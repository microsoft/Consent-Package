// First import the API switcher, mock vs real API
import "./utils/apiSwitcher.js";

import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import App from "./App.js";
import "./main.css";

import { Home } from "./components/Home.js";
import { GetStarted } from "./components/GetStarted.js";
import { ComponentsPlayground } from "./components/ComponentsPlayground.js";
import { ProfilePage } from "./components/ProfilePage.js";
import PolicyEditorPage from "./components/PolicyEditorPage.js";
import PolicyListPage from "./components/PolicyListPage.js";
import PolicyViewPage from "./components/PolicyViewPage.js";

import { setDataAdapter } from "@open-source-consent/api/shared";
import { IndexedDBDataAdapter } from "@open-source-consent/data-adapter-indexeddb";

// Initialize and set the data adapter before rendering the application
const dataAdapter = new IndexedDBDataAdapter();
setDataAdapter(dataAdapter);

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "playground", element: <ComponentsPlayground /> },
      { path: "get-started", element: <GetStarted /> },
      { path: "profile/:userId", element: <ProfilePage /> },
      { path: "policy/new", element: <PolicyEditorPage /> },
      {
        path: "policy/edit/:policyId",
        element: <PolicyEditorPage />,
      },
      { path: "policy/view/:policyId", element: <PolicyViewPage /> },
      { path: "policies", element: <PolicyListPage /> },
      { path: "*", element: <Navigate to="/" replace={true} /> }, // Corrected catch-all route
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <FluentProvider theme={webLightTheme}>
      <RouterProvider router={router} />
    </FluentProvider>
  </React.StrictMode>
);
