import Link from "next/link";

const NAV = [
  {
    label: "Learn",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/skill-tree", label: "Skill Tree" },
      { href: "/lessons", label: "Lessons" },
      { href: "/classroom", label: "AI Classroom" },
      { href: "/drills", label: "Drills" },
    ],
  },
  {
    label: "Practice",
    items: [
      { href: "/risk", label: "Risk calculator" },
      { href: "/formulas", label: "Formula Builder" },
      { href: "/simulator", label: "Simulator" },
      { href: "/replay", label: "Replay" },
      { href: "/journal", label: "Journal" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/billing", label: "Billing" },
    ],
  },
] as const;

export function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-bg-border bg-bg-raised px-3 py-6 md:block">
      <Link href="/dashboard" className="mb-8 block px-2 font-display text-2xl tracking-tight text-text-primary">
        stocktute
      </Link>
      <nav className="flex flex-col gap-6">
        {NAV.map((group) => (
          <div key={group.label}>
            <div className="px-3 pb-1 font-mono text-[10px] uppercase tracking-widest text-text-tertiary">
              {group.label}
            </div>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-surface-hover hover:text-text-primary"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
