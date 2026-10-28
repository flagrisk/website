"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error: string | null };

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

// Sign up with email + password. Captures a referral code (from the hidden
// field the signup form fills from ?ref=) and stashes it so it can be applied
// once the account actually exists and is signed in.
export async function signUpAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const ref = String(formData.get("ref") ?? "").trim();

  if (!email || !password) {
    return { error: "Enter your email and a password." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || null, ref_code: ref || null },
      emailRedirectTo: `${siteUrl()}/auth/callback${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Email confirmation off: a session is returned right away. Attribute the
  // referral now, then go to the dashboard.
  if (data.session) {
    if (ref) {
      await supabase.rpc("record_referral", { p_code: ref });
    }
    redirect("/dashboard");
  }

  // Email confirmation on: no session yet. The callback route applies the
  // referral after they confirm.
  redirect("/login?check_email=1");
}

export async function signInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
