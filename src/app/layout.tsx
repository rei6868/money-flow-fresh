// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MainLayout from "@/components/Layout/MainLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Money Flow",
  description: "Financial Management Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
