import { User } from 'oidc-client-ts'

export type AppRole = 'OWNER' | 'ADMIN' | 'STAFF' | 'MECHANIC' | 'CUSTOMER'

function decodeJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return {}
  }
}

export function getUserRoles(user: User | null | undefined): AppRole[] {
  if (!user?.access_token) return []

  const payload = decodeJwtPayload(user.access_token)

  const roles: string[] = payload?.realm_access?.roles || []
  const appRoles: AppRole[] = roles.filter((r): r is AppRole =>
    ['OWNER', 'ADMIN', 'STAFF', 'MECHANIC', 'CUSTOMER'].includes(r)
  )
  return appRoles
}

export function hasRole(user: User | null | undefined, ...roles: AppRole[]): boolean {
  const userRoles = getUserRoles(user)
  return roles.some((role) => userRoles.includes(role))
}

export function hasAnyRole(user: User | null | undefined, roles: AppRole[]): boolean {
  const userRoles = getUserRoles(user)
  return roles.some((role) => userRoles.includes(role))
}

// OWNER: Full access — admin panel, invoices, customers, vehicles, work orders, fast intake
// ADMIN: Everything except admin panel (tenant/branch/policy management)
// STAFF: Work orders, customers, vehicles, invoices (view). No admin panel.
// MECHANIC: Fast intake, work orders (view/create), vehicles (view), customers (view). No admin, no invoices, no customer/vehicle delete.
// CUSTOMER: Not applicable for management UI

export function canAccessAdmin(user: User | null | undefined): boolean {
  return hasRole(user, 'OWNER')
}

export function canAccessInvoices(user: User | null | undefined): boolean {
  return hasRole(user, 'OWNER', 'ADMIN', 'STAFF')
}

export function canCreateWorkOrder(user: User | null | undefined): boolean {
  return hasRole(user, 'OWNER', 'ADMIN', 'STAFF', 'MECHANIC')
}

export function canManageCustomers(user: User | null | undefined): boolean {
  return hasRole(user, 'OWNER', 'ADMIN', 'STAFF')
}

export function canViewCustomers(user: User | null | undefined): boolean {
  return hasRole(user, 'OWNER', 'ADMIN', 'STAFF', 'MECHANIC')
}

export function canViewVehicles(user: User | null | undefined): boolean {
  return hasRole(user, 'OWNER', 'ADMIN', 'STAFF', 'MECHANIC')
}

export function canManageVehicles(user: User | null | undefined): boolean {
  return hasRole(user, 'OWNER', 'ADMIN', 'STAFF')
}
