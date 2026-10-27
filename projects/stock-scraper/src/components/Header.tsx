"use client";

import { Download, LineChart, Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export type TabId = "markets" | "export";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "markets", label: "Markets", icon: <LineChart size={15} /> },
  { id: "export", label: "Download", icon: <Download size={15} /> },
];

interface HeaderProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const { theme, toggle } = useTheme();

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        borderColor: "var(--border)",
        background: "var(--header-bg)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ background: "var(--accent)" }}
          >
            S
          </div>
          <div>
            <h1 className="text-[0.95rem] font-semibold tracking-tight">Stock Scraper</h1>
            <p className="text-[0.65rem]" style={{ color: "var(--text-dim)" }}>
              EOD prices · downloads
            </p>
          </div>
        </div>

        <nav className="tabs order-3 w-full justify-center sm:order-none sm:w-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tab ${activeTab === t.id ? "active" : ""}`}
              onClick={() => onTabChange(t.id)}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={toggle}
          aria-label="Toggle theme"
          title={theme === "light" ? "Dark mode" : "Light mode"}
        >
          {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
        </button>
      </div>
    </header>
  );
}
