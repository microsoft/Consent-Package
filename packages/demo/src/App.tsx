import { Outlet, ScrollRestoration } from "react-router";
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
    <>
      <ScrollRestoration />
      <div className={styles.root}>
        <Header />
        <main className={styles.main}>
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  );
}
