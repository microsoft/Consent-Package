import { makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  footer: {
    backgroundColor: "var(--color-background)",
    borderTop: `var(--border-width) solid var(--color-border)`,
    padding: "calc(var(--spacing-unit) * 4) 0",
    marginTop: "auto",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 calc(var(--spacing-unit) * 2)",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "calc(var(--spacing-unit) * 4)",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "calc(var(--spacing-unit) * 2)",
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: "var(--color-text)",
    marginBottom: "calc(var(--spacing-unit) * 1)",
  },
  link: {
    color: "var(--color-text-light)",
    textDecoration: "none",
    fontSize: tokens.fontSizeBase300,
    transition: "color var(--transition-speed) ease",
    "&:hover": {
      color: "var(--color-primary)",
    },
  },
  copyright: {
    textAlign: "center",
    color: "var(--color-text-light)",
    fontSize: tokens.fontSizeBase300,
    marginTop: "calc(var(--spacing-unit) * 4)",
  },
});

export function Footer(): JSX.Element {
  const styles = useStyles();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.section}>
          <h3 className={styles.title}>Product</h3>
          <a href="/get-started" className={styles.link}>Get Started</a>
          <a href="/playground" className={styles.link}>Playground</a>
          <a href="/docs" className={styles.link}>Documentation</a>
        </div>
        <div className={styles.section}>
          <h3 className={styles.title}>Resources</h3>
          <a href="https://github.com/microsoft/Open-Source-Consent-Package" className={styles.link}>GitHub</a>
          <a href="/blog" className={styles.link}>Blog</a>
          <a href="/support" className={styles.link}>Support</a>
        </div>
        <div className={styles.section}>
          <h3 className={styles.title}>Legal</h3>
          <a href="/privacy" className={styles.link}>Privacy Policy</a>
          <a href="/terms" className={styles.link}>Terms of Service</a>
          <a href="/license" className={styles.link}>License</a>
        </div>
      </div>
      <div className={styles.copyright}>
        © {new Date().getFullYear()} Microsoft. All rights reserved.
      </div>
    </footer>
  );
} 