# CardFind — U.S. Credit Card Finder

**Live site:** [https://credit-card-finder.vercel.app](https://credit-card-finder.vercel.app)

**Repo:** [github.com/tejas-ml/credit-card-finder](https://github.com/tejas-ml/credit-card-finder)  
**Author:** [github.com/tejas-ml](https://github.com/tejas-ml)

A simple U.S. credit card finder. Browse top cards for travel, airport lounge access, cash back, dining, and more — filter by benefits, search by name or issuer, and open the bank’s page to learn more and apply.

## Features

- **Light & dark mode** (light is default; preference is saved)
- **Search** U.S. cards, banks, and benefits
- **Filters** — travel, cash back, dining, gas, groceries, airline, shopping, no fee, premium, business, student, points
- **Top picks** by category
- **Clickable card faces** and apply buttons → official issuer pages
- **Sort** by rating, name, annual fee, or welcome bonus

## Tech

Static site (HTML, CSS, JS). No build step required.

| File | Purpose |
|------|---------|
| `index.html` | Page structure |
| `styles.css` | Themes & layout |
| `data.js` | U.S. card catalog & apply links |
| `app.js` | Search, filters, theme, rendering |
| `vercel.json` | Vercel deploy config |

## Local development

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8765
# → http://127.0.0.1:8765
```

## Deploy (Vercel)

```bash
npx vercel --prod
```

## Disclaimer

Card offers and rates change. Always verify details on the issuer’s official site before applying. This project is for informational purposes and is not affiliated with any bank or card network.

## Author

[Tejas Mahajan](https://github.com/tejas-ml) · [github.com/tejas-ml](https://github.com/tejas-ml)
