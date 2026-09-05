import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Document Screening | SSB",
  description: "AI-based identity and document screening for border checkpoints.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
