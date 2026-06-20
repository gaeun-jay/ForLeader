-- ============================================================
-- 회의 시간 조율 사이트 — Supabase 스키마 (updated)
-- Supabase 대시보드 > SQL Editor 에 전체 붙여넣고 Run 하세요.
-- ============================================================

create extension if not exists pgcrypto;

-- 1) 회의(투표) 테이블
create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  dates jsonb not null,           -- 예: ["2026-06-22", "2026-06-23"]
  start_time text not null,       -- 예: "09:00"
  end_time text not null,         -- 예: "22:00"
  step_minutes int not null default 30,
  participants jsonb not null default '[]'::jsonb,  -- 예: ["철수","영희","민수"]
  created_at timestamptz not null default now()
);

-- 2) 참가자 응답 테이블
create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  name text not null,
  available_slots jsonb not null default '[]'::jsonb,  -- 예: ["2026-06-22_09:30", ...]
  note text,                      -- 특이사항 (nullable)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (meeting_id, name)
);

-- 3) updated_at 자동 갱신 트리거
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger responses_updated_at
  before update on responses
  for each row execute function update_updated_at();

-- 4) Row Level Security 활성화
alter table meetings enable row level security;
alter table responses enable row level security;

-- 5) 공개 정책 (팀 내부용)
create policy "anyone can read meetings"
  on meetings for select using (true);

create policy "anyone can create meetings"
  on meetings for insert with check (true);

create policy "anyone can read responses"
  on responses for select using (true);

create policy "anyone can create responses"
  on responses for insert with check (true);

create policy "anyone can update responses"
  on responses for update using (true);
