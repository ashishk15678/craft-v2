import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/student-session";

export async function POST(request: Request) {
  const session = await getStudentSession();
  if (!session?.user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { logs } = await request.json().catch(() => ({ logs: "" }));
  const text = typeof logs === "string" ? logs.toLowerCase() : "";
  const hint =
    text.includes("undefined") || text.includes("null")
      ? "Trace the value at the boundary where it enters your GET handler. Add one assertion before storage access, then rerun the focused test."
      : text.includes("timeout") || text.includes("econnrefused")
        ? "Check whether your listener is started before the client connects. Verify the port and await the server-ready event before your test sends a request."
        : text.includes("expected") || text.includes("assert")
          ? "Read the expected value and inspect the smallest function that transforms the input. Compare only that function’s inputs and output before changing the wider design."
          : "Start with the first failing line, not the final stack trace. Reproduce it with one focused test and inspect the value immediately before the failure.";
  return NextResponse.json({
    hint,
    note: "Minimal nudge generated from your error output; no solution code revealed.",
  });
}
