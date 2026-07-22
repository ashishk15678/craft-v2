import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStudentSession } from "@/lib/student-session";

async function progressForUser(userId: string) {
  return prisma.studentProgress.upsert({ where: { userId }, update: {}, create: { userId } });
}

export async function GET() {
  const session = await getStudentSession();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await progressForUser(session.user.id));
}

export async function PATCH(request: Request) {
  const session = await getStudentSession();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const current = await progressForUser(session.user.id);
  const currentStage = body.action === "previous" ? Math.max(1, current.currentStage - 1) : body.action === "advance" ? Math.min(current.totalStages, current.currentStage + 1) : current.currentStage;
  return NextResponse.json(await prisma.studentProgress.update({ where: { userId: session.user.id }, data: { currentStage, hintsUsed: body.action === "hint" ? current.hintsUsed + 1 : undefined, peerReviewRequested: body.action === "peer-review" ? true : undefined } }));
}
