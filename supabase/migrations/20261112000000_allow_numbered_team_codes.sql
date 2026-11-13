-- Preserve existing letter-based team codes and accept numbered codes.
ALTER TABLE public.teams
  DROP CONSTRAINT IF EXISTS teams_letter_check,
  ADD CONSTRAINT teams_letter_check
    CHECK (letter ~ '^([1-9][0-9]{0,4}|[A-Z]{1,3})$');
