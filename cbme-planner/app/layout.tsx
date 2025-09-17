import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CBME Planner",
  description: "NMC GMER-aligned CBME curriculum planner",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div className="mx-auto max-w-7xl px-4 py-6">
          {children}
        </div>
      </body>
    </html>
  );
}

