import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { LoginScreen } from "@/components/dashboard/login-screen";
import { AnteprimaClient } from "@/components/dashboard/anteprima-client";

export default async function AnteprimaPage() {
  const session = await getServerSession(authOptions);
  if (!session) return <LoginScreen />;
  return <AnteprimaClient />;
}
