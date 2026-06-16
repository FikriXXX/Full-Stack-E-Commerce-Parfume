import { createClient } from "@/lib/supabase/server";
import { RoleToggle } from "./role-toggle";

export default async function AdminUsersPage() {
  let users: { id: string; full_name: string | null; phone: string | null; city: string | null; role: string; created_at: string }[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    users = data || [];
  } catch {
    // Supabase not configured
  }

  return (
    <div>
      <h1 className="font-serif text-2xl">Users</h1>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="pb-2 pr-4">Nama</th>
              <th className="pb-2 pr-4">Telepon</th>
              <th className="pb-2 pr-4">Kota</th>
              <th className="pb-2 pr-4">Role</th>
              <th className="pb-2">Bergabung</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border">
                <td className="py-2 pr-4 font-medium">{user.full_name || "-"}</td>
                <td className="py-2 pr-4">{user.phone || "-"}</td>
                <td className="py-2 pr-4">{user.city || "-"}</td>
                <td className="py-2 pr-4">
                  <RoleToggle userId={user.id} initialRole={user.role} />
                </td>
                <td className="py-2 text-xs text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString("id-ID")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
