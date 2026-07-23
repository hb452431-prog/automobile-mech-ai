
-- Restrict mechanics table public read to authenticated users only (hide phone/contact from anon)
DROP POLICY IF EXISTS "mechanics public read" ON public.mechanics;
CREATE POLICY "mechanics authenticated read" ON public.mechanics
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.mechanics FROM anon;

-- Lock down SECURITY DEFINER functions: revoke broad EXECUTE
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
