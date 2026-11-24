import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../config/roles';
import { visitService } from '../services/visitService';
import { adminService } from '../services/adminService';
import { crmService } from '../services/crmService';
import { scopeVisitsForUser } from '../utils/workspaceScope';
import RepDashboard from '../components/dashboards/RepDashboard';
import ManagerDashboard from '../components/dashboards/ManagerDashboard';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import VisitDetailModal from '../components/visits/VisitDetailModal';

export default function DashboardPage() {
  const { user } = useAuth();
  const [allVisits, setAllVisits] = useState([]);
  const [areas, setAreas] = useState([]);
  const [users, setUsers] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);

  useEffect(() => {
    Promise.all([
      visitService.list(),
      adminService.getAreas(),
      adminService.getUsers(),
      crmService.getFollowUps(),
    ]).then(([v, a, u, f]) => {
      setAllVisits(v);
      setAreas(a);
      setUsers(u);
      setFollowUps(f);
    });
  }, []);

  const managedRepIds = users
    .filter((u) => u.role === ROLES.REPRESENTATIVE && u.managerId === user?.id)
    .map((u) => u.id);

  const scopedVisits = scopeVisitsForUser(allVisits, user, managedRepIds);

  const renderDashboard = () => {
    if (user?.role === ROLES.REPRESENTATIVE) {
      return (
        <RepDashboard
          user={user}
          visits={scopedVisits}
          areas={areas}
          followUps={followUps}
          onSelectVisit={setSelectedVisit}
        />
      );
    }

    if (user?.role === ROLES.MANAGER) {
      return (
        <ManagerDashboard
          user={user}
          visits={scopedVisits}
          areas={areas}
          users={users}
          followUps={followUps}
          onSelectVisit={setSelectedVisit}
        />
      );
    }

    return (
      <AdminDashboard
        user={user}
        visits={allVisits}
        areas={areas}
        users={users}
        followUps={followUps}
        onSelectVisit={setSelectedVisit}
      />
    );
  };

  return (
    <>
      {renderDashboard()}
      <VisitDetailModal visit={selectedVisit} onClose={() => setSelectedVisit(null)} />
    </>
  );
}