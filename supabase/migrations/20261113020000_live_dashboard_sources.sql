-- Publish additional dashboard sources through the existing RLS policies.
DO $$
DECLARE source_table text;
BEGIN
  FOREACH source_table IN ARRAY ARRAY[
    'teams', 'profiles', 'sales', 'commissions', 'commission_transactions',
    'commission_ledger', 'withdrawals', 'referrals', 'tip_persons',
    'notifications', 'projects', 'buildings', 'floors', 'flats'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
        AND tablename = source_table
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', source_table);
    END IF;
  END LOOP;
END $$;

-- Team numbering grows with the organization and preserves legacy login prefixes.
ALTER TABLE public.teams
  DROP CONSTRAINT IF EXISTS teams_letter_check,
  ADD CONSTRAINT teams_letter_check CHECK (letter ~ '^([1-9][0-9]*|[A-Z]{1,3})$');
