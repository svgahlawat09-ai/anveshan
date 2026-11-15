import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "#about", label: "About" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#framework", label: "Evidence Framework" },
  { href: "#faq", label: "FAQ" },
];

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-sm font-heading text-lg font-bold ${
          dark ? "bg-[#F5EFD5] text-[#292522]" : "bg-[#8D2939] text-white"
        }`}
        aria-hidden
      >
        अ
      </span>
      <span className="leading-tight">
        <span
          className={`block font-heading text-lg font-bold tracking-tight ${
            dark ? "text-[#F5EFD5]" : "text-[#292522]"
          }`}
        >
          ANVESHAN
        </span>
        <span
          className={`block font-mono text-[9px] uppercase tracking-[0.22em] ${
            dark ? "text-[#D8CDB0]" : "text-[#5C544E]"
          }`}
        >
          Evidence Investigation Lab
        </span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 border-b border-[#D8CDB0] bg-[#F5EFD5]/90 backdrop-blur-md"
      data-testid="landing-navbar"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              data-testid={`nav-link-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
              className="font-mono text-xs uppercase tracking-[0.16em] text-[#5C544E] transition-colors hover:text-[#8D2939]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/report"
            data-testid="nav-sample-dossier-link"
            className="font-mono text-xs uppercase tracking-[0.16em] text-[#5C544E] transition-colors hover:text-[#8D2939]"
          >
            Sample Dossier
          </Link>
          <Link
            to="/investigate"
            data-testid="nav-cta-investigating"
            className="inline-flex items-center rounded-sm bg-[#8D2939] px-4 py-2 font-mono text-xs font-medium uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#741F2D]"
          >
            Start Investigating
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-[#D8CDB0] text-[#292522] lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          data-testid="nav-mobile-toggle"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-[#D8CDB0] bg-[#F5EFD5] px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-3" aria-label="Mobile">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="font-mono text-xs uppercase tracking-[0.16em] text-[#292522]"
              >
                {l.label}
              </a>
            ))}
            <Link
              to="/report"
              onClick={() => setOpen(false)}
              className="font-mono text-xs uppercase tracking-[0.16em] text-[#5C544E]"
            >
              Sample Dossier
            </Link>
            <Link
              to="/investigate"
              onClick={() => setOpen(false)}
              data-testid="nav-mobile-cta"
              className="mt-1 inline-flex w-fit items-center rounded-sm bg-[#8D2939] px-4 py-2 font-mono text-xs font-medium uppercase tracking-[0.16em] text-white"
            >
              Start Investigating
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
