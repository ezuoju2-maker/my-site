/**
 * 用户角色定义。
 *
 * 未来扩展：新增 'agent'（代理商）、'moderator'（客服）等角色，
 * 只需修改这里的 USER_ROLES 数组，其他地方会自动跟随。
 */

export const USER_ROLES = ["user", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isValidRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" &&
    (USER_ROLES as readonly string[]).includes(value)
  );
}

export function normalizeRole(value: unknown): UserRole {
  return isValidRole(value) ? value : "user";
}
