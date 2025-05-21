// First import the API switcher, mock vs real API
import "./utils/apiSwitcher.js";

import React from "react";
import ReactDOM from "react-dom/client";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import App from "./App.js";
import "./main.css";

import { setDataAdapter } from "@open-source-consent/api/shared";
import { IndexedDBDataAdapter } from "@open-source-consent/data-adapter-indexeddb";

// Initialize and set the data adapter before rendering the application
const dataAdapter = new IndexedDBDataAdapter();
setDataAdapter(dataAdapter);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <FluentProvider theme={webLightTheme}>
      <App />
    </FluentProvider>
  </React.StrictMode>
);
