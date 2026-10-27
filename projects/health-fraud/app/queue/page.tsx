import type { Metadata } from "next";
import { CmsQueue } from "@/components/CmsQueue";
import { getCmsQueue } from "@/lib/cms";

export const metadata: Metadata = {
  title: "SIU queue",
  description:
    "Live CMS Medicare Part B provider-service utilization scored for 99215 intensity, fee outliers, and injection volume.",
};

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const { lines, source, year, error } = await getCmsQueue();
  return (
    <CmsQueue lines={lines} source={source} year={year} error={error} />
  );
}
