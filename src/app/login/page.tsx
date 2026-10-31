import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false, follow: false },
};

export const instant = false;

// searchParams is a Promise in Next 16.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next ?? "/dashboard";

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in with your phone number and password."
      footer={
        <>
          New to FlagRisk?{" "}
          <Link href="/signup" className="font-semibold text-night underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
