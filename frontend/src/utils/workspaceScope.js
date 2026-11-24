import { ROLES } from '../config/roles';

export function getRoleHomeRoute() {
  return '/dashboard';
}

export function getWorkspaceMeta(user) {
  const role = user?.role || ROLES.REPRESENTATIVE;
  const name = user?.name || 'User';
  const area = user?.area || 'Unassigned Territory';

  if (role === ROLES.ADMIN) {
    return {
      title: `${name} — Admin Control Center`,
      subtitle: 'Organization-wide visits, territories, user accounts, and audit logs',
      badge: 'Admin',
      accentClass: 'bg-slate-900 text-white',
    };
  }

  if (role === ROLES.MANAGER) {
    return {
      title: `${name} — Territory Manager Hub`,
      subtitle: `Managing team & visits in ${area}`,
      badge: 'Manager',
      accentClass: 'bg-indigo-600 text-white',
    };
  }

  return {
    title: `${name} — Field Rep Workspace`,
    subtitle: `Assigned field zone: ${area}`,
    badge: 'Representative',
    accentClass: 'bg-emerald-600 text-white',
  };
}

export function scopeVisitsForUser(visits, user, managedRepIds = []) {
  if (!user) return [];
  if (user.role === ROLES.ADMIN) {
    return visits;
  }

  if (user.role === ROLES.REPRESENTATIVE) {
    return visits.filter((v) => {
      const repId = v.repId || v.representative?._id || v.representative?.id || v.representative;
      const repName = v.repName || v.representative?.name;
      return (
        (user.id && String(repId) === String(user.id)) ||
        (user.name && repName?.toLowerCase() === user.name.toLowerCase())
      );
    });
  }

  if (user.role === ROLES.MANAGER) {
    const normalizedManagedIds = (managedRepIds || []).map(String);
    return visits.filter((v) => {
      const repId = v.repId || v.representative?._id || v.representative?.id || v.representative;
      const visitArea = v.area || v.business?.area;
      const matchesManagedRep = repId && normalizedManagedIds.includes(String(repId));
      const matchesManagedArea =
        user.area && visitArea && visitArea.toLowerCase().includes(user.area.toLowerCase());
      return matchesManagedRep || matchesManagedArea;
    });
  }

  return visits;
}