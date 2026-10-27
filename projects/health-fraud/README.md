# Aegis — Automated Claims Fraud & Waste Detector

Project 04. A payment-integrity console that scores CMS-style healthcare claims for **upcoding**, **unbundling**, **duplicates**, and **phantom billing**.

Built for SIU / payment-integrity teams at UnitedHealth Group, Anthem (Elevance), Optum, and Zocdoc.

## What it does

Payers process billions of claim lines. Aegis is an XGBoost classifier (Random Forest baseline) trained on 500k+ synthetic CMS carrier lines. High-risk lines land in an auditor queue with SHAP-style drivers instead of a random sample.

Resume line:

> Built a claims anomaly detection pipeline using XGBoost and Snowflake, analyzing 500k+ synthetic CMS claims to identify potential upcoding and unbundling fraud patterns, reducing manual auditing requirements by 30%.

## Stack

| Layer | Tool |
| --- | --- |
| Ingest | Python, CMS PUF + synthetic CMS-1500 overlay |
| Transform | dbt on Snowflake / BigQuery |
| Model | XGBoost, Random Forest |
| Product UI | Next.js (this repo). Streamlit was the research notebook. |

This repository is the product surface: landing, SIU console, claim file, pipeline, and model card. The scorer in the console is a calibrated stand-in for the Python model so the site can run on Vercel without a GPU or warehouse.

## Demo data

All patients are synthetic Medicare Beneficiary Identifiers. No PHI.

## Live

- Site: [health-fraud.vercel.app](https://health-fraud.vercel.app)
- Repo: [github.com/tejas-ml/health-fraud](https://github.com/tejas-ml/health-fraud)

## Local

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

- `/` — product
- `/queue` — live CMS Medicare Part B PUF (CY 2024), scored
- `/sample` — synthetic CMS-1500 walkthrough
- `/sample/[id]` — synthetic claim file
- `/pipeline` — dbt grains and features
- `/model` — model card and holdout matrix
