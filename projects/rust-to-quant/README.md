# Rust→Quant

**Live site:** [https://rust-course-lovat.vercel.app](https://rust-course-lovat.vercel.app)

Interactive **Rust course from beginner to professional quantitative finance**.

- Warm **off-white light mode** + soft **dark mode**
- **12 modules**, 30+ lessons with exercises
- **In-browser Rust runner** (Monaco + Rust Playground API)
- Progress saved in `localStorage`
- Built with **Next.js** (App Router) + Tailwind CSS

## Path

1. Rust foundations & control flow  
2. Ownership, borrowing, slices  
3. Structs, enums, Option/Result  
4. Collections & std / iterators  
5. Errors, traits, generics, lifetimes  
6. Concurrency & performance  
7. Ecosystem (Cargo, crates, testing mindset)  
8. Quant math (returns, vol, corr, RNG)  
9. Derivatives (BS, Greeks, binomial)  
10. Monte Carlo  
11. Portfolio & risk (PnL, VaR, mean-variance)  
12. Order book + pricing-engine capstone  

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Push to GitHub and import the repo in [Vercel](https://vercel.com).  
The `/api/run` route proxies to `https://play.rust-lang.org/execute` (stable, edition 2021, std only).

## Notes

- Online runner supports **stdlib only** — no crates.io packages. Lessons teach library *patterns*; use a local Cargo project for `serde`, `rayon`, `ndarray`, `polars`, etc.
- Code execution depends on the public Rust Playground service availability and rate limits.
