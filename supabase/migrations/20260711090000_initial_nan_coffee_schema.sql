-- Nan Coffee, Please: production-minded initial schema.
--
-- Supabase changed new-project Data API defaults in 2026: explicit grants are
-- required for projects using the safer default. This migration revokes legacy
-- automatic grants, enables RLS on every public table, and then grants only the
-- operations the browser clients need. Administrative/moderation work is
-- intentionally left to trusted server code using service_role.

begin;

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

-- Opt into the post-May-30-2026 least-privilege behavior on projects that still
-- carry the legacy automatic Data API defaults.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public;
alter default privileges for role postgres in schema private
  revoke execute on functions from public, anon, authenticated;

create type public.profile_role as enum ('traveler', 'merchant', 'admin');
create type public.cafe_status as enum ('draft', 'published', 'temporarily_closed', 'archived');
create type public.ownership_status as enum ('pending', 'verified', 'rejected', 'revoked');
create type public.data_label as enum (
  'demo',
  'sample',
  'merchant_reported',
  'community_verified',
  'partner_verified',
  'official_verified'
);
create type public.approval_status as enum ('draft', 'approved', 'rejected', 'archived');
create type public.offering_availability as enum ('available', 'limited', 'sold_out', 'seasonal', 'unavailable');
create type public.coffee_process as enum ('washed', 'natural', 'honey', 'anaerobic', 'other');
create type public.roast_level as enum ('light', 'medium_light', 'medium', 'medium_dark', 'dark', 'unspecified');
create type public.outlet_availability as enum ('unknown', 'none', 'limited', 'most_seats');
create type public.work_suitability as enum ('not_assessed', 'limited', 'suitable', 'very_suitable');
create type public.video_call_suitability as enum ('not_assessed', 'not_recommended', 'possible', 'suitable');
create type public.speed_verification_level as enum ('merchant_reported', 'community_verified');
create type public.moderation_status as enum ('pending', 'published', 'flagged', 'rejected');
create type public.merchant_update_kind as enum ('coffee_offering', 'menu_item', 'opening_notice', 'workation', 'general');
create type public.input_method as enum ('text', 'voice_transcript', 'demo');
create type public.content_draft_status as enum ('draft', 'approved', 'rejected', 'applied');
create type public.checkin_verification_method as enum ('qr', 'location', 'demo');
create type public.itinerary_status as enum ('parsed', 'confirmed', 'generated', 'archived');
create type public.unseen_category as enum ('local_food', 'culture', 'craft', 'scenic_point', 'gentle_nature', 'community_experience');
create type public.place_verification_status as enum ('demo', 'source_checked', 'pending', 'partner_verified', 'official_verified', 'expired');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 120),
  role public.profile_role not null default 'traveler',
  locale text not null default 'th' check (locale in ('th', 'en')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cafes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_th text not null check (char_length(name_th) between 1 and 160),
  name_en text check (name_en is null or char_length(name_en) <= 160),
  description_th text,
  description_en text,
  address_th text not null,
  address_en text,
  latitude numeric(11, 8),
  longitude numeric(11, 8),
  phone text,
  website_url text,
  map_url text,
  opening_hours jsonb not null default '{}'::jsonb check (jsonb_typeof(opening_hours) = 'object'),
  opening_note_th text,
  opening_note_en text,
  photo_urls text[] not null default '{}',
  status public.cafe_status not null default 'draft',
  is_new_discovery boolean not null default false,
  roast_in_nan boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  source_name text not null default 'Merchant submission',
  source_url text,
  data_label public.data_label not null default 'merchant_reported',
  verification_note text,
  last_verified_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cafes_coordinates_together check ((latitude is null) = (longitude is null)),
  constraint cafes_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint cafes_longitude_range check (longitude is null or longitude between -180 and 180),
  constraint cafes_source_url_http check (source_url is null or source_url ~ '^https?://')
);

create table public.cafe_owners (
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  status public.ownership_status not null default 'pending',
  is_primary boolean not null default false,
  verification_source text,
  verified_at timestamptz,
  verified_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (cafe_id, profile_id),
  constraint cafe_owners_verified_timestamp check (status <> 'verified' or verified_at is not null)
);

create table public.coffee_offerings (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  bean_name text not null check (char_length(bean_name) between 1 and 160),
  origin_province text,
  origin_name text,
  producer text,
  is_nan_grown boolean not null default false,
  process public.coffee_process not null default 'other',
  process_detail text,
  roast_level public.roast_level not null default 'unspecified',
  tasting_notes_th text[] not null default '{}',
  tasting_notes_en text[] not null default '{}',
  brew_methods text[] not null default '{}',
  price_thb numeric(10, 2) check (price_thb is null or price_thb >= 0),
  availability public.offering_availability not null default 'available',
  available_from date,
  available_until date,
  approval_status public.approval_status not null default 'draft',
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,
  source_name text not null default 'Merchant submission',
  source_url text,
  data_label public.data_label not null default 'merchant_reported',
  verification_note text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coffee_offerings_nan_origin_named check (
    not is_nan_grown or (origin_name is not null and btrim(origin_name) <> '')
  ),
  constraint coffee_offerings_dates_ordered check (available_until is null or available_from is null or available_until >= available_from),
  constraint coffee_offerings_source_url_http check (source_url is null or source_url ~ '^https?://')
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  name_th text not null check (char_length(name_th) between 1 and 160),
  name_en text,
  description_th text,
  description_en text,
  category text not null default 'coffee',
  price_thb numeric(10, 2) check (price_thb is null or price_thb >= 0),
  is_available boolean not null default true,
  is_seasonal boolean not null default false,
  is_cafe_pick boolean not null default false,
  approval_status public.approval_status not null default 'draft',
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,
  source_name text not null default 'Merchant submission',
  source_url text,
  data_label public.data_label not null default 'merchant_reported',
  verification_note text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_items_source_url_http check (source_url is null or source_url ~ '^https?://')
);

create table public.workation_details (
  cafe_id uuid primary key references public.cafes (id) on delete cascade,
  free_wifi boolean not null default false,
  outlets public.outlet_availability not null default 'unknown',
  seating_details_th text,
  seating_details_en text,
  work_suitability public.work_suitability not null default 'not_assessed',
  quietness_note_th text,
  quietness_note_en text,
  video_call_suitability public.video_call_suitability not null default 'not_assessed',
  hours_policy_th text,
  hours_policy_en text,
  minimum_spend_thb numeric(10, 2) check (minimum_spend_thb is null or minimum_spend_thb >= 0),
  max_stay_minutes integer check (max_stay_minutes is null or max_stay_minutes > 0),
  is_workation_friendly boolean not null default false,
  approval_status public.approval_status not null default 'draft',
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,
  source_name text not null default 'Merchant submission',
  source_url text,
  data_label public.data_label not null default 'merchant_reported',
  verification_note text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workation_badge_minimum_fields check (
    not is_workation_friendly or (
      free_wifi
      and outlets not in ('unknown', 'none')
      and work_suitability <> 'not_assessed'
      and video_call_suitability <> 'not_assessed'
      and seating_details_th is not null and btrim(seating_details_th) <> ''
      and quietness_note_th is not null and btrim(quietness_note_th) <> ''
      and hours_policy_th is not null and btrim(hours_policy_th) <> ''
    )
  ),
  constraint workation_source_url_http check (source_url is null or source_url ~ '^https?://')
);

create table public.speed_reports (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  reporter_profile_id uuid references public.profiles (id) on delete set null,
  verification_level public.speed_verification_level not null default 'merchant_reported',
  download_mbps numeric(10, 2) not null check (download_mbps >= 0 and download_mbps <= 100000),
  upload_mbps numeric(10, 2) not null check (upload_mbps >= 0 and upload_mbps <= 100000),
  ping_ms numeric(10, 2) not null check (ping_ms >= 0 and ping_ms <= 60000),
  tested_at timestamptz not null,
  test_provider text,
  moderation_status public.moderation_status not null default 'pending',
  published_at timestamptz,
  source_name text not null default 'Merchant speed report',
  source_url text,
  data_label public.data_label not null default 'merchant_reported',
  verification_note text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint speed_reports_source_url_http check (source_url is null or source_url ~ '^https?://')
);

create table public.content_drafts (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  owner_profile_id uuid not null references public.profiles (id) on delete cascade,
  update_kind public.merchant_update_kind not null,
  input_method public.input_method not null default 'text',
  source_input_text text not null check (char_length(source_input_text) between 1 and 10000),
  source_language text not null default 'th' check (char_length(source_language) between 2 and 12),
  structured_data jsonb not null default '{}'::jsonb check (jsonb_typeof(structured_data) = 'object'),
  thai_copy text,
  english_copy text,
  status public.content_draft_status not null default 'draft',
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  rejected_at timestamptz,
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_drafts_approval_timestamp check (status <> 'approved' or approved_at is not null),
  constraint content_drafts_applied_timestamp check (status <> 'applied' or applied_at is not null)
);

-- Exact coordinates and raw audio are deliberately not stored. verification_evidence_hash
-- is for a one-way server-generated proof/token reference only.
create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  traveler_id uuid not null references public.profiles (id) on delete cascade,
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  verification_method public.checkin_verification_method not null,
  verification_evidence_hash text,
  is_verified boolean not null default false,
  checked_in_at timestamptz not null default now(),
  verified_at timestamptz,
  verification_note text,
  created_at timestamptz not null default now(),
  constraint check_ins_verification_timestamp check (is_verified = (verified_at is not null)),
  constraint check_ins_demo_not_verified check (verification_method <> 'demo' or not is_verified)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  traveler_id uuid not null references public.profiles (id) on delete cascade,
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  check_in_id uuid not null unique references public.check_ins (id) on delete cascade,
  coffee_quality smallint not null check (coffee_quality between 1 and 5),
  bean_story smallint not null check (bean_story between 1 and 5),
  service smallint not null check (service between 1 and 5),
  value smallint not null check (value between 1 and 5),
  atmosphere smallint not null check (atmosphere between 1 and 5),
  work_suitability_rating smallint check (work_suitability_rating is null or work_suitability_rating between 1 and 5),
  body_original text check (body_original is null or char_length(body_original) <= 5000),
  original_language text not null default 'th' check (char_length(original_language) between 2 and 12),
  body_translation text,
  translation_provider text,
  moderation_status public.moderation_status not null default 'pending',
  merchant_response text,
  merchant_responded_at timestamptz,
  merchant_reported_at timestamptz,
  merchant_report_reason text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.itineraries (
  id uuid primary key default gen_random_uuid(),
  traveler_id uuid references public.profiles (id) on delete cascade,
  input_method public.input_method not null default 'text',
  original_request text not null check (char_length(original_request) between 1 and 10000),
  structured_request jsonb not null default '{}'::jsonb check (jsonb_typeof(structured_request) = 'object'),
  recommendation_result jsonb check (recommendation_result is null or jsonb_typeof(recommendation_result) = 'object'),
  status public.itinerary_status not null default 'parsed',
  location_consent boolean not null default false,
  parsed_confirmed_at timestamptz,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint itineraries_confirmation_timestamp check (status = 'parsed' or parsed_confirmed_at is not null),
  constraint itineraries_generation_timestamp check (status <> 'generated' or generated_at is not null)
);

create table public.unseen_places (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_th text not null check (char_length(name_th) between 1 and 200),
  name_en text,
  category public.unseen_category not null,
  description_th text,
  description_en text,
  latitude numeric(11, 8) not null check (latitude between -90 and 90),
  longitude numeric(11, 8) not null check (longitude between -180 and 180),
  opening_hours jsonb not null default '{}'::jsonb check (jsonb_typeof(opening_hours) = 'object'),
  opening_note_th text,
  opening_note_en text,
  access_note_th text,
  access_note_en text,
  weather_note_th text,
  weather_note_en text,
  photo_urls text[] not null default '{}',
  verification_status public.place_verification_status not null default 'pending',
  approval_status public.approval_status not null default 'draft',
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,
  source_name text not null,
  source_url text,
  source_urls text[] not null default '{}',
  data_label public.data_label not null,
  verification_note text,
  last_verified_at timestamptz,
  verification_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unseen_places_source_url_http check (source_url is null or source_url ~ '^https?://'),
  constraint unseen_places_source_urls_present check (
    verification_status not in ('source_checked', 'partner_verified', 'official_verified')
    or cardinality(source_urls) > 0
  ),
  constraint unseen_places_verification_dates check (
    verification_expires_at is null or last_verified_at is null or verification_expires_at >= last_verified_at
  )
);

create table public.cafe_unseen_places (
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  unseen_place_id uuid not null references public.unseen_places (id) on delete cascade,
  travel_minutes smallint not null check (travel_minutes between 1 and 180),
  distance_km numeric(7, 2) check (distance_km is null or distance_km between 0 and 500),
  transport_mode text not null default 'walk',
  access_note_th text,
  access_note_en text,
  approval_status public.approval_status not null default 'draft',
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,
  source_name text not null default 'Merchant submission',
  source_url text,
  data_label public.data_label not null default 'merchant_reported',
  verification_note text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (cafe_id, unseen_place_id),
  constraint cafe_unseen_places_source_url_http check (source_url is null or source_url ~ '^https?://')
);

comment on column public.speed_reports.verification_level is
  'merchant_reported is a timestamped report, never a stability guarantee; community_verified requires a verified visit.';
comment on column public.content_drafts.source_input_text is
  'Text/transcript only. Raw voice audio is not retained by this schema.';
comment on column public.workation_details.is_workation_friendly is
  'Profile completeness badge; it does not guarantee Wi-Fi stability. Application logic must also require a current speed report.';
comment on column public.cafes.data_label is
  'Truth label shown to users. demo/sample rows must never be presented as independently verified facts.';

-- Index foreign keys, ownership predicates, and common public listing filters.
create unique index cafe_owners_one_primary_idx on public.cafe_owners (cafe_id) where is_primary and status = 'verified';
create index cafe_owners_profile_idx on public.cafe_owners (profile_id, status, cafe_id);
create index cafes_public_idx on public.cafes (updated_at desc) where status in ('published', 'temporarily_closed');
create index cafes_location_idx on public.cafes (latitude, longitude) where latitude is not null;
create index coffee_offerings_cafe_idx on public.coffee_offerings (cafe_id, updated_at desc);
create index coffee_offerings_public_idx on public.coffee_offerings (cafe_id, availability, updated_at desc)
  where approval_status = 'approved' and published_at is not null;
create index menu_items_cafe_idx on public.menu_items (cafe_id, updated_at desc);
create index menu_items_public_idx on public.menu_items (cafe_id, is_available, is_cafe_pick)
  where approval_status = 'approved' and published_at is not null;
create index speed_reports_public_idx on public.speed_reports (cafe_id, tested_at desc)
  where moderation_status = 'published';
create index speed_reports_reporter_idx on public.speed_reports (reporter_profile_id, created_at desc)
  where reporter_profile_id is not null;
create index content_drafts_owner_idx on public.content_drafts (owner_profile_id, status, updated_at desc);
create index content_drafts_cafe_idx on public.content_drafts (cafe_id, updated_at desc);
create index check_ins_traveler_idx on public.check_ins (traveler_id, checked_in_at desc);
create index check_ins_cafe_idx on public.check_ins (cafe_id, checked_in_at desc);
create index reviews_public_idx on public.reviews (cafe_id, published_at desc) where moderation_status = 'published';
create index reviews_traveler_idx on public.reviews (traveler_id, created_at desc);
create index itineraries_traveler_idx on public.itineraries (traveler_id, created_at desc) where traveler_id is not null;
create index unseen_places_public_idx on public.unseen_places (category, updated_at desc)
  where approval_status = 'approved' and published_at is not null;
create index unseen_places_location_idx on public.unseen_places (latitude, longitude);
create index cafe_unseen_places_place_idx on public.cafe_unseen_places (unseen_place_id, cafe_id);

-- Trigger helpers are deliberately private and run with the caller's privileges.
-- This migration creates no privilege-elevating database functions.
create function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create function private.reset_cafe_publication_on_material_change()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if row(
    new.name_th, new.name_en, new.description_th, new.description_en,
    new.address_th, new.address_en, new.latitude, new.longitude,
    new.phone, new.website_url, new.map_url, new.opening_hours,
    new.opening_note_th, new.opening_note_en, new.photo_urls,
    new.is_new_discovery, new.roast_in_nan
  ) is distinct from row(
    old.name_th, old.name_en, old.description_th, old.description_en,
    old.address_th, old.address_en, old.latitude, old.longitude,
    old.phone, old.website_url, old.map_url, old.opening_hours,
    old.opening_note_th, old.opening_note_en, old.photo_urls,
    old.is_new_discovery, old.roast_in_nan
  ) then
    new.status := 'draft';
    new.published_at := null;
  end if;
  return new;
end;
$$;

create function private.stamp_cafe_publication()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if new.status in ('published', 'temporarily_closed') then
    new.published_at := coalesce(new.published_at, now());
  elsif new.status in ('draft', 'archived') then
    new.published_at := null;
  end if;
  return new;
end;
$$;

create function private.stamp_approval()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public, auth
as $$
begin
  if new.approval_status = 'approved' then
    if tg_op = 'INSERT' then
      new.approved_at := coalesce(new.approved_at, now());
      new.approved_by := coalesce(new.approved_by, auth.uid());
    elsif old.approval_status is distinct from new.approval_status then
      new.approved_at := now();
      new.approved_by := coalesce(auth.uid(), new.approved_by);
    end if;
    new.published_at := coalesce(new.published_at, new.approved_at, now());
  elsif new.approval_status = 'draft' then
    new.approved_by := null;
    new.approved_at := null;
    new.published_at := null;
  else
    new.published_at := null;
  end if;
  return new;
end;
$$;

create function private.reset_offering_approval_on_material_change()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if row(
    new.bean_name, new.origin_province, new.origin_name, new.producer,
    new.is_nan_grown, new.process, new.process_detail, new.roast_level,
    new.tasting_notes_th, new.tasting_notes_en, new.brew_methods,
    new.price_thb, new.availability, new.available_from, new.available_until
  ) is distinct from row(
    old.bean_name, old.origin_province, old.origin_name, old.producer,
    old.is_nan_grown, old.process, old.process_detail, old.roast_level,
    old.tasting_notes_th, old.tasting_notes_en, old.brew_methods,
    old.price_thb, old.availability, old.available_from, old.available_until
  ) then
    new.approval_status := 'draft';
  end if;
  return new;
end;
$$;

create function private.reset_menu_approval_on_material_change()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if row(
    new.name_th, new.name_en, new.description_th, new.description_en,
    new.category, new.price_thb, new.is_available, new.is_seasonal, new.is_cafe_pick
  ) is distinct from row(
    old.name_th, old.name_en, old.description_th, old.description_en,
    old.category, old.price_thb, old.is_available, old.is_seasonal, old.is_cafe_pick
  ) then
    new.approval_status := 'draft';
  end if;
  return new;
end;
$$;

create function private.reset_workation_approval_on_material_change()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if row(
    new.free_wifi, new.outlets, new.seating_details_th, new.seating_details_en,
    new.work_suitability, new.quietness_note_th, new.quietness_note_en,
    new.video_call_suitability, new.hours_policy_th, new.hours_policy_en,
    new.minimum_spend_thb, new.max_stay_minutes, new.is_workation_friendly
  ) is distinct from row(
    old.free_wifi, old.outlets, old.seating_details_th, old.seating_details_en,
    old.work_suitability, old.quietness_note_th, old.quietness_note_en,
    old.video_call_suitability, old.hours_policy_th, old.hours_policy_en,
    old.minimum_spend_thb, old.max_stay_minutes, old.is_workation_friendly
  ) then
    new.approval_status := 'draft';
  end if;
  return new;
end;
$$;

create function private.reset_cafe_unseen_approval_on_material_change()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if row(
    new.travel_minutes, new.distance_km, new.transport_mode,
    new.access_note_th, new.access_note_en
  ) is distinct from row(
    old.travel_minutes, old.distance_km, old.transport_mode,
    old.access_note_th, old.access_note_en
  ) then
    new.approval_status := 'draft';
  end if;
  return new;
end;
$$;

create function private.reset_content_draft_approval_on_material_change()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if row(
    new.update_kind, new.input_method, new.source_input_text,
    new.source_language, new.structured_data, new.thai_copy, new.english_copy
  ) is distinct from row(
    old.update_kind, old.input_method, old.source_input_text,
    old.source_language, old.structured_data, old.thai_copy, old.english_copy
  ) then
    new.status := 'draft';
    new.approved_by := null;
    new.approved_at := null;
    new.rejected_at := null;
    new.applied_at := null;
  end if;
  return new;
end;
$$;

create function private.stamp_content_draft_status()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public, auth
as $$
begin
  if new.status = 'approved' then
    new.approved_at := coalesce(new.approved_at, now());
    new.approved_by := coalesce(new.approved_by, auth.uid());
    new.rejected_at := null;
  elsif new.status = 'rejected' then
    new.rejected_at := coalesce(new.rejected_at, now());
    new.approved_by := null;
    new.approved_at := null;
  elsif new.status = 'applied' then
    new.applied_at := coalesce(new.applied_at, now());
  elsif new.status = 'draft' then
    new.approved_by := null;
    new.approved_at := null;
    new.rejected_at := null;
    new.applied_at := null;
  end if;
  return new;
end;
$$;

create trigger cafes_10_reset_publication
before update on public.cafes
for each row execute function private.reset_cafe_publication_on_material_change();
create trigger cafes_20_stamp_publication
before insert or update on public.cafes
for each row execute function private.stamp_cafe_publication();

create trigger coffee_offerings_10_reset_approval
before update on public.coffee_offerings
for each row execute function private.reset_offering_approval_on_material_change();
create trigger coffee_offerings_20_stamp_approval
before insert or update on public.coffee_offerings
for each row execute function private.stamp_approval();

create trigger menu_items_10_reset_approval
before update on public.menu_items
for each row execute function private.reset_menu_approval_on_material_change();
create trigger menu_items_20_stamp_approval
before insert or update on public.menu_items
for each row execute function private.stamp_approval();

create trigger workation_details_10_reset_approval
before update on public.workation_details
for each row execute function private.reset_workation_approval_on_material_change();
create trigger workation_details_20_stamp_approval
before insert or update on public.workation_details
for each row execute function private.stamp_approval();

create trigger cafe_unseen_places_10_reset_approval
before update on public.cafe_unseen_places
for each row execute function private.reset_cafe_unseen_approval_on_material_change();
create trigger cafe_unseen_places_20_stamp_approval
before insert or update on public.cafe_unseen_places
for each row execute function private.stamp_approval();

create trigger unseen_places_stamp_approval
before insert or update on public.unseen_places
for each row execute function private.stamp_approval();

create trigger content_drafts_10_reset_approval
before update on public.content_drafts
for each row execute function private.reset_content_draft_approval_on_material_change();
create trigger content_drafts_20_stamp_status
before insert or update on public.content_drafts
for each row execute function private.stamp_content_draft_status();

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger cafes_set_updated_at before update on public.cafes
for each row execute function private.set_updated_at();
create trigger coffee_offerings_set_updated_at before update on public.coffee_offerings
for each row execute function private.set_updated_at();
create trigger menu_items_set_updated_at before update on public.menu_items
for each row execute function private.set_updated_at();
create trigger workation_details_set_updated_at before update on public.workation_details
for each row execute function private.set_updated_at();
create trigger speed_reports_set_updated_at before update on public.speed_reports
for each row execute function private.set_updated_at();
create trigger content_drafts_set_updated_at before update on public.content_drafts
for each row execute function private.set_updated_at();
create trigger reviews_set_updated_at before update on public.reviews
for each row execute function private.set_updated_at();
create trigger itineraries_set_updated_at before update on public.itineraries
for each row execute function private.set_updated_at();
create trigger unseen_places_set_updated_at before update on public.unseen_places
for each row execute function private.set_updated_at();
create trigger cafe_unseen_places_set_updated_at before update on public.cafe_unseen_places
for each row execute function private.set_updated_at();

revoke execute on all functions in schema private from public, anon, authenticated;

-- RLS: every table in the exposed public schema is protected.
alter table public.profiles enable row level security;
alter table public.cafes enable row level security;
alter table public.cafe_owners enable row level security;
alter table public.coffee_offerings enable row level security;
alter table public.menu_items enable row level security;
alter table public.workation_details enable row level security;
alter table public.speed_reports enable row level security;
alter table public.content_drafts enable row level security;
alter table public.check_ins enable row level security;
alter table public.reviews enable row level security;
alter table public.itineraries enable row level security;
alter table public.unseen_places enable row level security;
alter table public.cafe_unseen_places enable row level security;

-- Profiles: a user can create/read their own row and edit non-role columns only
-- (the column grants below prevent self-promotion to merchant/admin).
create policy profiles_select_own on public.profiles
for select to authenticated
using ((select auth.uid()) = id);
create policy profiles_insert_own_traveler on public.profiles
for insert to authenticated
with check ((select auth.uid()) = id and role = 'traveler');
create policy profiles_update_own on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Cafes: public reads are publication-gated; verified owners can also see and
-- edit their own unpublished rows. Cafe creation/claim verification is server-side.
create policy cafes_select_public on public.cafes
for select to anon, authenticated
using (status in ('published', 'temporarily_closed') and published_at is not null);
create policy cafes_select_verified_owner on public.cafes
for select to authenticated
using (
  id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);
create policy cafes_update_verified_owner on public.cafes
for update to authenticated
using (
  id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
)
with check (
  id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);

create policy cafe_owners_select_own on public.cafe_owners
for select to authenticated
using (profile_id = (select auth.uid()));

create policy coffee_offerings_select_public on public.coffee_offerings
for select to anon, authenticated
using (
  approval_status = 'approved' and published_at is not null
  and cafe_id in (
    select c.id from public.cafes c
    where c.status in ('published', 'temporarily_closed') and c.published_at is not null
  )
);
create policy coffee_offerings_select_owner on public.coffee_offerings
for select to authenticated
using (
  cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);
create policy coffee_offerings_insert_owner_draft on public.coffee_offerings
for insert to authenticated
with check (
  approval_status = 'draft'
  and cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);
create policy coffee_offerings_update_owner on public.coffee_offerings
for update to authenticated
using (
  cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
)
with check (
  cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);
create policy coffee_offerings_delete_owner_nonpublic on public.coffee_offerings
for delete to authenticated
using (
  approval_status <> 'approved'
  and cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);

create policy menu_items_select_public on public.menu_items
for select to anon, authenticated
using (
  approval_status = 'approved' and published_at is not null
  and cafe_id in (
    select c.id from public.cafes c
    where c.status in ('published', 'temporarily_closed') and c.published_at is not null
  )
);
create policy menu_items_select_owner on public.menu_items
for select to authenticated
using (
  cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);
create policy menu_items_insert_owner_draft on public.menu_items
for insert to authenticated
with check (
  approval_status = 'draft'
  and cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);
create policy menu_items_update_owner on public.menu_items
for update to authenticated
using (
  cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
)
with check (
  cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);
create policy menu_items_delete_owner_nonpublic on public.menu_items
for delete to authenticated
using (
  approval_status <> 'approved'
  and cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);

create policy workation_details_select_public on public.workation_details
for select to anon, authenticated
using (
  approval_status = 'approved' and published_at is not null
  and cafe_id in (
    select c.id from public.cafes c
    where c.status in ('published', 'temporarily_closed') and c.published_at is not null
  )
);
create policy workation_details_select_owner on public.workation_details
for select to authenticated
using (
  cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);
create policy workation_details_insert_owner_draft on public.workation_details
for insert to authenticated
with check (
  approval_status = 'draft'
  and cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);
create policy workation_details_update_owner on public.workation_details
for update to authenticated
using (
  cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
)
with check (
  cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);
create policy workation_details_delete_owner_nonpublic on public.workation_details
for delete to authenticated
using (
  approval_status <> 'approved'
  and cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);

create policy speed_reports_select_public on public.speed_reports
for select to anon, authenticated
using (
  moderation_status = 'published' and published_at is not null
  and cafe_id in (
    select c.id from public.cafes c
    where c.status in ('published', 'temporarily_closed') and c.published_at is not null
  )
);
create policy speed_reports_select_relevant on public.speed_reports
for select to authenticated
using (
  reporter_profile_id = (select auth.uid())
  or cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);
create policy speed_reports_insert_merchant_or_verified_traveler on public.speed_reports
for insert to authenticated
with check (
  reporter_profile_id = (select auth.uid())
  and moderation_status = 'pending'
  and (
    (
      verification_level = 'merchant_reported'
      and cafe_id in (
        select co.cafe_id from public.cafe_owners co
        where co.profile_id = (select auth.uid()) and co.status = 'verified'
      )
    )
    or
    (
      verification_level = 'community_verified'
      and cafe_id in (
        select ci.cafe_id from public.check_ins ci
        where ci.traveler_id = (select auth.uid())
          and ci.is_verified
          and ci.checked_in_at >= now() - interval '24 hours'
      )
    )
  )
);
create policy speed_reports_update_own_pending on public.speed_reports
for update to authenticated
using (reporter_profile_id = (select auth.uid()) and moderation_status = 'pending')
with check (reporter_profile_id = (select auth.uid()) and moderation_status = 'pending');

create policy content_drafts_select_owner on public.content_drafts
for select to authenticated
using (
  owner_profile_id = (select auth.uid())
  and cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);
create policy content_drafts_insert_owner on public.content_drafts
for insert to authenticated
with check (
  owner_profile_id = (select auth.uid()) and status = 'draft'
  and cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);
create policy content_drafts_update_owner on public.content_drafts
for update to authenticated
using (
  owner_profile_id = (select auth.uid()) and status <> 'applied'
  and cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
)
with check (
  owner_profile_id = (select auth.uid()) and status in ('draft', 'approved', 'rejected')
  and cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);
create policy content_drafts_delete_owner_nonapplied on public.content_drafts
for delete to authenticated
using (
  owner_profile_id = (select auth.uid()) and status in ('draft', 'rejected')
  and cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);

create policy check_ins_select_own on public.check_ins
for select to authenticated
using (traveler_id = (select auth.uid()));
create policy check_ins_insert_unverified_own on public.check_ins
for insert to authenticated
with check (
  traveler_id = (select auth.uid())
  and not is_verified and verified_at is null
  and cafe_id in (
    select c.id from public.cafes c
    where c.status in ('published', 'temporarily_closed') and c.published_at is not null
  )
);
create policy check_ins_delete_own_unverified on public.check_ins
for delete to authenticated
using (traveler_id = (select auth.uid()) and not is_verified);

create policy reviews_select_public on public.reviews
for select to anon, authenticated
using (
  moderation_status = 'published' and published_at is not null
  and cafe_id in (
    select c.id from public.cafes c
    where c.status in ('published', 'temporarily_closed') and c.published_at is not null
  )
);
create policy reviews_select_own on public.reviews
for select to authenticated
using (traveler_id = (select auth.uid()));
create policy reviews_insert_after_verified_visit on public.reviews
for insert to authenticated
with check (
  traveler_id = (select auth.uid()) and moderation_status = 'pending'
  and exists (
    select 1 from public.check_ins ci
    where ci.id = check_in_id
      and ci.traveler_id = (select auth.uid())
      and ci.cafe_id = cafe_id
      and ci.is_verified
  )
);
create policy reviews_update_own_pending on public.reviews
for update to authenticated
using (traveler_id = (select auth.uid()) and moderation_status = 'pending')
with check (traveler_id = (select auth.uid()) and moderation_status = 'pending');
create policy reviews_delete_own_pending on public.reviews
for delete to authenticated
using (traveler_id = (select auth.uid()) and moderation_status = 'pending');

-- Merchant response/report columns deliberately have no browser UPDATE grant.
-- Supabase maps travelers and merchants to the same `authenticated` database
-- role; adding a cafe-owner UPDATE policy here would also let that policy use
-- the traveler's granted rating/body columns. A trusted server route must
-- authenticate cafe ownership, then write only response/report columns.

create policy itineraries_select_own on public.itineraries
for select to authenticated
using (traveler_id = (select auth.uid()));
create policy itineraries_insert_own on public.itineraries
for insert to authenticated
with check (traveler_id = (select auth.uid()));
create policy itineraries_update_own on public.itineraries
for update to authenticated
using (traveler_id = (select auth.uid()))
with check (traveler_id = (select auth.uid()));
create policy itineraries_delete_own on public.itineraries
for delete to authenticated
using (traveler_id = (select auth.uid()));

create policy unseen_places_select_public on public.unseen_places
for select to anon, authenticated
using (
  approval_status = 'approved'
  and published_at is not null
  and verification_status in ('source_checked', 'partner_verified', 'official_verified')
  and (verification_expires_at is null or verification_expires_at > now())
);

create policy cafe_unseen_places_select_public on public.cafe_unseen_places
for select to anon, authenticated
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
create policy cafe_unseen_places_select_owner on public.cafe_unseen_places
for select to authenticated
using (
  cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);
create policy cafe_unseen_places_insert_owner_draft on public.cafe_unseen_places
for insert to authenticated
with check (
  approval_status = 'draft'
  and cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);
create policy cafe_unseen_places_update_owner on public.cafe_unseen_places
for update to authenticated
using (
  cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
)
with check (
  cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);
create policy cafe_unseen_places_delete_owner_nonpublic on public.cafe_unseen_places
for delete to authenticated
using (
  approval_status <> 'approved'
  and cafe_id in (
    select co.cafe_id from public.cafe_owners co
    where co.profile_id = (select auth.uid()) and co.status = 'verified'
  )
);

-- Clear any legacy broad privileges on the concrete objects, then opt each
-- object into the Data API with the minimum operation set.
revoke all privileges on table
  public.profiles,
  public.cafes,
  public.cafe_owners,
  public.coffee_offerings,
  public.menu_items,
  public.workation_details,
  public.speed_reports,
  public.content_drafts,
  public.check_ins,
  public.reviews,
  public.itineraries,
  public.unseen_places,
  public.cafe_unseen_places
from anon, authenticated, service_role;

grant usage on schema public to anon, authenticated, service_role;

grant select on table
  public.cafes,
  public.coffee_offerings,
  public.menu_items,
  public.workation_details,
  public.speed_reports,
  public.reviews,
  public.unseen_places,
  public.cafe_unseen_places
to anon;

grant select on table
  public.profiles,
  public.cafes,
  public.cafe_owners,
  public.coffee_offerings,
  public.menu_items,
  public.workation_details,
  public.speed_reports,
  public.content_drafts,
  public.check_ins,
  public.reviews,
  public.itineraries,
  public.unseen_places,
  public.cafe_unseen_places
to authenticated;

grant insert (id, display_name, role, locale, avatar_url) on table public.profiles to authenticated;
grant update (display_name, locale, avatar_url) on table public.profiles to authenticated;

grant update (
  name_th, name_en, description_th, description_en, address_th, address_en,
  latitude, longitude, phone, website_url, map_url, opening_hours,
  opening_note_th, opening_note_en, photo_urls, status,
  roast_in_nan
) on table public.cafes to authenticated;

grant insert (
  cafe_id, bean_name, origin_province, origin_name, producer, is_nan_grown,
  process, process_detail, roast_level, tasting_notes_th, tasting_notes_en,
  brew_methods, price_thb, availability, available_from, available_until,
  approval_status
) on table public.coffee_offerings to authenticated;
grant update (
  bean_name, origin_province, origin_name, producer, is_nan_grown,
  process, process_detail, roast_level, tasting_notes_th, tasting_notes_en,
  brew_methods, price_thb, availability, available_from, available_until,
  approval_status
) on table public.coffee_offerings to authenticated;
grant delete on table public.coffee_offerings to authenticated;

grant insert (
  cafe_id, name_th, name_en, description_th, description_en, category,
  price_thb, is_available, is_seasonal, is_cafe_pick, approval_status
) on table public.menu_items to authenticated;
grant update (
  name_th, name_en, description_th, description_en, category,
  price_thb, is_available, is_seasonal, is_cafe_pick, approval_status
) on table public.menu_items to authenticated;
grant delete on table public.menu_items to authenticated;

grant insert (
  cafe_id, free_wifi, outlets, seating_details_th, seating_details_en,
  work_suitability, quietness_note_th, quietness_note_en,
  video_call_suitability, hours_policy_th, hours_policy_en,
  minimum_spend_thb, max_stay_minutes, is_workation_friendly,
  approval_status
) on table public.workation_details to authenticated;
grant update (
  free_wifi, outlets, seating_details_th, seating_details_en,
  work_suitability, quietness_note_th, quietness_note_en,
  video_call_suitability, hours_policy_th, hours_policy_en,
  minimum_spend_thb, max_stay_minutes, is_workation_friendly,
  approval_status
) on table public.workation_details to authenticated;
grant delete on table public.workation_details to authenticated;

grant insert (
  cafe_id, reporter_profile_id, verification_level,
  download_mbps, upload_mbps, ping_ms, tested_at, test_provider,
  moderation_status
) on table public.speed_reports to authenticated;
grant update (download_mbps, upload_mbps, ping_ms, tested_at, test_provider)
on table public.speed_reports to authenticated;

grant insert (
  cafe_id, owner_profile_id, update_kind, input_method, source_input_text,
  source_language, structured_data, thai_copy, english_copy, status
) on table public.content_drafts to authenticated;
grant update (
  update_kind, input_method, source_input_text, source_language,
  structured_data, thai_copy, english_copy, status
) on table public.content_drafts to authenticated;
grant delete on table public.content_drafts to authenticated;

grant insert (
  traveler_id, cafe_id, verification_method, verification_evidence_hash,
  is_verified, verification_note
) on table public.check_ins to authenticated;
grant delete on table public.check_ins to authenticated;

grant insert (
  traveler_id, cafe_id, check_in_id, coffee_quality, bean_story, service,
  value, atmosphere, work_suitability_rating, body_original,
  original_language, moderation_status
) on table public.reviews to authenticated;
grant update (
  coffee_quality, bean_story, service, value, atmosphere,
  work_suitability_rating, body_original, original_language
) on table public.reviews to authenticated;
grant delete on table public.reviews to authenticated;

grant insert (
  traveler_id, input_method, original_request, structured_request,
  recommendation_result, status, location_consent,
  parsed_confirmed_at, generated_at
) on table public.itineraries to authenticated;
grant update (
  original_request, structured_request, recommendation_result, status,
  location_consent, parsed_confirmed_at, generated_at
) on table public.itineraries to authenticated;
grant delete on table public.itineraries to authenticated;

grant insert (
  cafe_id, unseen_place_id, travel_minutes, distance_km, transport_mode,
  access_note_th, access_note_en, approval_status
) on table public.cafe_unseen_places to authenticated;
grant update (
  travel_minutes, distance_km, transport_mode, access_note_th,
  access_note_en, approval_status
) on table public.cafe_unseen_places to authenticated;
grant delete on table public.cafe_unseen_places to authenticated;

grant select, insert, update, delete on table
  public.profiles,
  public.cafes,
  public.cafe_owners,
  public.coffee_offerings,
  public.menu_items,
  public.workation_details,
  public.speed_reports,
  public.content_drafts,
  public.check_ins,
  public.reviews,
  public.itineraries,
  public.unseen_places,
  public.cafe_unseen_places
to service_role;

commit;
