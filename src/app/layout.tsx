import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SportseeProvider } from "@/hooks/useSportseeData";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SportSee",
  description: "Dashboard SportSee",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <SportseeProvider>{children}</SportseeProvider>
      </body>
    </html>
  );
}