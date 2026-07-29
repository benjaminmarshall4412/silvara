import { cookies } from "next/headers";

import { AdminFinance } from "@/components/admin/admin-finance";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import {
  isAdminConfigured,
  SILVARA_ADMIN_COOKIE,
  verifyAdminSessionCookie,
} from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  const store = await cookies();
  const session = verifyAdminSessionCookie(
    store.get(SILVARA_ADMIN_COOKIE)?.value,
  );

  if (session) {
    return <AdminFinance />;
  }

  return <AdminLoginForm configured={isAdminConfigured()} />;
}
