// =========================
// RBAC (Role-Based Access Control)
// =========================

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
  BOT = 'BOT',
}

export enum Permission {
  // Organization
  ORG_READ = 'org:read',
  ORG_UPDATE = 'org:update',
  ORG_DELETE = 'org:delete',
  ORG_BILLING = 'org:billing',

  // Users
  USER_READ = 'user:read',
  USER_INVITE = 'user:invite',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // API Keys
  APIKEY_READ = 'apikey:read',
  APIKEY_CREATE = 'apikey:create',
  APIKEY_DELETE = 'apikey:delete',

  // Data Sources
  SOURCE_READ = 'source:read',
  SOURCE_CREATE = 'source:create',
  SOURCE_UPDATE = 'source:update',
  SOURCE_DELETE = 'source:delete',
  SOURCE_CRAWL = 'source:crawl',

  // Documents
  DOC_READ = 'doc:read',
  DOC_CREATE = 'doc:create',
  DOC_UPDATE = 'doc:update',
  DOC_DELETE = 'doc:delete',

  // Chat
  CHAT_READ = 'chat:read',
  CHAT_SEND = 'chat:send',
  CHAT_DELETE = 'chat:delete',

  // Council
  COUNCIL_USE = 'council:use',
  COUNCIL_CONFIG = 'council:config',

  // Analytics
  ANALYTICS_READ = 'analytics:read',

  // Audit
  AUDIT_READ = 'audit:read',
}

// =========================
// ROLE PERMISSIONS MATRIX
// =========================

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.OWNER]: [
    // All permissions
    Permission.ORG_READ,
    Permission.ORG_UPDATE,
    Permission.ORG_DELETE,
    Permission.ORG_BILLING,
    Permission.USER_READ,
    Permission.USER_INVITE,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.APIKEY_READ,
    Permission.APIKEY_CREATE,
    Permission.APIKEY_DELETE,
    Permission.SOURCE_READ,
    Permission.SOURCE_CREATE,
    Permission.SOURCE_UPDATE,
    Permission.SOURCE_DELETE,
    Permission.SOURCE_CRAWL,
    Permission.DOC_READ,
    Permission.DOC_CREATE,
    Permission.DOC_UPDATE,
    Permission.DOC_DELETE,
    Permission.CHAT_READ,
    Permission.CHAT_SEND,
    Permission.CHAT_DELETE,
    Permission.COUNCIL_USE,
    Permission.COUNCIL_CONFIG,
    Permission.ANALYTICS_READ,
    Permission.AUDIT_READ,
  ],

  [UserRole.ADMIN]: [
    Permission.ORG_READ,
    Permission.ORG_UPDATE,
    Permission.USER_READ,
    Permission.USER_INVITE,
    Permission.USER_UPDATE,
    Permission.APIKEY_READ,
    Permission.APIKEY_CREATE,
    Permission.APIKEY_DELETE,
    Permission.SOURCE_READ,
    Permission.SOURCE_CREATE,
    Permission.SOURCE_UPDATE,
    Permission.SOURCE_DELETE,
    Permission.SOURCE_CRAWL,
    Permission.DOC_READ,
    Permission.DOC_CREATE,
    Permission.DOC_UPDATE,
    Permission.DOC_DELETE,
    Permission.CHAT_READ,
    Permission.CHAT_SEND,
    Permission.CHAT_DELETE,
    Permission.COUNCIL_USE,
    Permission.COUNCIL_CONFIG,
    Permission.ANALYTICS_READ,
    Permission.AUDIT_READ,
  ],

  [UserRole.EDITOR]: [
    Permission.ORG_READ,
    Permission.SOURCE_READ,
    Permission.SOURCE_CREATE,
    Permission.SOURCE_UPDATE,
    Permission.SOURCE_CRAWL,
    Permission.DOC_READ,
    Permission.DOC_CREATE,
    Permission.DOC_UPDATE,
    Permission.CHAT_READ,
    Permission.CHAT_SEND,
    Permission.COUNCIL_USE,
    Permission.ANALYTICS_READ,
  ],

  [UserRole.VIEWER]: [
    Permission.ORG_READ,
    Permission.SOURCE_READ,
    Permission.DOC_READ,
    Permission.CHAT_READ,
    Permission.CHAT_SEND,
    Permission.ANALYTICS_READ,
  ],

  [UserRole.BOT]: [
    Permission.CHAT_READ,
    Permission.CHAT_SEND,
  ],
};

// =========================
// RBAC SERVICE
// =========================

export class RBACService {
  /**
   * Check if role has permission
   */
  hasPermission(role: UserRole, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    return permissions.includes(permission);
  }

  /**
   * Check if role has any of the permissions
   */
  hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
    return permissions.some(p => this.hasPermission(role, p));
  }

  /**
   * Check if role has all permissions
   */
  hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
    return permissions.every(p => this.hasPermission(role, p));
  }

  /**
   * Get all permissions for a role
   */
  getPermissions(role: UserRole): Permission[] {
    return [...ROLE_PERMISSIONS[role]];
  }

  /**
   * Check if role can perform action on resource
   */
  can(role: UserRole, action: string, resource: string): boolean {
    const permission = `${resource}:${action}` as Permission;
    return this.hasPermission(role, permission);
  }

  /**
   * Get role hierarchy level (higher = more permissions)
   */
  getRoleLevel(role: UserRole): number {
    const levels: Record<UserRole, number> = {
      [UserRole.OWNER]: 5,
      [UserRole.ADMIN]: 4,
      [UserRole.EDITOR]: 3,
      [UserRole.VIEWER]: 2,
      [UserRole.BOT]: 1,
    };
    return levels[role];
  }

  /**
   * Check if role1 has higher or equal level than role2
   */
  isHigherOrEqual(role1: UserRole, role2: UserRole): boolean {
    return this.getRoleLevel(role1) >= this.getRoleLevel(role2);
  }

  /**
   * Check if role can manage another role
   */
  canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
    // Only OWNER can manage OWNER
    if (targetRole === UserRole.OWNER) {
      return managerRole === UserRole.OWNER;
    }

    // ADMIN and above can manage lower roles
    return this.getRoleLevel(managerRole) > this.getRoleLevel(targetRole);
  }

  /**
   * Validate role string
   */
  isValidRole(role: string): role is UserRole {
    return Object.values(UserRole).includes(role as UserRole);
  }

  /**
   * Get default role for new users
   */
  getDefaultRole(): UserRole {
    return UserRole.VIEWER;
  }

  /**
   * Get role display name
   */
  getRoleDisplayName(role: UserRole): string {
    const names: Record<UserRole, string> = {
      [UserRole.OWNER]: 'Owner',
      [UserRole.ADMIN]: 'Administrator',
      [UserRole.EDITOR]: 'Editor',
      [UserRole.VIEWER]: 'Viewer',
      [UserRole.BOT]: 'Bot',
    };
    return names[role];
  }

  /**
   * Get role description
   */
  getRoleDescription(role: UserRole): string {
    const descriptions: Record<UserRole, string> = {
      [UserRole.OWNER]: 'Full control including billing and organization deletion',
      [UserRole.ADMIN]: 'Manage users, sources, and all content',
      [UserRole.EDITOR]: 'Create and edit content, run crawls',
      [UserRole.VIEWER]: 'View content and use chat',
      [UserRole.BOT]: 'API access for chat only',
    };
    return descriptions[role];
  }
}

// =========================
// MIDDLEWARE HELPER
// =========================

export interface AuthContext {
  userId: string;
  orgId: string;
  role: UserRole;
}

export class RBACMiddleware {
  private rbac: RBACService;

  constructor() {
    this.rbac = new RBACService();
  }

  /**
   * Create middleware to check permission
   */
  requirePermission(permission: Permission) {
    return (context: AuthContext): boolean => {
      return this.rbac.hasPermission(context.role, permission);
    };
  }

  /**
   * Create middleware to check any permission
   */
  requireAnyPermission(permissions: Permission[]) {
    return (context: AuthContext): boolean => {
      return this.rbac.hasAnyPermission(context.role, permissions);
    };
  }

  /**
   * Create middleware to check all permissions
   */
  requireAllPermissions(permissions: Permission[]) {
    return (context: AuthContext): boolean => {
      return this.rbac.hasAllPermissions(context.role, permissions);
    };
  }

  /**
   * Create middleware to check role level
   */
  requireRole(minRole: UserRole) {
    return (context: AuthContext): boolean => {
      return this.rbac.isHigherOrEqual(context.role, minRole);
    };
  }
}

// =========================
// FACTORY FUNCTIONS
// =========================

export function createRBACService(): RBACService {
  return new RBACService();
}

export function createRBACMiddleware(): RBACMiddleware {
  return new RBACMiddleware();
}