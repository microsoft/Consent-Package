import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { makeStyles } from "@fluentui/react-components";

const useStyles = makeStyles({
  headerWrapper: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    background: "transparent",
    padding: "32px 0 24px 0",
  },
  navBar: {
    background: "var(--color-background)",
    boxShadow: "0 4px 24px 0 rgba(80, 80, 120, 0.3)",
    borderRadius: "40px",
    display: "flex",
    alignItems: "center",
    width: "100%",
    maxWidth: "1200px",
    minHeight: "64px",
    margin: "0 24px",
    padding: "0 calc(var(--spacing-unit) * 4)",
    gap: "calc(var(--spacing-unit) * 4)",
    position: "relative",
    "@media (max-width: 768px)": {
      padding: "0 calc(var(--spacing-unit) * 2)",
    },
  },
  logo: {
    display: "flex",
    alignItems: "center",
    fontWeight: 700,
    fontSize: "20px",
    letterSpacing: "-0.5px",
    color: "var(--color-text)",
    textDecoration: "none",
    marginRight: "calc(var(--spacing-unit) * 2)",
    gap: "calc(var(--spacing-unit) * 1)",
  },
  navLinks: {
    display: "flex",
    flex: 1,
    justifyContent: "center",
    gap: "calc(var(--spacing-unit) * 4)",
    "@media (max-width: 768px)": {
      display: "none",
    },
  },
  navLink: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    color: "var(--color-text)",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "16px",
    padding: "calc(var(--spacing-unit) * 1) 0",
    border: "none",
    background: "none",
    transition: "color 0.15s",
    position: "relative",
    "&:hover": {
      color: "var(--color-primary)",
    },
  },
  active: {
    color: "var(--color-primary)",
    fontWeight: 700,
    "&::after": {
      content: '""',
      display: "block",
      margin: "4px auto 0 auto",
      "@media (max-width: 768px)": {
        margin: "16px auto 0 auto",
      },
      width: "24px",
      height: "4px",
      borderRadius: "2px",
      background: "var(--color-primary)",
    },
  },
  loginBtn: {
    padding: "calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 3)",
    border: "2px solid var(--color-primary)",
    borderRadius: "calc(var(--spacing-unit) * 3)",
    background: "var(--color-background)",
    color: "var(--color-primary)",
    fontWeight: 600,
    fontSize: "16px",
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
    "&:hover": {
      background: "var(--color-primary)",
      color: "var(--color-background)",
    },
    "@media (max-width: 768px)": {
      display: "none",
    },
  },
  hamburgerButton: {
    display: "none",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "calc(var(--spacing-unit) * 1)",
    marginLeft: "auto",
    marginRight: "24px",
    "@media (max-width: 768px)": {
      display: "block",
    },
  },
  hamburgerIcon: {
    display: "block",
    width: "24px",
    height: "2px",
    background: "var(--color-text)",
    position: "relative",
    transition: "background 0.3s",
    "&::before, &::after": {
      content: '""',
      position: "absolute",
      width: "24px",
      height: "2px",
      left: "0",
      background: "var(--color-text)",
      transition: "transform 0.3s",
    },
    "&::before": {
      top: "-8px",
    },
    "&::after": {
      bottom: "-8px",
    },
  },
  hamburgerIconOpen: {
    background: "transparent",
    "&::before": {
      transform: "rotate(45deg)",
      top: "0",
    },
    "&::after": {
      transform: "rotate(-45deg)",
      bottom: "0",
    },
  },
  mobileMenuOverlay: {
    display: "none",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "var(--color-background)",
    padding: "calc(var(--spacing-unit) * 8) calc(var(--spacing-unit) * 4)",
    zIndex: 1000,
    "@media (max-width: 768px)": {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "calc(var(--spacing-unit) * 4)",
    },
  },
  closeButton: {
    position: "absolute",
    top: "calc(var(--spacing-unit) * 4)",
    right: "calc(var(--spacing-unit) * 4)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "calc(var(--spacing-unit) * 1)",
    color: "var(--color-text)",
    fontSize: "24px",
    fontWeight: "bold",
    "&:hover": {
      color: "var(--color-primary)",
    },
  },
  mobileNavLinks: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "calc(var(--spacing-unit) * 4)",
  },
  mobileNavLink: {
    fontSize: "24px",
    fontWeight: 600,
  },
  mobileLoginBtn: {
    display: "block !important",
    marginTop: "calc(var(--spacing-unit) * 4)",
    padding: "calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 6)",
    fontSize: "20px",
  },
});

export function Header(): JSX.Element {
  const styles = useStyles();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/get-started", label: "Get Started" },
    { path: "/playground", label: "Playground" },
    { path: "/profile", label: "Profile" },
    { path: "/policies", label: "Manage Policies" },
  ];

  const isActive = (path: string): boolean => {
    if (path === "/") {
      return location.pathname === "/";
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
    <div className={styles.headerWrapper}>
      <nav className={styles.navBar}>
        <Link to="/" className={styles.logo}>
          Consent Package
        </Link>
        <div className={styles.navLinks}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navLink} ${isActive(item.path) ? styles.active : ""}`}
              onClick={closeMobileMenu}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div>
          <button
            className={styles.loginBtn}
            onClick={() => {
              void (async () => {
                if (location.pathname === "/profile") await navigate("/");
                else await navigate("/profile");
              })();
            }}
          >
            {location.pathname === "/profile" ? "Log out" : "Log in"}
          </button>
        </div>
        <button
          className={styles.hamburgerButton}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span
            className={`${styles.hamburgerIcon} ${isMobileMenuOpen ? styles.hamburgerIconOpen : ""}`}
          />
        </button>
      </nav>

      {isMobileMenuOpen && (
        <div className={styles.mobileMenuOverlay}>
          <button
            className={styles.closeButton}
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            ×
          </button>
          <div className={styles.mobileNavLinks}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navLink} ${styles.mobileNavLink} ${isActive(item.path) ? styles.active : ""}`}
                onClick={closeMobileMenu}
              >
                {item.label}
              </Link>
            ))}
            <button
              className={`${styles.loginBtn} ${styles.mobileLoginBtn}`}
              onClick={() => {
                void (async () => {
                  if (location.pathname === "/profile") await navigate("/");
                  else await navigate("/profile");
                  closeMobileMenu();
                })();
              }}
            >
              {location.pathname === "/profile" ? "Log out" : "Log in"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
