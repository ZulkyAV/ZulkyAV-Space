import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";

export const metadata: Metadata = { title: "ZulkyAV Space", description: "Unfinished ideas, strange experiments, and small ventures slowly taking shape." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="dark" data-scroll-behavior="smooth"><body><Header /><main>{children}</main><Footer /></body></html>;
}
