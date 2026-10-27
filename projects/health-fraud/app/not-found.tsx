import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[1180px] px-5 py-24">
      <p className="font-mono text-[13px] text-flag">404</p>
      <h1 className="mt-3 font-serif text-4xl italic">This claim is not on file.</h1>
      <p className="mt-4 max-w-md text-[15px] text-muted">
        That line is not in the CMS queue or the synthetic sample.
      </p>
      <Link
        href="/queue"
        className="mt-8 inline-block text-[12px] tracking-[0.14em] uppercase hover:text-muted"
      >
        Return to the queue →
      </Link>
    </div>
  );
}
