import { LearningDetailClient } from "./learning-detail-client";

export default async function LearningDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LearningDetailClient trackId={id} />;
}
