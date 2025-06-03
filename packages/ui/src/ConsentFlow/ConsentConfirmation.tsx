import React, { useEffect, useRef } from 'react';
import { makeStyles, tokens, Text, Checkbox } from '@fluentui/react-components';
import type { CheckboxProps } from '@fluentui/react-components';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalL,
  },
  header: {
    marginBottom: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    textAlign: 'center',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  checkboxContainer: {
    marginTop: tokens.spacingVerticalM,
  },
  icon: {
    fontSize: tokens.fontSizeBase600,
    width: '50px',
    height: '50px',
  },
});

interface ConsentConfirmationProps {
  title: string;
  messageBody: React.ReactNode;
  checkboxLabel: string;
  isChecked: boolean;
  onCheckboxChange(checked: boolean): void;
  children?: React.ReactNode;
  icon?: React.ReactElement;
}

const ConsentConfirmation: React.FC<ConsentConfirmationProps> = ({
  title,
  messageBody,
  checkboxLabel,
  isChecked,
  onCheckboxChange,
  children,
  icon,
}) => {
  const styles = useStyles();
  const titleRef = useRef<HTMLHeadingElement>(null);

  const handleCheckboxChange = (
    _ev: React.FormEvent<HTMLInputElement | HTMLLabelElement>,
    data: CheckboxProps,
  ): void => {
    onCheckboxChange(!!data.checked);
  };

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus();
    }
  }, []);

  return (
    <div className={styles.root}>
      <h2 ref={titleRef} className={styles.header} tabIndex={-1}>
        {icon && React.cloneElement(icon, { className: styles.icon })}
        {title}
      </h2>
      <div className={styles.content}>
        {typeof messageBody === 'string' ? (
          <Text>{messageBody}</Text>
        ) : (
          messageBody
        )}
        {children}
        <div className={styles.checkboxContainer}>
          <Checkbox
            label={checkboxLabel}
            checked={isChecked}
            onChange={handleCheckboxChange}
            required
          />
        </div>
      </div>
    </div>
  );
};

export default ConsentConfirmation;
