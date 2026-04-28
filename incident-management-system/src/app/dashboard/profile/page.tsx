import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

// Legacy route — redirects to role-specific profile page
export default async function ProfileRedirect() {
  const cookieStore = await cookies();
  const token = cookieStore.get("incident_token")?.value;

  if (!token) {
    redirect("/auth/login");
  }

  const decoded = verifyToken(token!);

  if (!decoded) {
    redirect("/auth/login");
  }

  switch (decoded.role) {
    case "ADMIN":
      redirect("/dashboard/admin/profile");
    case "MANAGER":
      redirect("/dashboard/manager/profile");
    case "DEVELOPER":
      redirect("/dashboard/developer/profile");
    default:
      redirect("/auth/login");
  }
}
