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
