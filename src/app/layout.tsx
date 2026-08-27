import type { Metadata, Viewport } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PwaRegistration } from "@/components/pwa-registration";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZulkyAV Space",
  description: "Unfinished ideas, strange experiments, and small ventures slowly taking shape.",
  applicationName: "ZulkyAV Space",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "ZulkyAV Space",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0B0F",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="dark" data-scroll-behavior="smooth"><body><PwaRegistration /><Header /><main>{children}</main><Footer /></body></html>;
}
