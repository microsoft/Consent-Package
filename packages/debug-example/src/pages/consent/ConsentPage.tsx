import { Outlet } from "react-router-dom";
import { makeStyles, tokens, Subtitle2 } from "@fluentui/react-components";

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingHorizontalXXL,
  },
  header: {
    marginBottom: tokens.spacingVerticalL,
  },
});

function ConsentPage(): JSX.Element {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <Subtitle2 as="h2" block className={styles.header}>
        Consent Management (Debug)
      </Subtitle2>
      <Outlet />
    </div>
  );
}

export default ConsentPage;
