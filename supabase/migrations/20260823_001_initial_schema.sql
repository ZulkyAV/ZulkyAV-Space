begin;

-- Required for gen_random_uuid().
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_approved_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select lower(coalesce((select auth.jwt()) ->> 'email', '')) in (
    'arilskydrive05@gmail.com',
    'hrmanajement@outlook.com'
  );
$$;

revoke all on function public.is_approved_admin() from public;
grant execute on function public.is_approved_admin() to anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Reuse and extend the existing profile and note tables
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists headline text not null default '',
  add column if not exists intro text not null default '',
  add column if not exists location text not null default '',
  add column if not exists about text not null default '',
  add column if not exists social_links jsonb not null default '{}'::jsonb;

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  slug text not null,
  name text not null,
  description text not null default '',
  accent text not null default 'blue',
  status text not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint folders_section_check
    check (section in ('note', 'project', 'jualan')),
  constraint folders_status_check
    check (status in ('published', 'maintenance', 'draft', 'archived')),
  constraint folders_section_slug_key unique (section, slug)
);

alter table public.notes
  add column if not exists folder_id uuid references public.folders(id) on delete set null,
  add column if not exists cover_public_id text,
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists read_time text not null default '',
  add column if not exists sort_order integer not null default 0;

-- Keep legacy notes usable by placing them inside one real folder.
insert into public.folders (
  section,
  slug,
  name,
  description,
  accent,
  status,
  sort_order
)
values (
  'note',
  'general-notes',
  'General Notes',
  'Catatan, cerita, dan hal kecil yang ingin disimpan.',
  'blue',
  'published',
  0
)
on conflict (section, slug) do nothing;

update public.notes as n
set folder_id = f.id
from public.folders as f
where n.folder_id is null
  and f.section = 'note'
  and f.slug = 'general-notes';

-- ---------------------------------------------------------------------------
-- Admin identity
-- Username is stored separately from Supabase Auth credentials.
-- ---------------------------------------------------------------------------

create table if not exists public.admin_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  display_name text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint admin_accounts_username_length
    check (char_length(username) between 3 and 32)
);

create unique index if not exists admin_accounts_username_lower_key
  on public.admin_accounts (lower(username));

-- ---------------------------------------------------------------------------
-- Projects
-- Public component names and private quantities are deliberately separated.
-- ---------------------------------------------------------------------------

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references public.folders(id) on delete cascade,
  slug text not null,
  title text not null,
  description text not null default '',
  image_url text,
  image_public_id text,
  project_type text not null default 'other',
  stage text not null default 'idea',
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint projects_type_check
    check (project_type in ('food', 'drink', 'iot', 'web', 'other')),
  constraint projects_stage_check
    check (stage in ('idea', 'experiment', 'active', 'paused', 'completed')),
  constraint projects_folder_slug_key unique (folder_id, slug)
);

create table if not exists public.project_components (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  kind text not null default 'component',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint project_components_kind_check
    check (kind in ('ingredient', 'component', 'material', 'tool', 'other'))
);

create table if not exists public.project_component_private (
  component_id uuid primary key references public.project_components(id) on delete cascade,
  quantity numeric,
  unit text not null default '',
  private_notes text not null default '',
  updated_at timestamptz not null default timezone('utc', now()),
  constraint project_component_quantity_check
    check (quantity is null or quantity >= 0)
);

create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  content text not null default '',
  update_date date not null default current_date,
  is_published boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- Products, stock, and transactions
-- Selling price can be public; cost price stays in a private table.
-- ---------------------------------------------------------------------------

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references public.folders(id) on delete cascade,
  slug text not null,
  name text not null,
  description text not null default '',
  image_url text,
  image_public_id text,
  selling_price numeric(14,2),
  show_price boolean not null default true,
  current_stock integer not null default 0,
  labels text[] not null default '{}'::text[],
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint products_price_check
    check (selling_price is null or selling_price >= 0),
  constraint products_stock_check
    check (current_stock >= 0),
  constraint products_folder_slug_key unique (folder_id, slug)
);

create table if not exists public.product_private (
  product_id uuid primary key references public.products(id) on delete cascade,
  cost_price numeric(14,2),
  sku text,
  private_notes text not null default '',
  updated_at timestamptz not null default timezone('utc', now()),
  constraint product_private_cost_check
    check (cost_price is null or cost_price >= 0)
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  sold_at timestamptz not null default timezone('utc', now()),
  total_amount numeric(14,2) not null default 0,
  payment_method text not null default 'cash',
  notes text not null default '',
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint sales_total_check check (total_amount >= 0),
  constraint sales_payment_method_check
    check (payment_method in ('cash', 'qris', 'transfer', 'ewallet', 'other'))
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_snapshot text not null,
  quantity integer not null,
  unit_price numeric(14,2) not null default 0,
  subtotal numeric(14,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint sale_items_quantity_check check (quantity > 0),
  constraint sale_items_unit_price_check check (unit_price >= 0),
  constraint sale_items_subtotal_check check (subtotal >= 0)
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sale_id uuid references public.sales(id) on delete set null,
  movement_type text not null,
  quantity_delta integer not null,
  notes text not null default '',
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint stock_movements_type_check
    check (movement_type in ('initial', 'restock', 'sale', 'adjustment', 'waste')),
  constraint stock_movements_quantity_check check (quantity_delta <> 0)
);

-- Public controls only; chart values will be derived from sales later.
create table if not exists public.public_statistics_settings (
  id smallint primary key default 1,
  is_public boolean not null default true,
  show_best_seller boolean not null default true,
  show_recommended boolean not null default true,
  mask_exact_values boolean not null default true,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint public_statistics_single_row check (id = 1)
);

insert into public.public_statistics_settings (id)
values (1)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists folders_public_listing_idx
  on public.folders (section, status, sort_order);

create index if not exists notes_folder_listing_idx
  on public.notes (folder_id, published, sort_order);

create index if not exists projects_folder_listing_idx
  on public.projects (folder_id, is_published, sort_order);

create index if not exists project_components_project_idx
  on public.project_components (project_id, sort_order);

create index if not exists project_updates_project_idx
  on public.project_updates (project_id, update_date desc);

create index if not exists products_folder_listing_idx
  on public.products (folder_id, is_active, sort_order);

create index if not exists sales_sold_at_idx
  on public.sales (sold_at desc);

create index if not exists sale_items_sale_idx
  on public.sale_items (sale_id);

create index if not exists sale_items_product_idx
  on public.sale_items (product_id);

create index if not exists stock_movements_product_created_idx
  on public.stock_movements (product_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Automatic updated_at timestamps
-- ---------------------------------------------------------------------------

drop trigger if exists set_folders_updated_at on public.folders;
create trigger set_folders_updated_at
before update on public.folders
for each row execute function public.set_updated_at();

drop trigger if exists set_admin_accounts_updated_at on public.admin_accounts;
create trigger set_admin_accounts_updated_at
before update on public.admin_accounts
for each row execute function public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists set_project_component_private_updated_at
  on public.project_component_private;
create trigger set_project_component_private_updated_at
before update on public.project_component_private
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_product_private_updated_at on public.product_private;
create trigger set_product_private_updated_at
before update on public.product_private
for each row execute function public.set_updated_at();

drop trigger if exists set_public_statistics_settings_updated_at
  on public.public_statistics_settings;
create trigger set_public_statistics_settings_updated_at
before update on public.public_statistics_settings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.folders enable row level security;
alter table public.admin_accounts enable row level security;
alter table public.projects enable row level security;
alter table public.project_components enable row level security;
alter table public.project_component_private enable row level security;
alter table public.project_updates enable row level security;
alter table public.products enable row level security;
alter table public.product_private enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.public_statistics_settings enable row level security;

-- Folders: published and maintenance are listed publicly.
drop policy if exists "Visible folders are readable" on public.folders;
create policy "Visible folders are readable"
on public.folders
for select
to anon, authenticated
using (status in ('published', 'maintenance'));

drop policy if exists "Approved admins manage folders" on public.folders;
create policy "Approved admins manage folders"
on public.folders
for all
to authenticated
using ((select public.is_approved_admin()))
with check ((select public.is_approved_admin()));

-- Replace the old public note rule so maintenance folders cannot be opened.
drop policy if exists "Published notes are readable" on public.notes;
create policy "Published notes are readable"
on public.notes
for select
to anon, authenticated
using (
  published = true
  and exists (
    select 1
    from public.folders as f
    where f.id = notes.folder_id
      and f.section = 'note'
      and f.status = 'published'
  )
);

drop policy if exists "Approved admins manage admin accounts"
  on public.admin_accounts;
create policy "Approved admins manage admin accounts"
on public.admin_accounts
for all
to authenticated
using ((select public.is_approved_admin()))
with check ((select public.is_approved_admin()));

drop policy if exists "Published projects are readable" on public.projects;
create policy "Published projects are readable"
on public.projects
for select
to anon, authenticated
using (
  is_published = true
  and exists (
    select 1
    from public.folders as f
    where f.id = projects.folder_id
      and f.section = 'project'
      and f.status = 'published'
  )
);

drop policy if exists "Approved admins manage projects" on public.projects;
create policy "Approved admins manage projects"
on public.projects
for all
to authenticated
using ((select public.is_approved_admin()))
with check ((select public.is_approved_admin()));

drop policy if exists "Public project components are readable"
  on public.project_components;
create policy "Public project components are readable"
on public.project_components
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.projects as p
    where p.id = project_components.project_id
      and p.is_published = true
  )
);

drop policy if exists "Approved admins manage project components"
  on public.project_components;
create policy "Approved admins manage project components"
on public.project_components
for all
to authenticated
using ((select public.is_approved_admin()))
with check ((select public.is_approved_admin()));

drop policy if exists "Approved admins manage private project data"
  on public.project_component_private;
create policy "Approved admins manage private project data"
on public.project_component_private
for all
to authenticated
using ((select public.is_approved_admin()))
with check ((select public.is_approved_admin()));

drop policy if exists "Published project updates are readable"
  on public.project_updates;
create policy "Published project updates are readable"
on public.project_updates
for select
to anon, authenticated
using (
  is_published = true
  and exists (
    select 1
    from public.projects as p
    where p.id = project_updates.project_id
      and p.is_published = true
  )
);

drop policy if exists "Approved admins manage project updates"
  on public.project_updates;
create policy "Approved admins manage project updates"
on public.project_updates
for all
to authenticated
using ((select public.is_approved_admin()))
with check ((select public.is_approved_admin()));

drop policy if exists "Active products are readable" on public.products;
create policy "Active products are readable"
on public.products
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.folders as f
    where f.id = products.folder_id
      and f.section = 'jualan'
      and f.status = 'published'
  )
);

drop policy if exists "Approved admins manage products" on public.products;
create policy "Approved admins manage products"
on public.products
for all
to authenticated
using ((select public.is_approved_admin()))
with check ((select public.is_approved_admin()));

drop policy if exists "Approved admins manage private product data"
  on public.product_private;
create policy "Approved admins manage private product data"
on public.product_private
for all
to authenticated
using ((select public.is_approved_admin()))
with check ((select public.is_approved_admin()));

drop policy if exists "Approved admins manage sales" on public.sales;
create policy "Approved admins manage sales"
on public.sales
for all
to authenticated
using ((select public.is_approved_admin()))
with check ((select public.is_approved_admin()));

drop policy if exists "Approved admins manage sale items" on public.sale_items;
create policy "Approved admins manage sale items"
on public.sale_items
for all
to authenticated
using ((select public.is_approved_admin()))
with check ((select public.is_approved_admin()));

drop policy if exists "Approved admins manage stock movements"
  on public.stock_movements;
create policy "Approved admins manage stock movements"
on public.stock_movements
for all
to authenticated
using ((select public.is_approved_admin()))
with check ((select public.is_approved_admin()));

drop policy if exists "Public statistics settings are readable"
  on public.public_statistics_settings;
create policy "Public statistics settings are readable"
on public.public_statistics_settings
for select
to anon, authenticated
using (is_public = true);

drop policy if exists "Approved admins manage statistics settings"
  on public.public_statistics_settings;
create policy "Approved admins manage statistics settings"
on public.public_statistics_settings
for all
to authenticated
using ((select public.is_approved_admin()))
with check ((select public.is_approved_admin()));

-- ---------------------------------------------------------------------------
-- API privileges. RLS remains the final access control.
-- ---------------------------------------------------------------------------

grant select on table
  public.folders,
  public.notes,
  public.projects,
  public.project_components,
  public.project_updates,
  public.products,
  public.public_statistics_settings
to anon, authenticated;

grant insert, update, delete on table
  public.folders,
  public.notes,
  public.projects,
  public.project_components,
  public.project_updates,
  public.products,
  public.public_statistics_settings
to authenticated;

grant select, insert, update, delete on table
  public.admin_accounts,
  public.project_component_private,
  public.product_private,
  public.sales,
  public.sale_items,
  public.stock_movements
to authenticated;

revoke all on table
  public.admin_accounts,
  public.project_component_private,
  public.product_private,
  public.sales,
  public.sale_items,
  public.stock_movements
from anon;

commit;
