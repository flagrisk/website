import { createClient } from "@/lib/supabase/server";

// Returns the signed-in user if they are a website admin, else null.
// Uses the web_is_admin() RPC (SECURITY DEFINER) against the caller's session.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: isAdmin, error } = await supabase.rpc("web_is_admin");
  if (error || !isAdmin) return null;

  return user;
}
