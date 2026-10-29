"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";

export type AuthState = { error: string | null };

// Sign up with phone + password, mirroring the app. Supabase sends a 6-digit
// code through the Send SMS hook (Termii); the /verify screen confirms it.
// The invite code rides along in user metadata so the referral is attributed on
// the referred person's first dashboard visit.
export async function signUpAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "");
  const password = String(formData.get("password") ?? "");
  const ref = String(formData.get("ref") ?? "").trim();
  const phone = normalizePhone(phoneRaw);

  if (!fullName) return { error: "Enter your name." };
  if (phone.length < 11) return { error: "Enter a valid phone number." };
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    phone,
    password,
    options: { data: { display_name: fullName, ref_code: ref || null } },
  });

  if (error) {
    if (/already/i.test(error.message)) {
      return { error: "This number is already registered. Try logging in." };
    }
    return { error: error.message };
  }

  // Supabase returns success for a number that already exists (to stop this form
  // being used to discover who is registered). The empty identities array is the
  // signal, same as the app relies on.
  const exists =
    data.user &&
    Array.isArray(data.user.identities) &&
    data.user.identities.length === 0;
  if (exists) {
    return { error: "This number is already registered. Try logging in." };
  }

  // Code sent. Move to the verify screen.
  redirect(`/verify?phone=${encodeURIComponent(phone)}`);
}

// Confirm the SMS code; verifyOtp returns a session (cookies set by the SSR
// client), so the user is logged in afterwards.
export async function verifyOtpAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const phone = String(formData.get("phone") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();

  if (token.length < 6) return { error: "Enter the 6-digit code." };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });

  if (error) {
    return {
      error: /expired/i.test(error.message)
        ? "That code has expired. Send a new one."
        : "That code is not right. Check and try again.",
    };
  }

  redirect("/dashboard");
}

// Resend the signup code without creating a new user.
export async function resendOtpAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const phone = String(formData.get("phone") ?? "").trim();
  if (!phone) return { error: "Missing phone number." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { shouldCreateUser: false },
  });

  if (error) return { error: error.message };
  return { error: null };
}

// Log in with phone + password.
export async function signInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const phoneRaw = String(formData.get("phone") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");
  const phone = normalizePhone(phoneRaw);

  if (phone.length < 11 || !password) {
    return { error: "Enter your phone number and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ phone, password });

  if (error) {
    return { error: "That phone number and password do not match an account." };
  }

  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
