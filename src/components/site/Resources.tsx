import Link from "next/link";
import { ArrowRightIcon } from "./Icons";

const POSTS = [
  {
    tag: "Guide",
    tint: "linear-gradient(135deg,#1b1e3d,#2e2f5c)",
    title: "How to set up your safety circle the right way",
    excerpt: "Who to add, how many people, and how to make sure everyone can reach you when it matters.",
  },
  {
    tag: "Safety tip",
    tint: "linear-gradient(135deg,#2f9e8f,#1b1e3d)",
    title: "What to do in the first 60 seconds of an emergency",
    excerpt: "A calm, simple sequence for the moments that matter most, whether or not you can be seen or heard.",
  },
  {
    tag: "Guide",
    tint: "linear-gradient(135deg,#14152a,#46b3a6)",
    title: "Staying safe on late-night journeys",
    excerpt: "How Trip Watch keeps your circle with you from the first step to the front door.",
  },
];

export function Resources() {
  return (
    <section id="resources" className="bg-white text-ink">
      <div className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-28">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow mb-5">Resources</p>
            <h2 className="display">Practical safety, explained simply.</h2>
          </div>
          <Link href="/#resources" className="btn btn-outline shrink-0">
            View all guides <ArrowRightIcon size={18} />
          </Link>
        </div>

        <div className="mt-14 grid gap-7 md:grid-cols-3">
          {POSTS.map((p) => (
            <div key={p.title} className="card-flat flex flex-col overflow-hidden">
              <div className="h-44" style={{ background: p.tint }} />
              <div className="flex flex-1 flex-col p-8">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal">
                  {p.tag}
                </span>
                <h3 className="mt-3 text-xl font-semibold leading-snug text-ink">{p.title}</h3>
                <p className="mt-3 flex-1 leading-relaxed text-slate">{p.excerpt}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-night">
                  Read more <ArrowRightIcon size={15} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
