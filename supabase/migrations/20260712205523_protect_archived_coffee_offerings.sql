-- Single Origin lots remain as merchant history. Browser clients never
-- hard-delete them; trusted server workflows archive or clean them up.
drop policy if exists coffee_offerings_delete_owner_nonpublic
  on public.coffee_offerings;
drop policy if exists coffee_offerings_delete_owner_transient
  on public.coffee_offerings;

-- A material edit demotes an approved lot to draft, so draft status alone
-- cannot prove that a lot has never been public. Hard deletion therefore stays
-- server-only; the merchant removal flow archives canonical rows instead.
revoke delete on table public.coffee_offerings from authenticated;

comment on table public.coffee_offerings is
  'Single Origin lots are retained as history. Browser clients may edit active lots but cannot hard-delete or mutate archived lots.';
