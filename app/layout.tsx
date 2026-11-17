import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexa",
  description: "Search the web and everything of yours: files, videos, mail and calendar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
