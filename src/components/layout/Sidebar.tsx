import Link from "next/link";
import { auth } from "@/auth";
import { t } from "@/lib/i18n";

const NAV = [
  {
    label: "Learn",
    items: [
      { href: "/dashboard", labelKey: "nav.dashboard" as const },
      { href: "/skill-tree", labelKey: "nav.skillTree" as const },
      { href: "/lessons", labelKey: "nav.lessons" as const },
      { href: "/classroom", labelKey: "nav.classroom" as const },
      { href: "/drills", labelKey: "nav.drills" as const },
    ],
  },
  {
    label: "Practice",
    items: [
      { href: "/risk", labelKey: "nav.risk" as const },
      { href: "/formulas", labelKey: "nav.formulas" as const },
      { href: "/journal", labelKey: "nav.journal" as const },
    ],
  },
] as const;

export async function Sidebar() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

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
                  {t("en", item.labelKey)}
                </Link>
              ))}
            </div>
          </div>
        ))}
        {isAdmin ? (
          <div>
            <div className="px-3 pb-1 font-mono text-[10px] uppercase tracking-widest text-text-tertiary">
              Account
            </div>
            <Link
              href="/admin"
              className="rounded-md px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-surface-hover hover:text-text-primary"
            >
              {t("en", "nav.admin")}
            </Link>
          </div>
        ) : null}
      </nav>
    </aside>
  );
}
