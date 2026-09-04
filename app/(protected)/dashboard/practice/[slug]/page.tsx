import { PracticeChallenge } from "./practice-challenge";

export default async function PracticeChallengePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PracticeChallenge slug={slug} />;
}
