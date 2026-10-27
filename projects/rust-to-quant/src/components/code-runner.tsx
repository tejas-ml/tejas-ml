"use client";

import dynamic from "next/dynamic";
import { Check, Copy, Loader2, Play, RotateCcw, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useState } from "react";
import { clsx } from "@/lib/utils";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-foreground-muted">
      Loading editor…
    </div>
  ),
});

type RunResult = {
  success: boolean;
  stdout: string;
  stderr: string;
  error?: string;
};

type Props = {
  initialCode: string;
  solution?: string;
  title?: string;
  height?: number;
};

export function CodeRunner({ initialCode, solution, title = "Interactive Rust", height = 320 }: Props) {
  const { resolvedTheme } = useTheme();
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState("");
  const [isError, setIsError] = useState(false);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const run = useCallback(async () => {
    setRunning(true);
    setOutput("Compiling & running…");
    setIsError(false);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as RunResult;
      if (!res.ok) {
        setIsError(true);
        setOutput(data.error || data.stderr || "Request failed");
      } else {
        const text = [data.stdout, data.stderr].filter(Boolean).join("\n").trim();
        setIsError(!data.success);
        setOutput(text || (data.success ? "(no output)" : "Compilation failed"));
      }
    } catch (e) {
      setIsError(true);
      setOutput(e instanceof Error ? e.message : "Network error");
    } finally {
      setRunning(false);
    }
  }, [code]);

  const reset = () => {
    setCode(initialCode);
    setOutput("");
    setIsError(false);
    setShowSolution(false);
  };

  const loadSolution = () => {
    if (!solution) return;
    setCode(solution);
    setShowSolution(true);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const editorTheme = resolvedTheme === "dark" ? "vs-dark" : "light";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background-elevated shadow-[var(--shadow)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-background-muted/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            {title}
          </span>
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent">
            Rust 2021
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-foreground-muted hover:bg-background-muted hover:text-foreground"
            title="Copy"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            Copy
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-foreground-muted hover:bg-background-muted hover:text-foreground"
            title="Reset"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          {solution && (
            <button
              type="button"
              onClick={loadSolution}
              className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-foreground-muted hover:bg-background-muted hover:text-foreground"
              title="Show solution"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {showSolution ? "Solution loaded" : "Solution"}
            </button>
          )}
          <button
            type="button"
            onClick={run}
            disabled={running}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-accent-hover disabled:opacity-60"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Run
          </button>
        </div>
      </div>

      <div className="border-b border-border bg-editor-bg" style={{ height }}>
        <Editor
          height="100%"
          defaultLanguage="rust"
          language="rust"
          theme={editorTheme}
          value={code}
          onChange={(v) => setCode(v ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            padding: { top: 12, bottom: 12 },
            wordWrap: "on",
            renderLineHighlight: "line",
            scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
          }}
          loading={
            <div className="flex h-full items-center justify-center text-sm text-foreground-muted">
              Loading editor…
            </div>
          }
        />
      </div>

      <div
        className={clsx(
          "min-h-[88px] max-h-56 overflow-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed",
          isError ? "bg-error-soft text-error" : "bg-code-bg text-foreground"
        )}
      >
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
          Output
        </div>
        <pre className="whitespace-pre-wrap break-words">{output || "Press Run to compile and execute."}</pre>
      </div>
    </div>
  );
}
