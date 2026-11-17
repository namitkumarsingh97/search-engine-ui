"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/crawler", label: "Crawler" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/apps", label: "Products" },
  { href: "/admin/news", label: "News" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 inline-flex border-2 border-line bg-surface">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`kicker px-4 py-2.5 transition-colors ${active ? "bg-ink text-canvas" : "hover:bg-mustard"}`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
