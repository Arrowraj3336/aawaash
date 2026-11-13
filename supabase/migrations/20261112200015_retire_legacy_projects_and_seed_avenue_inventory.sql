-- Archive the catalogue as it stood at the reset, retaining sales and inventory history.
UPDATE public.projects
SET is_deleted = true, visibility = 'archived'
WHERE NOT is_deleted
  AND slug NOT IN ('27th', 'savitri-enclave')
  AND (created_at <= '2026-11-12T20:00:15Z'::timestamptz
    OR slug IN ('p-shree', 'mirzapur-tower', 'chandanpatti', 'the-serai-residences', 'aawash-skyline', 'verdant-heights'));

DO $$
DECLARE
  avenue_id uuid;
  avenue_building uuid;
  floor_row record;
  occupied integer;
BEGIN
  SELECT id INTO avenue_id FROM public.projects WHERE slug = '27th' AND NOT is_deleted FOR UPDATE;
  IF avenue_id IS NULL THEN RETURN; END IF;
  -- Preserve an existing multi-tower layout and let the live catalogue use it.
  IF (SELECT count(*) FROM public.buildings WHERE project_id = avenue_id) > 1 THEN
    UPDATE public.projects SET extra = extra || '{"avenue_inventory_v2":true}'::jsonb WHERE id = avenue_id;
    RETURN;
  END IF;

  SELECT id INTO avenue_building FROM public.buildings WHERE project_id = avenue_id;
  IF avenue_building IS NULL THEN
    INSERT INTO public.buildings (project_id, code, name, total_floors)
    VALUES (avenue_id, '27TH', '27th Avenue', 8)
    RETURNING id INTO avenue_building;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.flats f JOIN public.floors fl ON fl.id = f.floor_id
    WHERE f.project_id = avenue_id
      AND (f.building_id <> avenue_building OR fl.building_id <> avenue_building OR fl.project_id <> avenue_id)
  ) THEN
    RAISE EXCEPTION '27th Avenue has a flat linked to another tower or project.';
  END IF;

  INSERT INTO public.floors (project_id, building_id, number, name, ordering)
  SELECT avenue_id, avenue_building, n, 'Floor ' || n, n FROM generate_series(1, 8) AS n
  ON CONFLICT (building_id, number) DO NOTHING;

  FOR floor_row IN SELECT id, number FROM public.floors WHERE project_id = avenue_id AND building_id = avenue_building AND number BETWEEN 1 AND 8 ORDER BY number
  LOOP
    SELECT count(*) INTO occupied FROM public.flats WHERE project_id = avenue_id AND floor_id = floor_row.id;
    IF occupied >= 8 THEN CONTINUE; END IF;
    INSERT INTO public.flats (
      project_id, building_id, floor_id, unit_code, bedrooms, configuration, status, booking_status, admin_notes
    )
    SELECT avenue_id, avenue_building, floor_row.id, slots.code, 3, '3 BHK', 'not_released', 'closed',
      'Provisional slot. Confirm the official flat number and availability before release.'
    FROM (
      SELECT 'F' || lpad(floor_row.number::text, 2, '0') || '-' || lpad(n::text, 2, '0') AS code
      FROM generate_series(1, 8) AS n
    ) slots
    WHERE NOT EXISTS (SELECT 1 FROM public.flats f WHERE f.project_id = avenue_id AND f.unit_code = slots.code)
    ORDER BY slots.code
    LIMIT 8 - occupied;

    IF (SELECT count(*) FROM public.flats WHERE project_id = avenue_id AND floor_id = floor_row.id) <> 8 THEN
      RAISE EXCEPTION '27th Avenue provisional flat codes conflict on floor %.', floor_row.number;
    END IF;
  END LOOP;

  PERFORM public.recompute_project_flat_counts(avenue_id);
  UPDATE public.buildings SET total_floors = (
    SELECT count(*) FROM public.floors WHERE building_id = avenue_building
  ) WHERE id = avenue_building;
  UPDATE public.projects
  SET total_units = total_flats,
    extra = COALESCE(extra, '{}'::jsonb) || '{"avenue_inventory_v2":true}'::jsonb,
    description = replace(description, 'eight residential floors and 16 flats in total', 'eight residential floors with eight flats on each floor')
  WHERE id = avenue_id;
END $$;
