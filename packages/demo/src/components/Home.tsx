// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

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

export default function Home(): JSX.Element {
  const styles = useStyles();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <div className={styles.root}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <Title1 as="h1" className={styles.title}>
            Build consent into your project with confidence!
          </Title1>
          <Text className={styles.description}>
            The <b>Consent Package is a Software Development Kit</b> providing a customizable set of packages that allows developers to implement     auditable, traceable, privacy-focused functionality for managing and sharing consent data. The Consent Package is a flexible starting point for managing consent in applications, with features that prioritize transparency, user control, and privacy.  
            <br />
            <br />
            The Consent Package contains functionality for building consent management systems with audit trails, granular permissions, revocability, proxy consent, and flexible storage backends. Please visit the Consent Package on GitHub to integrate consent into your own work!
            <br />
            <br />
            This site demonstrates how the UI component library and backend packages, including the API, core services, and database packages, might be used in a real-world context. Get started with the Consent or Admin demos below! 
          </Text>
          <div className={styles.buttonContainer}>
            <Button
              appearance="primary"
              size="large"
              onClick={() => {
                if (currentUser) {
                  void navigate(`/profile/${currentUser.name}`);
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
            This site is designed to provide an example of a consent flow that was built using the Consent Package. There are two demo experiences on the site – one for the user providing consent and one for an admin setting up the content and data requirements within a particular consent flow.
            <br />
            <br />
            Everything you see on this site is included in the Consent Package and can be used to build similar flows in your projects.
            <br />
            <br />
            The Playground section of this demo site provides examples of how the UI components in the Consent Package can be used. New components and current component updates can be viewed there.
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
            <a
              href="https://github.com/microsoft/Open-Source-Consent-Package"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-link"
            >
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
            The Consent Package was created collaboration between{' '}
            <a
              href="https://www.microsoft.com/en-us/research/project/project-resolve/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-link"
            >
              Microsoft Research's Project Resolve
            </a>{' '},{' '}
            <a
              href="https://flok.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-link"
            >
              flok
            </a>, an organization whose mission is
            to rally the inherited metabolic disorder community to continuously
            improve our care and accelerate scientific progress, and{' '}
            <a
              href="https://www.bocoup.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-link"
            >
              Microsoft Research's Project Resolve
            </a>, a
            worker-owned technology consultancy committed to building
            technologies that that resist capture, safeguard privacy, and
            interoperate intentionally.
          </Text>
        </div>
      </section>
    </div>
  );
}
