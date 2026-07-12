import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckInReviewFlow } from "@/components/check-in-review-flow";
import { demoCafes } from "@/lib/demo";

export const metadata: Metadata = { title: "เช็กอินและรีวิว" };

export default async function CheckInPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cafe = demoCafes.find((item) => item.slug === slug);
  if (!cafe) notFound();

  return (
    <div className="page-container narrow-container">
      <CheckInReviewFlow cafe={{ id: cafe.id, slug: cafe.slug, name: cafe.name.th }} hasWorkation={Boolean(cafe.workation)} />
    </div>
  );
}
