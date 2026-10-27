"use client";

import { CodeRunner } from "@/components/code-runner";

export function PlaygroundClient({ initialCode }: { initialCode: string }) {
  return <CodeRunner initialCode={initialCode} title="Free playground" height={480} />;
}
