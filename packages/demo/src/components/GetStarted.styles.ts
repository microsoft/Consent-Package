// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import { makeStyles, tokens } from '@fluentui/react-components';

export const useStyles = makeStyles({
  root: {
    padding: '24px 64px',
    margin: '0 auto',
    '@media (max-width: 768px)': {
      padding: '24px',
    },
  },
  stepperWrapper: {
    marginBottom: '48px',
  },
  groupLabelsContainer: {
    display: 'flex',
    marginBottom: '16px',
    padding: '0 8px',
    width: '100%',
    '@media (max-width: 768px)': {
      justifyContent: 'flex-start',
      gap: '32px',
      overflowX: 'auto',
      paddingBottom: '8px',
    },
  },
  groupLabelItem: {
    textAlign: 'center',
    flexShrink: 0,
    '@media (min-width: 769px)': {
      flexGrow: 1,
      flexBasis: '0',
      minWidth: '0',
    },
  },
  groupLabelText: {
    fontWeight: tokens.fontWeightBold,
    fontSize: tokens.fontSizeBase500,
    paddingBottom: '4px',
  },
  stepper: {
    display: 'flex',
    justifyContent: 'space-around',
    position: 'relative',
    padding: '0 16px',
    paddingTop: '4px',
    overflowX: 'auto',
    '@media (max-width: 768px)': {
      justifyContent: 'flex-start',
      gap: '12px',
      paddingBottom: '8px',
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '20px',
      left: '40px',
      right: '40px',
      height: '3px',
      zIndex: 0,
      transition: 'background-color var(--transition-speed) ease',
      '@media (max-width: 768px)': {
        left: '20px',
        right: '20px',
      },
    },
  },
  step: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
    transition: 'transform var(--transition-speed) ease',
    minWidth: 'auto',
    maxWidth: '120px',
    textAlign: 'center',
    cursor: 'pointer',
    flexGrow: 1,
    flexBasis: '0',
    padding: '0 4px',
    '&:hover': {
      transform: 'translateY(-2px)',
    },
    '@media (max-width: 768px)': {
      minWidth: '60px',
      flexShrink: 0,
    },
  },
  stepNumber: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '2px solid',
    background: tokens.colorNeutralBackground1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
    transition: 'all var(--transition-speed) ease',
    boxShadow: tokens.shadow2,
    '@media (max-width: 768px)': {
      width: '32px',
      height: '32px',
      fontSize: '14px',
      marginBottom: '8px',
    },
  },
  stepNumberActive: {
    transform: 'scale(1.1)',
    boxShadow: tokens.shadow8,
  },
  stepLabel: {
    fontSize: '12px',
    transition: 'color var(--transition-speed) ease',
    wordBreak: 'break-word',
    whiteSpace: 'normal',
    lineHeight: '1.2',
    '@media (max-width: 768px)': {
      fontSize: '10px',
      maxWidth: '100%',
    },
  },
  slide: {
    minHeight: '400px',
    display: 'flex',
    flexDirection: 'column',
  },
  navigation: {
    marginTop: 'auto',
    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: '24px',
    '& button:first-child': {
      marginRight: '8px',
    },
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '400px',
  },
});
