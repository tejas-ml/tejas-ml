import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-8 px-5 py-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <p className="font-serif text-xl leading-snug italic text-ink">
            Built a claims anomaly detection pipeline using XGBoost and Snowflake,
            analyzing 500k+ synthetic CMS claims to identify potential upcoding and
            unbundling fraud patterns, reducing manual auditing requirements by 30%.
          </p>
          <p className="mt-4 text-[12px] tracking-[0.12em] uppercase text-muted">
            Project 04 · CMS PUF 2024 · Sample is synthetic · No PHI
          </p>
        </div>
        <div className="flex flex-col gap-2 text-[13px] text-muted">
          <Link href="/queue" className="hover:text-ink">
            SIU queue
          </Link>
          <Link href="/sample" className="hover:text-ink">
            Sample
          </Link>
          <Link href="/pipeline" className="hover:text-ink">
            Pipeline
          </Link>
          <Link href="/model" className="hover:text-ink">
            Model card
          </Link>
          <p className="mt-4">Python · XGBoost · dbt · Snowflake · Next.js</p>
        </div>
      </div>
    </footer>
  );
}
