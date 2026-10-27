"use client";

import { useMemo } from "react";

/** Lightweight markdown-ish renderer for lesson content (no external deps). */
export function LessonContent({ content }: { content: string }) {
  const html = useMemo(() => renderLessonMarkdown(content), [content]);
  return (
    <div
      className="prose-lesson animate-fade-in"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineFormat(text: string): string {
  let s = escapeHtml(text);
  // code
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  // bold
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // italic
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  // links [text](url)
  s = s.replace(
    /\[([^\]]+)\]\((https?:[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer">$1</a>'
  );
  return s;
}

function renderCodeBlock(lang: string, code: string): string {
  const body = escapeHtml(code);
  const isOutput = lang === "output" || lang === "console" || lang === "stdout";

  if (isOutput) {
    return [
      '<div class="lesson-output">',
      '<div class="lesson-output-label">Output</div>',
      `<pre class="lesson-output-pre"><code>${body}</code></pre>`,
      "</div>",
    ].join("");
  }

  const langClass = lang ? ` language-${escapeHtml(lang)}` : "";
  const label =
    lang && lang !== "text"
      ? `<div class="lesson-code-label">${escapeHtml(lang)}</div>`
      : "";
  return [
    '<div class="lesson-code">',
    label,
    `<pre><code class="${langClass.trim()}">${body}</code></pre>`,
    "</div>",
  ].join("");
}

function renderLessonMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  let inCode = false;
  let codeBuf: string[] = [];
  let codeLang = "";
  let inUl = false;
  let inOl = false;
  let inTable = false;
  let tableRows: string[][] = [];
  let inBlockquote = false;

  const closeLists = () => {
    if (inUl) {
      out.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      out.push("</ol>");
      inOl = false;
    }
  };

  const flushTable = () => {
    if (!inTable || tableRows.length === 0) return;
    const [header, ...rest] = tableRows;
    // skip separator row like |---|
    const body = rest.filter((r) => !r.every((c) => /^[\s-:]+$/.test(c)));
    out.push('<div class="overflow-x-auto mb-4"><table class="w-full text-sm border-collapse">');
    out.push("<thead><tr>");
    header.forEach((c) => {
      out.push(
        `<th class="border border-border bg-background-muted px-3 py-2 text-left font-semibold">${inlineFormat(c.trim())}</th>`
      );
    });
    out.push("</tr></thead><tbody>");
    body.forEach((row) => {
      out.push("<tr>");
      row.forEach((c) => {
        out.push(
          `<td class="border border-border px-3 py-2">${inlineFormat(c.trim())}</td>`
        );
      });
      out.push("</tr>");
    });
    out.push("</tbody></table></div>");
    tableRows = [];
    inTable = false;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      closeLists();
      flushTable();
      if (inBlockquote) {
        out.push("</blockquote>");
        inBlockquote = false;
      }
      if (!inCode) {
        inCode = true;
        codeBuf = [];
        codeLang = line.trim().slice(3).trim().toLowerCase();
      } else {
        out.push(renderCodeBlock(codeLang, codeBuf.join("\n")));
        inCode = false;
        codeLang = "";
      }
      i++;
      continue;
    }

    if (inCode) {
      codeBuf.push(line);
      i++;
      continue;
    }

    // table
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      closeLists();
      if (inBlockquote) {
        out.push("</blockquote>");
        inBlockquote = false;
      }
      inTable = true;
      const cells = line
        .trim()
        .slice(1, -1)
        .split("|");
      tableRows.push(cells);
      i++;
      continue;
    } else if (inTable) {
      flushTable();
    }

    // headings
    if (line.startsWith("### ")) {
      closeLists();
      if (inBlockquote) {
        out.push("</blockquote>");
        inBlockquote = false;
      }
      out.push(`<h3>${inlineFormat(line.slice(4))}</h3>`);
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      closeLists();
      if (inBlockquote) {
        out.push("</blockquote>");
        inBlockquote = false;
      }
      out.push(`<h2>${inlineFormat(line.slice(3))}</h2>`);
      i++;
      continue;
    }

    // blockquote
    if (line.startsWith("> ")) {
      closeLists();
      if (!inBlockquote) {
        out.push("<blockquote>");
        inBlockquote = true;
      }
      out.push(`<p>${inlineFormat(line.slice(2))}</p>`);
      i++;
      continue;
    } else if (inBlockquote) {
      out.push("</blockquote>");
      inBlockquote = false;
    }

    // unordered list
    if (/^[-*] /.test(line)) {
      if (inOl) {
        out.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        out.push("<ul>");
        inUl = true;
      }
      out.push(`<li>${inlineFormat(line.slice(2))}</li>`);
      i++;
      continue;
    }

    // ordered list
    if (/^\d+\. /.test(line)) {
      if (inUl) {
        out.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        out.push("<ol>");
        inOl = true;
      }
      out.push(`<li>${inlineFormat(line.replace(/^\d+\. /, ""))}</li>`);
      i++;
      continue;
    }

    closeLists();

    if (line.trim() === "") {
      i++;
      continue;
    }

    // math-ish lines leave as paragraph (escaped)
    out.push(`<p>${inlineFormat(line)}</p>`);
    i++;
  }

  closeLists();
  flushTable();
  if (inBlockquote) out.push("</blockquote>");
  if (inCode) out.push(renderCodeBlock(codeLang, codeBuf.join("\n")));

  return out.join("\n");
}
