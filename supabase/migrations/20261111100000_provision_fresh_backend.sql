-- Create the buckets used by the existing upload flows. Their storage policies
-- already exist and signed URLs provide access to published project media.
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('project-media', 'project-media', false),
  ('cms-media', 'cms-media', false),
  ('customer-documents', 'customer-documents', false)
ON CONFLICT (id) DO NOTHING;

-- New projects may lack Supabase's legacy default grants. The existing RLS
-- policy limits project writes to users with the super_admin role.
GRANT INSERT, UPDATE, DELETE ON public.projects TO authenticated;

-- The public project and brochure inventory use this slug. Preserve any
-- existing record, including one that an admin has archived or customized.
INSERT INTO public.projects (
  slug, name, location, address, project_type, visibility, display_priority,
  price_from, price_min, total_buildings, total_floors, total_flats, total_units,
  available_flats, area_min, area_max, thumbnail_url, hero_banner_url, cover_url
)
VALUES (
  '27th', '27th Avenue', 'Kamtaul Road, Mabbi, Darbhanga',
  'Kamtaul Road, Mabbi, Darbhanga, near Nexa showroom', 'flat_inventory', 'public', 95,
  6000000, 6000000, 1, 8, 16, 16, 16, 889, 1314,
  '/projects/27th-avenue/exterior-front.webp',
  '/projects/27th-avenue/exterior-front.webp',
  '/projects/27th-avenue/exterior-front.webp'
)
ON CONFLICT (slug) DO NOTHING;

-- Replace only the original seed asset URLs with the bundled copy.
UPDATE public.projects
SET hero_banner_url = '/images/savitri-enclave-facade.png',
    thumbnail_url = '/images/savitri-enclave-facade.png',
    cover_url = '/images/savitri-enclave-facade.png'
WHERE slug = 'savitri-enclave'
  AND hero_banner_url = 'https://aawaash.lovable.app/__l5e/assets-v1/a4fb8c7c-b535-49fd-bf12-03256784731f/savitri-enclave-facade.png'
  AND thumbnail_url = hero_banner_url
  AND cover_url = hero_banner_url;
