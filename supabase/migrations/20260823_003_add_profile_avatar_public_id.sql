begin;

alter table public.profiles
  add column if not exists avatar_public_id text;

comment on column public.profiles.avatar_public_id is
  'Cloudinary public ID used to replace or delete the profile avatar safely.';

commit;
