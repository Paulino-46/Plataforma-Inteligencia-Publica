// services/dashboardService.ts
// Agrega os dados reais vindos da API para alimentar a Dashboard.

import { userService, UserResponse } from "./userService";

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newThisMonth: number;
  byRole: { role: string; count: number }[];
  recentUsers: UserResponse[];
}

function isSameMonth(iso: string, ref: Date): boolean {
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

/** Busca os utilizadores e deriva as métricas apresentadas na Dashboard. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const users = await userService.findAll();
  const now = new Date();

  const active = users.filter((u) => u.active);
  const newThisMonth = users.filter((u) => u.createdAt && isSameMonth(u.createdAt, now));

  // Contagem por role
  const roleMap = new Map<string, number>();
  for (const u of users) {
    const role = u.role || "—";
    roleMap.set(role, (roleMap.get(role) ?? 0) + 1);
  }
  const byRole = Array.from(roleMap, ([role, count]) => ({ role, count })).sort(
    (a, b) => b.count - a.count
  );

  // Mais recentes primeiro
  const recentUsers = [...users]
    .sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    })
    .slice(0, 5);

  return {
    totalUsers: users.length,
    activeUsers: active.length,
    inactiveUsers: users.length - active.length,
    newThisMonth: newThisMonth.length,
    byRole,
    recentUsers,
  };
}

export default { getDashboardStats };
