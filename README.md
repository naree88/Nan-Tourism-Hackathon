# Nan Coffee, Please

Nan Coffee, Please is a Thai-first, mobile-first coffee discovery MVP for Nan. It demonstrates an explainable Coffee Trail for travelers and a human-approved update flow for independent cafe owners. The app runs without external credentials and never presents its fictional cafe fixtures as real businesses.

## What the demo proves

The complete demo outcome is:

1. A traveler can add zero, one, or several ordered places in Nan by name, coordinates, or an explicitly consented Current location.
2. Every search field is optional: transport context, Coffee Processing, Nan-grown/Nan-roasted coffee, Taste Note, roast level, and Workation.
3. With no filters, the home page shows every finder cafe fixture. Populated categories are combined deterministically, without an LLM.
4. The map uses the real Nan province boundary and plots selected places plus the filtered cafe coordinates.
5. One selected place limits cafes to 15 km. Several places also include cafes in a 5 km corridor along each consecutive route segment, even when they are more than 15 km from both endpoints.
6. Each of the 13 finder cafes opens a detail page with three recommended menus, complete Single Origin metadata, contextual customer reviews, and Workation-only internet metrics.
7. The merchant route links one MVP cafe and accepts text, Thai voice transcript, or one menu/bean/speed-test photo. It always creates a storefront draft for owner review before publishing.

No LLM or live routing service is needed for this story. Parsing, merchant extraction, and ranking are deterministic and grounded in the displayed fixture data.

## Data truth boundary

### Cafe fixtures

The home-page finder has **13 finder cafe fixtures** at the coordinates in [finder-cafes.ts](src/lib/demo/finder-cafes.ts). They cover every supported processing, taste, roast, Nan-grown/Nan-roasted, and Workation state, plus all supplied Unseen Nearby pair labels. Each finder card links to a generated cafe detail route backed by [finder-cafe-details.ts](src/lib/demo/finder-cafe-details.ts).

The three original public-profile fixtures remain available for the legacy cafe, merchant, check-in, and Coffee Trail flows:

These are product fixtures, not real businesses:

| Fixture | Purpose |
| --- | --- |
| ข่วงคลาวด์ คอฟฟี่แล็บ / Khuang Cloud Coffee Lab | Fruity Nan-grown-bean and Workation Friendly scenario |
| โกลเดนลูม เวิร์กรูม / Golden Loom Workroom | Workation and New discovery scenario |
| ฟองคำ โกโก้คอร์เนอร์ / Fong Kham Cocoa Corner | Chocolate-forward quick-takeaway scenario |

All cafe names, pins, beans, menus, prices, availability, hours, internet reports, reviews, and route estimates in these fixture sets are test data and must not be used for real travel. The home-page Nan boundary and administrative place index are generated from the source repositories credited on the map.

### Exactly three real, source-checked Unseen places

The fixture records say these names and coordinates were source-checked on **11 July 2026**:

| Place | Stored primary source | Verification limit |
| --- | --- | --- |
| วัดหัวข่วง / Wat Hua Khuang | [Tourism Authority of Thailand: Nan 24 hrs](https://thai.tourismthailand.org/Articles/nan-24-hrs) | Name/context and coordinates checked; no live hours or access status |
| วัดศรีพันต้น / Wat Si Phan Ton | [Tourism Authority of Thailand: Nan 24 hrs](https://thai.tourismthailand.org/Articles/nan-24-hrs) | Name/context and coordinates checked; no live hours or access status |
| โฮงเจ้าฟองคำ / Hong Chao Fong Kham | [Tourism Authority of Thailand: Nan and Phayao](https://www.tourismthailand.org/Articles/nan-and-phayao-cheap-but-charming-havens-2) | Name/context and coordinates checked; museum access must be rechecked |

The secondary coordinate-corroboration URLs are stored in [the TypeScript fixture](src/lib/demo/data.ts) and [the SQL seed](supabase/seed.sql). Opening, weather, road/access, and real-time suitability were not verified. Cafe-to-place distances and travel times are fictional UI estimates.

## Quick start

Requirements:

- Node.js **20.19+** or **22.12+**; Node 22 LTS is recommended.
- npm, using the committed `package-lock.json`.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. Environment variables are optional for the credential-free demo.

Available commands:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm test` | Run the Vitest domain tests once |

## Demo mode and reset

Demo mode activates when either `NEXT_PUBLIC_SUPABASE_URL` or a supported public Supabase key is missing. The header shows a demo-data pill and `/merchant` uses the automatic identity `merchant-demo-01`; there is no demo password.

The completed merchant profile approval, simulated check-in, and pending review are stored only in that browser's `localStorage`. Rejection does not modify the profile. Clearing site data resets the demo. The merchant MVP is intentionally scoped to Khuang Cloud Coffee Lab and previews the full bean, menu, opening-note, and Workation profile before approval.

## Environment variables

Copy `.env.example` to `.env.local` only when configuration is needed. Never commit `.env.local` or real credentials.

| Variable | Exposure | Current use |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-visible | Supabase project URL; required with one public key to enable connected mode |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-visible | Preferred current Supabase publishable key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-visible | Legacy anon-key fallback; currently shown in `.env.example` |
| `NEXT_PUBLIC_APP_URL` | Browser-visible | Absolute application base used for metadata; defaults to `http://localhost:3000` |
| `APP_DATA_MODE` | Server config | `demo` locally or `supabase` for connected data; production fails closed when omitted |
| `MERCHANT_DRAFT_PROVIDER` | Server config | `rules` for deterministic local parsing or `ai-gateway` for multimodal production extraction |
| `MERCHANT_AI_MODEL` | Server config | Required in AI mode as an `openai/<model-id>` AI Gateway model string |
| `AI_GATEWAY_API_KEY` | Server secret | Optional for local/non-Vercel Gateway calls; Vercel deployments should use automatic OIDC |
| `SUPABASE_SERVICE_ROLE_KEY` | Server secret | Required by the connected approval route for trusted, owner-authorized publication writes |

If both public key names are present, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` takes precedence. Publishable and legacy anon keys are intentionally public, but they are safe only with correctly tested RLS. Never give the service-role or model key a `NEXT_PUBLIC_` prefix.

## Supabase migration and seed

The repository includes:

- [Initial schema and RLS migration](supabase/migrations/20260711090000_initial_nan_coffee_schema.sql)
- [Archived coffee-offering retention policy](supabase/migrations/20260712205523_protect_archived_coffee_offerings.sql)
- [Merchant multimodal/profile migration](supabase/migrations/20260713010000_merchant_multimodal_profile.sql)
- [Atomic sold-out Single Origin approval RPC](supabase/migrations/20260713020000_atomic_sold_out_offering_archive.sql)
- [Idempotent demo seed](supabase/seed.sql)
- [Supabase-specific notes and post-apply checks](supabase/README.md)

The migrations create 13 public tables, enable RLS on all of them, and retain sold-out coffee lots as archived history. Apply every migration in timestamp order before `seed.sql`. The most direct hosted-project path is to run each file, in that order, in the Supabase SQL Editor. If using the CLI, initialize/link a Supabase project first—the repository does not currently include `supabase/config.toml`—then run the migrations with `supabase db push` and apply `seed.sql` to the intended development database.

The seed uses `ON CONFLICT DO NOTHING`. It creates the three fictional cafes and the three source-checked Unseen records, but intentionally creates **no Auth users, profiles, or cafe ownership claims**.

After applying to a development project, test anon, traveler, merchant-owner, and non-owner sessions. In particular, verify that pending drafts are not public, a merchant cannot access another cafe, unverified visits cannot create reviews/community reports, and travelers cannot set role, ownership, verification, translation, or moderation fields.

## Authentication, ownership, and current integration status

Public traveler browsing requires no login.

With a valid Supabase URL and public key, `/login` uses Supabase email/password auth. `/merchant` validates signed claims server-side and requires a `cafe_owners` row for the authenticated profile with `status = 'verified'`. Create the Auth user, matching `profiles` row, and verified ownership through a trusted admin/onboarding process; clients must not be allowed to self-assign merchant roles or ownership.

The connected merchant endpoints enforce the same ownership check before creating or reviewing a draft. The review endpoint reloads the canonical draft server-side; a rejected draft remains non-public, while approval applies the typed bean, menu, opening-note, and Workation patch with trusted server credentials. Raw transcript **text** may be stored as `content_drafts.source_input_text`; raw audio and image bytes are not persisted (only safe image metadata is retained with the draft).

In local mode, `MERCHANT_DRAFT_PROVIDER=rules` keeps the flow credential-free and deterministic. It can retain an attached photo as review evidence but cannot read the image. In production, `MERCHANT_DRAFT_PROVIDER=ai-gateway` sends the current authoritative profile, merchant text, and optional image to the configured OpenAI model through Vercel AI Gateway and accepts only schema-validated structured output. The model can propose a draft but cannot publish it.

Current boundary: traveler ranking, legacy cafe profile pages, and Unseen cards still read the TypeScript fixtures. The merchant editor and approval path are prepared for Supabase, but production onboarding still needs an Auth user, matching profile, verified cafe ownership, migrated database, and one published cafe. Check-in/review remains a browser-local demo and is not production visit verification.

## Voice, location, and privacy fallbacks

- Voice remains available in merchant and legacy input flows through the browser's `SpeechRecognition`/`webkitSpeechRecognition` implementation with `th-TH`. The app receives transcript text and does not retain an audio file.
- Location on the home-page finder is requested only after a button press. Denial, timeout, or lack of support falls back to a place name or typed coordinates.
- Finder coordinates and filters stay in React state for the current page session; the home page does not send them to the parse endpoint or write them to `localStorage`.
- The check-in location fallback ignores the returned coordinates after browser permission succeeds and stores only a `demo-verified` method/timestamp in `localStorage`. QR and location success are explicitly not production evidence.
- A browser-local demo review requires that simulated check-in, allows one pending review per cafe/site-data state, retains the Thai original, and does not appear publicly without moderation.

## Security boundaries

- AI Gateway credentials and the Supabase service role are server-only. Current client/server Supabase sessions use the publishable/anon key plus RLS.
- Server authorization uses validated claims, not an unverified client session value.
- Public reads are approval/publication/moderation gated. Merchant writes are verified-owner scoped; traveler records are owner scoped.
- Editing approved public records resets approval where defined, so publication remains a separate explicit action.
- Ownership verification, real check-in verification, moderation, translations, and administrative actions remain trusted server/admin responsibilities.
- The deterministic parser and ranker do not invent cafe, bean, place, weather, opening, or connectivity facts. Merchant-reported speed is never described as a stability guarantee.

## Vercel deployment

Import the intended GitHub repository as a Next.js project. Use `npm ci` for install and `npm run build` for the build; do not upload `.env.local`.

Configure variables separately for all three Vercel scopes:

| Scope | Recommended configuration |
| --- | --- |
| Development | Local/development Supabase project, `NEXT_PUBLIC_APP_URL=http://localhost:3000`, and development-only server secrets if needed |
| Preview | Isolated preview project/keys and the intended preview base URL; never reuse production service-role/model secrets by default |
| Production | Production URL, publishable key, canonical app URL, and only the server secrets actually required |

For production merchant updates set `APP_DATA_MODE=supabase`, `MERCHANT_DRAFT_PROVIDER=ai-gateway`, `MERCHANT_AI_MODEL=openai/<model-id>`, the Supabase public values, and `SUPABASE_SERVICE_ROLE_KEY`. Configure an OpenAI provider integration in Vercel AI Gateway. Keep local development on `demo` + `rules` until those services are ready.

Use either the publishable key or legacy anon key in each scope. `NEXT_PUBLIC_` values are embedded into the client build, so redeploy after changing them. A local secret file is not available to Vercel automatically.

## Validation status

The following checks passed during the implementation handoff:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

- ESLint completed with no errors or warnings.
- TypeScript completed with no errors.
- Vitest passed **133 tests across 18 files**, including finder coherence, Workation metrics, map bounds, Nan-grown/Nan-roasted filters, menu extraction without false bean matches, multimodal contracts, provider selection, immutable profile merging and atomic sold-out bean removal, Supabase enum mapping, merchant approval, and review eligibility.
- The Next.js production build completed and generated all traveler, cafe, merchant, auth, check-in, and API routes.
- `npm audit` reported **0 known vulnerabilities** after applying the non-breaking AI SDK dependency patch recommended by npm.
- HTTP smoke tests returned `200` for the merchant page. The merchant API completed menu rejection, voice-transcript bean/Workation approval, and multimodal photo-metadata flows; no image data URL appeared in the returned draft.

The in-app browser surface was unavailable in this session, so no visual/emulator pass is claimed. There is no automated browser E2E suite yet. Run the complete traveler and merchant story manually at **320px, 375px, 390px, and 430px** widths. Check Thai wrapping, no horizontal page scroll, 44px touch targets, safe-area/sticky controls, the virtual keyboard, loading/error states, slow-network duplicate-submit protection, and microphone/location denial and timeout fallbacks. Also verify a draft and a rejected update do not alter the public profile before testing approval.

## GitHub publication status

Publication is currently blocked. During this build, `.git/` exists but is empty, so this directory is not a Git repository: `git status` fails, and there is no branch, commit, `origin`, or pull request to report. Obtain the intended GitHub repository URL—or explicit permission to create one—before initializing Git and publishing; do not invent a destination.
