-- Apply a merchant-approved sold-out Single Origin removal as one database
-- transaction. Any exception rolls back menu unlinking, offering archival,
-- and the content-draft status update together.

create or replace function public.apply_sold_out_offering_removal_draft(
  p_draft_id uuid,
  p_cafe_id uuid,
  p_reviewer_id uuid,
  p_reviewed_at timestamptz default now()
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_structured_data jsonb;
  v_removals jsonb;
  v_target record;
  v_menu record;
  v_offering_name text;
  v_offering_updated_at timestamptz;
  v_reviewed_at timestamptz := statement_timestamp();
  v_archived_count integer := 0;
  v_unlinked_menu_count integer := 0;
begin
  -- Keep the parameter for API compatibility, but use the database clock for
  -- canonical approval audit fields rather than trusting a caller timestamp.
  if p_reviewed_at is null then
    raise exception 'A review timestamp is required.';
  end if;

  -- Lock the verified ownership row so it cannot be revoked while this
  -- approval transaction is applying public storefront changes.
  perform 1
  from public.cafe_owners as owner
  where owner.cafe_id = p_cafe_id
    and owner.profile_id = p_reviewer_id
    and owner.status = 'verified'
  for update;

  if not found then
    raise exception using
      errcode = '42501',
      message = 'The reviewer is not a verified owner of this cafe.';
  end if;

  select draft.structured_data
  into v_structured_data
  from public.content_drafts as draft
  where draft.id = p_draft_id
    and draft.cafe_id = p_cafe_id
    and draft.owner_profile_id = p_reviewer_id
    and draft.update_kind = 'coffee_offering'
    and draft.status = 'draft'
  for update;

  if not found then
    raise exception 'The sold-out removal draft is no longer reviewable.';
  end if;

  -- This RPC is deliberately narrow: it may only apply the dedicated
  -- removal draft created by the server route, never a mixed AI update.
  if v_structured_data -> 'kinds' is distinct from '["offering"]'::jsonb
    or jsonb_typeof(v_structured_data -> 'fieldEvidence') is distinct from 'array'
    or jsonb_typeof(v_structured_data -> 'unresolvedFields') is distinct from 'array'
    or nullif(btrim(v_structured_data ->> 'extractorVersion'), '') is null
    or exists (
      select 1
      from jsonb_object_keys(v_structured_data) as draft_key(key_name)
      where draft_key.key_name not in (
        'kinds', 'offeringRemovals', 'fieldEvidence',
        'unresolvedFields', 'extractorVersion'
      )
    )
  then
    raise exception 'A sold-out removal draft cannot contain other storefront changes.';
  end if;

  v_removals := v_structured_data -> 'offeringRemovals';
  if jsonb_typeof(v_removals) is distinct from 'array'
    or jsonb_array_length(v_removals) < 1
    or jsonb_array_length(v_removals) > 4
  then
    raise exception 'The sold-out removal draft must contain between one and four beans.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_removals) as removal(item)
    where case
      when jsonb_typeof(removal.item) is distinct from 'object' then true
      else
        (removal.item - array[
          'offeringId', 'beanName', 'reason', 'expectedUpdatedAt'
        ]) <> '{}'::jsonb
        or nullif(removal.item ->> 'offeringId', '') is null
        or nullif(btrim(removal.item ->> 'beanName'), '') is null
        or removal.item ->> 'reason' is distinct from 'sold-out'
        or nullif(removal.item ->> 'expectedUpdatedAt', '') is null
      end
  ) then
    raise exception 'A sold-out removal target is incomplete.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_removals) as removal(item)
    group by removal.item ->> 'offeringId'
    having count(*) > 1
  ) then
    raise exception 'The same Single Origin bean cannot be removed twice.';
  end if;

  -- Sorting the locks prevents two valid multi-bean drafts from taking the
  -- same offering rows in opposite order.
  for v_target in
    select
      (removal.item ->> 'offeringId')::uuid as offering_id,
      btrim(removal.item ->> 'beanName') as bean_name,
      (removal.item ->> 'expectedUpdatedAt')::timestamptz as expected_updated_at
    from jsonb_array_elements(v_removals) as removal(item)
    order by (removal.item ->> 'offeringId')::uuid
  loop
    select offering.bean_name, offering.updated_at
    into v_offering_name, v_offering_updated_at
    from public.coffee_offerings as offering
    where offering.id = v_target.offering_id
      and offering.cafe_id = p_cafe_id
      and offering.approval_status = 'approved'
      and offering.published_at is not null
    for update;

    if not found then
      raise exception 'A Single Origin bean is no longer public or does not belong to this cafe.';
    end if;
    if lower(btrim(v_offering_name)) <> lower(v_target.bean_name) then
      raise exception 'A Single Origin bean name changed after the removal draft was created.';
    end if;
    if v_offering_updated_at <> v_target.expected_updated_at then
      raise exception 'A Single Origin bean changed after the removal draft was created.';
    end if;

    -- Unlink every menu, but only republish menus that were public before this
    -- transaction. Draft/rejected/archived menus stay non-public.
    for v_menu in
      select
        menu.id,
        menu.approval_status,
        menu.approved_by,
        menu.approved_at,
        menu.published_at
      from public.menu_items as menu
      where menu.cafe_id = p_cafe_id
        and menu.featured_offering_id = v_target.offering_id
      order by menu.id
      for update
    loop
      update public.menu_items
      set featured_offering_id = null,
          approval_status = 'draft',
          approved_by = null,
          approved_at = null,
          published_at = null
      where id = v_menu.id
        and cafe_id = p_cafe_id
        and featured_offering_id = v_target.offering_id;

      if not found then
        raise exception 'A menu linked to the Single Origin bean changed during approval.';
      end if;

      if v_menu.approval_status = 'approved' and v_menu.published_at is not null then
        update public.menu_items
        set approval_status = 'approved',
            approved_by = p_reviewer_id,
            approved_at = v_reviewed_at,
            published_at = v_reviewed_at
        where id = v_menu.id
          and cafe_id = p_cafe_id
          and approval_status = 'draft';
      elsif v_menu.approval_status in ('rejected', 'archived') then
        update public.menu_items
        set approval_status = v_menu.approval_status,
            approved_by = v_menu.approved_by,
            approved_at = v_menu.approved_at,
            published_at = null
        where id = v_menu.id
          and cafe_id = p_cafe_id
          and approval_status = 'draft';
      end if;

      if not found and v_menu.approval_status <> 'draft' then
        raise exception 'A menu could not be restored after unlinking the sold-out bean.';
      end if;
      v_unlinked_menu_count := v_unlinked_menu_count + 1;
    end loop;

    update public.coffee_offerings
    set approval_status = 'archived',
        published_at = null
    where id = v_target.offering_id
      and cafe_id = p_cafe_id
      and approval_status = 'approved'
      and published_at is not null
      and updated_at = v_target.expected_updated_at;

    if not found then
      raise exception 'A Single Origin bean changed before it could be archived.';
    end if;
    v_archived_count := v_archived_count + 1;
  end loop;

  update public.content_drafts
  set status = 'applied',
      approved_by = p_reviewer_id,
      approved_at = v_reviewed_at,
      applied_at = v_reviewed_at
  where id = p_draft_id
    and cafe_id = p_cafe_id
    and owner_profile_id = p_reviewer_id
    and status = 'draft';

  if not found then
    raise exception 'The sold-out removal draft changed before it could be applied.';
  end if;

  return jsonb_build_object(
    'archived_offering_count', v_archived_count,
    'unlinked_menu_count', v_unlinked_menu_count
  );
end;
$$;

revoke all on function public.apply_sold_out_offering_removal_draft(
  uuid, uuid, uuid, timestamptz
) from public, anon, authenticated;

grant execute on function public.apply_sold_out_offering_removal_draft(
  uuid, uuid, uuid, timestamptz
) to service_role;

comment on function public.apply_sold_out_offering_removal_draft(
  uuid, uuid, uuid, timestamptz
) is 'Atomically unlinks menus, archives sold-out Single Origin offerings, and marks the canonical merchant draft applied. Service-role only.';
