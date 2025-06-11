// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

// First import the API switcher, mock vs real API
import './utils/apiSwitcher.js';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';

import App from './App.js';
import './main.css';

import Home from './components/Home.js';
import GetStarted from './components/GetStarted.js';
import ComponentsPlayground from './components/ComponentsPlayground.js';
import ProfilePage from './components/ProfilePage.js';
import ProtectedRoute from './components/ProtectedRoute.js';
import PolicyEditorPage from './components/PolicyEditorPage.js';
import PolicyListPage from './components/PolicyListPage.js';
import PolicyViewPage from './components/PolicyViewPage.js';
import AuthProvider from './utils/AuthContext.js';

import { setDataAdapter } from '@open-source-consent/api/shared';
import {
  setApiConfig,
  ThemeProvider as OSCThemeProvider,
  type ThemeProviderProps as OSCThemeProviderProps,
} from '@open-source-consent/ui';
import { IndexedDBDataAdapter } from '@open-source-consent/data-adapter-indexeddb';

// Initialize and set the data adapter before rendering the application
const dataAdapter = new IndexedDBDataAdapter();
setDataAdapter(dataAdapter);

/**
 * Our demo app uses a mock API by default but
 * the API config can be overridden to supply generic
 * configuration for the API. The UI package will
 * use any baseURL and headers from the API config by default.
 */
setApiConfig({
  // baseUrl: 'https://api.example.com',
  // headers: {
  //   'Authorization': 'Bearer MY_API_TOKEN',
  //   'X-Custom-Header': 'DemoAppValue'
  // },
  // credentials: 'include',
  // mode: 'cors',
  // cache: 'no-store',
  // redirect: 'follow',
  // timeout: 15000,
  arbitraryKey: 'arbitraryValue',
});

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <Home /> },
        { path: 'playground', element: <ComponentsPlayground /> },
        {
          path: 'get-started',
          element: (
            <ProtectedRoute requireNoUser>
              <GetStarted />
            </ProtectedRoute>
          ),
        },
        { path: 'profile/:userId', element: <ProfilePage /> },
        { path: 'policy/new', element: <PolicyEditorPage /> },
        {
          path: 'policy/edit/:policyId',
          element: <PolicyEditorPage />,
        },
        { path: 'policy/view/:policyId', element: <PolicyViewPage /> },
        { path: 'policies', element: <PolicyListPage /> },
        { path: '*', element: <Navigate to="/" replace={true} /> },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  },
);

const demoTheme = {
  ...webLightTheme,
  /**
   * This is the default theme color for the demo app. Would apply to button backgrounds, checkbox backgrounds, etc.
   *
   * More about the Fluent UI Theme system described here:
   * - Theming Docs: https://react.fluentui.dev/?path=/docs/concepts-developer-theming--docs
   * - Theme Designer with export: https://react.fluentui.dev/?path=/docs/theme-theme-designer--docs
   * - More properties that can be overridden: https://react.fluentui.dev/?path=/docs/theme-colors--docs
   */
  // colorBrandBackground: '#635BFF',
};

// UI package components' theme customization
const uiPackageTheme: OSCThemeProviderProps['theme'] = {
  // Default Theme Colors below. Change the values and view at '/playground'
  /* primary: '#0078d4',
  primaryHover: '#106ebe',
  primaryDisabled: 'rgba(0, 120, 212, 0.1)',
  
  secondary: '#f3f2f1',
  secondaryHover: '#e1dfdd',
  secondaryForeground: '#323130',
  
  danger: '#d13438',
  dangerHover: '#c50f1f',
  dangerDisabled: 'rgba(209, 52, 56, 0.1)',
  
  // Background Colors
  bgPrimary: '#fdf8f0',
  bgSecondary: '#fff',
  bgTertiary: '#f3f2f1',
  
  // Text Colors
  textPrimary: '#1e232c',
  textSecondary: '#a19983',
  textTertiary: '#fff',
  textDisabled: '#a19f9d',
  
  // Border Colors
  borderPrimary: '#fcdaa4',
  borderSecondary: '#f8b5ab',
  borderTertiary: '#f3cbb7',
  */
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FluentProvider theme={demoTheme}>
      <OSCThemeProvider theme={uiPackageTheme}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </OSCThemeProvider>
    </FluentProvider>
  </React.StrictMode>,
);
