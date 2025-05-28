// First import the API switcher, mock vs real API
import './utils/apiSwitcher.js';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import App from './App.js';
import './main.css';

import { Home } from './components/Home.js';
import { GetStarted } from './components/GetStarted.js';
import { ComponentsPlayground } from './components/ComponentsPlayground.js';
import { ProfilePage } from './components/ProfilePage.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import PolicyEditorPage from './components/PolicyEditorPage.js';
import PolicyListPage from './components/PolicyListPage.js';
import PolicyViewPage from './components/PolicyViewPage.js';
import { AuthProvider } from './utils/AuthContext.js';

import { setDataAdapter } from '@open-source-consent/api/shared';
import { setApiConfig } from '@open-source-consent/ui';
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FluentProvider theme={webLightTheme}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </FluentProvider>
  </React.StrictMode>,
);
