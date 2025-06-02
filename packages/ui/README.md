# Open Source Consent UI Package

A React component library for building consent management interfaces.

## Installation

```bash
pnpm add @open-source-consent/ui
```

## Theme Customization

The UI package uses CSS custom properties (variables) for theming. You can customize the theme by using the `ThemeProvider` component and passing your theme values.

Note: This only currently applies to the AgeSelect, Profile, RoleSelect and Signature components. A future update would be needed to apply that to the ConsentFlow and Policy components.

### Basic Usage

```tsx
import { ThemeProvider } from '@open-source-consent/ui'

function App() {
  return (
    <ThemeProvider
      theme={{
        // Override specific theme values
        primary: '#1a73e8',
        primaryHover: '#1557b0',
        bgPrimary: '#ffffff',
        // ... other theme values
      }}
    >
      {/* Your app components */}
    </ThemeProvider>
  )
}
```

### Available Theme Properties

The theme system includes the following categories of properties:

#### Color System
- `primary`: Primary brand color
- `primaryHover`: Primary color hover state
- `primaryDisabled`: Primary color disabled state
- `secondary`: Secondary brand color
- `secondaryHover`: Secondary color hover state
- `secondaryForeground`: Secondary color text
- `danger`: Danger/error color
- `dangerHover`: Danger color hover state
- `dangerDisabled`: Danger color disabled state

#### Background Colors
- `bgPrimary`: Primary background color
- `bgSecondary`: Secondary background color
- `bgTertiary`: Tertiary background color

#### Text Colors
- `textPrimary`: Primary text color
- `textSecondary`: Secondary text color
- `textTertiary`: Tertiary text color
- `textDisabled`: Disabled text color

#### Border Colors
- `borderPrimary`: Primary border color
- `borderSecondary`: Secondary border color
- `borderTertiary`: Tertiary border color

### CSS Custom Properties

You can also override theme values using CSS custom properties directly in your stylesheet:

```css
:root {
  --osc-primary: #1a73e8;
  --osc-primary-hover: #1557b0;
  --osc-bg-primary: #ffffff;
  /* ... other theme values */
}
```

## Component Usage

Each component in the library is designed to work with the theme system. Components will automatically use the theme values provided through the `ThemeProvider` or CSS custom properties.

Example:

```tsx
import { ConsentFlow, ThemeProvider } from '@open-source-consent/ui'

function App() {
  return (
    <ThemeProvider
      theme={{
        primary: '#1a73e8',
        // ... other theme values
      }}
    >
      <ConsentFlow
        // ... component props
      />
    </ThemeProvider>
  )
}
```

## Best Practices

1. **Consistent Theming**: Use the `ThemeProvider` at the root of your application to ensure consistent theming across all components.

2. **Selective Overrides**: Only override the theme values you need to change. The default theme provides a solid foundation.

3. **CSS Custom Properties**: For global theme changes, consider using CSS custom properties in your stylesheet instead of the `ThemeProvider` props.
