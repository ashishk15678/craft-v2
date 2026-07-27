"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

export function EnrollButton({ courseId, orgSlug, courseSlug }: { courseId: string; orgSlug: string; courseSlug: string }) {
  const router = useRouter();
  const enroll = trpc.course.enroll.useMutation({
    onSuccess: () => router.refresh(),
    onError: (e) => alert(e.message),
  });
  return (
    <button
      onClick={() => enroll.mutate({ courseId })}
      disabled={enroll.isPending}
      className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
    >
      {enroll.isPending ? "Enrolling…" : "Enroll in this course →"}
    </button>
  );
}
