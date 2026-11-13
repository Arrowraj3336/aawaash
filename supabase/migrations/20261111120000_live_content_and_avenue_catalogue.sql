-- App-side role checks need explicit grants on a fresh database. Signed-in
-- callers may check their own assignment only, matching the user_roles policy.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
      AND (
        COALESCE(current_setting('role', true), 'none') NOT IN ('authenticated', 'anon')
        OR _user_id = auth.uid()
      )
  )
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_team_id() TO authenticated, service_role;

-- Deliver homepage content changes to already-open public pages.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'cms_global_content'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cms_global_content;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'cms_brand_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cms_brand_settings;
  END IF;
END $$;

-- Initialize only the existing 27th Avenue listing. Preserve saved overrides.
UPDATE public.projects SET
    description = COALESCE(description, '27th Avenue by Satya Bhawani Plaza Buildcon Pvt. Ltd., presented as S.B.P. Buildcon Pvt. Ltd. in the brochure. Located on Kamtaul Road, Mabbi, Darbhanga, near the Nexa showroom. The project has eight residential floors and 16 flats in total.'),
    short_description = COALESCE(short_description, 'Exclusively 3 BHK residences across 8 residential floors. Super built-up areas from 889 to 1,314 sqft.'),
    amenities = CASE WHEN cardinality(amenities) = 0 THEN ARRAY['Temple', 'Kids Pool', 'Lawn', 'Kids Play Area', 'Jogging Track', 'Green Area', 'Gym', 'CCTV', 'Earthquake-resistant structure', 'Fire Safety', '24×7 Water Supply', '24×7 Power Backup'] ELSE amenities END,
    gallery = CASE WHEN COALESCE(cardinality(gallery), 0) = 0 THEN ARRAY['/projects/27th-avenue/exterior-front.webp', '/projects/27th-avenue/exterior-perspective.webp', '/projects/27th-avenue/exterior-aerial.webp', '/projects/27th-avenue/typical-floor-plan.webp'] ELSE gallery END,
    three_d_tour_url = COALESCE(three_d_tour_url, '/projects/27th-avenue/27th-avenue-exterior.glb'),
    extra = '{"brochure":{"version":1,"file":"/projects/27th-avenue/27th-avenue-brochure.pdf","owner_confirmed_at":"2026-11-10","area_basis":"Super built-up (S/B/U)","type7_note":"Owner-confirmed as 3 BHK. The original Type 7 brochure drawing and bedroom bullet show two bedrooms; confirm the final layout with the developer. The source plan is reproduced unchanged."},"flats":[{"title":"3 BHK · Type 1","area":"1,251 sqft · Super built-up","image":"/projects/27th-avenue/type-1-b8.webp","amenities":["Flats B8","2 washrooms"]},{"title":"3 BHK · Type 2","area":"1,251 sqft · Super built-up","image":"/projects/27th-avenue/type-2-b5.webp","amenities":["Flats B5","2 washrooms"]},{"title":"3 BHK · Type 3","area":"1,314 sqft · Super built-up","image":"/projects/27th-avenue/type-3-a1-a4-b4.webp","amenities":["Flats A1, A4, B4","2 washrooms"]},{"title":"3 BHK · Type 4","area":"1,251 sqft · Super built-up","image":"/projects/27th-avenue/type-4-a2-a3-b2-b3.webp","amenities":["Flats A2, A3, B2, B3","2 washrooms"]},{"title":"3 BHK · Type 5","area":"1,251 sqft · Super built-up","image":"/projects/27th-avenue/type-5-a5-a8.webp","amenities":["Flats A5, A8","2 washrooms"]},{"title":"3 BHK · Type 6","area":"1,125 sqft · Super built-up","image":"/projects/27th-avenue/type-6-a6-b6.webp","amenities":["Flats A6, B6","2 washrooms"]},{"title":"3 BHK · Type 7","area":"889 sqft · Super built-up","image":"/projects/27th-avenue/type-7-a7-b7.webp","amenities":["Flats A7, B7","2 washrooms"],"note":"Owner-confirmed as 3 BHK. The original Type 7 brochure drawing and bedroom bullet show two bedrooms; confirm the final layout with the developer. The source plan is reproduced unchanged."},{"title":"3 BHK · Type 8","area":"1,251 sqft · Super built-up","image":"/projects/27th-avenue/type-8-b1.webp","amenities":["Flats B1","2 washrooms"]}],"avenue_catalogue_initialized":true}'::jsonb || extra || '{"avenue_catalogue_initialized":true}'::jsonb
WHERE slug = '27th' AND NOT is_deleted
  AND extra->>'avenue_catalogue_initialized' IS DISTINCT FROM 'true';
