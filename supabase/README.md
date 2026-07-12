# Supabase artifacts

The Supabase CLI was not installed in the build workspace, so the initial
migration uses the conventional timestamped filename
`migrations/20260711090000_initial_nan_coffee_schema.sql` rather than a
CLI-generated name.

Apply the migration first, then `seed.sql`. The seed is intentionally
idempotent (`ON CONFLICT DO NOTHING`). It creates exactly three fictional cafes
whose names and factual fields are labelled `demo`. It does not create Auth
users, profiles, or cafe ownership claims; those must be created through a
trusted onboarding/admin flow before testing authenticated merchant policies.

The three Unseen Nearby rows are real places. Their stored source URLs and
coordinates were source-checked on 2026-07-11, but current opening hours,
access, weather suitability, and live status were not verified. The seeded
cafe-to-place times and distances are demo estimates, not live routing.

## Access model

- `anon` can select only publication-gated cafes, offerings, menus, workation
  details, speed reports, moderated reviews, and Unseen Nearby data.
- `authenticated` users receive the same public reads plus owner-scoped merchant
  writes and traveler-owned writes enforced by RLS.
- Ownership claims, check-in verification, moderation, translations, merchant
  review responses, and place verification remain server-side operations.
- Editing a published cafe, offering, menu, workation record, content draft, or
  cafe/place relation resets its public approval where applicable. Publishing is
  a separate explicit action.
- No function in `public` is created. Trigger helpers live in the unexposed
  `private` schema and run with the caller's privileges.

The migration explicitly revokes legacy automatic Data API privileges before
granting the minimum operations to `anon`, `authenticated`, and `service_role`.
RLS is enabled on all 13 public tables.

## Post-apply checks

After applying to a development project, run the Supabase database advisors and
exercise the Data API with anon, traveler, merchant-owner, and non-owner
sessions. At minimum, verify:

1. anon sees three cafes and three Unseen Nearby rows, but no drafts or private
   traveler/merchant tables;
2. a merchant cannot read or edit another merchant's cafe data;
3. editing approved public content makes it non-public until a second approval;
4. an unverified check-in cannot create a review or a community speed report;
5. a traveler cannot set moderation, verification, translation, ownership, or
   profile-role fields through the Data API.
