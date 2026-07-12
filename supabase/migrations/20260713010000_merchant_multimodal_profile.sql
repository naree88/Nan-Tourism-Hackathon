-- Merchant multimodal drafting and the structured fields rendered by the
-- storefront preview. Raw image bytes are intentionally not stored here;
-- source_media contains review/audit metadata only.

alter type public.input_method add value if not exists 'photo';
alter type public.input_method add value if not exists 'multimodal';
alter type public.coffee_process add value if not exists 'carbonic_maceration';
alter type public.coffee_process add value if not exists 'unknown';
alter type public.offering_availability add value if not exists 'unknown';

begin;

alter table public.coffee_offerings
  add column altitude_min_m integer,
  add column altitude_max_m integer,
  add column varietal text,
  add column processing_province text,
  add column processing_locality text,
  add column roaster_province text,
  add column roaster_locality text,
  add constraint coffee_offerings_altitude_min_range
    check (altitude_min_m is null or altitude_min_m between 0 and 5000),
  add constraint coffee_offerings_altitude_max_range
    check (altitude_max_m is null or altitude_max_m between 0 and 5000),
  add constraint coffee_offerings_altitude_ordered
    check (altitude_min_m is null or altitude_max_m is null or altitude_max_m >= altitude_min_m);

alter table public.menu_items
  add column featured_offering_id uuid;

create unique index coffee_offerings_id_cafe_unique_idx
  on public.coffee_offerings (id, cafe_id);

alter table public.menu_items
  add constraint menu_items_featured_offering_same_cafe_fk
  foreign key (featured_offering_id, cafe_id)
  references public.coffee_offerings (id, cafe_id)
  on delete set null (featured_offering_id);

create index menu_items_featured_offering_idx
  on public.menu_items (featured_offering_id)
  where featured_offering_id is not null;

alter table public.content_drafts
  add column generation_metadata jsonb not null default '{}'::jsonb,
  add column source_media jsonb not null default '[]'::jsonb,
  add constraint content_drafts_generation_metadata_object
    check (jsonb_typeof(generation_metadata) = 'object'),
  add constraint content_drafts_source_media_array
    check (jsonb_typeof(source_media) = 'array'),
  add constraint content_drafts_source_media_mvp_limit
    check (jsonb_array_length(source_media) <= 1);

comment on column public.content_drafts.generation_metadata is
  'Server-generated provider, model, prompt-version, and image-analysis metadata.';
comment on column public.content_drafts.source_media is
  'Metadata for at most one merchant evidence image. Raw image bytes and data URLs are not persisted.';
comment on column public.menu_items.featured_offering_id is
  'Optional merchant-approved link to the single-origin offering used by this menu item.';

create or replace function private.reset_offering_approval_on_material_change()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if row(
    new.bean_name, new.origin_province, new.origin_name, new.producer,
    new.altitude_min_m, new.altitude_max_m, new.varietal,
    new.is_nan_grown, new.process, new.process_detail,
    new.processing_province, new.processing_locality,
    new.roast_level, new.roaster_province, new.roaster_locality,
    new.tasting_notes_th, new.tasting_notes_en, new.brew_methods,
    new.price_thb, new.availability, new.available_from, new.available_until
  ) is distinct from row(
    old.bean_name, old.origin_province, old.origin_name, old.producer,
    old.altitude_min_m, old.altitude_max_m, old.varietal,
    old.is_nan_grown, old.process, old.process_detail,
    old.processing_province, old.processing_locality,
    old.roast_level, old.roaster_province, old.roaster_locality,
    old.tasting_notes_th, old.tasting_notes_en, old.brew_methods,
    old.price_thb, old.availability, old.available_from, old.available_until
  ) then
    new.approval_status := 'draft';
  end if;
  return new;
end;
$$;

create or replace function private.reset_menu_approval_on_material_change()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if row(
    new.name_th, new.name_en, new.description_th, new.description_en,
    new.category, new.price_thb, new.is_available, new.is_seasonal,
    new.is_cafe_pick, new.featured_offering_id
  ) is distinct from row(
    old.name_th, old.name_en, old.description_th, old.description_en,
    old.category, old.price_thb, old.is_available, old.is_seasonal,
    old.is_cafe_pick, old.featured_offering_id
  ) then
    new.approval_status := 'draft';
  end if;
  return new;
end;
$$;

create or replace function private.reset_content_draft_approval_on_material_change()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if row(
    new.update_kind, new.input_method, new.source_input_text,
    new.source_language, new.structured_data, new.thai_copy, new.english_copy,
    new.generation_metadata, new.source_media
  ) is distinct from row(
    old.update_kind, old.input_method, old.source_input_text,
    old.source_language, old.structured_data, old.thai_copy, old.english_copy,
    old.generation_metadata, old.source_media
  ) then
    new.status := 'draft';
    new.approved_by := null;
    new.approved_at := null;
    new.rejected_at := null;
    new.applied_at := null;
  end if;
  return new;
end;
$$;

-- Existing grants are column-scoped. Explicitly opt the new columns into only
-- the same authenticated operations as their parent records.
grant insert (
  altitude_min_m, altitude_max_m, varietal,
  processing_province, processing_locality,
  roaster_province, roaster_locality
) on table public.coffee_offerings to authenticated;
grant update (
  altitude_min_m, altitude_max_m, varietal,
  processing_province, processing_locality,
  roaster_province, roaster_locality
) on table public.coffee_offerings to authenticated;

grant insert (featured_offering_id) on table public.menu_items to authenticated;
grant update (featured_offering_id) on table public.menu_items to authenticated;

grant insert (generation_metadata, source_media) on table public.content_drafts to authenticated;
grant update (generation_metadata, source_media) on table public.content_drafts to authenticated;

-- Trigger helpers stay private and non-callable by Data API roles.
revoke execute on function private.reset_offering_approval_on_material_change()
  from public, anon, authenticated;
revoke execute on function private.reset_menu_approval_on_material_change()
  from public, anon, authenticated;
revoke execute on function private.reset_content_draft_approval_on_material_change()
  from public, anon, authenticated;

commit;
