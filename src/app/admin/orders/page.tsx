import { cookies } from "next/headers";

import { AdminOrders } from "@/components/admin/admin-orders";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import {
  isAdminConfigured,
  SILVARA_ADMIN_COOKIE,
  verifyAdminSessionCookie,
} from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const store = await cookies();
  const session = verifyAdminSessionCookie(store.get(SILVARA_ADMIN_COOKIE)?.value);

  if (session) {
    return <AdminOrders />;
  }

  return <AdminLoginForm configured={isAdminConfigured()} />;
}
