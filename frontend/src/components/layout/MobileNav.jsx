// src/components/layout/MobileNav.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../../config/roles';
import { useAuth } from '../../context/AuthContext';

export default function MobileNav() {
  const { user } = useAuth();
  const mobileItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role)).slice(0, 4);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white md:hidden">
      {mobileItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex-1 py-2.5 text-center text-xs font-medium ${
              isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}