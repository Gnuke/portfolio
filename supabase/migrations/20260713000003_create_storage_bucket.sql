insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-images',
  'project-images',
  true,      -- 공개 읽기 (방문자 표시)
  5242880,   -- 5MB (FR-013)
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
