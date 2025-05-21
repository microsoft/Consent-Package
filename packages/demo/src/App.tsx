import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Home } from "./components/Home.js";
import { GetStarted } from "./components/GetStarted.js";
import { ComponentsPlayground } from "./components/ComponentsPlayground.js";
import { ProfilePage } from "./components/ProfilePage.js";
import PolicyEditorPage from "./components/PolicyEditorPage.js";
import PolicyListPage from "./components/PolicyListPage.js";
import PolicyViewPage from "./components/PolicyViewPage.js";
import { Header } from "./components/Header.js";
import { Footer } from "./components/Footer.js";
import { makeStyles } from "@fluentui/react-components";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
  },
  main: {
    flex: 1,
    paddingTop: "64px", // Header height
  },
});

export default function App(): JSX.Element {
  const styles = useStyles();

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className={styles.root}>
        <Header />
        <main className={styles.main}>
          <Routes>
            <Route path="/playground" element={<ComponentsPlayground />} />
            <Route path="/get-started" element={<GetStarted />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/policy/new" element={<PolicyEditorPage />} />
            <Route
              path="/policy/edit/:policyId"
              element={<PolicyEditorPage />}
            />
            <Route path="/policy/view/:policyId" element={<PolicyViewPage />} />
            <Route path="/policies" element={<PolicyListPage />} />
            <Route path="/" element={<Home />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
