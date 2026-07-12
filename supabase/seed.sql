-- Nan Coffee, Please demo seed
--
-- The three cafe records below are fictional product-demo records, not real
-- businesses. Every factual cafe/coffee/connectivity field is labelled `demo`.
--
-- The three Unseen Nearby records are real places whose names and coordinates
-- were source-checked on 2026-07-11 using the URLs stored on each row. No live
-- opening or access status is claimed. Cafe-to-place travel times are synthetic
-- estimates for UI testing, not live routing results.

begin;

insert into public.cafes (
  id, slug, name_th, name_en, description_th, description_en,
  address_th, address_en, latitude, longitude, map_url,
  opening_hours, opening_note_th, opening_note_en,
  status, is_new_discovery, roast_in_nan,
  source_name, source_url, data_label, verification_note,
  last_verified_at, published_at, created_at, updated_at
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'demo-khuang-cloud-coffee-lab',
    'ข่วงคลาวด์ คอฟฟี่แล็บ (ร้านสมมติ)',
    'Khuang Cloud Coffee Lab (Fictional demo)',
    'สถานการณ์จำลองของสโลว์บาร์สายฟรุตตี้ใกล้ย่านเมืองเก่า ใช้ทดสอบเส้นทางและป้ายเมล็ดปลูกในน่าน',
    'A fictional fruity slow-bar scenario used to test Old Town routing and the Nan-grown bean badge.',
    'พิกัดสมมติใกล้ย่านหัวข่วง อำเภอเมืองน่าน — ไม่มีหน้าร้านจริง',
    'Fictional pin near the Hua Khuang area, Mueang Nan — no real storefront',
    18.777020, 100.770940,
    null,
    '{"monday":{"open":"08:00","close":"17:00"},"tuesday":{"open":"08:00","close":"17:00"},"wednesday":{"open":"08:00","close":"17:00"},"thursday":{"open":"08:00","close":"17:00"},"friday":{"open":"08:00","close":"17:00"},"saturday":{"open":"08:00","close":"17:00"},"sunday":{"open":"08:00","close":"17:00"}}'::jsonb,
    'เวลาทำการเป็นข้อมูลจำลอง ไม่ใช่สถานะเปิดสด',
    'Demo hours only; this is not a live open-status claim.',
    'published', false, true,
    'Nan Coffee, Please synthetic demo dataset', null, 'demo',
    'Fictional cafe and synthetic coordinates. Do not treat as a real business or verified local fact.',
    null, '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'demo-golden-loom-workroom',
    'โกลเดนลูม เวิร์กรูม (ร้านสมมติ)',
    'Golden Loom Workroom (Fictional demo)',
    'ร้านสมมติที่เน้นเมล็ดบาลานซ์และรายละเอียดพื้นที่ทำงานครบ ใช้ทดสอบการค้นหาเวิร์กเคชัน',
    'A fictional balanced-coffee cafe with complete work details, designed to test workation discovery.',
    'พิกัดสมมติใกล้ย่านศรีพันต้น อำเภอเมืองน่าน — ไม่มีหน้าร้านจริง',
    'Fictional pin near the Si Phan Ton area, Mueang Nan — no real storefront',
    18.776310, 100.766320,
    null,
    '{"monday":{"open":"09:00","close":"19:00"},"tuesday":{"open":"09:00","close":"19:00"},"wednesday":{"open":"09:00","close":"19:00"},"thursday":{"open":"09:00","close":"19:00"},"friday":{"open":"09:00","close":"19:00"},"saturday":{"open":"09:00","close":"19:00"},"sunday":{"open":"09:00","close":"19:00"}}'::jsonb,
    'เวลาทำการเป็นข้อมูลจำลอง ไม่ใช่สถานะเปิดสด',
    'Demo hours only; this is not a live open-status claim.',
    'published', true, true,
    'Nan Coffee, Please synthetic demo dataset', null, 'demo',
    'Fictional cafe and synthetic coordinates. Do not treat as a real business or verified local fact.',
    null, '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'demo-fong-kham-cocoa-corner',
    'ฟองคำ โกโก้คอร์เนอร์ (ร้านสมมติ)',
    'Fong Kham Cocoa Corner (Fictional demo)',
    'ร้านสมมติสำหรับคนชอบกาแฟโทนช็อกโกแลตและแวะรับเร็ว ไม่มีการอ้างว่ามีพื้นที่ทำงาน',
    'A fictional chocolate-forward quick-stop cafe with no workation claim.',
    'พิกัดสมมติใกล้ย่านบ้านพระเกิด อำเภอเมืองน่าน — ไม่มีหน้าร้านจริง',
    'Fictional pin near the Ban Phra Koet area, Mueang Nan — no real storefront',
    18.789190, 100.784930,
    null,
    '{"monday":{"open":"07:30","close":"16:30"},"tuesday":{"open":"07:30","close":"16:30"},"wednesday":{"open":"07:30","close":"16:30"},"thursday":{"open":"07:30","close":"16:30"},"friday":{"open":"07:30","close":"16:30"},"saturday":{"open":"07:30","close":"16:30"},"sunday":{"open":"07:30","close":"16:30"}}'::jsonb,
    'เวลาทำการเป็นข้อมูลจำลอง ไม่ใช่สถานะเปิดสด',
    'Demo hours only; this is not a live open-status claim.',
    'published', true, false,
    'Nan Coffee, Please synthetic demo dataset', null, 'demo',
    'Fictional cafe and synthetic coordinates. Do not treat as a real business or verified local fact.',
    null, '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z'
  )
on conflict (id) do nothing;

insert into public.coffee_offerings (
  id, cafe_id, bean_name, origin_province, origin_name, producer,
  is_nan_grown, process, process_detail, roast_level,
  tasting_notes_th, tasting_notes_en, brew_methods, price_thb,
  availability, approval_status, approved_at, published_at,
  source_name, source_url, data_label, verification_note,
  last_verified_at, created_at, updated_at
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'Ban Huai Ton Demo Lot N01', 'Nan', 'Ban Huai Ton (scenario label only)', 'Demo producer — not a real sourcing claim',
    true, 'natural', 'Synthetic demo process', 'light',
    array['สตรอว์เบอร์รี (จำลอง)', 'ช็อกโกแลต (จำลอง)'],
    array['strawberry (demo)', 'chocolate (demo)'],
    array['filter', 'aeropress'], 120.00,
    'available', 'approved', '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z',
    'Nan Coffee, Please synthetic demo dataset', null, 'demo',
    'Synthetic bean, origin, process, tasting notes, price, and availability; not a real coffee claim.',
    null, '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'Golden Balance Demo Lot W02', 'Chiang Rai', 'Synthetic demo lot', 'Demo producer — not a real sourcing claim',
    false, 'washed', 'Synthetic demo process', 'medium',
    array['คาราเมล (จำลอง)', 'อัลมอนด์ (จำลอง)'],
    array['caramel (fictional)', 'almond (fictional)'],
    array['filter', 'espresso'], 105.00,
    'limited', 'approved', '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z',
    'Nan Coffee, Please synthetic demo dataset', null, 'demo',
    'Synthetic bean, process, tasting notes, price, and availability; not a real coffee claim.',
    null, '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    'Cocoa Comfort Demo Lot E03', 'Unknown in demo', 'Synthetic demo lot', 'Demo producer — not a real sourcing claim',
    false, 'washed', 'Synthetic demo process', 'medium_dark',
    array['ช็อกโกแลต (จำลอง)', 'คาราเมล (จำลอง)'],
    array['chocolate (fictional)', 'caramel (fictional)'],
    array['espresso'], 75.00,
    'available', 'approved', '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z',
    'Nan Coffee, Please synthetic demo dataset', null, 'demo',
    'Synthetic bean, origin, process, tasting notes, price, and availability; not a real coffee claim.',
    null, '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z'
  )
on conflict (id) do nothing;

insert into public.menu_items (
  id, cafe_id, name_th, name_en, description_th, description_en,
  category, price_thb, is_available, is_seasonal, is_cafe_pick,
  approval_status, approved_at, published_at,
  source_name, source_url, data_label, verification_note,
  last_verified_at, created_at, updated_at
)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'ฟิลเตอร์ประจำร้าน (สมมติ)', 'House filter (fictional)',
    'เมนูทดสอบสำหรับแสดง Cafe pick', 'Test menu item for the Cafe pick label.',
    'coffee', 120.00, true, false, true,
    'approved', '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z',
    'Nan Coffee, Please synthetic demo dataset', null, 'demo',
    'Synthetic menu, price, and availability; not a real merchant claim.',
    null, '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'แฟลตไวต์บาลานซ์ (สมมติ)', 'Balanced flat white (fictional)',
    'เมนูสมมติสำหรับทดสอบ', 'Fictional menu fixture.',
    'coffee', 95.00, true, false, true,
    'approved', '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z',
    'Nan Coffee, Please synthetic demo dataset', null, 'demo',
    'Synthetic menu, price, and availability; not a real merchant claim.',
    null, '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    'อเมริกาโน่รับเร็ว (สมมติ)', 'Quick-pickup Americano (fictional)',
    'เมนูสมมติสำหรับทดสอบ quick takeaway', 'Fictional fixture for the quick-takeaway use case.',
    'coffee', 70.00, true, false, true,
    'approved', '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z',
    'Nan Coffee, Please synthetic demo dataset', null, 'demo',
    'Synthetic menu, price, and availability; not a real merchant claim.',
    null, '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z'
  )
on conflict (id) do nothing;

insert into public.workation_details (
  cafe_id, free_wifi, outlets, seating_details_th, seating_details_en,
  work_suitability, quietness_note_th, quietness_note_en,
  video_call_suitability, hours_policy_th, hours_policy_en,
  minimum_spend_thb, max_stay_minutes, is_workation_friendly,
  approval_status, approved_at, published_at,
  source_name, source_url, data_label, verification_note,
  last_verified_at, created_at, updated_at
)
values
  (
    '10000000-0000-4000-8000-000000000001', true, 'limited',
    'ที่นั่งทำงานและปลั๊กบางจุดเป็นข้อมูลจำลอง', 'Demo work seating with outlets at some seats.',
    'suitable', 'ระดับเสียงผสมเป็นข้อมูลจำลอง', 'Mixed quietness is a demo detail.', 'possible',
    'นั่งทำงานได้ 2 ชั่วโมงเมื่อสั่งเครื่องดื่ม 1 รายการ (นโยบายสมมติ)',
    'Two-hour work seating with one drink (fictional policy).',
    100.00, 120, true,
    'approved', '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z',
    'Nan Coffee, Please synthetic demo dataset', null, 'demo',
    'All workspace facts are synthetic. Wi-Fi availability is a demo merchant declaration, not a stability guarantee.',
    null, '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z'
  ),
  (
    '10000000-0000-4000-8000-000000000002', true, 'most_seats',
    'ที่นั่งทำงานและปลั๊กเกือบทุกที่เป็นข้อมูลจำลอง', 'Demo work seating with outlets at most seats.',
    'suitable', 'โซนเงียบเป็นข้อมูลจำลอง', 'Quiet work-zone detail is fictional.', 'suitable',
    'โซนทำงานสมมติ: โปรดใช้หูฟังสำหรับคอล', 'Fictional work-zone policy: use headphones for calls.',
    120.00, null, true,
    'approved', '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z',
    'Nan Coffee, Please synthetic demo dataset', null, 'demo',
    'All workspace facts are synthetic. Wi-Fi availability is a demo merchant declaration, not a stability guarantee.',
    null, '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z'
  )
on conflict (cafe_id) do nothing;

insert into public.speed_reports (
  id, cafe_id, reporter_profile_id, verification_level,
  download_mbps, upload_mbps, ping_ms, tested_at, test_provider,
  moderation_status, published_at,
  source_name, source_url, data_label, verification_note,
  last_verified_at, created_at, updated_at
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001', null, 'merchant_reported',
    86.00, 31.00, 18.00, '2026-07-10T07:30:00Z', 'Synthetic demo test',
    'published', '2026-07-11T02:00:00Z',
    'Nan Coffee, Please synthetic demo dataset', null, 'demo',
    'Synthetic speed values for UI testing only. Not a measurement and never a stability guarantee.',
    null, '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002', null, 'merchant_reported',
    122.00, 47.00, 14.00, '2026-07-09T04:00:00Z', 'Synthetic demo test',
    'published', '2026-07-11T02:00:00Z',
    'Nan Coffee, Please synthetic demo dataset', null, 'demo',
    'Synthetic speed values for UI testing only. Not a measurement and never a stability guarantee.',
    null, '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z'
  )
on conflict (id) do nothing;

insert into public.unseen_places (
  id, slug, name_th, name_en, category, description_th, description_en,
  latitude, longitude, opening_hours, opening_note_th, opening_note_en,
  access_note_th, access_note_en, weather_note_th, weather_note_en,
  verification_status, approval_status, approved_at, published_at,
  source_name, source_url, source_urls, data_label, verification_note,
  last_verified_at, verification_expires_at, created_at, updated_at
)
values
  (
    '50000000-0000-4000-8000-000000000001',
    'wat-hua-khuang', 'วัดหัวข่วง', 'Wat Hua Khuang', 'culture',
    'สถานที่วัฒนธรรมในน่านที่ตรวจสอบชื่อและพิกัดจากแหล่งอ้างอิงแล้ว โปรดตรวจสอบเวลาเปิดและการเข้าถึงล่าสุดก่อนเดินทาง',
    'A Nan cultural place whose name and coordinates were source-checked. Recheck current hours and access before visiting.',
    18.777170, 100.771330, '{}'::jsonb,
    'ไม่มีการอ้างสถานะเปิดสดในชุดข้อมูลนี้ โปรดตรวจสอบอีกครั้ง',
    'No live opening status is seeded; recheck before visiting.',
    'ข้อมูลการเข้าถึงอาจเปลี่ยนแปลง โปรดตรวจสอบกับแหล่งปัจจุบัน',
    'Access details may change; verify against a current source.',
    'ไม่มีการอ้างความเหมาะสมตามสภาพอากาศแบบสด',
    'No live weather-suitability claim is made.',
    'source_checked', 'approved', '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z',
    'Tourism Authority of Thailand + Wikidata',
    'https://thai.tourismthailand.org/Articles/nan-24-hrs',
    array['https://thai.tourismthailand.org/Articles/nan-24-hrs','https://www.wikidata.org/wiki/Q13020887'],
    'sample',
    'Name and coordinates source-checked 2026-07-11. Current hours, access, weather suitability, and open status were not verified.',
    '2026-07-11T02:00:00Z', null, '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z'
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    'wat-si-phan-ton', 'วัดศรีพันต้น', 'Wat Si Phan Ton', 'culture',
    'สถานที่วัฒนธรรมในน่านที่ตรวจสอบชื่อและพิกัดจากแหล่งอ้างอิงแล้ว โปรดตรวจสอบเวลาเปิดและการเข้าถึงล่าสุดก่อนเดินทาง',
    'A Nan cultural place whose name and coordinates were source-checked. Recheck current hours and access before visiting.',
    18.77598062, 100.76572753, '{}'::jsonb,
    'ไม่มีการอ้างสถานะเปิดสดในชุดข้อมูลนี้ โปรดตรวจสอบอีกครั้ง',
    'No live opening status is seeded; recheck before visiting.',
    'ข้อมูลการเข้าถึงอาจเปลี่ยนแปลง โปรดตรวจสอบกับแหล่งปัจจุบัน',
    'Access details may change; verify against a current source.',
    'ไม่มีการอ้างความเหมาะสมตามสภาพอากาศแบบสด',
    'No live weather-suitability claim is made.',
    'source_checked', 'approved', '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z',
    'Tourism Authority of Thailand + Thailandee',
    'https://thai.tourismthailand.org/Articles/nan-24-hrs',
    array['https://thai.tourismthailand.org/Articles/nan-24-hrs','https://www.thailandee.com/en/visit-thailand/wat-sri-panton-nan-251'],
    'sample',
    'Name and coordinates source-checked 2026-07-11. Current hours, access, weather suitability, and open status were not verified.',
    '2026-07-11T02:00:00Z', null, '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z'
  ),
  (
    '50000000-0000-4000-8000-000000000003',
    'hong-chao-fong-kham', 'โฮงเจ้าฟองคำ', 'Hong Chao Fong Kham', 'craft',
    'สถานที่เรียนรู้ชุมชนในน่านที่ตรวจสอบชื่อและพิกัดจากแหล่งอ้างอิงแล้ว โปรดตรวจสอบเวลาเปิดและการเข้าถึงล่าสุดก่อนเดินทาง',
    'A Nan community place whose name and coordinates were source-checked. Recheck current hours and access before visiting.',
    18.789618, 100.785608, '{}'::jsonb,
    'ไม่มีการอ้างสถานะเปิดสดในชุดข้อมูลนี้ โปรดตรวจสอบอีกครั้ง',
    'No live opening status is seeded; recheck before visiting.',
    'ข้อมูลการเข้าถึงอาจเปลี่ยนแปลง โปรดตรวจสอบกับแหล่งปัจจุบัน',
    'Access details may change; verify against a current source.',
    'ไม่มีการอ้างความเหมาะสมตามสภาพอากาศแบบสด',
    'No live weather-suitability claim is made.',
    'source_checked', 'approved', '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z',
    'Tourism Authority of Thailand + MThai Travel',
    'https://www.tourismthailand.org/Articles/nan-and-phayao-cheap-but-charming-havens-2',
    array['https://www.tourismthailand.org/Articles/nan-and-phayao-cheap-but-charming-havens-2','https://travel.mthai.com/blog/136628.html'],
    'sample',
    'Name and coordinates source-checked 2026-07-11. Current hours, access, weather suitability, and open status were not verified.',
    '2026-07-11T02:00:00Z', null, '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z'
  )
on conflict (id) do nothing;

insert into public.cafe_unseen_places (
  cafe_id, unseen_place_id, travel_minutes, distance_km, transport_mode,
  access_note_th, access_note_en, approval_status, approved_at, published_at,
  source_name, source_url, data_label, verification_note,
  last_verified_at, created_at, updated_at
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    2, 0.10, 'walk',
    'เวลาและระยะทางเป็นค่าประมาณสำหรับเดโม ไม่ใช่เส้นทางสด',
    'Time and distance are demo estimates, not live routing.',
    'approved', '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z',
    'Nan Coffee, Please synthetic proximity estimate', null, 'demo',
    'Synthetic cafe-to-place estimate for UI testing; re-route before travel.',
    null, '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z'
  ),
  (
    '10000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000002',
    9, 0.80, 'walk',
    'เวลาและระยะทางเป็นค่าประมาณสำหรับเดโม ไม่ใช่เส้นทางสด',
    'Time and distance are demo estimates, not live routing.',
    'approved', '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z',
    'Nan Coffee, Please synthetic proximity estimate', null, 'demo',
    'Synthetic cafe-to-place estimate for UI testing; re-route before travel.',
    null, '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '50000000-0000-4000-8000-000000000002',
    2, 0.10, 'walk',
    'เวลาและระยะทางเป็นค่าประมาณสำหรับเดโม ไม่ใช่เส้นทางสด',
    'Time and distance are demo estimates, not live routing.',
    'approved', '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z',
    'Nan Coffee, Please synthetic proximity estimate', null, 'demo',
    'Synthetic cafe-to-place estimate for UI testing; re-route before travel.',
    null, '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '50000000-0000-4000-8000-000000000001',
    10, 0.90, 'walk',
    'เวลาและระยะทางเป็นค่าประมาณสำหรับเดโม ไม่ใช่เส้นทางสด',
    'Time and distance are demo estimates, not live routing.',
    'approved', '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z',
    'Nan Coffee, Please synthetic proximity estimate', null, 'demo',
    'Synthetic cafe-to-place estimate for UI testing; re-route before travel.',
    null, '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    '50000000-0000-4000-8000-000000000003',
    3, 0.20, 'walk',
    'เวลาและระยะทางเป็นค่าประมาณสำหรับเดโม ไม่ใช่เส้นทางสด',
    'Time and distance are demo estimates, not live routing.',
    'approved', '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z',
    'Nan Coffee, Please synthetic proximity estimate', null, 'demo',
    'Synthetic cafe-to-place estimate for UI testing; re-route before travel.',
    null, '2026-07-11T02:00:00Z', '2026-07-11T02:00:00Z'
  )
on conflict (cafe_id, unseen_place_id) do nothing;

commit;
