-- Archived Single Origin lots remain as merchant history. Owners may clean up
-- only transient drafts or rejected submissions; approved and archived rows
-- require trusted administrative retention handling.
drop policy if exists coffee_offerings_delete_owner_nonpublic
  on public.coffee_offerings;

create policy coffee_offerings_delete_owner_transient
on public.coffee_offerings
for delete to authenticated
using (
  approval_status in ('draft', 'rejected')
  and cafe_id in (
    select co.cafe_id
    from public.cafe_owners co
    where co.profile_id = (select auth.uid())
      and co.status = 'verified'
  )
);

comment on policy coffee_offerings_delete_owner_transient
  on public.coffee_offerings is
  'Verified owners may delete draft/rejected rows only; archived lots are retained for audit history.';
