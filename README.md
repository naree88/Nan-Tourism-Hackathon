# Nan Coffee, Please

แพลตฟอร์มค้นหาร้านกาแฟน่านสำหรับนักท่องเที่ยว และ Merchant co-pilot ที่ช่วยเจ้าของร้านอัปเดตหน้าร้านด้วยข้อความ เสียง หรือรูปถ่าย โดยทุกการเปลี่ยนแปลงต้องผ่านการตรวจและอนุมัติก่อนเผยแพร่

> Thai-first · Mobile-first · Nan coffee discovery · Human-approved AI

## Live MVP

- Production: [nan-tourism-hackathon.vercel.app](https://nan-tourism-hackathon.vercel.app)
- ค้นหาร้านกาแฟ: [หน้าแรก](https://nan-tourism-hackathon.vercel.app/)
- ร้านฟองคำ คอฟฟี่พอยต์: [หน้าร้านตัวอย่าง](https://nan-tourism-hackathon.vercel.app/cafes/finder-demo-01)
- เจ้าของร้าน: [Demo login](https://nan-tourism-hackathon.vercel.app/login?next=/merchant)
- Source code: [naree88/Nan-Tourism-Hackathon](https://github.com/naree88/Nan-Tourism-Hackathon)

## ทดลองในฐานะกรรมการ

หน้าเที่ยวใช้งานได้ทันทีโดยไม่ต้องเข้าสู่ระบบ ส่วนหน้าจัดการร้านใช้บัญชี MVP ที่ตั้งใจเปิดเผยสำหรับการตัดสินเท่านั้น

| | ค่า |
|---|---|
| ร้าน | ฟองคำ คอฟฟี่พอยต์ |
| Username | `fongkham-demo` |
| Password | `NanCoffee2026!` |

ประโยคสำหรับทดสอบ Merchant co-pilot:

> วันนี้มีเมล็ดห้วยโทน จาวา เนเชอรัล 01 Natural แหล่งปลูกบ้านห้วยโทน อำเภอบ่อเกลือ จังหวัดน่าน ผู้ผลิตกลุ่มผู้ปลูกกาแฟบ้านห้วยโทน คั่วอ่อน โทนส้มแมนดาริน สตรอว์เบอร์รี และน้ำผึ้ง ชงแบบ Filter หรือ Cold Brew ราคาแก้วละ 150 บาท และมีจำนวนจำกัด

ขั้นตอนเดโมสั้น ๆ:

1. เข้าสู่ระบบด้วยบัญชีด้านบน
2. พิมพ์ประโยคเดโม หรือแนบรูปเมล็ดกาแฟ JPEG/PNG/WebP ไม่เกิน 2 MB
3. กดสร้างร่าง แล้วตรวจข้อมูลที่ AI อ่านได้
4. แก้ไขรายละเอียดใน Preview ได้ก่อนกดอนุมัติ
5. เมล็ดใหม่จะปรากฏเป็นรายการใหม่ใน Single Origin Coffee ของหน้าร้าน

## สิ่งที่ MVP แสดงให้เห็น

### 1. นักท่องเที่ยวค้นหาร้านที่เข้ากับเส้นทาง

- เพิ่มสถานที่ได้ 0, 1 หรือหลายจุด ด้วยชื่อสถานที่ พิกัด หรือ Current location
- ทุกตัวกรองเป็น optional; ไม่เลือกอะไรจะแสดงร้านกาแฟตัวอย่างทั้ง 13 ร้าน
- เลือกวิธีเดินทาง: รถยนต์ จักรยาน หรือเดิน
- เลือกกาแฟน่าน: เมล็ดปลูกในน่าน หรือคั่วในน่าน
- กรอง Coffee Processing, Taste Note, ระดับการคั่ว และ Workation
- ร้านปกติต้องอยู่ไม่เกิน 15 กม. จากจุดที่เลือก
- เมื่อมีหลายจุด ระบบเพิ่มร้านที่อยู่ใน corridor ±5 กม. ระหว่างจุดต่อเนื่อง แม้อยู่นอกรัศมีของปลายทาง
- การ์ดร้านแสดงระยะจากชื่อสถานที่จริง และเวลาเดินทางโดยประมาณที่คำนวณจากรถยนต์ 80, จักรยาน 15 และเดิน 5 กม./ชม.
- แผนที่จังหวัดน่านรองรับปุ่มซูม, mouse wheel, pan และ pinch บนมือถือ สูงสุด 64× หรือ 6,400%
- ใต้แผนที่มี “รายละเอียดจุดบนแผนที่” เพื่ออ่านคำอธิบายแต่ละตำแหน่งโดยไม่ใช้แผนที่ซ้ำ

### 2. หน้าร้านช่วยโปรโมตกาแฟน่าน

- Recommended Menu พร้อมราคาและความเชื่อมโยงกับเมล็ดเด่น
- รองรับ Single Origin Coffee หลายล็อตในร้านเดียว
- แสดงแหล่งปลูก, producer, altitude, varietal, process, processed in, roast, roasted in, taste notes, วิธีชง และ availability
- Coffee Origin Trace เลือกเฉพาะเมล็ดที่ปลูกในจังหวัดน่าน โดยให้เมล็ดน่านที่เจ้าของร้านอนุมัติล่าสุดมาก่อน
- Workation แสดง download, upload และ ping เมื่อร้านมีข้อมูล
- Customer Reviews จำลองให้สัมพันธ์กับเมนูและบริบทของแต่ละร้าน
- Unseen Nearby เชื่อมสถานที่ใกล้ร้านเพื่อชวนให้เกิดการเดินทางต่อ ไม่ใช่แค่แวะดื่มกาแฟ

### 3. Merchant co-pilot แบบ Human-approved

- รับ input จากข้อความ, Thai browser speech transcript และรูปถ่าย
- OpenAI อ่านข้อมูลร่วมกับหน้าร้านปัจจุบันแล้วคืน structured draft ที่ผ่าน schema validation
- เจ้าของร้านแก้ไขข้อมูลเมล็ด, เมนู, opening note และ Workation ใน Preview ได้
- AI ไม่มีสิทธิ์เผยแพร่เอง: ต้องกดยืนยันและ Approve/Reject ทุกครั้ง
- การอนุมัติเมล็ดใหม่เพิ่ม item ใน Single Origin แทนการสร้างประกาศลอยด้านบน
- สร้างร่างนำเมล็ดที่ขายหมดออกได้ โดย connected mode เก็บประวัติล็อตเดิมและใช้ transaction เดียวในการ archive

## Runtime modes

แอปรองรับการแยกโหมดข้อมูลออกจากโหมด AI เพื่อให้เดโมได้โดยไม่เสี่ยงแก้ฐานข้อมูลจริง

| ตัวแปร | โหมด | พฤติกรรม |
|---|---|---|
| `APP_DATA_MODE=demo` | Judging / local demo | ใช้ fixture ร้านกาแฟ 13 ร้าน; การอนุมัติหน้าร้านเก็บใน `localStorage` ของ browser |
| `APP_DATA_MODE=supabase` | Connected mode | โหลดและบันทึกร่าง/หน้าร้านผ่าน Supabase พร้อม Auth, ownership checks และ RLS |
| `MERCHANT_DRAFT_PROVIDER=rules` | Local fallback | แยกข้อมูลด้วย deterministic rules โดยไม่เรียกโมเดล |
| `MERCHANT_DRAFT_PROVIDER=openai-direct` | AI mode | เรียก OpenAI Responses API จาก server route เท่านั้น |

Production สำหรับกรรมการ ณ วันที่ 13 กรกฎาคม 2026 ใช้ `APP_DATA_MODE=demo`, Supabase Auth สำหรับ login และ `MERCHANT_DRAFT_PROVIDER=openai-direct` สำหรับสร้างร่างจริง จึงสาธิต AI ได้โดยไม่เขียนทับฐานข้อมูลหน้าร้านสาธารณะ

## Architecture

| Layer | หน้าที่ |
|---|---|
| Next.js App Router | หน้าเที่ยว, หน้าร้าน, login, merchant dashboard และ server API routes |
| Static demo domain data | 13 ร้าน, เมนู, Single Origin, รีวิว, Workation และ Unseen สำหรับ judging mode |
| Supabase Auth | ยืนยัน session ของบัญชีร้านเดโมด้วย signed claims และ `app_metadata` |
| Supabase Postgres | Schema, RLS, owner-scoped drafts และ publication workflow สำหรับ connected mode |
| OpenAI Responses API | แปลงข้อความ/รูปเป็น structured merchant draft; ไม่สามารถ publish โดยตรง |
| Vercel | Production deployment และ server-side environment variables |

Tech stack หลัก: Next.js 16, React 19, TypeScript, Supabase SSR/JS, Vercel AI SDK, OpenAI provider, Zod และ Vitest

## Routes

| Route | หน้าที่ |
|---|---|
| `/` | ค้นหาและกรองร้านบนแผนที่จังหวัดน่าน |
| `/cafes/[slug]` | รายละเอียดร้าน เมนู Single Origin, Coffee Origin Trace, รีวิว และ Workation |
| `/cafes/[slug]/check-in` | Check-in/review flow สำหรับ MVP |
| `/trail` | Coffee trail |
| `/login` | Supabase Auth สำหรับเจ้าของร้าน |
| `/merchant` | Merchant co-pilot และ approval preview |
| `/api/merchant/draft` | สร้าง structured draft ด้วย rules หรือ OpenAI |
| `/api/merchant/review` | Approve/Reject ร่างหลังตรวจสิทธิ์ |
| `/api/merchant/offering-removal` | สร้างร่างนำ Single Origin ที่ขายหมดออก |
| `/api/trails/parse` | แยก input เส้นทางแบบ deterministic |

## Run locally

ต้องมี Node.js รุ่นที่รองรับ Next.js 16 และ npm จากนั้นรันใน PowerShell:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

หน้าเที่ยวและ rule-based flow ทำงานได้โดยไม่ใส่ key แต่ `/login` และ `/merchant` ต้องมี Supabase public configuration และ Auth user ที่ provision แล้ว

### สร้างบัญชีร้านเดโมใน Supabase

ใส่ Supabase URL, publishable key และ secret key ใน `.env.local` แล้วรันคำสั่งนี้เฉพาะกับ Supabase project สำหรับเดโมที่ตั้งใจไว้:

```powershell
node --env-file=.env.local scripts/provision-demo-merchant.mjs
```

Script จะสร้างหรืออัปเดต Auth user ของร้านฟองคำและใส่สิทธิ์ใน `app_metadata` ห้ามรันกับ project อื่นโดยไม่ตรวจ environment ก่อน

## Environment variables

ดู template ได้ที่ [`.env.example`](./.env.example) โดยค่าจริงต้องอยู่ใน `.env.local` หรือ Vercel Project Settings เท่านั้น

| Variable | Exposure | ใช้เมื่อ |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-visible | Supabase Auth และ connected mode |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-visible | Public Supabase client key ที่แนะนำ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-visible | Legacy compatibility fallback |
| `NEXT_PUBLIC_APP_URL` | Browser-visible | Canonical app URL / metadata |
| `APP_DATA_MODE` | Server config | ต้องเป็น `demo` หรือ `supabase`; Production fail closed หากไม่กำหนด |
| `MERCHANT_DRAFT_PROVIDER` | Server config | `rules` หรือ `openai-direct` |
| `MERCHANT_AI_MODEL` | Server config | Direct OpenAI model ID; judging deployment ใช้ `gpt-5.6-luna` |
| `OPENAI_API_KEY` | **Server secret** | เรียก OpenAI จาก `/api/merchant/draft` |
| `SUPABASE_SECRET_KEY` | **Server secret** | Admin writes ใน connected mode และ provisioning script |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server secret** | Legacy fallback เท่านั้น |

ตัวแปรที่ขึ้นต้นด้วย `NEXT_PUBLIC_` จะอยู่ใน browser bundle แม้หน้า Vercel จะทำเครื่องหมายว่า Sensitive จึงต้องใส่เฉพาะ URL หรือ publishable key เท่านั้น ห้ามเปลี่ยนชื่อ OpenAI/Supabase secret ให้ขึ้นต้นด้วย `NEXT_PUBLIC_`

### Vercel Production

ตั้งค่าที่ Project → Settings → Environment Variables แล้ว redeploy หลังเปลี่ยนค่า เพราะ deployment เก่าจะไม่รับ environment variables ชุดใหม่

- Scope `OPENAI_API_KEY` และ `SUPABASE_SECRET_KEY` เฉพาะ environment ที่ต้องใช้ และเปิด Sensitive
- Preview ไม่ควรใช้ Production secret/database โดยไม่จำเป็น
- Judging mode ต้องใช้ Supabase URL + publishable key สำหรับ Auth และ OpenAI key สำหรับ AI draft
- `SUPABASE_SECRET_KEY` ไม่จำเป็นต่อ runtime เมื่อ `APP_DATA_MODE=demo`; ใช้เมื่อเปิด persistent Supabase mode เท่านั้น
- OpenAI key ใช้ Project แยก, จำกัดสิทธิ์ Responses API และตั้ง Project spend limit ไว้ที่ USD 5

## Supabase connected mode

Migration อยู่ใน `supabase/migrations`:

1. `20260711090000_initial_nan_coffee_schema.sql`
2. `20260712205523_protect_archived_coffee_offerings.sql`
3. `20260713010000_merchant_multimodal_profile.sql`
4. `20260713020000_atomic_sold_out_offering_archive.sql`
5. `20260713030000_database_advisor_fixes.sql`

เมื่อตั้ง Supabase CLI และ link project แล้ว ให้ review migration ก่อนใช้คำสั่ง:

```powershell
supabase db push
```

ไฟล์ `supabase/seed.sql` เป็น seed สำหรับ environment ที่ต้องการ persistent demo data แยกจาก static judging fixtures

## Security and privacy boundaries

- ตรวจ Git history และ tracked tree รอบล่าสุดแล้ว ไม่พบ OpenAI, Supabase, GitHub, Vercel, database credential หรือ private key จริงถูก commit
- `.env.local`, `.vercel/`, logs และ build output ถูก `.gitignore`
- `OPENAI_API_KEY` และ Supabase secret ถูกอ่านเฉพาะ server-side; browser ใช้ publishable key ร่วมกับ RLS
- Supabase public tables ทั้ง 13 ตารางเปิด RLS และ policy ผูกการเขียนกับผู้ใช้/เจ้าของร้านที่ยืนยันแล้ว
- Authorization ใช้ validated Supabase claims; สิทธิ์ร้านเดโมอยู่ใน `app_metadata` ไม่ใช่ user-editable metadata
- AI รับ current profile เป็น context แต่ถูกสั่งให้ถือข้อความและรูปเป็น untrusted data และคืนเฉพาะ structured schema
- OpenAI request ใช้ `maxRetries: 0`, จำกัด output, reasoning ต่ำ และ `store: false`
- `store: false` ลดการเก็บ Response application state แต่ **ไม่ใช่** การรับรอง Zero Data Retention; ดู [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data#v1responses)
- ระบบไม่เก็บไฟล์เสียงดิบ; browser ส่งเฉพาะ transcript text
- รูปถูกส่งให้ OpenAI เฉพาะตอนสร้างร่าง และไม่เก็บ raw image bytes ใน Supabase; เก็บได้เพียงชื่อ ชนิด และขนาดสำหรับ audit metadata
- Connected mode อาจเก็บข้อความ/transcript ใน `content_drafts` เพื่อให้เจ้าของร้านตรวจสอบย้อนกลับ
- บัญชีกรรมการเป็น public demo credential ที่จำกัดให้ร้านเดียว ควร reset หรือปิดหลังจบการตัดสิน

แนวทาง key ปัจจุบันอ้างอิง [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys), [Vercel Sensitive Environment Variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables) และ [OpenAI API key best practices](https://developers.openai.com/api/docs/guides/production-best-practices#api-keys)

## Verification status

ตรวจล่าสุดวันที่ 13 กรกฎาคม 2026:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

- Vitest: 179 tests ผ่านทั้งหมดใน 27 test files
- ESLint, TypeScript และ production build ผ่าน
- `npm audit --omit=dev`: ไม่พบช่องโหว่ dependency ที่รายงานในขณะตรวจ
- Production rehearsal ผ่านทั้ง traveler filters/map, demo login, text/photo OpenAI draft, approval preview และผลบนหน้าร้าน
- OpenAI production request สำเร็จด้วย `gpt-5.6-luna` และ log เฉพาะ token usage ไม่บันทึก key หรือ merchant input

## Data scope

- ชื่อ/พิกัดร้านกาแฟ 13 ร้าน, ความสัมพันธ์ร้าน–เมล็ด–เมนู–ราคา–รีวิว–อินเทอร์เน็ต เป็น MVP fixtures สำหรับทดสอบ
- ภูมิศาสตร์กาแฟน่านถูกปรับให้ใกล้บริบทจริงจาก reference ที่รวบรวมสำหรับโครงการ แต่ไม่ควรตีความเป็น inventory หรือ sourcing claim แบบ real-time
- พิกัดสถานที่ MVP ที่กำหนด: ท่าอากาศยานน่านนคร, วัดภูมินทร์ และวัดพระธาตุแช่แห้ง
- ขอบเขตจังหวัดใช้ GeoJSON จาก [apisit/thailand.json](https://github.com/apisit/thailand.json)
- ดัชนีจังหวัด/อำเภอ/ตำบลและพิกัดอ้างอิงจาก [spicydog/thailand-province-district-subdistrict-zipcode-latitude-longitude](https://github.com/spicydog/thailand-province-district-subdistrict-zipcode-latitude-longitude)
- ชื่อ Unseen Nearby ใน MVP เป็นข้อมูลประกอบเส้นทาง; ไม่ได้อ้างว่าทุกรายการผ่าน official verification แยกกัน

## Deployment workflow

`main` เชื่อมกับ Vercel Production โดยตรง:

```powershell
git add README.md
git commit -m "Update README for production MVP"
git push origin main
```

การ push ไป `main` จะสร้าง Production deployment ใหม่อัตโนมัติ ตรวจ deployment status และ smoke test URL หลัง push ทุกครั้ง
