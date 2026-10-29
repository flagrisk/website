import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = { title: "Create your account" };

export const instant = false;

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const sp = await searchParams;
  const ref = (sp.ref ?? "").toUpperCase().trim();

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start a circle and keep the people you love safe."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-night underline">
            Log in
          </Link>
        </>
      }
    >
      <SignupForm refCode={ref} />
    </AuthShell>
  );
}
