begin;

alter table public.projects
  add column if not exists action_label text not null default 'Download APK';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_action_label_length_check'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
      add constraint projects_action_label_length_check
      check (char_length(trim(action_label)) between 1 and 80);
  end if;
end
$$;

commit;
