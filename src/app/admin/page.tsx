import { cookies } from "next/headers";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import {
  isAdminConfigured,
  SILVARA_ADMIN_COOKIE,
  verifyAdminSessionCookie,
} from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const store = await cookies();
  const session = verifyAdminSessionCookie(store.get(SILVARA_ADMIN_COOKIE)?.value);

  if (session) {
    return <AdminDashboard />;
  }

  return <AdminLoginForm configured={isAdminConfigured()} />;
}
