import { Outlet, ScrollRestoration } from 'react-router';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { makeStyles, shorthands } from '@fluentui/react-components';
import { useAuth } from './utils/useAuth.js';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  main: {
    flex: 1,
    ...shorthands.padding('16px'),
    paddingTop: '88px',
  },
});

export default function App(): JSX.Element {
  const styles = useStyles();
  const { currentUser } = useAuth();

  return (
    <>
      <ScrollRestoration />
      <div className={styles.root}>
        <Header />
        <main className={styles.main} id="main" tabIndex={-1}>
          <Outlet context={{ user: currentUser }} />
        </main>
        <Footer />
      </div>
    </>
  );
}
