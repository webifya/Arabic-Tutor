export const roles = ["student", "parent", "teacher", "content_editor", "admin", "super_admin"] as const;
export type Role = (typeof roles)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (roles as readonly string[]).includes(value);
}

export function isAdminRole(role: Role): boolean {
  return role === "admin" || role === "super_admin";
}

export function hasRole(actual: Role, allowed: readonly Role[]): boolean {
  return allowed.includes(actual);
}
