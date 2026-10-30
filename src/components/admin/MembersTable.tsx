"use client";

import { useMemo, useState } from "react";
import { formatNaira } from "@/lib/tiers";

export type MemberRow = {
  id: string;
  name: string;
  phone: string;
  tier: string;
  earned: number;
  referred: number;
  joined: string | null;
};

export function MembersTable({ members }: { members: MemberRow[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(needle) ||
        m.phone.toLowerCase().includes(needle),
    );
  }, [q, members]);

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or phone"
        className="mb-4 w-full max-w-[320px] rounded-[10px] border border-line bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-night"
      />
      {filtered.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate">
                <th className="pb-2 font-medium">Member</th>
                <th className="pb-2 font-medium">Phone</th>
                <th className="pb-2 font-medium">Plan</th>
                <th className="pb-2 font-medium">Referred</th>
                <th className="pb-2 font-medium">Earned</th>
                <th className="pb-2 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td className="py-2.5 text-ink">
                    {m.name || m.id.slice(0, 8)}
                  </td>
                  <td className="py-2.5 text-slate">{m.phone || "—"}</td>
                  <td className="py-2.5 text-slate capitalize">{m.tier}</td>
                  <td className="py-2.5 text-ink">{m.referred}</td>
                  <td className="py-2.5 text-ink">{formatNaira(m.earned)}</td>
                  <td className="py-2.5 text-slate">
                    {m.joined
                      ? new Date(m.joined).toLocaleDateString("en-NG")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate">No members match that search.</p>
      )}
      <p className="mt-3 text-xs text-slate">
        {filtered.length} of {members.length} members
      </p>
    </div>
  );
}
