import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./ErrorBoundary";
import { I18nProvider } from "./i18n";

const rootEl = document.getElementById("root");
console.log("[main] mount start", !!rootEl);
ReactDOM.createRoot(rootEl!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <ChakraProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ChakraProvider>
      </I18nProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
console.log("[main] mount done");
