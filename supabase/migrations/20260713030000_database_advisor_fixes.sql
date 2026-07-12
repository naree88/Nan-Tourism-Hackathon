-- Resolve the actionable Supabase performance-advisor findings without
-- broadening Data API access. Foreign-key indexes are partial where the
-- referencing column is nullable, because only non-null values participate
-- in referential lookups.

begin;

create index cafe_owners_verified_by_idx
  on public.cafe_owners (verified_by)
  where verified_by is not null;

create index cafe_unseen_places_approved_by_idx
  on public.cafe_unseen_places (approved_by)
  where approved_by is not null;

create index cafes_created_by_idx
  on public.cafes (created_by)
  where created_by is not null;

create index coffee_offerings_approved_by_idx
  on public.coffee_offerings (approved_by)
  where approved_by is not null;

create index content_drafts_approved_by_idx
  on public.content_drafts (approved_by)
  where approved_by is not null;

create index menu_items_approved_by_idx
  on public.menu_items (approved_by)
  where approved_by is not null;

create index menu_items_featured_offering_same_cafe_idx
  on public.menu_items (featured_offering_id, cafe_id)
  where featured_offering_id is not null;

create index unseen_places_approved_by_idx
  on public.unseen_places (approved_by)
  where approved_by is not null;

create index workation_details_approved_by_idx
  on public.workation_details (approved_by)
  where approved_by is not null;

-- Each authenticated SELECT below is the exact OR of the former public and
-- owner/relevant policies. Anonymous users retain the same publication-gated
-- predicate in a dedicated policy, so access semantics do not change while
-- authenticated queries evaluate only one permissive SELECT policy per table.

drop policy cafes_select_public on public.cafes;
drop policy cafes_select_verified_owner on public.cafes;

create policy cafes_select_public on public.cafes
for select to anon
using (status in ('published', 'temporarily_closed') and published_at is not null);

create policy cafes_select_authenticated on public.cafes
for select to authenticated
using (
  (status in ('published', 'temporarily_closed') and published_at is not null)
  or id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);

drop policy coffee_offerings_select_public on public.coffee_offerings;
drop policy coffee_offerings_select_owner on public.coffee_offerings;

create policy coffee_offerings_select_public on public.coffee_offerings
for select to anon
using (
  approval_status = 'approved' and published_at is not null
  and cafe_id in (
    select c.id from public.cafes c
    where c.status in ('published', 'temporarily_closed') and c.published_at is not null
  )
);

create policy coffee_offerings_select_authenticated on public.coffee_offerings
for select to authenticated
using (
  (
    approval_status = 'approved' and published_at is not null
    and cafe_id in (
      select c.id from public.cafes c
      where c.status in ('published', 'temporarily_closed') and c.published_at is not null
    )
  )
  or cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);

drop policy menu_items_select_public on public.menu_items;
drop policy menu_items_select_owner on public.menu_items;

create policy menu_items_select_public on public.menu_items
for select to anon
using (
  approval_status = 'approved' and published_at is not null
  and cafe_id in (
    select c.id from public.cafes c
    where c.status in ('published', 'temporarily_closed') and c.published_at is not null
  )
);

create policy menu_items_select_authenticated on public.menu_items
for select to authenticated
using (
  (
    approval_status = 'approved' and published_at is not null
    and cafe_id in (
      select c.id from public.cafes c
      where c.status in ('published', 'temporarily_closed') and c.published_at is not null
    )
  )
  or cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);

drop policy workation_details_select_public on public.workation_details;
drop policy workation_details_select_owner on public.workation_details;

create policy workation_details_select_public on public.workation_details
for select to anon
using (
  approval_status = 'approved' and published_at is not null
  and cafe_id in (
    select c.id from public.cafes c
    where c.status in ('published', 'temporarily_closed') and c.published_at is not null
  )
);

create policy workation_details_select_authenticated on public.workation_details
for select to authenticated
using (
  (
    approval_status = 'approved' and published_at is not null
    and cafe_id in (
      select c.id from public.cafes c
      where c.status in ('published', 'temporarily_closed') and c.published_at is not null
    )
  )
  or cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);

drop policy speed_reports_select_public on public.speed_reports;
drop policy speed_reports_select_relevant on public.speed_reports;

create policy speed_reports_select_public on public.speed_reports
for select to anon
using (
  moderation_status = 'published' and published_at is not null
  and cafe_id in (
    select c.id from public.cafes c
    where c.status in ('published', 'temporarily_closed') and c.published_at is not null
  )
);

create policy speed_reports_select_authenticated on public.speed_reports
for select to authenticated
using (
  (
    moderation_status = 'published' and published_at is not null
    and cafe_id in (
      select c.id from public.cafes c
      where c.status in ('published', 'temporarily_closed') and c.published_at is not null
    )
  )
  or reporter_profile_id = (select auth.uid())
  or cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);

drop policy reviews_select_public on public.reviews;
drop policy reviews_select_own on public.reviews;

create policy reviews_select_public on public.reviews
for select to anon
using (
  moderation_status = 'published' and published_at is not null
  and cafe_id in (
    select c.id from public.cafes c
    where c.status in ('published', 'temporarily_closed') and c.published_at is not null
  )
);

create policy reviews_select_authenticated on public.reviews
for select to authenticated
using (
  (
    moderation_status = 'published' and published_at is not null
    and cafe_id in (
      select c.id from public.cafes c
      where c.status in ('published', 'temporarily_closed') and c.published_at is not null
    )
  )
  or traveler_id = (select auth.uid())
);

drop policy cafe_unseen_places_select_public on public.cafe_unseen_places;
drop policy cafe_unseen_places_select_owner on public.cafe_unseen_places;

create policy cafe_unseen_places_select_public on public.cafe_unseen_places
for select to anon
using (
  approval_status = 'approved' and published_at is not null
  and cafe_id in (
    select c.id from public.cafes c
    where c.status in ('published', 'temporarily_closed') and c.published_at is not null
  )
  and unseen_place_id in (
    select up.id from public.unseen_places up
    where up.approval_status = 'approved'
      and up.published_at is not null
      and up.verification_status in ('source_checked', 'partner_verified', 'official_verified')
      and (up.verification_expires_at is null or up.verification_expires_at > now())
  )
);

create policy cafe_unseen_places_select_authenticated on public.cafe_unseen_places
for select to authenticated
using (
  (
    approval_status = 'approved' and published_at is not null
    and cafe_id in (
      select c.id from public.cafes c
      where c.status in ('published', 'temporarily_closed') and c.published_at is not null
    )
    and unseen_place_id in (
      select up.id from public.unseen_places up
      where up.approval_status = 'approved'
        and up.published_at is not null
        and up.verification_status in ('source_checked', 'partner_verified', 'official_verified')
        and (up.verification_expires_at is null or up.verification_expires_at > now())
    )
  )
  or cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);

commit;
