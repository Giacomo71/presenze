import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { LoginScreen } from "@/components/dashboard/login-screen";
import { CaricaClient } from "@/components/dashboard/carica-client";

export default async function CaricaPage() {
  const session = await getServerSession(authOptions);
  if (!session) return <LoginScreen />;
  return <CaricaClient />;
}
