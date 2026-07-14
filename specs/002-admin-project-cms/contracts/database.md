# Contract: Supabase 데이터베이스 & Storage

**Project**: `onaormuhkjekmcezeccn` (https://onaormuhkjekmcezeccn.supabase.co)

마이그레이션은 Supabase MCP `apply_migration`으로 적용하고, 동일 SQL을
`supabase/migrations/`에 사본으로 보관한다.

## Migration 1: `create_content_tables`

```sql
-- projects: 관리 대상 프로젝트 (진행 중/완성/예정)
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  description text not null check (length(trim(description)) > 0),
  status text not null check (status in ('current', 'completed', 'planned')),
  tagline text,
  stack text[] not null default '{}',
  links jsonb not null default '[]',
  display_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- project_images: 프로젝트 스크린샷 (Storage 경로 참조)
create table public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  storage_path text not null,
  display_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

-- tech_stack: 책장 기술 스택
create table public.tech_stack (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  category text check (category in ('Language', 'Backend', 'Frontend', 'Infra', 'Tool')),
  color text not null default '#7f9aa6',
  display_order integer,
  created_at timestamptz not null default now()
);

create index project_images_project_id_idx on public.project_images (project_id);

-- updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();
```

## Migration 2: `enable_rls_policies`

```sql
alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.tech_stack enable row level security;

-- 공개 읽기 (방문자)
create policy "public read projects" on public.projects
  for select using (true);
create policy "public read project_images" on public.project_images
  for select using (true);
create policy "public read tech_stack" on public.tech_stack
  for select using (true);

-- 관리자(authenticated)만 쓰기
create policy "admin write projects" on public.projects
  for all to authenticated using (true) with check (true);
create policy "admin write project_images" on public.project_images
  for all to authenticated using (true) with check (true);
create policy "admin write tech_stack" on public.tech_stack
  for all to authenticated using (true) with check (true);
```

## Migration 3: `create_storage_bucket`

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-images',
  'project-images',
  true,                                   -- 공개 읽기 (방문자 표시)
  5242880,                                -- 5MB (FR-013)
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
);

create policy "admin upload images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'project-images');
create policy "admin update images" on storage.objects
  for update to authenticated
  using (bucket_id = 'project-images');
create policy "admin delete images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'project-images');
```

(공개 버킷은 읽기 정책 불필요 — public URL로 제공)

## Auth 설정 (대시보드 수동 — quickstart 참조)

1. Authentication → Sign In / Up → **Allow new users to sign up = OFF**
2. Authentication → Users → **Add user** (관리자 이메일/비밀번호 1개)

## 접근 계약 요약

| 주체 | projects/tech_stack/project_images | storage: project-images |
|------|------------------------------------|-------------------------|
| anon (방문자) | SELECT만 | 공개 URL 읽기만 |
| authenticated (관리자) | SELECT/INSERT/UPDATE/DELETE | INSERT/UPDATE/DELETE |
