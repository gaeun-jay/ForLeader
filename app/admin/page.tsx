import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import AdminLogin from "@/components/AdminLogin";
import AdminDashboard from "@/components/AdminDashboard";

async function isAuthenticated(): Promise<boolean> {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return false;

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export default async function AdminPage() {
  const authed = await isAuthenticated();
  return authed ? <AdminDashboard /> : <AdminLogin />;
}
