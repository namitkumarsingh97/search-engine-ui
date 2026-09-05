import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexa",
  description: "A small search engine built from scratch",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
