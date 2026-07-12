# Build Prompt for GPT-5.6 Sol

You are the implementation agent for **Nan Coffee, Please**. Your job is to build a polished, deployable MVP in the current repository.

Read [`handoff.md`](./handoff.md) fully before making decisions. It is the product source of truth. Also inspect the existing repository, preserve unrelated user changes, and follow any existing project conventions.

## Objective

Build a mobile-first Next.js + TypeScript web application, deployable to Vercel and designed for Supabase, that lets travelers discover Nan specialty cafés through an AI Coffee Trail and lets café owners update their public information through a human-approved AI co-pilot.

The app must feel credible as a hackathon demo: it should be immediately usable with a small seed dataset even if live API credentials are not configured.

## Product requirements

Implement these user-facing flows:

1. **Three home-screen entry paths**
   - Let AI plan it: area/start point, time, transport.
   - I already have a plan: one to three places or a natural-language plan.
   - Find coffee near me: opt-in location plus quick taste/use-case preferences.
   - Each accepts typing and a Thai voice-input affordance. If voice transcription cannot be configured, include a graceful demo/transcript fallback and explain it in README.
   - Always show a parsed-request confirmation/edit step before generating recommendations.

2. **Transparent Coffee Trail results**
   - Return ranked cafés with a plain-language "why this fits" explanation.
   - Use transparent deterministic ranking for seed/demo data. Do not pretend an LLM found facts that are absent from the data.
   - Include route/area, time, preference, detour, current availability, badges, and workation suitability when applicable.

3. **Café profile**
   - Current bean/menu offerings and last-update time.
   - Badge system: Nan-grown beans, Nan-roasted, Workation Friendly, New discovery.
   - Workation details: Wi-Fi, reported speed with timestamp, outlets, work seating, video-call suitability, hours/policy.
   - Distinguish Wi-Fi available, Speed reported, and Community verified. Never call a merchant report a stability guarantee.
   - Show Café pick / Traveler favorite / AI pick labels with source-based explanations.
   - Include an optional **Unseen ใกล้ร้านนี้ / Unseen Nearby** module with one to three verified nearby places, travel time, category, and opening/access context.

4. **Merchant co-pilot**
   - Merchant dashboard and café ownership model.
   - Text/voice update form for beans, menu availability, opening notes, and workation details.
   - Convert raw input into a structured preview plus Thai/English content draft.
   - Public content changes only after explicit merchant approval.

5. **Check-ins and reviews**
   - A demo-friendly QR/location check-in UI.
   - Structured review fields and a visible verified-visit state.
   - Keep user-generated text and moderation/approval state in the data model.

## Data and safety requirements

- Follow the table/RLS guidance in `handoff.md`.
- Use Supabase migrations if Supabase is set up; otherwise create well-organized SQL migrations and demo data so the project is ready to connect.
- Enable RLS on exposed tables and create least-privilege policies.
- Never commit secrets. Add `.env.example` only.
- Use `.env.local` for real local keys and ensure it is gitignored. Keep a committed `.env.example` with empty placeholders and setup guidance. `NEXT_PUBLIC_` variables are browser-exposed; secrets such as service-role and AI provider keys must be server-only.
- Configure deployment secrets in Vercel environment variables with appropriate Development/Preview/Production scope. Do not copy a local secret file into the repository or deployment output.
- All model/API calls and privileged database operations must run server-side.
- Do not scrape or fabricate tourism, café, bean, menu, review, or connectivity data.
- Seed data must be clearly marked `demo`, `sample`, or `verified` as appropriate.
- Keep original local facts/source URLs/verification timestamps in the data model where relevant.

## Recommended architecture

- Next.js App Router, TypeScript, modern responsive CSS/Tailwind using the repository's existing UI conventions.
- Supabase Auth/Postgres/Storage with a demo-mode repository/service layer if env variables are absent.
- Server endpoints or Server Actions for parsing a traveler request, generating explainable recommendations, drafting merchant content, and optional transcription integration.
- Maintain a clear boundary between deterministic structured data and AI-generated text.

## UX bar

- Thai-first, with English fields/descriptions generated or stored where relevant.
- **Mobile-first is non-negotiable.** Design and test the app first at 320px, 375px, 390px, and 430px viewport widths, then verify tablet and desktop layouts. There must be no horizontal page scroll, clipped text, overlapping controls, inaccessible bottom controls, or layout shifts when loading results.
- Use fluid layouts, responsive typography, sensible text wrapping, and image aspect-ratio constraints; never depend on fixed desktop widths.
- All primary controls must be comfortably tappable (target at least 44 × 44 CSS px), with sufficient spacing between neighboring touch targets.
- Respect mobile safe areas, virtual keyboards, browser chrome, and scroll position. Forms, the voice-input state, confirmation/edit step, filters, map/directions links, and bottom actions must remain usable on a small phone screen.
- Prefer mobile patterns where appropriate: compact filters, bottom sheets/drawers, sticky-but-safe primary actions, and horizontally scrollable chips only when their scroll affordance is clear.
- Test the complete traveler and merchant flows in a mobile browser/emulator before handoff, including permission denial for microphone/location and slow-network/loading states.
- Maintain accessible labels, keyboard navigation, readable contrast, loading/error/empty states, and clear microphone/location permission states.
- Use premium but calm coffee/travel visual direction: espresso brown, cream, forest green, muted indigo, restrained saffron accent.
- Avoid a generic dashboard aesthetic. The first screen should make the three traveler paths obvious in seconds.

## Explicit non-goals

- Payments, hotel/OTA booking, real-time inventory, or a generic travel directory.
- Claiming live weather, event availability, café opening status, or stable Wi-Fi without an actual verified data source.
- Publishing AI-generated merchant content without merchant approval.

## Execution process

1. Inspect the repository and summarize the chosen implementation plan in your first progress update.
2. Build the smallest coherent vertical slice before expanding polish.
3. Create/read migrations, RLS policies, and seed data carefully.
4. Make the app usable in demo mode if Supabase/OpenAI credentials are absent.
5. Run lint, type checking, and a production build; fix all errors you introduce.
6. If a local server can run, verify the main traveler and merchant flows in a browser.
7. Update README with setup, demo credentials (if applicable), environment variables, migrations, testing, and Vercel deployment steps.
8. Publish the completed code to GitHub. First inspect `git status`, the active branch, and the `origin` remote. Stage only task-related files, commit intentionally, push the branch, and open a draft PR when the repository workflow supports it. If no Git repository or GitHub remote exists, stop before publishing and ask the user for the intended repository URL or explicit permission to create one; never invent a GitHub destination.
9. Finish with a concise implementation report: files changed, verified flows, GitHub branch/commit/PR or publish blocker, commands run, and any configuration that the user must complete.

## Definition of done

The finished MVP demonstrates this story without hand-waving:

> A traveler speaks or types a plan involving Wat Phumin, receives an explained recommendation for a nearby café with a current Nan-grown bean and Workation Friendly details, sees an Unseen Nearby place, then a café owner updates a bean by voice/text and approves the bilingual public draft.

Build it with honesty, clear provenance, and a high-quality interface.
