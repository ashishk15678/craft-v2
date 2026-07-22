import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getStudentSession() {
  return auth.api.getSession({ headers: await headers() });
}
