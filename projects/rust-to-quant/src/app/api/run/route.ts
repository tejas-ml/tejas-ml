import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

type PlaygroundResponse = {
  success: boolean;
  stdout: string;
  stderr: string;
  error?: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = typeof body.code === "string" ? body.code : "";

    if (!code.trim()) {
      return NextResponse.json({ success: false, stdout: "", stderr: "No code provided." }, { status: 400 });
    }

    if (code.length > 100_000) {
      return NextResponse.json(
        { success: false, stdout: "", stderr: "Code too large (max 100KB)." },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    try {
      const res = await fetch("https://play.rust-lang.org/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: "stable",
          mode: "debug",
          edition: "2021",
          crateType: "bin",
          tests: false,
          code,
          backtrace: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json(
          {
            success: false,
            stdout: "",
            stderr: `Playground error (${res.status}): ${text.slice(0, 500)}`,
          },
          { status: 502 }
        );
      }

      const data = (await res.json()) as PlaygroundResponse;

      return NextResponse.json({
        success: Boolean(data.success),
        stdout: data.stdout ?? "",
        stderr: data.stderr ?? "",
        error: data.error ?? undefined,
      });
    } catch (e) {
      clearTimeout(timeout);
      if (e instanceof Error && e.name === "AbortError") {
        return NextResponse.json(
          { success: false, stdout: "", stderr: "Compilation timed out. Try simpler code." },
          { status: 504 }
        );
      }
      throw e;
    }
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        stdout: "",
        stderr: e instanceof Error ? e.message : "Unexpected server error",
      },
      { status: 500 }
    );
  }
}
