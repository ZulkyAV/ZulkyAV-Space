begin;

alter table public.projects
  add column if not exists download_url text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_download_url_https_check'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
      add constraint projects_download_url_https_check
      check (download_url is null or download_url ~ '^https://');
  end if;
end
$$;

create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  image_url text not null,
  image_public_id text,
  alt_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint project_images_url_https_check check (image_url ~ '^https://'),
  constraint project_images_sort_order_check check (sort_order between 0 and 99)
);

create index if not exists project_images_project_listing_idx
  on public.project_images (project_id, sort_order, created_at);

alter table public.project_images enable row level security;

drop policy if exists "Published project images are readable"
  on public.project_images;
create policy "Published project images are readable"
on public.project_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.projects as p
    join public.folders as f on f.id = p.folder_id
    where p.id = project_images.project_id
      and p.is_published = true
      and f.section = 'project'
      and f.status = 'published'
  )
);

drop policy if exists "Approved admins manage project images"
  on public.project_images;
create policy "Approved admins manage project images"
on public.project_images
for all
to authenticated
using ((select public.is_approved_admin()))
with check ((select public.is_approved_admin()));

grant select on table public.project_images to anon, authenticated;
grant insert, update, delete on table public.project_images to authenticated;

commit;
