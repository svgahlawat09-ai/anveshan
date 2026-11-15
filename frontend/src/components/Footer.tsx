import { Link } from "react-router-dom";
import { Logo } from "./Navbar";

const EXPLORE = [
  { href: "/#about", label: "About" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#framework", label: "Evidence Framework" },
  { href: "/#faq", label: "FAQ" },
];

const APPLICATION = [
  { href: "/investigate", label: "Start Investigation" },
  { href: "/results", label: "Results Dashboard" },
  { href: "/report", label: "Demo Report" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[#D8CDB0] bg-[#292522] text-[#F5EFD5]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-4">
            <Logo dark />
            <p className="max-w-sm font-heading text-xl italic leading-snug text-[#D8CDB0]">
              "Question everything. Follow the evidence."
            </p>
          </div>
          <nav aria-label="Explore">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#F39291]">
              Explore
            </h3>
            <ul className="mt-4 space-y-2.5">
              {EXPLORE.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-sm text-[#F5EFD5]/80 transition-colors hover:text-[#F39291]"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Application">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#F39291]">
              Application
            </h3>
            <ul className="mt-4 space-y-2.5">
              {APPLICATION.map((l) => (
                <li key={l.href}>
                  <Link
                    to={l.href}
                    className="text-sm text-[#F5EFD5]/80 transition-colors hover:text-[#F39291]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-[#4A423C] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#D8CDB0]">
            ANVESHAN — Evidence Investigation Lab
          </p>
          <p className="font-mono text-[10px] tracking-[0.08em] text-[#D8CDB0]/70">
            Demonstration build — all investigation data shown in this product is illustrative.
          </p>
        </div>
      </div>
    </footer>
  );
}
