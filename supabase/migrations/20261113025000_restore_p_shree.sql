-- Restore the owner-requested listing and retain existing IDs, media and inventory.
UPDATE public.projects
SET is_deleted = false, visibility = 'public'
WHERE slug = 'p-shree' AND is_deleted AND visibility = 'archived';
