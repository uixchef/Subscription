"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CreditCard, Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/payments", label: "Dashboard", icon: LayoutDashboard },
  { href: "/payments/transactions", label: "Transactions", icon: CreditCard },
  { href: "/payments/settings", label: "Settings", icon: Settings },
] as const;

function navLinkActive(pathname: string, href: string) {
  if (href === "/payments") {
    return pathname === "/payments" || pathname === "/payments/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PaymentHubSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex w-60 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground"
      aria-label="Main navigation"
    >
      <div className="flex h-14 items-center border-b border-border px-4">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          Payment Hub
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Hub sections">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = navLinkActive(pathname, href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      <Separator />
      <div className="p-3">
        <p className="px-2 text-xs text-muted-foreground">v0.1 · Internal</p>
      </div>
    </aside>
  );
}
