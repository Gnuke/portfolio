-- 선반(기술 분류)을 하드코딩에서 데이터로 전환.
-- 카테고리를 admin에서 추가·이름변경·순서변경·삭제할 수 있게 한다.

create table public.tech_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0),
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.tech_categories (name, display_order) values
  ('Language', 1),
  ('Backend', 2),
  ('Frontend', 3),
  ('Database', 4),
  ('Infra', 5),
  ('Tool', 6);

-- 고정 목록 CHECK 제약을 FK로 교체.
-- 이름 변경은 소속 기술에 전파(cascade), 선반 삭제 시 소속 기술은 미분류(null).
alter table public.tech_stack drop constraint tech_stack_category_check;
alter table public.tech_stack add constraint tech_stack_category_fkey
  foreign key (category) references public.tech_categories (name)
  on update cascade on delete set null;

alter table public.tech_categories enable row level security;

-- 공개 읽기 (방문자)
create policy "public read tech_categories" on public.tech_categories
  for select using (true);

-- 관리자(authenticated)만 쓰기
create policy "admin write tech_categories" on public.tech_categories
  for all to authenticated using (true) with check (true);
