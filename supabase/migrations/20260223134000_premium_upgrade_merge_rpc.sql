create or replace function public.premium_should_apply_incoming(
  p_existing_version integer,
  p_existing_updated_at timestamptz,
  p_incoming_version integer,
  p_incoming_updated_at timestamptz
)
returns boolean
language sql
immutable
as $$
  select
    case
      when coalesce(p_incoming_version, 1) > coalesce(p_existing_version, 1) then true
      when coalesce(p_incoming_version, 1) < coalesce(p_existing_version, 1) then false
      else coalesce(p_incoming_updated_at, to_timestamp(0)) > coalesce(p_existing_updated_at, to_timestamp(0))
    end;
$$;

create or replace function public.premium_parse_json_array(raw text)
returns jsonb
language plpgsql
immutable
as $$
declare
  parsed jsonb;
begin
  if raw is null or btrim(raw) = '' then
    return '[]'::jsonb;
  end if;

  parsed := raw::jsonb;
  if jsonb_typeof(parsed) <> 'array' then
    return '[]'::jsonb;
  end if;

  return parsed;
exception
  when others then
    return '[]'::jsonb;
end;
$$;

create or replace function public.premium_upgrade_merge(
  p_user_id uuid,
  p_billing_cycle text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_billing_cycle text := case when p_billing_cycle = 'year' then 'year' else 'month' end;
  v_entities jsonb := coalesce(p_payload -> 'entities', '{}'::jsonb);
  v_folders jsonb := coalesce(v_entities -> 'folders', '[]'::jsonb);
  v_notes jsonb := coalesce(v_entities -> 'notes', '[]'::jsonb);
  v_recipes jsonb := coalesce(v_entities -> 'recipes', '[]'::jsonb);
  v_item jsonb;
  v_data jsonb;
  v_local_id text;
  v_cloud_id uuid;
  v_version integer;
  v_updated_at timestamptz;
  v_deleted_at timestamptz;
  v_folder_id uuid;
  v_note_id uuid;
  v_recipe_id uuid;
  v_existing_version integer;
  v_existing_updated_at timestamptz;
  v_should_apply boolean;
  v_folder_name text;
  v_folder_emoji text;
  v_recipe_title text;
  v_recipe_subtitle text;
  v_recipe_description text;
  v_recipe_emoji text;
  v_recipe_image_url text;
  v_recipe_steps_text text;
  v_recipe_prep_time integer;
  v_recipe_cook_time integer;
  v_recipe_servings integer;
  v_note_title text;
  v_note_content text;
  v_note_pinned_at timestamptz;
  v_ingredients jsonb;
  v_folders_json jsonb;
  v_ingredient jsonb;
  v_folder_ref jsonb;
  v_folder_ref_name text;
  v_folder_ref_emoji text;
  v_inserted_ingredient_count integer := 0;
  v_uploaded_recipes integer := 0;
  v_uploaded_notes integer := 0;
  v_uploaded_folders integer := 0;
  v_merged_recipes integer := 0;
  v_merged_notes integer := 0;
  v_merged_folders integer := 0;
  v_deleted_recipes integer := 0;
  v_deleted_notes integer := 0;
  v_deleted_folders integer := 0;
  v_canonical_recipes jsonb;
  v_canonical_notes jsonb;
  v_canonical_folders jsonb;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  insert into public.user_entitlements (
    user_id,
    plan,
    billing_cycle,
    activated_at,
    updated_at
  )
  values (
    p_user_id,
    'premium',
    v_billing_cycle,
    v_now,
    v_now
  )
  on conflict (user_id)
  do update set
    plan = excluded.plan,
    billing_cycle = excluded.billing_cycle,
    activated_at = excluded.activated_at,
    updated_at = excluded.updated_at;

  v_uploaded_recipes := jsonb_array_length(v_recipes);
  v_uploaded_notes := jsonb_array_length(v_notes);
  v_uploaded_folders := jsonb_array_length(v_folders);

  for v_item in
    select value
    from jsonb_array_elements(v_folders)
  loop
    v_local_id := nullif(btrim(v_item ->> 'localId'), '');
    if v_local_id is null then
      continue;
    end if;

    v_data := coalesce(v_item -> 'data', '{}'::jsonb);
    v_cloud_id := nullif(v_item ->> 'cloudId', '')::uuid;
    v_version := greatest(1, coalesce((v_item ->> 'version')::integer, 1));
    v_updated_at := coalesce((v_item ->> 'updatedAt')::timestamptz, v_now);
    v_deleted_at := (v_item ->> 'deletedAt')::timestamptz;

    select id, client_version, client_updated_at
      into v_folder_id, v_existing_version, v_existing_updated_at
    from public.folders
    where user_id = p_user_id
      and (
        (v_cloud_id is not null and id = v_cloud_id)
        or client_id = v_local_id
      )
    order by case when v_cloud_id is not null and id = v_cloud_id then 0 else 1 end
    limit 1;

    if v_deleted_at is not null then
      if v_folder_id is not null then
        delete from public.folders
        where id = v_folder_id
          and user_id = p_user_id;
        v_deleted_folders := v_deleted_folders + 1;
      end if;
      continue;
    end if;

    v_folder_name := coalesce(nullif(btrim(v_data ->> 'name'), ''), 'Untitled folder');
    v_folder_emoji := coalesce(nullif(btrim(v_data ->> 'emoji'), ''), '📁');

    if v_folder_id is null then
      insert into public.folders (
        user_id,
        name,
        emoji,
        client_id,
        client_version,
        client_updated_at
      )
      values (
        p_user_id,
        v_folder_name,
        v_folder_emoji,
        v_local_id,
        v_version,
        v_updated_at
      )
      returning id into v_folder_id;

      v_merged_folders := v_merged_folders + 1;
      continue;
    end if;

    v_should_apply := public.premium_should_apply_incoming(
      v_existing_version,
      v_existing_updated_at,
      v_version,
      v_updated_at
    );

    if v_should_apply then
      update public.folders
      set
        name = v_folder_name,
        emoji = v_folder_emoji,
        client_id = v_local_id,
        client_version = v_version,
        client_updated_at = v_updated_at
      where id = v_folder_id
        and user_id = p_user_id;

      v_merged_folders := v_merged_folders + 1;
    end if;
  end loop;

  for v_item in
    select value
    from jsonb_array_elements(v_notes)
  loop
    v_local_id := nullif(btrim(v_item ->> 'localId'), '');
    if v_local_id is null then
      continue;
    end if;

    v_data := coalesce(v_item -> 'data', '{}'::jsonb);
    v_cloud_id := nullif(v_item ->> 'cloudId', '')::uuid;
    v_version := greatest(1, coalesce((v_item ->> 'version')::integer, 1));
    v_updated_at := coalesce((v_item ->> 'updatedAt')::timestamptz, v_now);
    v_deleted_at := (v_item ->> 'deletedAt')::timestamptz;

    select id, client_version, client_updated_at
      into v_note_id, v_existing_version, v_existing_updated_at
    from public.notes
    where user_id = p_user_id
      and (
        (v_cloud_id is not null and id = v_cloud_id)
        or client_id = v_local_id
      )
    order by case when v_cloud_id is not null and id = v_cloud_id then 0 else 1 end
    limit 1;

    if v_deleted_at is not null then
      if v_note_id is not null then
        delete from public.notes
        where id = v_note_id
          and user_id = p_user_id;
        v_deleted_notes := v_deleted_notes + 1;
      end if;
      continue;
    end if;

    v_note_title := nullif(btrim(v_data ->> 'title'), '');
    v_note_content := nullif(btrim(v_data ->> 'content'), '');
    v_note_pinned_at := (v_data ->> 'pinnedAt')::timestamptz;

    if v_note_id is null then
      insert into public.notes (
        user_id,
        title,
        content,
        pinned_at,
        client_id,
        client_version,
        client_updated_at
      )
      values (
        p_user_id,
        v_note_title,
        v_note_content,
        v_note_pinned_at,
        v_local_id,
        v_version,
        v_updated_at
      )
      returning id into v_note_id;

      v_merged_notes := v_merged_notes + 1;
      continue;
    end if;

    v_should_apply := public.premium_should_apply_incoming(
      v_existing_version,
      v_existing_updated_at,
      v_version,
      v_updated_at
    );

    if v_should_apply then
      update public.notes
      set
        title = v_note_title,
        content = v_note_content,
        pinned_at = v_note_pinned_at,
        client_id = v_local_id,
        client_version = v_version,
        client_updated_at = v_updated_at
      where id = v_note_id
        and user_id = p_user_id;

      v_merged_notes := v_merged_notes + 1;
    end if;
  end loop;

  for v_item in
    select value
    from jsonb_array_elements(v_recipes)
  loop
    v_local_id := nullif(btrim(v_item ->> 'localId'), '');
    if v_local_id is null then
      continue;
    end if;

    v_data := coalesce(v_item -> 'data', '{}'::jsonb);
    v_cloud_id := nullif(v_item ->> 'cloudId', '')::uuid;
    v_version := greatest(1, coalesce((v_item ->> 'version')::integer, 1));
    v_updated_at := coalesce((v_item ->> 'updatedAt')::timestamptz, v_now);
    v_deleted_at := (v_item ->> 'deletedAt')::timestamptz;

    select id, client_version, client_updated_at
      into v_recipe_id, v_existing_version, v_existing_updated_at
    from public.recipes
    where user_id = p_user_id
      and (
        (v_cloud_id is not null and id = v_cloud_id)
        or client_id = v_local_id
      )
    order by case when v_cloud_id is not null and id = v_cloud_id then 0 else 1 end
    limit 1;

    if v_deleted_at is not null then
      if v_recipe_id is not null then
        delete from public.recipes
        where id = v_recipe_id
          and user_id = p_user_id;
        v_deleted_recipes := v_deleted_recipes + 1;
      end if;
      continue;
    end if;

    v_recipe_title := coalesce(nullif(btrim(v_data ->> 'title'), ''), 'Untitled recipe');
    v_recipe_subtitle := nullif(btrim(v_data ->> 'subtitle'), '');
    v_recipe_description := nullif(btrim(v_data ->> 'description'), '');
    v_recipe_emoji := nullif(btrim(v_data ->> 'emoji'), '');
    v_recipe_image_url := nullif(btrim(v_data ->> 'imageUrl'), '');
    v_recipe_steps_text := nullif(btrim(v_data ->> 'stepsText'), '');
    v_recipe_prep_time := (v_data ->> 'prepTimeMinutes')::integer;
    v_recipe_cook_time := (v_data ->> 'cookTimeMinutes')::integer;
    v_recipe_servings := (v_data ->> 'servings')::integer;

    if v_recipe_id is null then
      insert into public.recipes (
        user_id,
        title,
        subtitle,
        description,
        emoji,
        image_url,
        steps_text,
        prep_time_minutes,
        cook_time_minutes,
        servings,
        client_id,
        client_version,
        client_updated_at
      )
      values (
        p_user_id,
        v_recipe_title,
        v_recipe_subtitle,
        v_recipe_description,
        v_recipe_emoji,
        v_recipe_image_url,
        v_recipe_steps_text,
        v_recipe_prep_time,
        v_recipe_cook_time,
        v_recipe_servings,
        v_local_id,
        v_version,
        v_updated_at
      )
      returning id into v_recipe_id;

      v_should_apply := true;
      v_merged_recipes := v_merged_recipes + 1;
    else
      v_should_apply := public.premium_should_apply_incoming(
        v_existing_version,
        v_existing_updated_at,
        v_version,
        v_updated_at
      );

      if v_should_apply then
        update public.recipes
        set
          title = v_recipe_title,
          subtitle = v_recipe_subtitle,
          description = v_recipe_description,
          emoji = v_recipe_emoji,
          image_url = v_recipe_image_url,
          steps_text = v_recipe_steps_text,
          prep_time_minutes = v_recipe_prep_time,
          cook_time_minutes = v_recipe_cook_time,
          servings = v_recipe_servings,
          client_id = v_local_id,
          client_version = v_version,
          client_updated_at = v_updated_at
        where id = v_recipe_id
          and user_id = p_user_id;

        v_merged_recipes := v_merged_recipes + 1;
      end if;
    end if;

    if not v_should_apply or v_recipe_id is null then
      continue;
    end if;

    delete from public.recipe_ingredients
    where recipe_id = v_recipe_id;

    v_ingredients := public.premium_parse_json_array(v_data ->> 'ingredientsJson');
    v_inserted_ingredient_count := 0;

    for v_ingredient in
      select value
      from jsonb_array_elements(v_ingredients)
    loop
      if nullif(btrim(v_ingredient ->> 'name'), '') is null then
        continue;
      end if;

      v_inserted_ingredient_count := v_inserted_ingredient_count + 1;
      insert into public.recipe_ingredients (
        recipe_id,
        name,
        quantity,
        unit,
        notes,
        position
      )
      values (
        v_recipe_id,
        nullif(btrim(v_ingredient ->> 'name'), ''),
        nullif(btrim(v_ingredient ->> 'quantity'), ''),
        nullif(btrim(v_ingredient ->> 'unit'), ''),
        nullif(btrim(v_ingredient ->> 'notes'), ''),
        coalesce((v_ingredient ->> 'position')::integer, v_inserted_ingredient_count)
      );
    end loop;

    delete from public.recipe_folders
    where recipe_id = v_recipe_id;

    v_folders_json := public.premium_parse_json_array(v_data ->> 'foldersJson');
    for v_folder_ref in
      select value
      from jsonb_array_elements(v_folders_json)
    loop
      v_folder_ref_name := nullif(btrim(v_folder_ref ->> 'name'), '');
      if v_folder_ref_name is null then
        continue;
      end if;

      select id into v_folder_id
      from public.folders
      where user_id = p_user_id
        and lower(name) = lower(v_folder_ref_name)
      order by created_at asc
      limit 1;

      if v_folder_id is null then
        v_folder_ref_emoji := coalesce(nullif(btrim(v_folder_ref ->> 'emoji'), ''), '📁');
        insert into public.folders (
          user_id,
          name,
          emoji,
          client_id,
          client_version,
          client_updated_at
        )
        values (
          p_user_id,
          v_folder_ref_name,
          v_folder_ref_emoji,
          null,
          1,
          v_now
        )
        returning id into v_folder_id;
      end if;

      if v_folder_id is not null then
        insert into public.recipe_folders (recipe_id, folder_id)
        values (v_recipe_id, v_folder_id)
        on conflict do nothing;
      end if;
    end loop;
  end loop;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'clientId', r.client_id,
        'clientVersion', r.client_version,
        'clientUpdatedAt', r.client_updated_at,
        'updatedAt', r.updated_at
      )
      order by r.updated_at desc
    ),
    '[]'::jsonb
  )
  into v_canonical_recipes
  from public.recipes r
  where r.user_id = p_user_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', n.id,
        'clientId', n.client_id,
        'clientVersion', n.client_version,
        'clientUpdatedAt', n.client_updated_at,
        'updatedAt', n.updated_at
      )
      order by n.updated_at desc
    ),
    '[]'::jsonb
  )
  into v_canonical_notes
  from public.notes n
  where n.user_id = p_user_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', f.id,
        'clientId', f.client_id,
        'clientVersion', f.client_version,
        'clientUpdatedAt', f.client_updated_at,
        'createdAt', f.created_at
      )
      order by f.created_at desc
    ),
    '[]'::jsonb
  )
  into v_canonical_folders
  from public.folders f
  where f.user_id = p_user_id;

  return jsonb_build_object(
    'entitlement',
    jsonb_build_object(
      'plan', 'premium',
      'billingCycle', v_billing_cycle,
      'activatedAt', v_now
    ),
    'canonical',
    jsonb_build_object(
      'recipes', v_canonical_recipes,
      'notes', v_canonical_notes,
      'folders', v_canonical_folders
    ),
    'stats',
    jsonb_build_object(
      'uploaded',
      jsonb_build_object(
        'recipes', v_uploaded_recipes,
        'notes', v_uploaded_notes,
        'folders', v_uploaded_folders
      ),
      'merged',
      jsonb_build_object(
        'recipes', v_merged_recipes,
        'notes', v_merged_notes,
        'folders', v_merged_folders
      ),
      'deleted',
      jsonb_build_object(
        'recipes', v_deleted_recipes,
        'notes', v_deleted_notes,
        'folders', v_deleted_folders
      )
    )
  );
end;
$$;
