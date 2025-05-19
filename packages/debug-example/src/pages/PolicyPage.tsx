import { Routes, Route, Link } from "react-router-dom";
import {
  makeStyles,
  shorthands,
  tokens,
  Subtitle1,
  Body1,
} from "@fluentui/react-components";
import PolicyListPage from "./policy/PolicyListPage.js";
import CreatePolicyPage from "./policy/CreatePolicyPage.js";
import PolicyDetailsPage from "./policy/PolicyDetailsPage.js";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap(tokens.spacingVerticalL),
    width: "100%",
    maxWidth: "960px",
  },
  nav: {
    display: "flex",
    ...shorthands.gap(tokens.spacingHorizontalM),
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  link: {
    textDecorationLine: "none",
    color: tokens.colorBrandForegroundLink,
    "&hover": {
      color: tokens.colorBrandForegroundLinkHover,
      textDecorationLine: "underline",
    },
  },
});

function PolicyPage(): JSX.Element {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <Subtitle1 as="h2">Policy Management</Subtitle1>
      <nav className={styles.nav}>
        <Link to="list" className={styles.link}>
          List Policies
        </Link>
        <Link to="create" className={styles.link}>
          Create New Policy
        </Link>
      </nav>
      <Body1>
        This section allows you to create, view, and manage different versions
        of policies.
      </Body1>
      <Routes>
        <Route path="list" element={<PolicyListPage />} />
        <Route path="create" element={<CreatePolicyPage />} />
        <Route path="details/:policyId" element={<PolicyDetailsPage />} />
        <Route index element={<PolicyListPage />} />
      </Routes>
    </div>
  );
}

export default PolicyPage;
