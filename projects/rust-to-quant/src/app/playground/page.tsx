import { PlaygroundClient } from "./playground-client";

export const metadata = {
  title: "Playground",
  description: "Interactive Rust playground — write and run Rust in your browser.",
};

const DEFAULT = `// Rust→Quant Playground
// Tip: pure Rust (std only). External crates need a local Cargo project.

fn main() {
    let spots = [100.0_f64, 102.5, 99.0, 105.0];
    let mean = spots.iter().sum::<f64>() / spots.len() as f64;
    println!("spots: {:?}", spots);
    println!("mean:  {:.4}", mean);

    // Black-Scholes d1 sketch
    let (s, k, r, sigma, t) = (100.0, 100.0, 0.05, 0.2, 1.0);
    let d1 = ((s / k).ln() + (r + 0.5 * sigma * sigma) * t) / (sigma * t.sqrt());
    println!("d1 = {:.6}", d1);
}
`;

export default function PlaygroundPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Playground</h1>
        <p className="mt-2 text-foreground-muted">
          Free-form Rust sandbox powered by the official Rust Playground compiler. Great for
          experimenting between lessons. Uses the stable channel and the 2021 edition —{" "}
          <strong className="font-medium text-foreground">std only</strong> (no crates.io deps here).
        </p>
      </div>
      <PlaygroundClient initialCode={DEFAULT} />
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          {
            t: "Shortcuts",
            b: "Edit freely, hit Run, read compiler errors — they teach ownership better than any blog.",
          },
          {
            t: "Limits",
            b: "Timeouts and no network. Heavy Monte Carlo may be slow; reduce path counts online.",
          },
          {
            t: "Local pro setup",
            b: "Install rustup, then add serde, rayon, ndarray, polars for real quant workloads.",
          },
        ].map((x) => (
          <div key={x.t} className="rounded-xl border border-border bg-background-elevated p-4 text-sm">
            <p className="font-semibold">{x.t}</p>
            <p className="mt-1 text-foreground-muted">{x.b}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
