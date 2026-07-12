# Nan Coffee, Please — Engineering Handoff

## Project summary

**Nan Coffee, Please** is an AI-powered coffee-discovery web app for Nan, Thailand. It helps travelers discover independent specialty cafés, current Nan-grown coffee offerings, work-friendly café spaces, and nearby lesser-known places to visit.

The project serves two groups:

- **Travelers** receive an explained AI Coffee Trail that fits their actual trip plan, current location, available time, transport, coffee preferences, weather/season, and workation needs.
- **Independent café owners** can keep beans, menus, opening notices, workation details, and bilingual marketing content current with a simple text or Thai voice update workflow.

The app is a tourism discovery product, not an OTA. Do **not** build hotel bookings, payments, real-time accommodation inventory, or a general social network.

## Challenge alignment

Primary track: **Track 1 — AI Trip Planner & Concierge**.

The core value is an AI Coffee Trail that adapts to the user's context. Workation discovery and the merchant co-pilot are supporting features.

Coffee is not presented as the only reason to visit Nan. It is the approachable first stop that reveals local food, crafts, culture, nature, and lesser-known communities in every season.

## Product principles

1. **Low friction:** travelers and merchants can use type or Thai voice input; browsing does not require login.
2. **Local value:** surface independent and lesser-known cafés, not only popular places.
3. **Truth over generated content:** AI must never invent café facts, bean origins, business hours, activities, reviews, or local culture.
4. **Human-in-the-loop:** merchants approve every AI-generated public description/content draft before it is published.
5. **Transparent recommendation:** show why each café is recommended.
6. **Privacy-aware:** location is opt-in; voice is used only for the requested transcription and is not retained by default.

## Core traveler experience

### Home screen: three immediate entry paths

All three paths accept text or Thai voice input. Voice requests are transcribed into structured fields and shown to the user for confirmation/editing before recommendations are generated.

1. **Let AI plan it**
   - Minimum inputs: current area/start point, available time, transport.
   - Example: "อยู่แถววัดภูมินทร์ มีเวลา 2 ชั่วโมง ขับรถมา อยากได้กาแฟโทนผลไม้ แล้วแวะที่ Unseen ใกล้ ๆ"
   - Output: a short Coffee Trail with explained recommendations.

2. **I already have a plan**
   - User adds one to three destinations or states a natural-language plan.
   - Example: "บ่ายนี้จะไปวัดภูมินทร์ แล้วอยากหาร้านกาแฟนั่งทำงานได้สัก 2 ชั่วโมง"
   - Output: cafés that fit the itinerary with minimal detour.

3. **Find coffee near me**
   - Explicit location consent.
   - Preferences: fruity/chocolatey, light/medium roast, work/photos/quick takeaway.
   - Output: nearby explained recommendations.

### Café detail screen

Show:

- Café story, location, opening status/hours, photos, map/directions link.
- Current coffee offerings: bean origin, process, roast, tasting notes, brew method, price, availability, last updated.
- Café pick, traveler favorite, and AI pick for you—each with its source/reason.
- Badge list and meanings.
- Workation details where available.
- Verified visitor reviews/check-ins.
- Optional **Unseen ใกล้ร้านนี้ / Unseen Nearby** section.

### Unseen Nearby: a supporting discovery feature

After a traveler opens, saves, or checks in at any café, suggest one to three verified lesser-known nearby places.

- Categories: local food, culture, craft, scenic point, gentle nature, community experience.
- Show detour/travel time, opening status, source/verification status, and weather/access suitability.
- Keep it a small optional module, not a separate generic place directory.
- Use only verified official or partner information.

## Badge system

| Badge | Meaning / eligibility |
|---|---|
| **Nan-grown beans** | Café currently serves at least one bean grown in Nan, with origin/farm where known. This is distinct from roasting location. |
| **Nan-roasted** | Coffee is roasted in Nan. It does not by itself mean the beans were grown in Nan. |
| **Workation Friendly** | Café provides the required workspace details: Wi-Fi, seating, plugs, work suitability, and policies. |
| **New discovery** | A lesser-known or newly participating café. It must not be penalized by low review count. |

### Workation internet trust labels

Never call merchant-submitted speed data a guarantee.

- **Wi-Fi available:** merchant declaration only.
- **Speed reported:** merchant provides download/upload/ping plus timestamp.
- **Community verified:** a verified visitor reports they could work there.

If later using geographic connectivity data, label it **Area connectivity signal**, never as the café's actual speed.

Collect these workation fields:

- Free Wi-Fi
- Download/upload/ping and test date/time
- Power outlets
- Seat/table suitability
- Quietness and video-call suitability
- Opening hours
- Minimum spend / seating policy

## Merchant co-pilot

### Merchant workflow

1. Merchant claims/signs into their café profile.
2. Merchant types or speaks Thai to update a bean, menu, availability, opening notice, or workation detail.
3. AI transcribes/extracts structured fields and drafts Thai + English copy.
4. Merchant reviews, edits, approves, or rejects the draft.
5. Only approved information becomes public.

Example merchant voice update:

> วันนี้มีเมล็ดบ้านห้วยโต้น Natural คั่วอ่อน โทนสตรอว์เบอร์รีกับช็อกโกแลต ใช้ทำ filter ราคาแก้วละ 120 บาท

Expected structured data: origin/producer, process, roast, tasting notes, brew method, price, and availability.

## Reviews and fair discovery

- A user should be able to leave a review only after QR check-in or a privacy-conscious location verification flow.
- One review per verified visit.
- Review dimensions: coffee quality, bean/story, service, value, atmosphere, and optional work suitability.
- Keep original review text and show a clearly labelled translation if applicable.
- Merchants can respond/report; an admin moderates flagged content.
- Do not rank only by stars. Combine fit, current availability, detour, opening status, season, badges, and verified feedback.

## Recommendation logic

Inputs:

- Traveler request: route, time, transport, coffee tastes, use case, consented location.
- Café data: live approved offerings, hours, location, badges, workation details.
- Verified local/seasonal data: weather, opening/access status, approved Unseen Nearby places.
- Reviews and check-ins.

Output must include a plain-language reason, for example:

> Recommended because you chose fruity light-roast coffee, this café has a Nan-grown Natural bean available today, and it is a short detour from Wat Phumin.

For the hackathon, a transparent deterministic ranking plus an LLM that explains the structured result is preferable to an opaque agent that invents routes.

## Technical requirements

- **Frontend:** Next.js with TypeScript, responsive mobile-first UI, deployed to Vercel.
- **Backend/data:** Supabase Auth, Postgres, Storage, and Row Level Security.
- **AI:** server-side only. Never put model keys, Supabase service-role keys, or any secret in client code or the repository.
- **Authentication:** browsing public data is open; login is required for merchant tools, check-ins, reviews, and saved trails.
- **Accessibility:** Thai-first, readable contrast, keyboard/mobile support, clear location/microphone permission states.
- **Responsive acceptance:** validate 320px, 375px, 390px, and 430px viewport widths with no horizontal overflow, clipped/overlapping controls, or inaccessible actions. Touch targets should be at least 44 × 44 CSS px; account for safe areas and the virtual keyboard.

### Suggested Supabase data model

Use migrations and enable RLS on every public-schema table.

- `profiles`: id, display_name, role (`traveler`, `merchant`, `admin`), locale.
- `cafes`: owner/profile relation, name, Thai/English descriptions, address, latitude, longitude, hours, status, is_new_discovery, roast_in_nan, source/verification details.
- `cafe_owners`: café-to-merchant ownership relation.
- `coffee_offerings`: café, bean name, origin province, origin name/farm, producer, process, roast level, tasting notes, brew methods, price, availability, timestamps, approved status.
- `menu_items`: café, name, description, price, seasonal/availability, café-pick flag.
- `workation_details`: café, free_wifi, outlets, seating/work suitability, video-call suitability, policies, last updated.
- `speed_reports`: café, reporter/user, download_mbps, upload_mbps, ping_ms, test timestamp, verification level, approval/moderation state.
- `content_drafts`: café, source input, structured data, Thai copy, English copy, status (`draft`, `approved`, `rejected`), owner.
- `check_ins`: traveler, café, verification method, timestamp.
- `reviews`: traveler, café, check-in relation, structured ratings, body/original language, translation, status.
- `itineraries`: traveler optional, original request, structured request, recommendation result, timestamps.
- `unseen_places`: name, category, description, coordinates, hours, source URL/type, verification status, weather/access notes.
- `cafe_unseen_places`: café/place relation, travel time/distance, approved status.

### RLS expectations

- Public users can read only approved public café, offering, menu, place, and moderated review data.
- Merchants can read/write only cafés they own and their related draft/offering/workation data.
- Travelers can read/write only their own profile, saved itineraries, check-ins, and reviews.
- Admin actions are server-side or controlled through an explicit role-based policy.
- Never expose the Supabase service role in the browser.

## MVP build scope

Build a complete end-to-end demo with a small, clearly verified seed dataset. Three to five cafés and several Unseen Nearby places are enough.

Required flows:

1. Home screen with three entry paths and voice/text affordance.
2. Coffee Trail or nearby result with stated recommendation reasons.
3. Café detail page with current bean/menu data, badges, workation details, and Unseen Nearby.
4. Merchant dashboard with text/voice update input, structured draft preview, and approval flow.
5. Public profile updates after merchant approval.
6. QR/location check-in and structured review UI; use a safe demo fallback if physical verification is unavailable.

Explicit non-goals:

- Payment processing
- Accommodation booking
- Scraping private/unauthorized data
- Claiming unverified internet stability or coffee provenance
- Unmoderated publication of AI output

## Verification and handoff requirements

- Include a concise README with setup, environment variables, Supabase migration/apply instructions, test/demo accounts, and Vercel deployment steps.
- Add a committed `.env.example` with placeholders only, and maintain a gitignored `.env.local` for real local keys. Never put a secret in `.env`, `.env.example`, source code, or the GitHub repository.
- Expected variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and the chosen server-only AI provider key (for example `OPENAI_API_KEY`). `NEXT_PUBLIC_` variables are exposed to the browser and must never contain a secret.
- Configure real secrets separately in Vercel for Development, Preview, and Production; do not rely on a local `.env.local` after deployment.
- Provide seed data that is clearly marked sample/verified as applicable.
- Run lint, type check, and production build before handoff.
- If Supabase credentials are unavailable, make the app render a usable local/demo mode with a visible but non-intrusive demo-data label.
- **GitHub delivery is required:** after implementation and validation, publish the application code, migrations, README, and configuration templates to the intended GitHub repository. If no repository/remote exists, request the repository URL or explicit authority to create the repository before publishing; do not invent a destination.

## Key source guidance

Use provided/official sources such as TAT Data API, Tourism Authority of Thailand Nan content, provincial tourism calendar, and the provincial tourism/sports office for destination context. Preserve source URLs and verification timestamps for local places. Do not state that an event, café, coffee origin, or opening hour is current unless it has been verified.

## Pitch-ready one-liner

> Nan Coffee, Please helps travelers discover Nan-grown coffee and hidden cafés through AI trails that fit their real plans, while giving small cafés a voice-first way to keep their story current in Thai and English.
