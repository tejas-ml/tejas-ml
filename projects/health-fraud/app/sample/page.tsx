import type { Metadata } from "next";
import { Workbench } from "@/components/Workbench";

export const metadata: Metadata = {
  title: "Sample",
  description:
    "Synthetic CMS-1500 sample for the Aegis SIU walkthrough — upcoding, unbundling, and duplicate flags.",
};

export default function SamplePage() {
  return <Workbench />;
}
