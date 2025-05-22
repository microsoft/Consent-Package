import {
  makeStyles,
  Text,
  Title2,
  Title3,
  tokens,
} from '@fluentui/react-components';

interface Detail {
  title: string;
  items: string[];
}

interface ConsentDetailsProps {
  title: string;
  description: string;
  details: Detail[];
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    marginBottom: '32px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '16px',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
  },
});

const ConsentDetails = ({
  title,
  description,
  details,
}: ConsentDetailsProps): JSX.Element => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <Title2 align="center">{title}</Title2>
      <Text align="center">{description}</Text>
      {details.map((detail, index) => (
        <div key={index} className={styles.section}>
          <Title3>{detail.title}</Title3>
          {detail.items.map((item, itemIndex) => (
            <li key={itemIndex}>{item}</li>
          ))}
        </div>
      ))}
    </div>
  );
};

export default ConsentDetails;
