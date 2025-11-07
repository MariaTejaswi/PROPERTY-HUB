import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { user, logout, isAuthenticated, isLandlord, isTenant } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link to="/dashboard" className={styles.logo}>
          <h1>PropertyHub</h1>
        </Link>

        <div className={styles.nav}>
          <Link to="/dashboard" className={styles.navLink}>
            Dashboard
          </Link>

          {isLandlord && (
            <>
              <Link to="/properties" className={styles.navLink}>
                Properties
              </Link>
              <Link to="/payments" className={styles.navLink}>
                Payments
              </Link>
              <Link to="/maintenance" className={styles.navLink}>
                Maintenance
              </Link>
              <Link to="/leases" className={styles.navLink}>
                Leases
              </Link>
            </>
          )}

          {isTenant && (
            <>
              <Link to="/payments" className={styles.navLink}>
                Payments
              </Link>
              <Link to="/maintenance" className={styles.navLink}>
                Requests
              </Link>
              <Link to="/leases" className={styles.navLink}>
                Lease
              </Link>
            </>
          )}

          <Link to="/messages" className={styles.navLink}>
            Messages
          </Link>

          <div className={styles.user}>
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userRole}>{user.role}</span>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
