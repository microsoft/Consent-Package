import { useNavigate } from 'react-router';
import {
  makeStyles,
  tokens,
  Text,
  Title1,
  Button,
  Title2,
} from '@fluentui/react-components';
import {
  ShieldLockRegular,
  DataTrendingRegular,
  CodeRegular,
} from '@fluentui/react-icons';
import { useAuth } from '../utils/useAuth.js';

const useStyles = makeStyles({
  root: {
    backgroundColor: 'var(--color-background)',
    display: 'flex',
    flexDirection: 'column',
  },
  hero: {
    padding: 'calc(var(--spacing-unit) * 12) calc(var(--spacing-unit) * 2)',
    textAlign: 'center',
    background:
      'linear-gradient(180deg, var(--color-background) 0%, var(--color-border) 100%)',
  },
  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '800px',
    margin: '0 auto',
  },
  title: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightBold,
    color: 'var(--color-text)',
    marginBottom: 'calc(var(--spacing-unit) * 3)',
    lineHeight: 1.2,
  },
  description: {
    fontSize: tokens.fontSizeBase500,
    color: 'var(--color-text-light)',
    marginBottom: 'calc(var(--spacing-unit) * 4)',
    lineHeight: 1.6,
  },
  features: {
    padding: 'calc(var(--spacing-unit) * 8) calc(var(--spacing-unit) * 2)',
    backgroundColor: 'var(--color-background)',
  },
  featuresGrid: {
    display: 'grid',
    maxWidth: '1200px',
    margin: '0 auto',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 'calc(var(--spacing-unit) * 4)',
  },
  featureCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: 'calc(var(--spacing-unit) * 4)',
    backgroundColor: 'var(--color-background)',
    borderRadius: 'var(--border-radius)',
    border: `var(--border-width) solid var(--color-border)`,
    transition:
      'transform var(--transition-speed) ease, box-shadow var(--transition-speed) ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
    boxShadow: '0 4px 24px 0 rgba(80, 80, 120, 0.1)',
    gap: 'calc(var(--spacing-unit) * 2)',
  },
  featureIcon: {
    fontSize: '32px',
    color: 'var(--color-primary)',
  },
  featureTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: 'var(--color-text)',
    marginBottom: 'calc(var(--spacing-unit) * 2)',
  },
  featureDescription: {
    fontSize: tokens.fontSizeBase300,
    color: 'var(--color-text-light)',
    lineHeight: 1.6,
  },
  buttonContainer: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  ctaButton: {
    padding: 'calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 4)',
    borderRadius: 'calc(var(--spacing-unit) * 3)',
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    transition: 'all var(--transition-speed) ease',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
  },
  info: {
    padding: 'calc(var(--spacing-unit) * 4) calc(var(--spacing-unit) * 2)',
  },
  infoContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    maxWidth: '800px',
    margin: '0 auto',
  },
  infoTitle: {
    fontSize: tokens.fontSizeHero600,
    fontWeight: tokens.fontWeightBold,
    color: 'var(--color-text)',
    marginBottom: 'var(--spacing-unit)',
  },
  infoDescription: {
    fontSize: tokens.fontSizeBase400,
    color: 'var(--color-text-light)',
    lineHeight: 1.6,
  },
  infoList: {
    paddingLeft: '18px',
    marginTop: '8px',
    marginBottom: '8px',
  },
});

export function Home(): JSX.Element {
  const styles = useStyles();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <div className={styles.root}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <Title1 as="h1" className={styles.title}>
            Share Consent with Confidence
          </Title1>
          <Text className={styles.description}>
            The Consent Package provides an auditable, traceable,
            privacy-focused solution for managing and sharing consent data.
            Built with transparency and user control at its core, it helps
            organizations maintain compliance while respecting user privacy.
            <br />
            <br />
            This site provides context, examples, and two demos for how the
            package works and our documentation shows you how to implement it
            yourself. Get started with the Consent or Admin demos below!
          </Text>
          <div className={styles.buttonContainer}>
            <Button
              appearance="primary"
              size="large"
              onClick={() => {
                if (currentUser) {
                  void navigate(`/profile/${currentUser.id}`);
                } else {
                  void navigate('/get-started');
                }
              }}
              className={styles.ctaButton}
            >
              {currentUser ? 'View Profile' : 'Consent Demo'}
            </Button>
            <Button
              appearance="secondary"
              size="large"
              onClick={() => {
                void navigate('/policies');
              }}
              className={styles.ctaButton}
            >
              Admin Demo
            </Button>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <ShieldLockRegular
              aria-hidden="true"
              className={styles.featureIcon}
            />
            <Title2 as="h2" className={styles.featureTitle}>
              Auditable by Design
            </Title2>
            <Text className={styles.featureDescription}>
              Built with auditability and immutability as first principles,
              ensuring your consent stores are always auditable and traceable.
            </Text>
          </div>
          <div className={styles.featureCard}>
            <DataTrendingRegular
              aria-hidden="true"
              className={styles.featureIcon}
            />
            <Title2 as="h2" className={styles.featureTitle}>
              Privacy-Focused
            </Title2>
            <Text className={styles.featureDescription}>
              Empowers users with control over their data by encouraging
              granular consent systems.
            </Text>
          </div>
          <div className={styles.featureCard}>
            <CodeRegular aria-hidden="true" className={styles.featureIcon} />
            <Title2 as="h2" className={styles.featureTitle}>
              Open Source
            </Title2>
            <Text className={styles.featureDescription}>
              Transparent, community-driven development that you can trust and
              contribute to.
            </Text>
          </div>
        </div>
      </section>
      <section className={styles.info}>
        <div className={styles.infoContent}>
          <Title2 as="h2" className={styles.infoTitle}>
            What is on this site?
          </Title2>
          <Text className={styles.infoDescription}>
            The demos on this site are broken down into two experiences. The
            Consent Demo engages in the process of providing consent for data to
            be used in an application. The Admin Demo outlines how an admin
            would set up a consent framework's consent and data requirements.
            <br />
            <br />
            The Playground section of this demo site provides examples of how
            the components in the Consent Package can be used. New components
            and current component updates can be viewed there.
          </Text>
        </div>
      </section>
      <section className={styles.info}>
        <div className={styles.infoContent}>
          <Title2 as="h2" className={styles.infoTitle}>
            The Consent Package
          </Title2>
          <Text className={styles.infoDescription}>
            The Consent Package itself, is made up of several packages:
            <ul className={styles.infoList}>
              <li>
                <b>ui</b> - component library for policy authoring and consent
                authorization/revocation.
              </li>
              <li>
                <b>api</b> - Azure functions for creating and reading both
                policies and consent, with minimal API wrappers for core logic
                and data adapter.
              </li>
              <li>
                <b>core</b> - Core logic.
              </li>
              <li>
                <b>data-adapter-cosmosdb</b> - A simple data adapter for
                CosmosDB NoSQL API.
              </li>
              <li>
                <b>data-adapter-indexeddb</b> – A local client-side mockup of
                the API and database, used for the demo.
              </li>
              <li>
                <b>demo</b> - An application that utilizes the UI package and
                makes requests to the API to demonstrate the framework's use.
              </li>
            </ul>
            Please visit the{' '}
            <a href="https://github.com/microsoft/Open-Source-Consent-Package">
              Consent Package on GitHub
            </a>{' '}
            to collaborate, contribute, and integrate into your own work!
          </Text>
        </div>
      </section>
      <section className={styles.info}>
        <div className={styles.infoContent}>
          <Title2 as="h2" className={styles.infoTitle}>
            About the Project
          </Title2>
          <Text className={styles.infoDescription}>
            The Consent Package was created collaboration between Microsoft
            Research's Project Resolve, flok, an organization whose mission is
            to rally the inherited metabolic disorder community to continuously
            improve our care and accelerate scientific progress, and Bocoup, a
            worker-owned technology consultancy committed to building
            technologies that that resist capture, safeguard privacy, and
            interoperate intentionally.
            <br />
            <br />
            Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque
            faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi
            pretium tellus duis convallis. Tempus leo eu aenean sed diam urna
            tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas.
            Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut
            hendrerit semper vel class aptent taciti sociosqu. Ad litora
            torquent per conubia nostra inceptos himenaeos.
            <br />
            <br />
            Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque
            faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi
            pretium tellus duis convallis. Tempus leo eu aenean sed diam urna
            tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas.
            Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut
            hendrerit semper vel class aptent taciti sociosqu. Ad litora
            torquent per conubia nostra inceptos himenaeos.
          </Text>
        </div>
      </section>
    </div>
  );
}
