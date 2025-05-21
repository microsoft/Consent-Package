import { useNavigate } from "react-router";
import {
  makeStyles,
  tokens,
  Text,
  Title1,
  Button,
  Title2,
} from "@fluentui/react-components";
import {
  ShieldLockRegular,
  DataTrendingRegular,
  CodeRegular,
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  root: {
    backgroundColor: "var(--color-background)",
    display: "flex",
    flexDirection: "column",
  },
  hero: {
    padding: "calc(var(--spacing-unit) * 12) calc(var(--spacing-unit) * 2)",
    textAlign: "center",
    background:
      "linear-gradient(180deg, var(--color-background) 0%, var(--color-border) 100%)",
  },
  heroContent: {
    display: "flex",
    flexDirection: "column",
    maxWidth: "800px",
    margin: "0 auto",
  },
  title: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightBold,
    color: "var(--color-text)",
    marginBottom: "calc(var(--spacing-unit) * 3)",
    lineHeight: 1.2,
  },
  description: {
    fontSize: tokens.fontSizeBase500,
    color: "var(--color-text-light)",
    marginBottom: "calc(var(--spacing-unit) * 4)",
    lineHeight: 1.6,
  },
  features: {
    padding: "calc(var(--spacing-unit) * 8) calc(var(--spacing-unit) * 2)",
    backgroundColor: "var(--color-background)",
  },
  featuresGrid: {
    display: "grid",
    maxWidth: "1200px",
    margin: "0 auto",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "calc(var(--spacing-unit) * 4)",
  },
  featureCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "calc(var(--spacing-unit) * 4)",
    backgroundColor: "var(--color-background)",
    borderRadius: "var(--border-radius)",
    border: `var(--border-width) solid var(--color-border)`,
    cursor: "pointer",
    transition:
      "transform var(--transition-speed) ease, box-shadow var(--transition-speed) ease",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    },
    boxShadow: "0 4px 24px 0 rgba(80, 80, 120, 0.1)",
    gap: "calc(var(--spacing-unit) * 2)",
  },
  featureIcon: {
    fontSize: "32px",
    color: "var(--color-primary)",
  },
  featureTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: "var(--color-text)",
    marginBottom: "calc(var(--spacing-unit) * 2)",
  },
  featureDescription: {
    fontSize: tokens.fontSizeBase300,
    color: "var(--color-text-light)",
    lineHeight: 1.6,
  },
  ctaButton: {
    padding: "calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 4)",
    borderRadius: "calc(var(--spacing-unit) * 3)",
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    transition: "all var(--transition-speed) ease",
    "&:hover": {
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    },
  },
});

export function Home(): JSX.Element {
  const styles = useStyles();
  const navigate = useNavigate();

  return (
    <div className={styles.root}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <Title1 className={styles.title}>
            Share Consent with Confidence
          </Title1>
          <Text className={styles.description}>
            The Open Source Consent Package provides a secure, privacy-focused
            solution for managing and sharing consent data. Built with
            transparency and user control at its core, it helps organizations
            maintain compliance while respecting user privacy.
          </Text>
          <Button
            appearance="primary"
            size="large"
            onClick={() => navigate("/get-started")}
            className={styles.ctaButton}
          >
            Get Started
          </Button>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <ShieldLockRegular
              aria-hidden="true"
              className={styles.featureIcon}
            />
            <Title2 className={styles.featureTitle}>Secure by Design</Title2>
            <Text className={styles.featureDescription}>
              Built with security as a first principle, ensuring your consent
              data is always protected and handled with care.
            </Text>
          </div>
          <div className={styles.featureCard}>
            <DataTrendingRegular
              aria-hidden="true"
              className={styles.featureIcon}
            />
            <Title2 className={styles.featureTitle}>Privacy-Focused</Title2>
            <Text className={styles.featureDescription}>
              Empowers users with control over their data while helping
              organizations maintain compliance with privacy regulations.
            </Text>
          </div>
          <div className={styles.featureCard}>
            <CodeRegular aria-hidden="true" className={styles.featureIcon} />
            <Title2 className={styles.featureTitle}>Open Source</Title2>
            <Text className={styles.featureDescription}>
              Transparent, community-driven development that you can trust and
              contribute to.
            </Text>
          </div>
        </div>
      </section>
    </div>
  );
}
