import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lead Importer · GrowEasy",
  description: "AI-powered CSV importer that maps any lead export into GrowEasy CRM format.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
