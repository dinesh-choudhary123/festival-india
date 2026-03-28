import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Festival India — Social Media Calendar",
  description:
    "Complete Indian festivals & events calendar with 240+ days across all categories. Plan your social media content around festivals, observances, and special days.",
  keywords: [
    "Indian festivals",
    "social media calendar",
    "festival calendar India",
    "Indian holidays",
    "content calendar",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
