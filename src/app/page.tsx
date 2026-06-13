import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { LoginScreen } from "@/components/dashboard/login-screen";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <LoginScreen />;
  }

  return <DashboardClient />;
}
