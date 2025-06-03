import React from 'react';

interface ThemeProviderProps {
  children: React.ReactNode;
  theme?: Partial<{
    // Color System
    primary: string;
    primaryHover: string;
    primaryDisabled: string;
    secondary: string;
    secondaryHover: string;
    secondaryForeground: string;
    danger: string;
    dangerHover: string;
    dangerDisabled: string;

    // Background Colors
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;

    // Text Colors
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    textDisabled: string;

    // Border Colors
    borderPrimary: string;
    borderSecondary: string;
    borderTertiary: string;
  }>;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  theme = {},
}) => {
  const styleRef = React.useRef<HTMLStyleElement | null>(null);

  React.useEffect(() => {
    // Create or get style element
    if (!styleRef.current) {
      styleRef.current = document.createElement('style');
      document.head.appendChild(styleRef.current);
    }

    // Generate CSS custom properties
    const cssVars = Object.entries(theme)
      .map(([key, value]) => {
        const cssVarName = `--osc-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        return `${cssVarName}: ${value};`;
      })
      .join('\n');

    // Update style element
    styleRef.current.textContent = `:root {\n${cssVars}\n}`;
  }, [theme]);

  return <>{children}</>;
};

export { ThemeProvider };
export type { ThemeProviderProps };
