import {
  BarChart3,
  Briefcase,
  Calculator,
  ClipboardList,
  FileText,
  Globe,
  LayoutGrid,
  Map as MapIcon,
  Package,
  Rocket,
  ShoppingCart,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import { API_URL } from "./drive";

/** One of the owner's own projects, shown as a built-in Nexa feature. */
export interface PublicApp {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  icon: string;
  tone: AppTone;
  openInNewTab: boolean;
}

/** What the admin editor works with (includes hidden apps). */
export interface AdminApp extends PublicApp {
  keywords: string[];
  visible: boolean;
  order: number;
}

export type AppTone = "mustard" | "orange" | "charcoal" | "paper";

export const APP_ICONS = {
  briefcase: Briefcase,
  "layout-grid": LayoutGrid,
  users: Users,
  "bar-chart": BarChart3,
  map: MapIcon,
  truck: Truck,
  clipboard: ClipboardList,
  package: Package,
  globe: Globe,
  rocket: Rocket,
  wrench: Wrench,
  calculator: Calculator,
  "file-text": FileText,
  cart: ShoppingCart,
} as const;

export const ICON_NAMES = Object.keys(APP_ICONS);

export function iconFor(name: string) {
  return APP_ICONS[name as keyof typeof APP_ICONS] ?? LayoutGrid;
}

/** Flat color blocks, matching the Bauhaus palette. */
export const TONE_CLASSES: Record<AppTone, string> = {
  mustard: "bg-mustard text-ink",
  orange: "bg-accent text-white",
  charcoal: "bg-ink text-canvas",
  paper: "bg-surface text-ink",
};

/** Works on the server and in the browser. Resolves to [] if the API is unreachable. */
export async function fetchApps(): Promise<PublicApp[]> {
  try {
    const res = await fetch(`${API_URL}/apps`, { cache: "no-store" });
    return res.ok ? ((await res.json()) as PublicApp[]) : [];
  } catch {
    return [];
  }
}

/** Props for the <a> that takes the user to the app. */
export function appLinkProps(app: Pick<PublicApp, "url" | "openInNewTab">) {
  return {
    href: app.url,
    ...(app.openInNewTab ? { target: "_blank" } : {}),
    rel: "noopener noreferrer",
  };
}
