import { Suspense, lazy } from "react";
import {
  makeStyles,
  shorthands,
  tokens,
  Text,
  Title1,
} from "@fluentui/react-components";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";

const PolicyPage = lazy(() => import("./pages/PolicyPage.js"));
const PolicyListPage = lazy(() => import("./pages/policy/PolicyListPage.js"));
const CreatePolicyPage = lazy(
  () => import("./pages/policy/CreatePolicyPage.js")
);
const PolicyDetailsPage = lazy(
  () => import("./pages/policy/PolicyDetailsPage.js")
);

const ConsentPage = lazy(() => import("./pages/consent/ConsentPage.js"));
const ConsentListPage = lazy(
  () => import("./pages/consent/ConsentListPage.js")
);
const RecordConsentPage = lazy(
  () => import("./pages/consent/RecordConsentPage.js")
);
const ConsentDetailsPage = lazy(
  () => import("./pages/consent/ConsentDetailsPage.js")
);

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.gap(tokens.spacingHorizontalXXL),
    ...shorthands.padding(tokens.spacingHorizontalXXL),
  },
  nav: {
    display: "flex",
    ...shorthands.gap(tokens.spacingHorizontalL),
    marginBottom: tokens.spacingVerticalXXL,
  },
  navLink: {
    textDecorationLine: "none",
    color: tokens.colorBrandForegroundLink,
    fontWeight: tokens.fontWeightSemibold,
    "&hover": {
      color: tokens.colorBrandForegroundLinkHover,
      textDecorationLine: "underline",
    },
  },
});

function HomePage(): JSX.Element {
  return (
    <Text>
      Welcome to the Consent Management Debug Example. Select an option above to
      get started.
    </Text>
  );
}

function App(): JSX.Element {
  const styles = useStyles();

  return (
    <Router>
      <div className={styles.container}>
        <Title1 as="h1">Consent & Policy Debug UI</Title1>
        <nav className={styles.nav}>
          <Link to="/" className={styles.navLink}>
            Home
          </Link>
          <Link to="/policy" className={styles.navLink}>
            Policy Management
          </Link>
          <Link to="/consent" className={styles.navLink}>
            Consent Debug
          </Link>
        </nav>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/policy/*" element={<PolicyPage />}>
              <Route index element={<Navigate to="list" replace />} />
              <Route path="list" element={<PolicyListPage />} />
              <Route path="create" element={<CreatePolicyPage />} />
              <Route path="details/:policyId" element={<PolicyDetailsPage />} />
            </Route>
            <Route path="consent/*" element={<ConsentPage />}>
              <Route index element={<Navigate to="list" replace />} />
              <Route path="list" element={<ConsentListPage />} />
              <Route path="record" element={<RecordConsentPage />} />
              <Route
                path="details/:consentId"
                element={<ConsentDetailsPage />}
              />
            </Route>
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
