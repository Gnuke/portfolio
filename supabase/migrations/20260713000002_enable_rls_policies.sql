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
