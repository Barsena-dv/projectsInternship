import React from 'react';
import { useAuth } from '../../hooks/useAuth';

/**
 * RoleBackground
 * 
 * Renders a full-screen animated glassy orb background based on the current user's role.
 */
const RoleBackground = () => {
  const { user } = useAuth();
  const role = user?.role || 'default';

  return (
    <>
      <div className={`pnf-role-bg-base pnf-bg-${role}`}>
        <div className="pnf-orb pnf-orb-1" />
        <div className="pnf-orb pnf-orb-2" />
        <div className="pnf-orb pnf-orb-3" />
        <div className="pnf-orb pnf-orb-4" />
      </div>
      <div className="pnf-glass-overlay" />
    </>
  );
};

export default RoleBackground;
