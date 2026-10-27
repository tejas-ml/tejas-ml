import { defineModule, L } from "./types";

export const m02 = defineModule({
  id: "m02",
  slug: "ownership",
  number: 2,
  title: "Ownership & Borrowing",
  description:
    "The heart of Rust: moves, Clone/Copy, references, the borrow checker, and slices for market data windows.",
  level: "Beginner",
  color: "#3a6b8a",
  sections: [
    {
      id: "m02-s01",
      slug: "ownership-core",
      title: "Ownership Core",
      description: "Stack, heap, moves, and Copy types.",
      lessons: [
        L({
          id: "m02-l01",
          slug: "stack-heap-string",
          title: "Stack, Heap & String",
          duration: 22,
          summary: "Where data lives, why String is different from string literals, and what Drop means.",
          content: `## Two homes for data

- **Stack** — fixed size, fast push/pop (integers, floats, small arrays)
- **Heap** — growable, allocated at runtime (\`String\`, \`Vec\`)

\`\`\`rust
let n: i32 = 5;                    // stack
let s = String::from("AAPL");      // heap buffer + stack metadata
\`\`\`

## \`&str\` vs \`String\`

| Type | Owns data? | Growable? | Typical source |
|------|------------|-----------|----------------|
| \`&str\` | No (borrow) | No | \`"literal"\`, slices |
| \`String\` | Yes | Yes | \`String::from\`, \`.to_string()\` |

## Ownership rules (memorize)

1. Each value has **one owner**  
2. Only **one** owner at a time  
3. When owner leaves scope, value is **dropped** (memory freed)

### Finance intuition

Think of a \`String\` ticker as a physical ticket. You can **hand it** to a function (move) or **show it** (borrow). You cannot hand the same physical ticket to two people at once.

### Exercise

Create owned tickers and print lengths.`,
          starterCode: `fn main() {
    let a = String::from("AAPL");
    let b = "MSFT".to_string();
    // TODO: print both and their .len() (bytes)
    // TODO: push_str "_US" onto a mutable clone of a
    println!("{a} {b}");
}`,
          solution: `fn main() {
    let a = String::from("AAPL");
    let b = "MSFT".to_string();
    println!("{a} len={}", a.len());
    println!("{b} len={}", b.len());

    let mut tagged = a.clone();
    tagged.push_str("_US");
    println!("tagged={tagged}");
    println!("original a still={a}");
}`,
          challenge: "Build a String label with format! for BUY 100 AAPL and print it.",
          tips: [
            "String::from and .to_string() both allocate",
            "len() is bytes, not grapheme clusters",
            "clone() is explicit — good for learning cost",
          ],
        }),
        L({
          id: "m02-l02",
          slug: "moves",
          title: "Move Semantics",
          duration: 24,
          summary: "Assignment and function calls move non-Copy values; fix errors with clone or redesign.",
          content: `## Moves invalidate the old name

\`\`\`rust
fn main() {
    let s1 = String::from("AAPL");
    let s2 = s1; // s1 moved into s2
    // println!("{s1}"); // error: borrow of moved value
    println!("s2={s2}");
}
\`\`\`

\`\`\`output
s2=AAPL
\`\`\`

## Copy types skip moves

\`i32\`, \`f64\`, \`bool\`, \`char\`, and tuples/arrays of Copy types implement \`Copy\`:

\`\`\`rust
let x = 5;
let y = x; // both valid
\`\`\`

## Functions take ownership

\`\`\`rust
fn eat(s: String) {
    println!("{s}");
}

fn main() {
    let t = String::from("X");
    eat(t);
    // t is gone — cannot use t here
}
\`\`\`

\`\`\`output
X
\`\`\`

### How quants usually fix this

1. **Borrow** (\`&str\` / \`&String\`) if you only read  
2. **Clone** if you truly need two owners (costs allocation)  
3. **Return ownership** back if the function should give it back  

\`\`\`rust
fn tag(mut s: String) -> String {
    s.push_str("-G1");
    s
}
\`\`\`

### Exercise

Observe a move, then fix with clone and with returning ownership.`,
          starterCode: `fn make_label(ticker: String, side: &str) -> String {
    format!("{side} order for {ticker}")
}

fn main() {
    let symbol = String::from("MSFT");
    let label = make_label(symbol, "BUY");
    println!("{label}");
    // println!("{symbol}"); // try uncommenting — then fix properly
}`,
          solution: `fn make_label(ticker: String, side: &str) -> String {
    format!("{side} order for {ticker}")
}

fn make_label_borrow(ticker: &str, side: &str) -> String {
    format!("{side} order for {ticker}")
}

fn main() {
    let symbol = String::from("MSFT");
    let label = make_label(symbol.clone(), "BUY");
    println!("{label}");
    println!("still own: {symbol}");
    println!("{}", make_label_borrow(&symbol, "SELL"));
}`,
          challenge: "Rewrite make_label to take &str only (best style for this case).",
          tips: [
            "Compiler move errors are normal — read them carefully",
            "Prefer &str parameters for read-only text",
            "Clone is fine while learning; optimize later",
          ],
        }),
        L({
          id: "m02-l03",
          slug: "copy-clone-drop",
          title: "Copy, Clone & Drop",
          duration: 18,
          summary: "When values duplicate cheaply, when clone is explicit, and when drop runs.",
          content: `## Copy vs Clone

- **Copy**: implicit bitwise copy (cheap, stack-ish types)
- **Clone**: explicit \`.clone()\` — may allocate

\`\`\`rust
#[derive(Copy, Clone, Debug)]
struct TickSize {
    cents: i32,
}
\`\`\`

You can only derive \`Copy\` if all fields are Copy — so a struct with \`String\` cannot be Copy.

## Drop

When a value goes out of scope, Rust runs its destructor. For \`String\`, that frees the heap buffer. You rarely implement \`Drop\` yourself at first — but knowing it runs at \`}\` explains why dangling pointers can’t exist in safe Rust.

### Example

\`\`\`rust
fn main() {
    {
        let s = String::from("temp");
        println!("{s}");
    } // s dropped here
    println!("after scope");
}
\`\`\`

\`\`\`output
temp
after scope
\`\`\`

### Exercise

Define a Copy quote-tick struct and pass it around freely.`,
          starterCode: `#[derive(Copy, Clone, Debug)]
struct Px {
    cents: i64,
}

fn bump(p: Px, by: i64) -> Px {
    Px { cents: p.cents + by }
}

fn main() {
    let p = Px { cents: 100_00 };
    let q = bump(p, 5); // p still usable because Copy
    println!("p={p:?} q={q:?}");
    // TODO: print dollars as f64 for both
}`,
          solution: `#[derive(Copy, Clone, Debug)]
struct Px {
    cents: i64,
}

fn bump(p: Px, by: i64) -> Px {
    Px { cents: p.cents + by }
}

fn dollars(p: Px) -> f64 {
    p.cents as f64 / 100.0
}

fn main() {
    let p = Px { cents: 100_00 };
    let q = bump(p, 5);
    println!("p={p:?} (\${:.2})", dollars(p));
    println!("q={q:?} (\${:.2})", dollars(q));
}`,
          challenge: "Add a NonCopyOrder { ticker: String, qty: i64 } and show it does NOT implement Copy.",
          tips: [
            "Integer tick prices often use i64 cents — Copy friendly",
            "String fields block Copy",
            "Drop is automatic — no free() calls",
          ],
        }),
      ],
    },
    {
      id: "m02-s02",
      slug: "borrowing",
      title: "Borrowing & References",
      description: "Shared and mutable references, and the exclusive-mut rule.",
      lessons: [
        L({
          id: "m02-l04",
          slug: "immutable-borrows",
          title: "Immutable Borrows (&T)",
          duration: 20,
          summary: "Read data without taking ownership — the default for helpers and metrics.",
          content: `## Borrow with \`&\`

\`\`\`rust
fn mid(bid: &f64, ask: &f64) -> f64 {
    (*bid + *ask) / 2.0
}
// or simply take f64 by Copy for numbers — but the idea matters for String/struct
\`\`\`

For non-Copy types:

\`\`\`rust
fn print_ticker(t: &String) {
    println!("{t}");
}
// better API: fn print_ticker(t: &str)

fn main() {
    let ticker = String::from("AAPL");
    print_ticker(&ticker);
    println!("still own: {ticker}");
}
\`\`\`

\`\`\`output
AAPL
still own: AAPL
\`\`\`

## Many readers OK

\`\`\`rust
fn main() {
    let s = String::from("IBM");
    let r1 = &s;
    let r2 = &s;
    println!("{r1} {r2}");
}
\`\`\`

\`\`\`output
IBM IBM
\`\`\`

### Exercise

Compute mid and spread from a borrowed quote struct.`,
          starterCode: `struct Quote {
    bid: f64,
    ask: f64,
}

fn mid(q: &Quote) -> f64 {
    0.0 // TODO
}

fn spread(q: &Quote) -> f64 {
    0.0 // TODO
}

fn main() {
    let q = Quote { bid: 100.0, ask: 100.05 };
    println!("mid={:.4} spread={:.4}", mid(&q), spread(&q));
    println!("still have bid={}", q.bid);
}`,
          solution: `struct Quote {
    bid: f64,
    ask: f64,
}

fn mid(q: &Quote) -> f64 {
    (q.bid + q.ask) / 2.0
}

fn spread(q: &Quote) -> f64 {
    q.ask - q.bid
}

fn main() {
    let q = Quote { bid: 100.0, ask: 100.05 };
    println!("mid={:.4} spread={:.4}", mid(&q), spread(&q));
    println!("still have bid={}", q.bid);
}`,
          challenge: "Add fn is_locked(q: &Quote, max_spread: f64) -> bool.",
          tips: [
            "Field access through &Quote does not need explicit *",
            "Prefer &str over &String in APIs",
            "Borrowing keeps the owner valid",
          ],
        }),
        L({
          id: "m02-l05",
          slug: "mutable-borrows",
          title: "Mutable Borrows (&mut T)",
          duration: 22,
          summary: "Exclusive write access — update positions and books safely.",
          content: `## One writer, no readers

\`\`\`rust
let mut x = 10;
let r = &mut x;
*r += 1;
// let r2 = &x; // not while r is live
\`\`\`

## Methods that mutate

\`\`\`rust
fn improve_bid(q: &mut Quote, by: f64) {
    q.bid += by;
}
\`\`\`

### Why exclusive mut?

Prevents iterator invalidation and data races at compile time — critical when many components touch a book.

### Exercise

Mutate a position quantity and average price after a fill.`,
          starterCode: `struct Position {
    qty: f64,
    avg: f64,
}

fn apply_buy(p: &mut Position, fill_qty: f64, fill_px: f64) {
    // TODO: weighted average update for a buy that increases long qty
    // new_avg = (qty*avg + fill_qty*fill_px) / (qty+fill_qty) when qty+fill>0
}

fn main() {
    let mut p = Position { qty: 100.0, avg: 50.0 };
    apply_buy(&mut p, 50.0, 56.0);
    println!("qty={} avg={:.4}", p.qty, p.avg);
}`,
          solution: `struct Position {
    qty: f64,
    avg: f64,
}

fn apply_buy(p: &mut Position, fill_qty: f64, fill_px: f64) {
    let new_qty = p.qty + fill_qty;
    if new_qty.abs() < 1e-12 {
        p.qty = 0.0;
        p.avg = 0.0;
        return;
    }
    p.avg = (p.qty * p.avg + fill_qty * fill_px) / new_qty;
    p.qty = new_qty;
}

fn main() {
    let mut p = Position { qty: 100.0, avg: 50.0 };
    apply_buy(&mut p, 50.0, 56.0);
    println!("qty={} avg={:.4}", p.qty, p.avg); // 150 @ 52.0
}`,
          challenge: "Implement apply_sell for reducing a long (ignore short-open for now).",
          tips: [
            "Only one &mut at a time",
            "NLL (non-lexical lifetimes) end borrows when last used",
            "Weighted average is a classic mut borrow exercise",
          ],
        }),
        L({
          id: "m02-l06",
          slug: "borrow-checker-errors",
          title: "Reading Borrow Checker Errors",
          duration: 18,
          summary: "Hand-holding through the most common compile errors and how to fix them.",
          content: `## Error patterns you’ll see

### 1) Use after move
**Fix:** borrow, clone, or restructure.

### 2) Cannot borrow as mutable because also borrowed as immutable
**Fix:** finish read borrows before mut borrow; shrink scopes.

\`\`\`rust
fn main() {
    let mut v = vec![1, 2, 3];
    let first = v[0]; // copy out i32
    v.push(4); // ok — no live ref
    println!("first={first} v={v:?}");
}
\`\`\`

\`\`\`output
first=1 v=[1, 2, 3, 4]
\`\`\`

### 3) Returns reference to local
**Fix:** return owned data (\`String\`, \`Vec\`) instead of \`&str\` to locals.

## Practical strategy

1. Prefer **owned** fields in structs for long-lived data  
2. Prefer **short** borrows in function signatures  
3. Don’t fight the checker with \`unsafe\` while learning  

### Exercise

Fix the broken function in the starter (commented mistakes).`,
          starterCode: `fn best_label(prefer_long: bool) -> String {
    let long = String::from("LONG");
    let short = String::from("SHORT");
    // Broken idea: return &long or &short (locals)
    // TODO: return an owned String instead
    if prefer_long {
        long
    } else {
        short
    }
}

fn main() {
    println!("{}", best_label(true));
    println!("{}", best_label(false));
}`,
          solution: `fn best_label(prefer_long: bool) -> String {
    if prefer_long {
        String::from("LONG")
    } else {
        String::from("SHORT")
    }
}

fn main() {
    println!("{}", best_label(true));
    println!("{}", best_label(false));
}`,
          challenge:
            "Write fn longest<'a>(a: &'a str, b: &'a str) -> &'a str that returns the longer borrowed str.",
          tips: [
            "If data is created inside the function, return String not &str",
            "Split code into smaller scopes when mut/immut conflict",
            "The checker is teaching aliasing rules used by CPUs and compilers",
          ],
        }),
      ],
    },
    {
      id: "m02-s03",
      slug: "slices",
      title: "Slices & Views",
      description: "String slices and array slices for windows of prices.",
      lessons: [
        L({
          id: "m02-l07",
          slug: "string-slices",
          title: "String Slices (&str)",
          duration: 20,
          summary: "Views into string data — parsing symbols and message prefixes without copy.",
          content: `## Slices are views

\`\`\`rust
let s = String::from("AAPL.O");
let root = &s[0..4]; // "AAPL" — careful: must be byte boundaries
\`\`\`

Prefer safe APIs:

\`\`\`rust
fn main() {
    let sym = "MSFT";
    assert!(sym.starts_with("MS"));
    for part in "A,B,C".split(',') {
        println!("{part}");
    }
}
\`\`\`

\`\`\`output
A
B
C
\`\`\`

## API rule of thumb

Take \`&str\` in functions so both literals and \`String\` work (\`String\` coerces to \`&str\`).

### Exercise

Parse \"SYM:QTY\" style tags.`,
          starterCode: `fn parse_tag(tag: &str) -> (&str, f64) {
    // TODO: split on ':' — return ("?", 0.0) on failure for now
    ("?", 0.0)
}

fn main() {
    for t in ["AAPL:100", "MSFT:50.5", "BAD"] {
        let (sym, qty) = parse_tag(t);
        println!("{t} -> {sym} {qty}");
    }
}`,
          solution: `fn parse_tag(tag: &str) -> (&str, f64) {
    let mut parts = tag.split(':');
    let sym = parts.next().unwrap_or("?");
    let qty = parts
        .next()
        .and_then(|x| x.parse().ok())
        .unwrap_or(0.0);
    (sym, qty)
}

fn main() {
    for t in ["AAPL:100", "MSFT:50.5", "BAD"] {
        let (sym, qty) = parse_tag(t);
        println!("{t} -> {sym} {qty}");
    }
}`,
          challenge: "Return Option<(&str, f64)> instead of dummy defaults.",
          tips: [
            "Byte indexing can panic on non-UTF8 boundaries — prefer APIs",
            "&str is the flexible borrowed string type",
            "split returns an iterator of &str",
          ],
        }),
        L({
          id: "m02-l08",
          slug: "array-slices",
          title: "Array/Slice Windows for Prices",
          duration: 22,
          summary: " &[T] views, slicing ranges, and SMA without copying the whole series.",
          content: `## Slice type \`&[T]\`

\`\`\`rust
let prices = [100.0, 101.0, 99.5, 102.0, 103.0];
let window: &[f64] = &prices[1..4];
\`\`\`

## Iteration without taking ownership

\`\`\`rust
fn main() {
    let prices = [100.0, 101.0, 99.5, 102.0, 103.0];
    for p in prices.iter() {
        println!("{p}");
    }
    let sum: f64 = prices.iter().sum();
    println!("sum={sum}");
}
\`\`\`

\`\`\`output
100
101
99.5
102
103
sum=505.5
\`\`\`

### Exercise

SMA over full series and last 3 points.`,
          starterCode: `fn sma(prices: &[f64]) -> f64 {
    if prices.is_empty() {
        return 0.0;
    }
    // TODO
    0.0
}

fn main() {
    let closes = [10.0, 11.0, 12.0, 11.5, 13.0];
    println!("SMA all  = {:.4}", sma(&closes));
    println!("SMA last3= {:.4}", sma(&closes[closes.len()-3..]));
}`,
          solution: `fn sma(prices: &[f64]) -> f64 {
    if prices.is_empty() {
        return 0.0;
    }
    let sum: f64 = prices.iter().sum();
    sum / prices.len() as f64
}

fn main() {
    let closes = [10.0, 11.0, 12.0, 11.5, 13.0];
    println!("SMA all  = {:.4}", sma(&closes));
    println!("SMA last3= {:.4}", sma(&closes[closes.len() - 3..]));
}`,
          challenge: "Write fn min_max(xs: &[f64]) -> Option<(f64, f64)>.",
          tips: [
            "Slices prevent needless Vec clones",
            "len() is usize — cast to f64 for division",
            "Empty slice edge cases matter in rolling stats",
          ],
        }),
        L({
          id: "m02-l09",
          slug: "ownership-lab",
          title: "Module 2 Lab: Quote Toolkit",
          duration: 25,
          summary: "Combine ownership ideas into a small quote helper library.",
          content: `## Build a mini toolkit

1. \`struct Quote { bid, ask }\`  
2. \`mid\`, \`spread\` via \`&Quote\`  
3. \`fn improve(&mut self-ish function)\`  
4. \`fn label(q: &Quote, sym: &str) -> String\`  

No heap sharing tricks — just clean borrows.

Work until all prints look right; then try the challenge.`,
          starterCode: `struct Quote {
    bid: f64,
    ask: f64,
}

fn mid(q: &Quote) -> f64 { (q.bid + q.ask) / 2.0 }
fn spread(q: &Quote) -> f64 { q.ask - q.bid }

fn improve_bid(q: &mut Quote, by: f64) {
    q.bid += by;
}

fn label(sym: &str, q: &Quote) -> String {
    format!("{sym} mid={:.4} spr={:.4}", mid(q), spread(q))
}

fn main() {
    let mut q = Quote { bid: 10.00, ask: 10.05 };
    println!("{}", label("FOO", &q));
    improve_bid(&mut q, 0.01);
    println!("{}", label("FOO", &q));
    // TODO: reject improvement if it would cross the ask (bid >= ask)
}`,
          solution: `struct Quote {
    bid: f64,
    ask: f64,
}

fn mid(q: &Quote) -> f64 {
    (q.bid + q.ask) / 2.0
}
fn spread(q: &Quote) -> f64 {
    q.ask - q.bid
}

fn improve_bid(q: &mut Quote, by: f64) -> bool {
    let new_bid = q.bid + by;
    if new_bid >= q.ask {
        return false;
    }
    q.bid = new_bid;
    true
}

fn label(sym: &str, q: &Quote) -> String {
    format!("{sym} mid={:.4} spr={:.4}", mid(q), spread(q))
}

fn main() {
    let mut q = Quote { bid: 10.00, ask: 10.05 };
    println!("{}", label("FOO", &q));
    println!("ok? {}", improve_bid(&mut q, 0.01));
    println!("{}", label("FOO", &q));
    println!("cross? {}", improve_bid(&mut q, 1.0));
    println!("{}", label("FOO", &q));
}`,
          challenge: "Track a Vec of mid history by pushing mid after each successful improve.",
          tips: [
            "Return bool or Result for rejected improves",
            "Keep mutation functions small",
            "You're ready for structs/enums in Module 3",
          ],
        }),
      ],
    },
  ],
});
