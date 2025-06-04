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
    transition: 'color var(--transition-speed) ease',
    '&.top-section': {
      fontSize: tokens.fontSizeBase300,
    },
    '&.bottom-section': {
      fontSize: tokens.fontSizeBase200,
    },
    '&:hover': {
      color: 'var(--color-primary)',
    },
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
  bottomRowContainer: {
    maxWidth: '1200px',
    margin: '16px auto 0',
    width: '100%',
  },
  bottomRow: {
    borderTop: 'var(--border-width) solid var(--color-border)',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '24px',
    padding: '16px',
    color: 'var(--color-text-light)',
    marginTop: '0',
  },
  copyright: {
    marginLeft: 'auto',
    color: 'var(--color-text-light)',
    fontSize: tokens.fontSizeBase200,
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
                <Link
                  to={`/profile/${currentUser.id}`}
                  className={`${styles.link} top-section`}
                >
                  View Profile
                </Link>
              </li>
            ) : (
              <li>
                <Link
                  to="/get-started"
                  className={`${styles.link} top-section`}
                >
                  Consent Demo
                </Link>
              </li>
            )}
            <li>
              <Link to="/policies" className={`${styles.link} top-section`}>
                Admin Demo
              </Link>
            </li>
            <li>
              <Link to="/playground" className={`${styles.link} top-section`}>
                Playground
              </Link>
            </li>
            <li>
              <Link
                to="https://github.com/microsoft/Open-Source-Consent-Package/tree/main/docs"
                className={`${styles.link} top-section`}
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
                className={`${styles.link} top-section`}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </Link>
            </li>
            <li>
              <Link
                to="https://github.com/microsoft/Open-Source-Consent-Package/issues"
                className={`${styles.link} top-section`}
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
                className={`${styles.link} top-section`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Report Security Issue
              </Link>
            </li>
            <li>
              <Link
                to="https://github.com/microsoft/Open-Source-Consent-Package/blob/main/LICENSE"
                className={`${styles.link} top-section`}
                target="_blank"
                rel="noopener noreferrer"
              >
                License
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className={styles.bottomRowContainer}>
        <div className={styles.bottomRow}>
          <a
            href="https://go.microsoft.com/fwlink/?LinkId=521839"
            className={`${styles.link} bottom-section`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy & Cookies
          </a>
          <a
            href="https://go.microsoft.com/fwlink/?linkid=2259814"
            className={`${styles.link} bottom-section`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Consumer Health Privacy
          </a>
          <a
            href="https://www.microsoft.com/trademarks"
            className={`${styles.link} bottom-section`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Trademarks
          </a>
          <a
            href="https://go.microsoft.com/fwlink/?LinkID=206977"
            className={`${styles.link} bottom-section`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms of use
          </a>
          <span className={styles.copyright}>
            &copy; Microsoft {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </footer>
  );
}
