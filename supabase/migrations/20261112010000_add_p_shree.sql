-- Source: owner-supplied P Shree proposed exterior, area schedule and tower plans.
-- Do not seed booking availability or undocumented flat numbers.
INSERT INTO public.projects (
  id, slug, name, location, address, project_type, construction_status, visibility,
  status, tag, short_description, description, area_min, area_max,
  total_buildings, total_floors, total_flats, total_units, hero_banner_url,
  cover_url, thumbnail_url, gallery, gallery_count, floor_plan_count, extra
) VALUES (
  '81ddf13e-4a6e-4d6e-8acd-9c1d7ab75582', 'p-shree', 'P Shree',
  'Chandanpatti, Darbhanga', 'Chandanpatti, Darbhanga, Bihar',
  'flat_inventory', 'planning', 'public', 'live', 'Proposed development',
  'Proposed 2 and 3 BHK residences across three towers in Chandanpatti, Darbhanga.',
  'Proposed 2 and 3 BHK residences across three towers in Chandanpatti, Darbhanga.',
  971, 1352, 3, 5, 140, 140,
  '/projects/p-shree/entrance.webp', '/projects/p-shree/entrance.webp', '/projects/p-shree/entrance.webp',
  ARRAY[
    '/projects/p-shree/entrance.webp', '/projects/p-shree/street-corner.webp',
    '/projects/p-shree/courtyard.webp', '/projects/p-shree/three-tower-elevation.webp',
    '/projects/p-shree/front-elevation.webp', '/projects/p-shree/aerial-front.webp',
    '/projects/p-shree/aerial-rear.webp', '/projects/p-shree/ground-level.webp'
  ],
  8, 3, '{"developer":"S.B.P. Buildcon Pvt. Ltd.","architect":"Sukriti Architects & Planners"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
