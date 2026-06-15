import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api-utils";

// Legacy route — redirects to role-specific profile page
export default async function ProfileRedirect() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  switch (currentUser.role) {
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
