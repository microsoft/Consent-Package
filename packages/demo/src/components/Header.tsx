import { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import {
  makeStyles,
  shorthands,
  Drawer,
  DrawerHeader,
  DrawerBody,
  Button as FluentButton,
} from '@fluentui/react-components';
import { AuthMenu } from './AuthMenu.js';
import { useAuth } from '../utils/useAuth.js';

const useStyles = makeStyles({
  headerWrapper: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'transparent',
    paddingTop: '16px',
    paddingBottom: '16px',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 1000,
    backgroundColor: 'var(--colorNeutralBackground1)',
    '@media (max-width: 768px)': {
      paddingTop: '8px',
      paddingBottom: '8px',
    },
  },
  navBar: {
    boxShadow: '0 4px 24px 0 rgba(80, 80, 120, 0.3)',
    borderRadius: '40px',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    maxWidth: '1200px',
    minHeight: '56px',
    margin: '0 24px',
    ...shorthands.padding('0px', '24px'),
    ...shorthands.gap('16px'),
    position: 'relative',
    '@media (max-width: 768px)': {
      ...shorthands.padding('0px', '16px'),
      minHeight: '50px',
      borderRadius: '30px',
      ...shorthands.gap('0px'),
      justifyContent: 'space-between',
    },
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    fontWeight: 700,
    fontSize: '20px',
    letterSpacing: '-0.5px',
    color: 'var(--colorNeutralForeground1)',
    textDecoration: 'none',
    marginRight: '16px',
    ...shorthands.gap('8px'),
    '@media (max-width: 768px)': {
      fontSize: '16px',
      marginRight: '0',
      flex: '1',
    },
  },
  navLinks: {
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    ...shorthands.gap('32px'),
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  navLink: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    color: 'var(--colorNeutralForeground1)',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '16px',
    ...shorthands.padding('8px', '0px'),
    border: 'none',
    background: 'none',
    transition: 'color var(--transition-speed)',
    position: 'relative',
    '&:hover': {
      color: 'var(--colorBrandForegroundLink)',
    },
  },
  active: {
    color: 'var(--colorBrandForegroundLink)',
    fontWeight: 700,
    '&::after': {
      content: '""',
      display: 'block',
      margin: '4px auto 0 auto',
      '@media (max-width: 768px)': {
        margin: '16px auto 0 auto',
      },
      width: '24px',
      height: '4px',
      borderRadius: '2px',
      background: 'var(--colorBrandBackground)',
    },
  },
  hamburgerButton: {
    display: 'none',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    ...shorthands.padding('8px'),
    marginLeft: 'auto',
    marginRight: '0px',
    '@media (max-width: 768px)': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...shorthands.padding('8px'),
      height: '40px',
      width: '40px',
    },
  },
  hamburgerIcon: {
    display: 'block',
    width: '24px',
    height: '2px',
    backgroundColor: 'var(--colorNeutralForeground1)',
    position: 'relative',
    transition: 'background-color var(--transition-speed)',
    '&::before, &::after': {
      content: '""',
      position: 'absolute',
      width: '24px',
      height: '2px',
      left: '0',
      backgroundColor: 'var(--colorNeutralForeground1)',
      transition: 'transform var(--transition-speed)',
    },
    '&::before': {
      top: '-8px',
    },
    '&::after': {
      bottom: '-8px',
    },
  },
  hamburgerIconOpen: {
    backgroundColor: 'transparent',
    '&::before': {
      transform: 'rotate(45deg)',
      top: '0',
    },
    '&::after': {
      transform: 'rotate(-45deg)',
      bottom: '0',
    },
  },
  drawerHeaderStyle: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0',
    height: '68px',
  },
  drawerHeaderCloseButton: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: '0',
  },
  mobileNavLinks: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap('24px'),
    paddingTop: '24px',
  },
  mobileNavLink: {
    fontSize: '20px',
    fontWeight: 600,
  },
  mobileAuthContainer: {
    marginTop: '24px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  authContainerDesktop: {
    marginLeft: 'auto',
    '@media (max-width: 768px)': {
      transform: 'scale(0.9)',
      transformOrigin: 'right center',
      marginLeft: '8px',
      marginRight: '8px',
    },
  },
  skipLink: {
    position: 'absolute',
    left: '-9999px',
    top: 'auto',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    zIndex: -1,
  },
});

export function Header(): JSX.Element {
  const styles = useStyles();
  const location = useLocation();
  const { currentUser } = useAuth();

  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);
  const skipLinkRef = useRef<HTMLAnchorElement>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Home' },
    ...(currentUser ? [] : [{ path: '/get-started', label: 'Consent Demo' }]),
    { path: '/policies', label: 'Admin Demo' },
    { path: '/playground', label: 'Playground' },
  ];

  const isActive = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path === '/policies' && location.pathname.includes('/policy'))
      return true;

    return location.pathname.startsWith(path);
  };

  const toggleMobileMenu = (): void => {
    const newState = !isMobileMenuOpen;

    setIsMobileMenuOpen(newState);
    if (!newState) hamburgerButtonRef.current?.focus();
  };

  const handleNavigation = (): void => {
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);

    // Focus the skip link after a short delay to ensure the page has updated
    setTimeout(() => {
      skipLinkRef.current?.focus();
    }, 100);
  };

  return (
    <header className={styles.headerWrapper}>
      <a href="#main" className={styles.skipLink} ref={skipLinkRef}>
        Skip to main content
      </a>
      <nav className={styles.navBar} role="navigation">
        <Link to="/" className={styles.logo} aria-label="Consent Package Home">
          <span>Consent Package</span>
        </Link>
        <div
          className={styles.navLinks}
          role="menubar"
          aria-label="Navigation Menu"
        >
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navLink} ${
                isActive(item.path) ? styles.active : ''
              }`}
              onClick={handleNavigation}
              role="menuitem"
              aria-current={isActive(item.path) ? 'page' : false}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className={styles.authContainerDesktop}>
          <AuthMenu />
        </div>

        <FluentButton
          ref={hamburgerButtonRef}
          appearance="transparent"
          className={styles.hamburgerButton}
          onClick={toggleMobileMenu}
          aria-label="Open navigation menu"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
        >
          <span
            className={`${styles.hamburgerIcon} ${isMobileMenuOpen ? styles.hamburgerIconOpen : ''}`}
          />
        </FluentButton>
      </nav>

      <Drawer
        id="mobile-menu"
        type="overlay"
        open={isMobileMenuOpen}
        onOpenChange={(_e: unknown, data: { open: boolean }) => {
          return toggleMobileMenu();
        }}
        position="end"
        modalType="modal"
        inertTrapFocus={true}
        aria-label="Pop-out navigation menu"
      >
        <DrawerHeader className={styles.drawerHeaderStyle}>
          <FluentButton
            appearance="subtle"
            className={styles.drawerHeaderCloseButton}
            onClick={() => toggleMobileMenu()}
            aria-label="Close navigation menu"
          >
            <span
              className={`${styles.hamburgerIcon} ${isMobileMenuOpen ? styles.hamburgerIconOpen : ''}`}
            />
          </FluentButton>
        </DrawerHeader>
        <DrawerBody>
          <div className={styles.mobileNavLinks} role="menu">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navLink} ${styles.mobileNavLink} ${isActive(item.path) ? styles.active : ''}`}
                onClick={handleNavigation}
                role="menuitem"
                aria-current={isActive(item.path) ? 'page' : false}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className={styles.mobileAuthContainer}>
            <AuthMenu />
          </div>
        </DrawerBody>
      </Drawer>
    </header>
  );
}
