import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { AdminAccounts } from "@/components/admin-accounts";
export default async function AdminPage(){const user=await currentUser();if(!user)redirect("/login");if(user.role!=="ADMIN")redirect("/");return <AdminAccounts/>}
