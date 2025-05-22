import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import {
  makeStyles,
  shorthands,
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
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
    transition: 'color 0.15s',
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
      display: 'block',
      marginRight: '8px',
    },
  },
  hamburgerIcon: {
    display: 'block',
    width: '24px',
    height: '2px',
    background: 'var(--colorNeutralForeground1)',
    position: 'relative',
    transition: 'background 0.3s',
    '&::before, &::after': {
      content: '""',
      position: 'absolute',
      width: '24px',
      height: '2px',
      left: '0',
      background: 'var(--colorNeutralForeground1)',
      transition: 'transform 0.3s',
    },
    '&::before': {
      top: '-8px',
    },
    '&::after': {
      bottom: '-8px',
    },
  },
  hamburgerIconOpen: {
    background: 'transparent',
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
});

export function Header(): JSX.Element {
  const styles = useStyles();
  const location = useLocation();
  const { currentUser } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Home' },
    ...(currentUser ? [] : [{ path: '/get-started', label: 'Get Started' }]),
    { path: '/playground', label: 'Playground' },
    { path: '/policies', label: 'Manage Policies' },
  ];

  const isActive = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const toggleMobileMenu = (): void => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = (): void => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={styles.headerWrapper}>
      <nav className={styles.navBar}>
        <Link to="/" className={styles.logo}>
          <span>Consent Package</span>
        </Link>
        <div className={styles.navLinks}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navLink} ${
                isActive(item.path) ? styles.active : ''
              }`}
              onClick={closeMobileMenu}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className={styles.authContainerDesktop}>
          <AuthMenu />
        </div>

        <FluentButton
          appearance="transparent"
          className={styles.hamburgerButton}
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          <span
            className={`${styles.hamburgerIcon} ${
              isMobileMenuOpen ? styles.hamburgerIconOpen : ''
            }`}
          />
        </FluentButton>
      </nav>

      <Drawer
        type="overlay"
        open={isMobileMenuOpen}
        onOpenChange={(_e: unknown, data: { open: boolean }) =>
          setIsMobileMenuOpen(data.open)
        }
        position="end"
      >
        <DrawerHeader className={styles.drawerHeaderStyle}>
          <DrawerHeaderTitle>Menu</DrawerHeaderTitle>
          <FluentButton
            appearance="subtle"
            aria-label="Close panel"
            onClick={closeMobileMenu}
          >
            &times;
          </FluentButton>
        </DrawerHeader>
        <DrawerBody>
          <div className={styles.mobileNavLinks}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navLink} ${styles.mobileNavLink} ${
                  isActive(item.path) ? styles.active : ''
                }`}
                onClick={() => {
                  closeMobileMenu();
                }}
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
