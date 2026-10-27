import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Aegis — Automated Claims Fraud & Waste Detector",
    template: "%s · Aegis",
  },
  description:
    "An XGBoost pipeline that scores CMS-style healthcare claims for upcoding, unbundling, and duplicate billing. Built for SIU teams at UnitedHealth, Anthem, Optum, and Zocdoc.",
  metadataBase: new URL("https://health-fraud.vercel.app"),
  openGraph: {
    title: "Aegis — Automated Claims Fraud & Waste Detector",
    description:
      "Flag the claim before it pays. XGBoost on 500k+ synthetic CMS claims.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden bg-paper text-ink">
        <Nav />
        <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
