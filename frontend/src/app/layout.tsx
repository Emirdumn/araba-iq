import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArabaIQ",
  description: "Car recommendations and comparison platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen flex flex-col bg-[#f4f5f7] text-[#0d1117] antialiased">
        {children}
      </body>
    </html>
  );
}
