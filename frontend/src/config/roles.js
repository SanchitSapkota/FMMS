export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  REPRESENTATIVE: 'representative',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.REPRESENTATIVE]: 'Representative',
};

export const SELF_REGISTER_ROLES = [ROLES.MANAGER, ROLES.REPRESENTATIVE];

export const NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.REPRESENTATIVE],
  },
  {
    label: 'Log Visit',
    path: '/visits/new',
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.REPRESENTATIVE],
  },
  {
    label: 'Visit Reports',
    path: '/visits',
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.REPRESENTATIVE],
  },
  {
    label: 'Visit Map',
    path: '/map',
    roles: [ROLES.ADMIN, ROLES.MANAGER],
  },
  {
    label: 'Leads & Follow-ups',
    path: '/crm',
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.REP],
  },
  {
    label: 'Marketing Areas',
    path: '/areas',
    roles: [ROLES.ADMIN, ROLES.MANAGER],
  },
  {
    label: 'Users & Audit Logs',
    path: '/admin/users',
    roles: [ROLES.ADMIN],
  },
];