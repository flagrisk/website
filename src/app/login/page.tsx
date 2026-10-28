import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Log in" };

export const instant = false;

// searchParams is a Promise in Next 16.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; check_email?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next ?? "/dashboard";

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your FlagRisk account."
      footer={
        <>
          New to FlagRisk?{" "}
          <Link href="/signup" className="font-semibold text-night underline">
            Create an account
          </Link>
        </>
      }
    >
      {sp.check_email && (
        <p className="mb-4 rounded-[10px] bg-teal/10 px-3.5 py-2.5 text-sm text-teal">
          Check your email to confirm your account, then log in.
        </p>
      )}
      {sp.error === "confirm" && (
        <p className="mb-4 rounded-[10px] bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
          That confirmation link didn&apos;t work. Try logging in, or sign up again.
        </p>
      )}
      <LoginForm next={next} />
    </AuthShell>
  );
}
