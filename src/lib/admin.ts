import type { NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// Returns the signed-in user if they are a website admin, else null.
// Uses the web_is_admin() RPC against the caller's cookie session.
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

// Admin check that accepts EITHER the website cookie session OR a Bearer token
// (used by the console, which signs in separately). Verifies the token and
// checks web_roles via the service client.
export async function requireAdminFromRequest(request: NextRequest) {
  const authz = request.headers.get("authorization") ?? "";
  if (authz.startsWith("Bearer ")) {
    const token = authz.slice(7).trim();
    const svc = createServiceClient();
    const {
      data: { user },
    } = await svc.auth.getUser(token);
    if (user) {
      const { data } = await svc
        .from("web_roles")
        .select("is_admin")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.is_admin) return user;
    }
    return null;
  }
  return requireAdmin();
}
