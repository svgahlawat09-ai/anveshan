import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bookmark, History, Plus, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Logo } from "./Navbar";
import {
  clearAllDemoData,
  getHistory,
  getSavedReports,
  type HistoryEntry,
  type SavedReport,
} from "@/lib/storage";
import { formatDate } from "./stance";

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [saved, setSaved] = useState<SavedReport[]>([]);

  const reload = () => {
    setHistory(getHistory());
    setSaved(getSavedReports());
  };

  useEffect(() => {
    reload();
    const onStorage = () => reload();
    window.addEventListener("anveshan:storage", onStorage);
    return () => window.removeEventListener("anveshan:storage", onStorage);
  }, []);

  const clearData = () => {
    clearAllDemoData();
    reload();
    onNavigate?.();
    toast.success("Local demo data cleared");
  };

  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6" aria-label="Workspace">
        <div>
          <p className="px-2 font-mono text-[9px] uppercase tracking-[0.22em] text-[#5C544E]">
            Workspace
          </p>
          <Link
            to="/investigate"
            onClick={onNavigate}
            data-testid="sidebar-new-investigation"
            className="mt-2 flex items-center gap-2.5 rounded-sm border border-[#D8CDB0] bg-[#8D2939] px-3 py-2.5 font-mono text-xs font-medium uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#741F2D]"
          >
            <Plus className="h-4 w-4" />
            New Investigation
          </Link>
        </div>

        <div>
          <p className="flex items-center gap-2 px-2 font-mono text-[9px] uppercase tracking-[0.22em] text-[#5C544E]">
            <History className="h-3 w-3" /> Investigation History
            <span className="ml-auto text-[#8D2939]">{history.length}</span>
          </p>
          <div className="mt-2 space-y-1" data-testid="sidebar-history-list">
            {history.length === 0 ? (
              <p className="px-2 py-1.5 text-xs leading-relaxed text-[#6A625A]">
                No investigations yet. Run one to populate this history.
              </p>
            ) : (
              history.slice(0, 6).map((h) => (
                <Link
                  key={h.id}
                  to="/results"
                  onClick={onNavigate}
                  data-testid={`sidebar-history-item-${h.id}`}
                  className="block rounded-sm border border-transparent px-2 py-1.5 transition-colors hover:border-[#D8CDB0] hover:bg-[#EFE8CC]"
                >
                  <span className="line-clamp-2 text-xs leading-snug text-[#292522]">
                    {h.claim}
                  </span>
                  <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.14em] text-[#6A625A]">
                    {formatDate(h.date)} · {h.mode}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        <div>
          <p className="flex items-center gap-2 px-2 font-mono text-[9px] uppercase tracking-[0.22em] text-[#5C544E]">
            <Bookmark className="h-3 w-3" /> Saved Reports
            <span className="ml-auto text-[#8D2939]">{saved.length}</span>
          </p>
          <div className="mt-2 space-y-1" data-testid="sidebar-saved-list">
            {saved.length === 0 ? (
              <p className="px-2 py-1.5 text-xs leading-relaxed text-[#6A625A]">
                Nothing saved. Save a report from its dossier page.
              </p>
            ) : (
              saved.map((r) => (
                <Link
                  key={r.id}
                  to="/report"
                  onClick={onNavigate}
                  data-testid={`sidebar-saved-item-${r.id}`}
                  className="block rounded-sm border border-transparent px-2 py-1.5 transition-colors hover:border-[#D8CDB0] hover:bg-[#EFE8CC]"
                >
                  <span className="line-clamp-2 text-xs leading-snug text-[#292522]">
                    {r.title}
                  </span>
                  <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.14em] text-[#6A625A]">
                    Saved {formatDate(r.savedAt)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        <div>
          <p className="flex items-center gap-2 px-2 font-mono text-[9px] uppercase tracking-[0.22em] text-[#5C544E]">
            <Settings className="h-3 w-3" /> Settings
          </p>
          <Popover>
            <PopoverTrigger
              data-testid="sidebar-settings-trigger"
              className="mt-2 flex w-full items-center gap-2.5 rounded-sm border border-[#D8CDB0] px-3 py-2 text-left text-xs text-[#292522] transition-colors hover:bg-[#EFE8CC]"
            >
              <Settings className="h-3.5 w-3.5 text-[#5C544E]" />
              Demo data controls
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8D2939]">
                Local storage
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[#5C544E]">
                History and saved reports live only in this browser. Clear them to
                reset the demonstration.
              </p>
              <button
                type="button"
                onClick={clearData}
                data-testid="sidebar-clear-data"
                className="mt-3 inline-flex items-center gap-2 rounded-sm border border-[#F5B4AC] px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#6E1B1B] transition-colors hover:bg-[#FCE8E6]"
              >
                <Trash2 className="h-3 w-3" />
                Clear demo data
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </nav>

      <div className="border-t border-[#D8CDB0] p-4" data-testid="sidebar-profile">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#292522] font-mono text-xs text-[#F5EFD5]">
            DI
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[#292522]">
              Demo Investigator
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#6A625A]">
              Prototype session
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Re-read storage whenever the route changes so new history/saves appear.
  useEffect(() => {
    window.dispatchEvent(new Event("anveshan:storage"));
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F5EFD5]">
      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-[#D8CDB0] bg-white lg:flex print:hidden"
        data-testid="workspace-sidebar"
      >
        <div className="border-b border-[#D8CDB0] px-5 py-4">
          <Logo />
        </div>
        <SidebarNav />
      </aside>

      {/* Mobile top bar + sheet */}
      <div className="sticky top-0 z-40 border-b border-[#D8CDB0] bg-[#F5EFD5]/95 backdrop-blur-md lg:hidden print:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              data-testid="workspace-mobile-menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-[#D8CDB0] text-[#292522]"
              aria-label="Open workspace menu"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden
              >
                <path d="M2 4h12M2 8h12M2 12h12" />
              </svg>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b border-[#D8CDB0] px-5 py-4">
                <Logo />
                <SheetTitle className="sr-only">Workspace navigation</SheetTitle>
              </SheetHeader>
              <SidebarNav onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="font-heading text-base font-bold tracking-tight text-[#292522]">
            ANVESHAN
          </span>
          <Link
            to="/investigate"
            data-testid="workspace-mobile-new"
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-[#8D2939] text-white"
            aria-label="New investigation"
          >
            <Plus className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <main className="lg:pl-64">{children}</main>
    </div>
  );
}
