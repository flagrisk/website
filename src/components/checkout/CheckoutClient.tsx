"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { startCheckout, verifyCheckout } from "@/lib/actions/checkout";

declare global {
  interface Window {
    PaystackPop?: new () => {
      resumeTransaction: (
        accessCode: string,
        handlers?: {
          onSuccess?: (txn: { reference: string }) => void;
          onCancel?: () => void;
          onError?: (err: unknown) => void;
        },
      ) => void;
    };
  }
}

const PAYSTACK_SRC = "https://js.paystack.co/v2/inline.js";

function loadPaystack(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) return resolve();
    const existing = document.querySelector(`script[src="${PAYSTACK_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("load failed")));
      return;
    }
    const s = document.createElement("script");
    s.src = PAYSTACK_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Paystack."));
    document.head.appendChild(s);
  });
}

type Phase = "idle" | "starting" | "paying" | "confirming" | "error";

export function CheckoutClient({
  tier,
  tierName,
  cycle,
  priceLabel,
  hasEmail,
}: {
  tier: string;
  tierName: string;
  cycle: "monthly" | "annual";
  priceLabel: string;
  hasEmail: boolean;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    loadPaystack().catch(() => {
      /* button click will surface the error */
    });
  }, []);

  async function confirm(reference: string) {
    setPhase("confirming");
    // The charge webhook flips current_tier shortly after payment. Poll both the
    // verify result and the tier, like the app does.
    for (let i = 0; i < 8; i++) {
      const res = await verifyCheckout(reference, tier);
      if (res.activated || res.status === "success") {
        router.replace("/dashboard?welcome=paid");
        return;
      }
      if (res.status === "failed" || res.status === "abandoned") {
        setPhase("error");
        setMessage("That payment did not go through. You can try again.");
        return;
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
    // Paid but activation still catching up.
    setMessage(
      "Payment received. Your plan will update in a moment, check your dashboard.",
    );
    router.replace("/dashboard");
  }

  async function pay() {
    if (phase === "starting" || phase === "paying" || phase === "confirming") return;
    setMessage(null);
    setPhase("starting");

    const init = await startCheckout(tier, cycle, email);
    if (!init.ok) {
      if (init.needsAuth) {
        router.push(`/login?next=/checkout?tier=${tier}%26cycle=${cycle}`);
        return;
      }
      setPhase("error");
      setMessage(init.error);
      return;
    }

    try {
      await loadPaystack();
      if (!window.PaystackPop) throw new Error("Paystack unavailable.");
      setPhase("paying");
      const popup = new window.PaystackPop();
      popup.resumeTransaction(init.accessCode, {
        onSuccess: (txn) => confirm(txn?.reference ?? init.reference),
        onCancel: () => {
          setPhase("idle");
          setMessage("Checkout cancelled.");
        },
        onError: () => {
          setPhase("error");
          setMessage("Something went wrong with the payment.");
        },
      });
    } catch {
      setPhase("error");
      setMessage("Could not open the payment window. Please try again.");
    }
  }

  const busy = phase === "starting" || phase === "paying" || phase === "confirming";
  const busyLabel =
    phase === "starting"
      ? "Starting…"
      : phase === "confirming"
        ? "Confirming payment…"
        : "Waiting for payment…";

  return (
    <div>
      {!hasEmail && (
        <label className="mb-4 block">
          <span className="text-sm font-medium text-ink">
            Email for your receipt
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1.5 w-full rounded-[10px] border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-night"
          />
        </label>
      )}
      <button
        onClick={pay}
        disabled={busy}
        className="w-full rounded-[10px] bg-night px-4 py-3 text-sm font-semibold text-white transition hover:bg-dusk disabled:opacity-60"
      >
        {busy ? busyLabel : `Pay ${priceLabel} with Paystack`}
      </button>
      <p className="mt-3 text-xs text-slate">
        Secure payment by Paystack. {tierName}, billed {cycle}. FlagRisk never
        sees your card details.
      </p>
      {message && <p className="mt-3 text-sm text-ink">{message}</p>}
    </div>
  );
}
