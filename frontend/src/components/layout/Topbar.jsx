// src/components/layout/Topbar.jsx
import React from 'react';
import { LogOut, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../config/roles';

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
          {ROLE_LABELS[user?.role] || user?.role}
        </span>
        {user?.area && (
          <span className="hidden text-xs text-slate-500 sm:inline">• {user.area}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-700">{user?.name}</span>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </header>
  );
}