create table organizations (
  id uuid primary key,
  name text not null,
  address text not null,
  admin_name text null,
  admin_email text null,
  created_by text not null,
  contact_name text not null,
  contact_details text not null,
  created_at timestamptz not null default now()
);
