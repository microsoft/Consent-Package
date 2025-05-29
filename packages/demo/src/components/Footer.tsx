import { Link } from 'react-router';
import { makeStyles, tokens } from '@fluentui/react-components';
import { useAuth } from '../utils/useAuth.js';

const useStyles = makeStyles({
  footer: {
    backgroundColor: 'var(--color-background)',
    borderTop: `var(--border-width) solid var(--color-border)`,
    padding: 'calc(var(--spacing-unit) * 4) 0',
    marginTop: 'auto',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 calc(var(--spacing-unit) * 2)',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 'calc(var(--spacing-unit) * 4)',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'calc(var(--spacing-unit) * 2)',
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: 'var(--color-text)',
    marginBottom: 'calc(var(--spacing-unit) * 1)',
  },
  link: {
    color: 'var(--color-text-light)',
    textDecoration: 'none',
    fontSize: tokens.fontSizeBase300,
    transition: 'color var(--transition-speed) ease',
    '&:hover': {
      color: 'var(--color-primary)',
    },
  },
  copyright: {
    textAlign: 'center',
    color: 'var(--color-text-light)',
    fontSize: tokens.fontSizeBase300,
    marginTop: 'calc(var(--spacing-unit) * 4)',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'calc(var(--spacing-unit) * 2)',
  },
});

export function Footer(): JSX.Element {
  const styles = useStyles();
  const { currentUser } = useAuth();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.section}>
          <span className={styles.title}>Product</span>
          <ul className={styles.list}>
            {currentUser ? (
              <li>
                <Link to={`/profile/${currentUser.id}`} className={styles.link}>
                  View Profile
                </Link>
              </li>
            ) : (
              <li>
                <Link to="/get-started" className={styles.link}>
                  Consent Demo
                </Link>
              </li>
            )}
            <li>
              <Link to="/playground" className={styles.link}>
                Playground
              </Link>
            </li>
            <li>
              <Link
                to="https://github.com/microsoft/Open-Source-Consent-Package/tree/main/docs"
                className={styles.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                Documentation
              </Link>
            </li>
          </ul>
        </div>
        <div className={styles.section}>
          <span className={styles.title}>Resources</span>
          <ul className={styles.list}>
            <li>
              <Link
                to="https://github.com/microsoft/Open-Source-Consent-Package"
                className={styles.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </Link>
            </li>
            <li>
              <Link
                to="https://github.com/microsoft/Open-Source-Consent-Package/issues"
                className={styles.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                Report an issue
              </Link>
            </li>
          </ul>
        </div>
        <div className={styles.section}>
          <span className={styles.title}>Legal</span>
          <ul className={styles.list}>
            <li>
              <Link
                to="https://github.com/microsoft/Open-Source-Consent-Package/blob/main/SECURITY.md"
                className={styles.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                Report Security Issue
              </Link>
            </li>
            <li>
              <Link
                to="https://github.com/microsoft/Open-Source-Consent-Package/blob/main/LICENSE"
                className={styles.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                License
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className={styles.copyright}>
        © {new Date().getFullYear()} Microsoft. All rights reserved.
      </div>
    </footer>
  );
}
