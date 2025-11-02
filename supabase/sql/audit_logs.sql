-- Supabase Audit Logging Schema and Triggers
-- Safe to run multiple times (IF NOT EXISTS used where possible)

-- Extensions (for UUID)
create extension if not exists "pgcrypto";

-- 1) Audit table
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  "timestamp" timestamptz not null default now(),
  action text not null,
  entity_type text,
  entity_id text,
  actor_id uuid,
  actor_email text,
  source text,
  reversible boolean not null default false,
  meta jsonb not null default '{}'::jsonb,
  constraint audit_logs_action_chk check (action in (
    'create','update','delete','rename','sign_in','sign_out','import','export','settings_update','error'
  ))
);

-- Indexes
create index if not exists audit_logs_ts_idx on public.audit_logs ("timestamp" desc);
create index if not exists audit_logs_action_idx on public.audit_logs (action);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_email);
create index if not exists audit_logs_meta_gin on public.audit_logs using gin (meta);

-- Row Level Security
alter table public.audit_logs enable row level security;

-- Policies
do $$ begin
  -- Read for authenticated users
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='audit_logs' and policyname='audit_read_auth'
  ) then
    create policy audit_read_auth on public.audit_logs
      for select
      to authenticated
      using (true);
  end if;

  -- Insert for authenticated users
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='audit_logs' and policyname='audit_insert_auth'
  ) then
    create policy audit_insert_auth on public.audit_logs
      for insert
      to authenticated
      with check (true);
  end if;
end $$;

-- 2) Helper to extract auth info inside triggers (safe for unauthenticated)
create or replace function public._current_actor_email() returns text
language sql stable as $$
  select coalesce((current_setting('request.jwt.claims', true)::json ->> 'email'), null)
$$;

-- 3) Generic audit trigger function for patients
create or replace function public.log_patient_audit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs(action, entity_type, entity_id, actor_id, actor_email, source, reversible, meta)
    values ('create','patient', new.id::text, auth.uid(), public._current_actor_email(), 'database_trigger', true,
            jsonb_build_object('after', to_jsonb(new)));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_logs(action, entity_type, entity_id, actor_id, actor_email, source, reversible, meta)
    values ('update','patient', new.id::text, auth.uid(), public._current_actor_email(), 'database_trigger', true,
            jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new)));
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.audit_logs(action, entity_type, entity_id, actor_id, actor_email, source, reversible, meta)
    values ('delete','patient', old.id::text, auth.uid(), public._current_actor_email(), 'database_trigger', true,
            jsonb_build_object('before', to_jsonb(old)));
    return old;
  end if;
  return null;
end;
$$;

-- Attach trigger to patients table
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='patients') then
    if not exists (select 1 from pg_trigger where tgname='patient_audit_trg') then
      create trigger patient_audit_trg
      after insert or update or delete on public.patients
      for each row execute function public.log_patient_audit();
    end if;
  end if;
end $$;

-- 4) Prescriptions audit trigger
create or replace function public.log_prescription_audit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs(action, entity_type, entity_id, actor_id, actor_email, source, reversible, meta)
    values ('create','prescription', coalesce(new.id::text, new.patient_id::text), auth.uid(), public._current_actor_email(), 'database_trigger', true,
            jsonb_build_object('after', to_jsonb(new)));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_logs(action, entity_type, entity_id, actor_id, actor_email, source, reversible, meta)
    values ('update','prescription', coalesce(new.id::text, new.patient_id::text), auth.uid(), public._current_actor_email(), 'database_trigger', true,
            jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new)));
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.audit_logs(action, entity_type, entity_id, actor_id, actor_email, source, reversible, meta)
    values ('delete','prescription', coalesce(old.id::text, old.patient_id::text), auth.uid(), public._current_actor_email(), 'database_trigger', true,
            jsonb_build_object('before', to_jsonb(old)));
    return old;
  end if;
  return null;
end;
$$;

do $$ begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='prescriptions') then
    if not exists (select 1 from pg_trigger where tgname='prescription_audit_trg') then
      create trigger prescription_audit_trg
      after insert or update or delete on public.prescriptions
      for each row execute function public.log_prescription_audit();
    end if;
  end if;
end $$;

-- 5) Clinic settings audit trigger
create or replace function public.log_settings_audit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs(action, entity_type, entity_id, actor_id, actor_email, source, reversible, meta)
    values ('create','settings', coalesce(new.id::text, 'settings'), auth.uid(), public._current_actor_email(), 'database_trigger', true,
            jsonb_build_object('after', to_jsonb(new)));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_logs(action, entity_type, entity_id, actor_id, actor_email, source, reversible, meta)
    values ('update','settings', coalesce(new.id::text, 'settings'), auth.uid(), public._current_actor_email(), 'database_trigger', true,
            jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new)));
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.audit_logs(action, entity_type, entity_id, actor_id, actor_email, source, reversible, meta)
    values ('delete','settings', coalesce(old.id::text, 'settings'), auth.uid(), public._current_actor_email(), 'database_trigger', true,
            jsonb_build_object('before', to_jsonb(old)));
    return old;
  end if;
  return null;
end;
$$;

do $$ begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='clinic_settings') then
    if not exists (select 1 from pg_trigger where tgname='settings_audit_trg') then
      create trigger settings_audit_trg
      after insert or update or delete on public.clinic_settings
      for each row execute function public.log_settings_audit();
    end if;
  end if;
end $$;

-- 6) Storage object audit (uploads/updates/deletes) via storage.objects
create or replace function public.log_storage_audit() returns trigger
language plpgsql security definer set search_path = public, storage as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs(action, entity_type, entity_id, actor_id, actor_email, source, reversible, meta)
    values ('create','storage_object', new.id::text, auth.uid(), public._current_actor_email(), 'database_trigger', true,
            jsonb_build_object('bucket_id', new.bucket_id, 'name', new.name, 'after', to_jsonb(new)));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_logs(action, entity_type, entity_id, actor_id, actor_email, source, reversible, meta)
    values ('update','storage_object', new.id::text, auth.uid(), public._current_actor_email(), 'database_trigger', true,
            jsonb_build_object('bucket_id', new.bucket_id, 'name', new.name, 'before', to_jsonb(old), 'after', to_jsonb(new)));
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.audit_logs(action, entity_type, entity_id, actor_id, actor_email, source, reversible, meta)
    values ('delete','storage_object', old.id::text, auth.uid(), public._current_actor_email(), 'database_trigger', true,
            jsonb_build_object('bucket_id', old.bucket_id, 'name', old.name, 'before', to_jsonb(old)));
    return old;
  end if;
  return null;
end;
$$;

do $$ begin
  if exists (select 1 from information_schema.tables where table_schema='storage' and table_name='objects') then
    if not exists (select 1 from pg_trigger where tgname='storage_objects_audit_trg') then
      create trigger storage_objects_audit_trg
      after insert or update or delete on storage.objects
      for each row execute function public.log_storage_audit();
    end if;
  end if;
end $$;

-- Done
