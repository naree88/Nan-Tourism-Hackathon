# Nan Coffee, Please — Important Notes

## 1. Current MVP decision

### Product

**Nan Coffee, Please** is an AI coffee-discovery app for Nan. It helps travelers find lesser-known specialty cafés, understand current coffee offerings, and choose a Coffee Trail that fits their time, location, weather, season, transport, and preferences.

The MVP is **not** a hotel/OTA/long-stay booking product. Workation is represented through reliable café-workspace information, not a promise that every accommodation has stable internet.

An intentionally secondary feature, **Unseen Nearby** (Thai UI label: **Unseen ใกล้ร้านนี้**) gives any café visitor one to three verified nearby ideas for a short local break. It complements the coffee experience; it is not a separate destination directory.

### Recommended track

**Track 1 — AI Trip Planner & Concierge** is now the strongest primary fit because the core user value is an AI-generated coffee trail that adapts to the user's plan, location, time, weather, and season.

The app also supports Track 2 through its workation-friendly café discovery, and Track 3 through the merchant content co-pilot. These are supporting capabilities, not separate products.

### One-line proposition

> Discover Nan-grown coffee, work-friendly cafés, and the local stories between them — with an AI trail built for the way you travel.

## 2. Challenge alignment

- Nan Beyond Seasons Challenge asks for tourism value across 12 months, local value distribution, responsible AI, design thinking, and a usable prototype.
- Coffee is not claimed to be the only reason someone visits Nan. It is an approachable entry point that turns a quick café stop into longer, more distributed local exploration.
- The app must use verified local facts; AI may organize, translate, recommend, and explain, but must not invent coffee origins, activities, reviews, or local culture.

## 3. Primary users

### Traveler

Thai independent travelers, generally 25–40, who are planning a short trip to Nan or are already there. They like good coffee, local discovery, and may want a café suitable for working remotely, but do not necessarily identify as specialty-coffee experts.

### Merchant

Independent Nan specialty-café owners/managers, especially small shops with no dedicated marketing team, limited time to update changing beans/menus, and limited confidence creating English content.

### Secondary users

- Remote workers / workation travelers looking for cafés that suit a work session.
- International travelers who benefit from accurate, merchant-approved English information.

## 4. Traveler home screen: three immediate choices

Do not require a complete itinerary or login to browse.

Every entry path accepts either typing or **Thai voice input**. The app transcribes a natural-language request into structured fields, shows the traveler a short confirmation/edit screen, and only then generates a recommendation. Audio is used for the requested transcription and is not retained by default.

### 1. Let AI plan it

The traveler enters only:

- Current area or starting point
- Available time
- Transport mode

The app proposes a Coffee Trail that considers weather, season, distance, opening status, and relevant local stops.

Example voice request:

> ตอนนี้อยู่แถววัดภูมินทร์ มีเวลา 2 ชั่วโมง ขับรถมา อยากได้กาแฟโทนผลไม้ แล้วแวะที่ Unseen ใกล้ ๆ

### 2. I already have a plan

The traveler adds one to three destinations or types a plan such as "Wat Phumin this afternoon." AI finds café stops that fit the route with minimal detour.

They can say the same request instead, for example: "บ่ายนี้จะไปวัดภูมินทร์ แล้วอยากหาร้านกาแฟนั่งทำงานได้สัก 2 ชั่วโมง"

### 3. Find coffee near me

With explicit location consent, the traveler selects simple preference chips such as:

- Fruity / chocolatey
- Light / medium roast
- Work / photos / quick takeaway

The app returns nearby cafés with concise, explained recommendations.

The traveler may also speak a short need such as: "หาร้านกาแฟใกล้ ๆ ที่มีปลั๊ก กาแฟคั่วอ่อน และนั่งทำงานได้"

### Unseen Nearby (supporting feature)

After a traveler saves, opens, or checks in at any café, the app can suggest one to three lesser-known nearby places, based on available time, weather, transport, and opening status. Examples are a local food stop, a short cultural visit, a scenic viewpoint, a gentle nature walk, or a community craft experience.

Rules:

- Keep results within a realistic short detour and show estimated travel time.
- Use only verified official/partner location and opening information.
- Respect weather, road/access, and seasonal suitability.
- Present it as an optional local discovery, not as the main reason to choose the café.

## 5. Badge system

Badges make discovery quicker and communicate a café's role transparently.

| Badge | Eligibility / meaning |
|---|---|
| **Nan-grown beans** | The café currently serves at least one coffee grown in Nan, with a named source/origin when known. This is not the same as roasting in Nan. |
| **Nan-roasted** | Coffee is roasted in Nan. It does not by itself prove that the bean was grown in Nan. |
| **Workation Friendly** | The café declares that it supports a work session and supplies the required workspace information. |
| **New discovery** | A lesser-known or newly participating café. It is not penalized simply because it has few reviews. |

### Workation Friendly requirements

At minimum, ask the café to state:

- Free Wi-Fi availability
- Download, upload, and ping results, plus test date/time
- Plug availability
- Table/seat suitability
- Noise / video-call suitability
- Opening hours and any minimum-spend or seating policy

### Internet-trust labels

Do not present merchant-submitted values as a guarantee of stable connectivity.

- **Wi-Fi available** — merchant declaration only
- **Speed reported** — merchant reports a test with results and timestamp
- **Community verified** — verified visitors report that they were able to work there

If area-level data is later added, label it **Area connectivity signal**, not café speed. It can describe fixed-broadband availability or aggregated nearby measurements, but cannot earn a Workation Friendly or Community Verified badge on its own.

## 6. Coffee and menu data

### Per coffee offering

- Bean name, origin, producer/farm where available
- Process: Washed, Natural, Honey, Anaerobic, or Other
- Roast level: Light, Medium-light, Medium, Medium-dark, Dark
- Tasting notes, brew methods, price, availability, and last-updated time

Use standardized categories for filtering, but show the café's own description. Roast labels vary between roasters, so do not turn them into a false numeric comparison.

### Menu recommendations

Make each recommendation's source visible:

- **Café pick** — owner-confirmed signature/seasonal menu
- **Traveler favorite** — based on verified reviews of that menu item
- **AI pick for you** — based on stated taste and current availability, with an explanation

## 7. Merchant AI co-pilot and human-in-the-loop

### Low-friction update flow

The merchant can type or speak Thai to add a bean, update availability, set an opening notice, or update a workation detail.

Example:

> วันนี้มีเมล็ดบ้านห้วยโต้น Natural คั่วอ่อน โทนสตรอว์เบอร์รีกับช็อกโกแลต ใช้ทำ filter ราคาแก้วละ 120 บาท

AI may:

- Transcribe Thai speech
- Extract structured bean/menu/workspace fields
- Draft Thai and English descriptions
- Create a content pack for a post or story

For travelers, AI may also transcribe a voice request and extract a route, time, coffee preference, or workation need for user confirmation.

The merchant always previews, corrects, approves, or rejects the draft before it appears publicly. Raw voice data is used only for the requested transcription and is not retained by default.

## 8. Reviews and fair discovery

- A visitor checks in through a café QR code or a privacy-conscious location flow before reviewing.
- One review per verified visit.
- Structured dimensions: coffee quality, bean/story, service, value, atmosphere, and work suitability when relevant.
- Show original review text with a clearly labelled translation.
- Let merchants respond/report; moderation handles inappropriate content.
- AI ranking must not rely only on star rating. Use preference fit, current bean availability, distance/detour, opening status, season, and verified feedback.

## 9. Responsible recommendation logic

### Inputs

- Traveler preferences and available time
- Start point, route points, transport, and consented location
- Current café opening status and merchant-approved beans/menus
- Weather and verified seasonal/community information
- Badges and verified reviews

### Output

Each recommendation gives a human-readable reason, for example:

> Recommended because you chose fruity light-roast coffee, this café has a Nan-grown Natural bean available today, and it is a short detour from Wat Phumin.

When relevant, follow the café recommendation with an optional Unseen Nearby card, for example:

> Unseen nearby: a verified cultural or nature stop 12 minutes away, open until 17:00, suitable for today's weather.

## 10. Technical direction

### Application

- Next.js deployed on Vercel
- Server-side routes handle AI actions and secrets
- No API keys or privileged credentials in the client/repository

### Supabase

- Roles: `traveler`, `merchant`, `admin`
- Suggested tables: `profiles`, `cafes`, `cafe_owners`, `coffee_offerings`, `menu_items`, `workation_details`, `speed_reports`, `content_drafts`, `check_ins`, `reviews`, `itineraries`, and `seasonal_experiences`
- Storage: merchant-approved café, bean, and menu photos
- RLS: merchants manage only their own café data; travelers manage only their own check-ins/reviews; admins moderate and verify ownership

## 11. MVP demo scope

Build one complete, credible loop using a small verified dataset:

1. Traveler chooses one of the three home-screen paths.
2. AI returns an explained Coffee Trail or nearby café recommendation.
3. Traveler opens a profile with current bean/menu data and badges.
4. Merchant adds or changes a bean/workation detail via voice or text.
5. AI creates structured Thai/English content; merchant approves it.
6. The public café profile updates.
7. Traveler checks in and leaves a structured review.

Do not build payments, accommodation booking, real-time hotel inventory, or a full social network in the MVP.

## 12. Success metrics and pitch messages

### Proposed metrics

- Views, saves, and verified check-ins received by New discovery cafés
- Share of routes that reach more than one local area/community
- Number of current Nan-grown coffee offerings and merchant updates
- Workation Friendly profiles with current data
- Use of routes in low-season months and weekday periods
- Saves/clicks on verified Unseen Nearby recommendations

### Elevator pitch

> Nan Coffee, Please helps travelers discover Nan-grown coffee and hidden cafés through AI trails that fit their real plans, while giving small cafés a voice-first way to keep their story current in Thai and English.

### Answer to the low-season question

> Coffee is not the only reason to visit Nan. It is the familiar first stop that helps a traveler discover local food, crafts, culture, and community experiences along a route they would otherwise miss. Workation Friendly cafés also give remote workers a practical reason to stay and explore outside the winter peak.

## 13. Data and validation priorities

- Verify every café, coffee origin, menu, operating hour, badge, and community claim used in the demo.
- Validate Nan-grown origin separately from roasting location.
- Collect workation details from merchants; show a test timestamp, not a permanent promise of stable internet.
- Use official TAT/TAT Data API, provincial calendar, and tourism sources for destination/event context.
- Interview several café owners and travelers to test whether the badges and three home-screen paths are immediately understandable.
