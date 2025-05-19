import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './components/Home.js';
import { GetStarted } from './components/GetStarted.js';
import { ComponentsPlayground } from './components/ComponentsPlayground.js';
import { ProfilePage } from './components/ProfilePage.js';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { makeStyles } from "@fluentui/react-components";
const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
  },
  main: {
    flex: 1,
    paddingTop: "64px", // Header height
  }
});

export default function App(): JSX.Element {
  const styles = useStyles();

  return (
    <BrowserRouter>
      <div className={styles.root}>
        <Header />
        <main className={styles.main}>
          <Routes>
            <Route path="/playground" element={<ComponentsPlayground />} />
            <Route path="/get-started" element={<GetStarted />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/" element={<Home />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
