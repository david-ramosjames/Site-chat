import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChatToConvert — Turn website visitors into booked jobs",
  description:
    "A lightweight chat widget for home services businesses. One script, guided intake, more booked jobs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased font-sans">{children}</body>
    </html>
  );
}
