import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { VerifyForm } from "@/components/auth/VerifyForm";

export const metadata: Metadata = { title: "Confirm your number" };
export const instant = false;

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string }>;
}) {
  const sp = await searchParams;
  const phone = sp.phone ?? "";
  if (!phone) redirect("/signup");

  return (
    <AuthShell
      title="Confirm your number"
      subtitle={`We sent a 6-digit code to ${phone}.`}
      footer={
        <>
          Wrong number?{" "}
          <Link href="/signup" className="font-semibold text-night underline">
            Start over
          </Link>
        </>
      }
    >
      <VerifyForm phone={phone} />
    </AuthShell>
  );
}
