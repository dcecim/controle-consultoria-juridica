import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider, extendTheme, ColorModeScript, useColorMode } from "@chakra-ui/react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./AuthProvider";
import ErrorBoundary from "./ErrorBoundary";
import { I18nProvider } from "./i18n";

const rootEl = document.getElementById("root");
try {
  const meta = import.meta as unknown as { env?: Record<string, unknown> };
  const envTenant = meta.env?.VITE_TENANT_ID as string | undefined;
  const current = localStorage.getItem("tenantId");
  const desired = envTenant ?? current ?? "1";
  localStorage.setItem("tenantId", String(desired));
} catch { /* ignore */ }
console.log("[main] mount start", !!rootEl);
function getTheme(name: string) {
  if (name === "dark") {
    return extendTheme({
      config: { initialColorMode: "dark", useSystemColorMode: false },
      colors: {
        brand: { 500: "#3B82F6", 600: "#2563EB" },
      },
      styles: { global: { body: { bg: "gray.900", color: "gray.100" } } },
    });
  }
  if (name === "sepia") {
    return extendTheme({
      config: { initialColorMode: "light", useSystemColorMode: false },
      colors: {
        brand: { 500: "#B08968", 600: "#9C6B4E" },
      },
      styles: { global: { body: { bg: "#FFF7ED", color: "#5B4636" } } },
    });
  }
  if (name === "ocean") {
    return extendTheme({
      config: { initialColorMode: "light", useSystemColorMode: false },
      colors: {
        brand: { 500: "#0EA5E9", 600: "#0284C7" },
      },
      styles: { global: { body: { bg: "#F0F9FF", color: "#0F172A" } } },
    });
  }
  return extendTheme({
    config: { initialColorMode: "light", useSystemColorMode: false },
    colors: { brand: { 500: "#3182CE", 600: "#2B6CB0" } },
    styles: { global: { body: { bg: "gray.50", color: "gray.800" } } },
  });
}

export function ColorModeSync({ themeName }: { themeName: string }) {
  const { setColorMode } = useColorMode();
  React.useEffect(() => {
    const desired = themeName === "dark" ? "dark" : "light";
    setColorMode(desired as "light" | "dark");
  }, [themeName, setColorMode]);
  return null;
}

export function ThemeController() {
  const [themeName, setThemeName] = React.useState<string>(() => localStorage.getItem("themeName") || "light");
  React.useEffect(() => {
    const handler = () => setThemeName(localStorage.getItem("themeName") || "light");
    window.addEventListener("storage", handler);
    window.addEventListener("theme:change", handler as EventListener);
    return () => { window.removeEventListener("storage", handler); window.removeEventListener("theme:change", handler as EventListener); };
  }, []);
  const theme = React.useMemo(() => getTheme(themeName), [themeName]);
  const initialMode = themeName === "dark" ? "dark" : "light";
  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={initialMode} />
      <ColorModeSync themeName={themeName} />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ChakraProvider>
  );
}

ReactDOM.createRoot(rootEl!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <ThemeController />
      </I18nProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
console.log("[main] mount done");
