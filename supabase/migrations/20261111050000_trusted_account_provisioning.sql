-- Assign privileges and teams only through authorized provisioning workflows.
-- Existing role assignments are retained for a separate owner review.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_mobile TEXT := COALESCE(meta->>'mobile_number', '');
  v_login_id TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  IF v_mobile = '' THEN
    v_mobile := regexp_replace(split_part(NEW.email, '@', 1), '[^0-9]', '', 'g');
    IF length(v_mobile) < 10 THEN
      v_mobile := lpad(v_mobile, 10, '0');
    END IF;
  END IF;
  v_login_id := COALESCE(NULLIF(meta->>'login_id', ''), v_mobile);

  INSERT INTO public.profiles (id, full_name, mobile_number, login_id, email)
  VALUES (NEW.id, COALESCE(meta->>'full_name', ''), v_mobile, v_login_id, NEW.email);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;
