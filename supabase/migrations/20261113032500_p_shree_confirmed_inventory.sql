-- P Shree's confirmed inventory. Existing flat records keep their status and details.
DO $$
DECLARE
  project_row public.projects%ROWTYPE;
BEGIN
  SELECT * INTO project_row FROM public.projects WHERE slug = 'p-shree' FOR UPDATE;
  IF NOT FOUND OR COALESCE(project_row.extra->>'p_shree_inventory_initialized', '') = 'true' THEN RETURN; END IF;

  INSERT INTO public.buildings (project_id, code, name, ordering, total_floors)
  SELECT project_row.id, code, 'Tower ' || code, ordering, 1
  FROM (VALUES ('A', 1), ('B', 2), ('C', 3)) AS towers(code, ordering)
  ON CONFLICT (project_id, code) DO NOTHING;

  INSERT INTO public.floors (project_id, building_id, number, name, ordering)
  SELECT project_row.id, id, 1, 'Floor 1', 1 FROM public.buildings
  WHERE project_id = project_row.id AND code IN ('A', 'B', 'C')
  ON CONFLICT (building_id, number) DO NOTHING;

  INSERT INTO public.flats (
    project_id, building_id, floor_id, unit_code, area_sqft, bedrooms, configuration, status, booking_status
  )
  SELECT project_row.id, b.id, f.id, u.unit_code, u.area, u.bedrooms, u.bedrooms || ' BHK', 'not_released', 'open'
  FROM (VALUES
      ('A', 'A101', 1256, 3),
      ('A', 'A102', 1256, 3),
      ('A', 'A103', 1190, 3),
      ('A', 'A104', 1190, 3),
      ('A', 'A105', 1175, 3),
      ('A', 'A106', 1175, 3),
      ('A', 'A107', 1190, 3),
      ('A', 'A108', 1190, 3),
      ('A', 'A109', 1234, 3),
      ('A', 'A110', 1234, 3),
      ('B', 'B101', 1252, 3),
      ('B', 'B102', 1252, 3),
      ('B', 'B103', 1186, 3),
      ('B', 'B104', 1186, 3),
      ('B', 'B105', 971, 2),
      ('B', 'B106', 971, 2),
      ('B', 'B107', 1186, 3),
      ('B', 'B108', 1186, 3),
      ('B', 'B109', 1231, 3),
      ('B', 'B110', 1231, 3),
      ('C', 'C101', 1352, 3),
      ('C', 'C102', 1352, 3),
      ('C', 'C103', 1277, 3),
      ('C', 'C104', 1277, 3),
      ('C', 'C105', 1277, 3),
      ('C', 'C106', 1277, 3),
      ('C', 'C107', 1329, 3),
      ('C', 'C108', 1329, 3)
  ) AS u(tower, unit_code, area, bedrooms)
  JOIN public.buildings b ON b.project_id = project_row.id AND b.code = u.tower
  JOIN public.floors f ON f.building_id = b.id AND f.number = 1
  ON CONFLICT (project_id, unit_code) DO NOTHING;

  PERFORM public.recompute_project_flat_counts(project_row.id);
  UPDATE public.projects SET
    price_from = CASE WHEN COALESCE(price_from, 0) <= 0 AND COALESCE(price_min, 0) <= 0 THEN 4500000 ELSE price_from END,
    price_min = CASE WHEN COALESCE(price_from, 0) <= 0 AND COALESCE(price_min, 0) <= 0 THEN 4500000 ELSE price_min END,
    total_units = total_flats,
    extra = COALESCE(extra, '{}'::jsonb) || '{"p_shree_inventory_initialized":true}'::jsonb
  WHERE id = project_row.id;
END $$;
