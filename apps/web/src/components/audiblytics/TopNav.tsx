'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string };

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/settings", label: "Settings" },
];

export function TopNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Main navigation"
      className="flex justify-end px-5 py-6 md:px-8 lg:px-14"
    >
      <div className="flex min-w-0 flex-wrap justify-end gap-x-8 gap-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "text-ui-sm text-foreground hover:text-forest",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
                isActive && "border-b-2 border-primary pb-px font-medium",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
