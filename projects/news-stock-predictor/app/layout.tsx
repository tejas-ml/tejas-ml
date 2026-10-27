import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "News Stock Predictor",
  description:
    "Scrapes recent news headlines about a company and predicts stock direction from sentiment.",
};

// Apply the saved theme before first paint to avoid a flash of the wrong mode.
const themeScript = `(function(){try{var t=localStorage.getItem('nsp-theme');document.documentElement.setAttribute('data-theme', t==='fancy'?'fancy':'basic');}catch(e){document.documentElement.setAttribute('data-theme','basic');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="basic">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
