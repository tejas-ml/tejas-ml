import { defineModule, L } from "./types";

export const m01 = defineModule({
  id: "m01",
  slug: "foundations",
  number: 1,
  title: "Rust Foundations",
  description:
    "From zero to comfortable: mental model, printing, variables, types, functions, and control flow — with finance-flavored examples at every step.",
  level: "Beginner",
  color: "#c45c26",
  sections: [
    {
      id: "m01-s01",
      slug: "getting-started",
      title: "Getting Started",
      description: "Why Rust, how programs run, and your first outputs.",
      lessons: [
        L({
          id: "m01-l01",
          slug: "why-rust",
          title: "Why Rust for Finance?",
          duration: 18,
          summary:
            "Memory safety, speed, and reliability — why quants and trading systems pick Rust over Python/C++/Java.",
          content: `## The problem quant code faces

Quantitative systems must be **fast** (price thousands of options, process market data) and **correct** (a use-after-free in a risk engine is a career-limiting bug). Historically teams chose:

| Language | Speed | Safety | Pain points |
|----------|-------|--------|-------------|
| Python | Slow (unless NumPy) | GC, easy | Latency, GIL, production hardening |
| C++ | Very fast | Manual memory | Subtle UB, long build/debug cycles |
| Java/C# | Good | GC | GC pauses, less control over layout |
| **Rust** | **Very fast** | **Compile-time** | Steeper learning curve |

## What Rust gives you

1. **No garbage collector** — predictable latency for pricing and order handling  
2. **No data races** (in safe Rust) — shared state is checked at compile time  
3. **Zero-cost abstractions** — iterators and generics often compile to the same code as hand-written loops  
4. **A strict compiler** — many bugs never reach production  

## Mental model (three ideas)

1. **Ownership** — every value has one owner; when the owner goes away, the value is freed  
2. **Borrowing** — you can lend data temporarily without giving it away  
3. **Types as contracts** — encode “this order must have a side” or “this parse might fail” in the type system  

## Hello, quant world

Every executable starts at \`fn main()\`. \`println!\` is a **macro** (the \`!\` matters).

### Walkthrough example

\`\`\`rust
fn main() {
    let desk = "Equity Derivatives";
    println!("Desk: {}", desk);
    println!("Status: {}", "READY");
}
\`\`\`

\`\`\`output
Desk: Equity Derivatives
Status: READY
\`\`\`

The \`{}\` is a placeholder filled by later arguments — like formatted logging you’ll use for fills and risk.

### Common beginner mistakes

- Forgetting \`!\` on \`println\` → “expected function, found macro” style confusion  
- Using single quotes for strings (\`'hello'\`) — strings need \`"double quotes"\`; \`'A'\` is a single character  
- Expecting Python-style indentation to define blocks — Rust uses \`{ }\`  

### Try it

Run the starter, then personalize the output.`,
          starterCode: `fn main() {
    println!("Hello, quant world!");
    // TODO: print your name
    // TODO: print a fake P&L line like: P&L: +12450.00
}`,
          solution: `fn main() {
    println!("Hello, quant world!");
    println!("Trader: Ada Lovelace");
    println!("P&L: +12450.00");
    println!("Book: US equity options");
}`,
          challenge:
            "Print five lines: desk name, trader, strategy, notional, and market status (OPEN/CLOSED).",
          tips: [
            "println! requires the ! — it is a macro, not a function",
            "Each statement ends with a semicolon",
            "You can call println! as many times as you want",
          ],
        }),
        L({
          id: "m01-l02",
          slug: "printing-and-formatting",
          title: "Printing & Formatting",
          duration: 20,
          summary:
            "Master println!, format!, debug {:?} prints, and numeric formatting you’ll use for prices and rates.",
          content: `## Display vs Debug

- \`{}\` — human-friendly **Display** (strings, numbers)  
- \`{:?}\` — **Debug** view (great for arrays, structs later)  
- \`{:#?}\` — pretty Debug  

\`\`\`rust
fn main() {
    let px = 100.2567;
    println!("price = {}", px);
    println!("price 2dp = {:.2}", px);
    println!("scientific = {:.3e}", 0.000123);
}
\`\`\`

\`\`\`output
price = 100.2567
price 2dp = 100.26
scientific = 1.230e-4
\`\`\`

## Named and positional args

\`\`\`rust
fn main() {
    println!("{ticker} mid={mid:.4}", ticker = "AAPL", mid = 190.125);
    println!("{0} / {1} / {0}", "bid", "ask"); // positional
}
\`\`\`

\`\`\`output
AAPL mid=190.1250
bid / ask / bid
\`\`\`

## format! builds a String

\`\`\`rust
let label = format!("BUY {} @ {:.2}", 100, 150.5);
// label is owned String — useful for logs and order tags
\`\`\`

## Why this matters in finance

You’ll constantly print:

- Prices with fixed decimals  
- Quantities as integers  
- Rates as percents (\`0.05\` → \`5.0%\`)  
- Debug dumps of intermediate Greeks during development  

### Guided example: order ticket

\`\`\`rust
fn main() {
    let side = "BUY";
    let qty = 250;
    let limit = 412.375;
    println!("--- ORDER ---");
    println!("side     {}", side);
    println!("qty      {}", qty);
    println!("limit    {:.3}", limit);
    println!("notional {:.2}", qty as f64 * limit);
}
\`\`\`

\`\`\`output
--- ORDER ---
side     BUY
qty      250
limit    412.375
notional 103093.75
\`\`\`

### Exercise

Format a small mark-to-market blurb with 2 decimal places for money and 1 for percent.`,
          starterCode: `fn main() {
    let symbol = "MSFT";
    let qty = 100.0_f64;
    let entry = 400.0;
    let mark = 412.55;
    let pnl = qty * (mark - entry);

    // TODO: print a clean blotter-style summary:
    // SYMBOL  qty=... entry=... mark=... pnl=...
    // Also print pnl as percent of |entry notional|
    println!("replace me");
}`,
          solution: `fn main() {
    let symbol = "MSFT";
    let qty = 100.0_f64;
    let entry = 400.0;
    let mark = 412.55;
    let pnl = qty * (mark - entry);
    let notional = (qty * entry).abs();
    let pnl_pct = if notional == 0.0 { 0.0 } else { pnl / notional * 100.0 };

    println!(
        "{symbol}  qty={qty:.0} entry={entry:.2} mark={mark:.2} pnl={pnl:.2}"
    );
    println!("P&L vs entry notional: {pnl_pct:.1}%");
}`,
          challenge:
            "Add a third price (yesterday’s close) and print day-change in dollars and percent.",
          tips: [
            "{:.2} means 2 digits after the decimal",
            "as f64 converts integers for multiplication with floats",
            "format! is like println! but returns a String",
          ],
        }),
        L({
          id: "m01-l03",
          slug: "comments-and-cargo-mindset",
          title: "Comments, Style & Cargo Mindset",
          duration: 15,
          summary:
            "How Rust projects are organized locally, what the playground can/can’t do, and how to write readable quant code.",
          content: `## Comments

\`\`\`rust
// line comment

/// Doc comment — for public APIs (shows in rustdoc)
fn mid(bid: f64, ask: f64) -> f64 {
    (bid + ask) / 2.0 // trailing comment
}
\`\`\`

## Local vs playground

| | Playground (this site) | Local \`cargo\` |
|--|------------------------|----------------|
| Crates | almost none | crates.io |
| Binary | single snippet | project with modules |
| Tests | limited | \`cargo test\` |
| Release opts | constrained | \`--release\` for benches |

**Mental model for local projects:**

\`\`\`text
my-pricer/
  Cargo.toml      # dependencies
  src/main.rs     # binary entry
  src/lib.rs      # library root (optional)
  src/bs.rs       # module
\`\`\`

You don’t need Cargo to learn here — but knowing it exists means you won’t be surprised later when we talk about \`serde\` and \`rayon\`.

## Style that scales

- Prefer **clarity** over clever one-liners in pricing code  
- Name variables after domain terms: \`spot\`, \`strike\`, \`time_to_expiry\`, \`rate\`  
- Keep functions small; pure math functions are easy to test  

### Exercise

Rewrite noisy names into clear domain names and document a tiny helper.`,
          starterCode: `// TODO: rename a,b,c to domain terms and add a short doc comment on mid_price
fn f(a: f64, b: f64) -> f64 {
    (a + b) / 2.0
}

fn main() {
    let x = 100.0;
    let y = 100.05;
    println!("{}", f(x, y));
}`,
          solution: `/// Mid price from bid and ask quotes.
fn mid_price(bid: f64, ask: f64) -> f64 {
    (bid + ask) / 2.0
}

fn main() {
    let bid = 100.0;
    let ask = 100.05;
    println!("mid = {:.4}", mid_price(bid, ask));
}`,
          challenge:
            "Add spread(bid, ask) with a doc comment and print mid + spread for two symbols.",
          tips: [
            "/// doc comments go directly above the item",
            "Domain names beat x/y/z in finance code",
            "Playground is for learning; Cargo is for real systems",
          ],
        }),
      ],
    },
    {
      id: "m01-s02",
      slug: "variables-types",
      title: "Variables & Types",
      description: "Immutability, scalars, inference, and casting for market data.",
      lessons: [
        L({
          id: "m01-l04",
          slug: "variables-mutability",
          title: "Variables, mut & Shadowing",
          duration: 22,
          summary:
            "let, mut, shadowing, and constants — immutability by default as a risk control.",
          content: `## Immutability is the default

\`\`\`rust
let price = 100.5;
// price = 101.0; // error: cannot assign twice to immutable variable
let mut volume = 1_000;
volume = 1_200; // ok
\`\`\`

In trading systems this default is a feature: fewer accidental overwrites of \`spot\`, \`seed\`, or \`nav\`.

## Shadowing (re-bind with \`let\`)

Shadowing is **not** mutation — it creates a new variable that reuses the name:

\`\`\`rust
let n = "42";           // &str
let n: i32 = n.parse().expect("int"); // i32
let n = n + 1;
\`\`\`

Useful when transforming raw market strings into numbers.

## Constants

\`\`\`rust
const TRADING_DAYS_US: u32 = 252;
const SECONDS_PER_DAY: u64 = 86_400;
\`\`\`

Constants must have an explicit type and be computable at compile time.

### Worked example: position size

\`\`\`rust
fn main() {
    const MAX_QTY: i64 = 10_000;
    let mut qty = 1_000;
    qty += 500;
    if qty > MAX_QTY {
        qty = MAX_QTY;
    }
    println!("qty={qty} (max {MAX_QTY})");
}
\`\`\`

\`\`\`output
qty=1500 (max 10000)
\`\`\`

### Exercise

Track a mutable quantity, clamp it, compute notional.`,
          starterCode: `fn main() {
    const MAX_POSITION: f64 = 500.0;
    let price = 150.25_f64;
    let mut quantity = 100.0;

    // TODO: increase quantity by 200
    // TODO: clamp quantity so it never exceeds MAX_POSITION
    // TODO: notional = price * quantity
    // print price, quantity, notional

    println!("price={} qty={}", price, quantity);
}`,
          solution: `fn main() {
    const MAX_POSITION: f64 = 500.0;
    let price = 150.25_f64;
    let mut quantity = 100.0;

    quantity += 200.0;
    if quantity > MAX_POSITION {
        quantity = MAX_POSITION;
    }
    let notional = price * quantity;

    println!("price={:.2}", price);
    println!("quantity={:.0}", quantity);
    println!("notional={:.2}", notional);
}`,
          challenge:
            "Use shadowing to parse quantity from the string \"350\" then apply the same clamp logic.",
          tips: [
            "mut allows reassignment of the same binding",
            "shadowing can change types; mut cannot",
            "const names are SCREAMING_SNAKE by convention",
          ],
        }),
        L({
          id: "m01-l05",
          slug: "scalar-types",
          title: "Scalar Types Deep Dive",
          duration: 24,
          summary:
            "Integers, floats, bools, chars — choosing types for prices, sizes, and flags.",
          content: `## Integer families

| Type | Range idea | Quant use |
|------|------------|-----------|
| \`i32\` | default signed | days, small counts |
| \`i64\` | large signed | order ids, timestamps (ms) |
| \`u32\`/\`u64\` | unsigned | sizes that can't be negative |
| \`isize\`/\`usize\` | pointer-sized | indices, lengths |

Underscores help readability: \`1_000_000\`.

## Floats

- \`f64\` — default; use for most math (rates, vols, spots)  
- \`f32\` — half size, less precision; rarely first choice for risk  

**Important:** binary floats are not decimal money. For display/rounding you manage precision; for true decimal cash some shops use integer cents or decimal crates later.

## Bool and char

\`\`\`rust
let is_open = true;
let grade = 'A'; // Unicode scalar — single quotes
\`\`\`

## Overflow behavior

- **Debug**: overflow often panics  
- **Release**: wraps for primitives  
- Prefer \`checked_add\`, \`saturating_add\` when sizes matter  

\`\`\`rust
fn main() {
    let q: u32 = 10;
    println!("{:?}", q.checked_add(20)); // Some(30)
}
\`\`\`

\`\`\`output
Some(30)
\`\`\`

### Example: simple interest

\`\`\`rust
fn simple_interest(p: f64, r: f64, t: f64) -> f64 {
    p * r * t
}
\`\`\`

### Exercise

Compute simple interest and future value; print with clear labels.`,
          starterCode: `fn main() {
    let principal: f64 = 10_000.0;
    let rate: f64 = 0.05; // 5% annual
    let years: f64 = 3.0;

    // interest = P * r * t
    // future  = P + interest
    // TODO: compute and print all values, rate as percent
}`,
          solution: `fn main() {
    let principal: f64 = 10_000.0;
    let rate: f64 = 0.05;
    let years: f64 = 3.0;
    let interest = principal * rate * years;
    let future = principal + interest;

    println!("Principal: \${:.2}", principal);
    println!("Rate: {:.1}%", rate * 100.0);
    println!("Years: {}", years);
    println!("Interest: \${:.2}", interest);
    println!("Future value: \${:.2}", future);
}`,
          challenge:
            "Use checked_add on two u32 day counts (180 + 90) and print the Option.",
          tips: [
            "Prefer f64 for market math unless you have a fixed-point standard",
            "Cast with 'as' carefully — prefer same types in expressions",
            "u32 for quantities if negatives are invalid",
          ],
        }),
        L({
          id: "m01-l06",
          slug: "tuples-arrays-intro",
          title: "Tuples & Arrays Intro",
          duration: 20,
          summary:
            "Fixed-size groups of values: quote pairs, OHLC bars, and small matrices of numbers.",
          content: `## Tuples — heterogeneous, fixed length

\`\`\`rust
let quote: (f64, f64) = (100.0, 100.05); // bid, ask
let (bid, ask) = quote; // destructure
let mid = (quote.0 + quote.1) / 2.0;
\`\`\`

Great for returning multiple values without a full struct yet.

## Arrays — homogeneous, fixed length

\`\`\`rust
fn main() {
    let closes: [f64; 5] = [10.0, 10.5, 10.25, 10.75, 11.0];
    println!("first={} last={}", closes[0], closes[4]);
    println!("len={}", closes.len());
}
\`\`\`

\`\`\`output
first=10 last=11
len=5
\`\`\`

Arrays live on the stack (when small) and have size known at compile time.

## When to use which

| Need | Prefer |
|------|--------|
| bid+ask pair quickly | tuple or later \`struct Quote\` |
| 5 known scenario shocks | array \`[f64; 5]\` |
| Growing trade list | \`Vec\` (Module 4) |

### Example: OHLC

\`\`\`rust
fn main() {
    let bar: (f64, f64, f64, f64) = (100.0, 102.0, 99.5, 101.0);
    let (o, h, l, c) = bar;
    println!("range = {:.2}", h - l);
    println!("ret   = {:.4}", c / o - 1.0);
}
\`\`\`

\`\`\`output
range = 2.50
ret   = 0.0100
\`\`\`

### Exercise

Store 4 closes in an array; print first/last and a simple return.`,
          starterCode: `fn main() {
    let closes: [f64; 4] = [100.0, 101.5, 100.5, 103.0];
    // TODO: print each via index or debug {:?}
    // TODO: simple return last/first - 1
    // TODO: tuple (first, last) and print it
}`,
          solution: `fn main() {
    let closes: [f64; 4] = [100.0, 101.5, 100.5, 103.0];
    println!("closes = {:?}", closes);
    println!("first = {:.2}, last = {:.2}", closes[0], closes[3]);

    let simple_ret = closes[3] / closes[0] - 1.0;
    println!("period return = {:.4} ({:.2}%)", simple_ret, simple_ret * 100.0);

    let ends = (closes[0], closes[3]);
    println!("(open, close) = {:?}", ends);
}`,
          challenge:
            "Make an array of 3 (bid, ask) tuples and print the mid for each.",
          tips: [
            "Array type is [T; N] — length is part of the type",
            "Out-of-bounds index panics at runtime",
            "Destructuring makes tuple code readable",
          ],
        }),
      ],
    },
    {
      id: "m01-s03",
      slug: "functions-control",
      title: "Functions & Control Flow",
      description: "fn, if expressions, loops, and early returns.",
      lessons: [
        L({
          id: "m01-l07",
          slug: "functions",
          title: "Functions & Return Values",
          duration: 22,
          summary:
            "Write reusable pricing helpers: parameters, returns, and expression-bodied functions.",
          content: `## Anatomy

\`\`\`rust
fn mid_price(bid: f64, ask: f64) -> f64 {
    (bid + ask) / 2.0  // last expression = return value (no semicolon)
}
\`\`\`

- Parameters need types  
- Return type after \`->\`  
- \`return x;\` works for early exits; final value usually omits \`return\`  

## Early return

\`\`\`rust
fn safe_div(a: f64, b: f64) -> f64 {
    if b == 0.0 {
        return 0.0;
    }
    a / b
}
\`\`\`

## Multiple helpers

\`\`\`rust
fn notional(qty: f64, px: f64) -> f64 { qty * px }
fn fee(notional: f64, bps: f64) -> f64 { notional * bps / 10_000.0 }
\`\`\`

### Exercise

Implement compound growth and a year-by-year reporter using a function.`,
          starterCode: `fn compound(principal: f64, rate: f64, years: u32) -> f64 {
    // TODO: principal * (1+rate)^years  — hint: .powi
    principal
}

fn main() {
    let p = 10_000.0;
    let r = 0.07;
    println!("5y value = {:.2}", compound(p, r, 5));

    // Bonus TODO: loop years 1..=5 printing balance each year
}`,
          solution: `fn compound(principal: f64, rate: f64, years: u32) -> f64 {
    principal * (1.0 + rate).powi(years as i32)
}

fn main() {
    let mut balance = 10_000.0;
    let rate = 0.07;

    for year in 1..=5 {
        balance *= 1.0 + rate;
        println!("Year {year}: \${balance:.2}");
    }

    println!("formula check: \${:.2}", compound(10_000.0, 0.07, 5));
}`,
          challenge:
            "Write monthly_compound(p, annual_rate, years) using rate/12 and years*12 periods.",
          tips: [
            "No semicolon on the returned expression",
            "powi takes i32 for f64",
            "Functions take ownership of arguments unless you borrow (next modules)",
          ],
        }),
        L({
          id: "m01-l08",
          slug: "if-else-expressions",
          title: "if / else as Expressions",
          duration: 18,
          summary:
            "Branching with equal types in both arms — classify trades, regimes, and signs.",
          content: `## if is an expression

\`\`\`rust
let side = if qty > 0.0 {
    "long"
} else if qty < 0.0 {
    "short"
} else {
    "flat"
};
\`\`\`

Both (all) branches must produce the **same type**.

## Blocks yield values

\`\`\`rust
let fee_bps = if notional > 1_000_000.0 { 0.5 } else { 1.0 };
\`\`\`

## No truthy/falsey junk

Only \`bool\` works in conditions — not numbers or Options.

### Example: trading session

\`\`\`rust
fn session_label(hour_utc: u32) -> &'static str {
    if hour_utc < 13 {
        "ASIA"
    } else if hour_utc < 21 {
        "LONDON_NY_OVERLAP_OR_EU"
    } else {
        "US"
    }
}
\`\`\`

### Exercise

Classify a return into UP / DOWN / FLAT with a threshold.`,
          starterCode: `fn classify_move(ret: f64, threshold: f64) -> &'static str {
    // TODO: |ret| < threshold => FLAT, else UP/DOWN
    "FLAT"
}

fn main() {
    for r in [-0.02, -0.0001, 0.0, 0.0003, 0.015] {
        println!("ret={r:+.4} -> {}", classify_move(r, 0.001));
    }
}`,
          solution: `fn classify_move(ret: f64, threshold: f64) -> &'static str {
    if ret.abs() < threshold {
        "FLAT"
    } else if ret > 0.0 {
        "UP"
    } else {
        "DOWN"
    }
}

fn main() {
    for r in [-0.02, -0.0001, 0.0, 0.0003, 0.015] {
        println!("ret={r:+.4} -> {}", classify_move(r, 0.001));
    }
}`,
          challenge:
            "Return a tuple (label, severity) where severity is LOW/HIGH if |ret| > 2*threshold.",
          tips: [
            "Branches must match types",
            "Use .abs() for magnitude checks",
            "&'static str is a string literal type — fine for labels",
          ],
        }),
        L({
          id: "m01-l09",
          slug: "loops",
          title: "loop, while, and for",
          duration: 24,
          summary:
            "Iterate scenarios, days, and Monte Carlo seeds — break, continue, and ranges.",
          content: `## Three loop styles

\`\`\`rust
fn main() {
    // infinite until break
    loop {
        break;
    }

    // condition
    let mut i = 0;
    let n = 3;
    while i < n {
        i += 1;
    }

    // iterator / range (most common)
    for day in 1..=5 {
        println!("day {day}");
    }
}
\`\`\`

\`\`\`output
day 1
day 2
day 3
day 4
day 5
\`\`\`

## Ranges

- \`0..n\` — exclusive end (0..3 → 0,1,2)  
- \`1..=n\` — inclusive end  
- \`.rev()\` — reverse  

## break with value

\`\`\`rust
let found = loop {
    // ...
    break 42;
};
\`\`\`

### Example: cumulative product of returns

\`\`\`rust
fn wealth_path(start: f64, rets: &[f64]) -> f64 {
    let mut w = start;
    for r in rets {
        w *= 1.0 + *r;
    }
    w
}
\`\`\`

(You’ll meet slices properly in Module 2 — here think “list of returns”.)

### Exercise

Simulate 10 days of +0.1% drift and print the path.`,
          starterCode: `fn main() {
    let mut price = 100.0;
    let daily = 0.001; // +0.1%

    // TODO: for day in 1..=10 update price and print day, price
}`,
          solution: `fn main() {
    let mut price = 100.0;
    let daily = 0.001;

    println!("day 0: {:.4}", price);
    for day in 1..=10 {
        price *= 1.0 + daily;
        println!("day {day}: {price:.4}");
    }
}`,
          challenge:
            "Nested loop: for each of 3 scenarios (rates -0.001, 0, 0.001), print a 5-day path.",
          tips: [
            "for x in xs iterates by move/copy depending on type",
            "use .iter() later when you need references",
            "Prefer for over while when you know the count",
          ],
        }),
        L({
          id: "m01-l10",
          slug: "module1-practice",
          title: "Module 1 Practice Lab",
          duration: 25,
          summary:
            "Capstone mini-lab: mini blotter combining variables, functions, formatting, and loops.",
          content: `## Lab goals

Wire together everything from Module 1 into a tiny **blotter printer**:

1. Store several trades as tuples \`(name, qty, price)\` in an array  
2. Function \`trade_notional(qty, px)\`  
3. Loop to print each line and a total  

This is deliberately simple — no structs/Vec yet — so you feel fluent with basics before ownership.

### Design sketch

\`\`\`text
trades: [("AAPL", 10, 190.0), ("MSFT", -5, 420.0), ...]
for each trade:
  print side from sign of qty
  print notional
sum absolute notionals or net cash
\`\`\`

### Stretch ideas (after you finish)

- Flag any |qty| above a limit  
- Print running net notional after each line  

Take your time — re-run often.`,
          starterCode: `fn notional(qty: f64, px: f64) -> f64 {
    qty * px
}

fn side(qty: f64) -> &'static str {
    if qty >= 0.0 { "BUY" } else { "SELL" }
}

fn main() {
    // (symbol, qty, price)
    let trades = [
        ("AAPL", 10.0, 190.0),
        ("MSFT", -5.0, 420.0),
        ("GOOG", 8.0, 175.5),
    ];

    let mut gross = 0.0_f64;

    // TODO: loop trades, print SIDE SYMBOL qty @ px  notional=...
    // TODO: accumulate gross += notional(...).abs()
    // TODO: print total gross notional

    println!("trades stored: {}", trades.len());
    let _ = (notional, side, gross); // keep compiler calm until you implement
}`,
          solution: `fn notional(qty: f64, px: f64) -> f64 {
    qty * px
}

fn side(qty: f64) -> &'static str {
    if qty >= 0.0 {
        "BUY"
    } else {
        "SELL"
    }
}

fn main() {
    let trades = [
        ("AAPL", 10.0, 190.0),
        ("MSFT", -5.0, 420.0),
        ("GOOG", 8.0, 175.5),
    ];

    let mut gross = 0.0_f64;

    println!("{:<5} {:<5} {:>8} {:>10} {:>12}", "SIDE", "SYM", "QTY", "PX", "NOTIONAL");
    for (sym, qty, px) in trades {
        let n = notional(qty, px);
        gross += n.abs();
        println!(
            "{:<5} {:<5} {:>8.0} {:>10.2} {:>12.2}",
            side(qty),
            sym,
            qty,
            px,
            n
        );
    }
    println!("Gross |notional| = {:.2}", gross);
}`,
          challenge:
            "Also compute net cash (sum of signed notionals) and print long vs short counts.",
          tips: [
            "Array of tuples is fine for tiny labs",
            "abs() on f64 for gross exposure style metrics",
            "Next module: ownership will explain why String vs &str matters for symbols",
          ],
        }),
      ],
    },
  ],
});
