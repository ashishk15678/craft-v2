"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export function DeleteTopicButton({ topicId }: { topicId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  const del = trpc.topic.delete.useMutation({
    onSuccess: () => {
      router.push("/dashboard/topics");
      router.refresh();
    },
  });

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Delete?</span>
        <button
          onClick={() => del.mutate({ topicId })}
          disabled={del.isPending}
          className="flex items-center gap-1 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors"
        >
          {del.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            "Yes, delete"
          )}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-destructive/50 hover:text-destructive transition-colors"
      title="Delete topic"
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden />
      Delete
    </button>
  );
}
