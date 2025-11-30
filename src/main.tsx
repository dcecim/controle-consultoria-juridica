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
      components: {
        Button: { defaultProps: { colorScheme: "brand" }, baseStyle: { _focusVisible: { boxShadow: "0 0 0 3px var(--chakra-colors-brand-500)" } }, variants: { outline: { borderColor: "brand.500", color: "brand.600", _hover: { borderColor: "brand.600", color: "brand.600" } } } },
        Input: { defaultProps: { focusBorderColor: "brand.500" }, variants: { outline: { field: { _focusVisible: { boxShadow: "0 0 0 3px var(--chakra-colors-brand-500)" }, borderColor: "brand.500", _invalid: { borderColor: "brand.600", boxShadow: "0 0 0 3px var(--chakra-colors-brand-600)" } }, addon: { borderColor: "brand.500" } } } },
        Select: { defaultProps: { focusBorderColor: "brand.500" }, variants: { outline: { field: { _focusVisible: { boxShadow: "0 0 0 3px var(--chakra-colors-brand-500)" }, borderColor: "brand.500", _invalid: { borderColor: "brand.600", boxShadow: "0 0 0 3px var(--chakra-colors-brand-600)" } } } } },
        Textarea: { defaultProps: { focusBorderColor: "brand.500" }, variants: { outline: { field: { _focusVisible: { boxShadow: "0 0 0 3px var(--chakra-colors-brand-500)" }, borderColor: "brand.500", _invalid: { borderColor: "brand.600", boxShadow: "0 0 0 3px var(--chakra-colors-brand-600)" } } } } },
        FormError: { baseStyle: { text: { color: "brand.600" }, icon: { color: "brand.600" } } },
        FormLabel: { baseStyle: { _focus: { color: "brand.600" } } },
        Checkbox: { defaultProps: { colorScheme: "brand" } },
        Switch: { defaultProps: { colorScheme: "brand" } },
        Radio: { defaultProps: { colorScheme: "brand" } },
        Progress: { defaultProps: { colorScheme: "brand" } },
        Tabs: { defaultProps: { variant: "enclosed" }, baseStyle: { tab: { _selected: { color: "brand.600", borderColor: "brand.500" }, _focusVisible: { boxShadow: "0 0 0 3px var(--chakra-colors-brand-500)" } }, tablist: { borderColor: "brand.500" } } },
        Stepper: { defaultProps: { colorScheme: "brand" } },
        Badge: { defaultProps: { colorScheme: "brand", variant: "solid" }, baseStyle: { container: { borderRadius: "md" } } },
        Tag: { defaultProps: { colorScheme: "brand", variant: "solid" }, baseStyle: { container: { borderRadius: "md" } } },
        Alert: { defaultProps: { variant: "left-accent" } },
      },
      styles: { global: { body: { bg: "gray.900", color: "gray.100" } } },
    });
  }
  if (name === "sepia") {
    return extendTheme({
      config: { initialColorMode: "light", useSystemColorMode: false },
      colors: {
        brand: { 500: "#B08968", 600: "#9C6B4E" },
        blue: { 500: "#B47B3E", 600: "#9C6B30" },
        gray: { 50: "#FFF7ED", 100: "#FFEAD5", 200: "#FED7AA", 700: "#6B4F3D", 800: "#5B4636" },
      },
      components: {
        Button: { defaultProps: { colorScheme: "brand" }, baseStyle: { _focusVisible: { boxShadow: "0 0 0 3px var(--chakra-colors-brand-500)" } }, variants: { outline: { borderColor: "brand.500", color: "brand.600", _hover: { borderColor: "brand.600", color: "brand.600" } } } },
        Input: { defaultProps: { focusBorderColor: "brand.500" }, variants: { outline: { field: { _focusVisible: { boxShadow: "0 0 0 3px var(--chakra-colors-brand-500)" }, borderColor: "brand.500", _invalid: { borderColor: "brand.600", boxShadow: "0 0 0 3px var(--chakra-colors-brand-600)" } }, addon: { borderColor: "brand.500" } } } },
        Select: { defaultProps: { focusBorderColor: "brand.500" }, variants: { outline: { field: { _focusVisible: { boxShadow: "0 0 0 3px var(--chakra-colors-brand-500)" }, borderColor: "brand.500", _invalid: { borderColor: "brand.600", boxShadow: "0 0 0 3px var(--chakra-colors-brand-600)" } } } } },
        Textarea: { defaultProps: { focusBorderColor: "brand.500" }, variants: { outline: { field: { _focusVisible: { boxShadow: "0 0 0 3px var(--chakra-colors-brand-500)" }, borderColor: "brand.500", _invalid: { borderColor: "brand.600", boxShadow: "0 0 0 3px var(--chakra-colors-brand-600)" } } } } },
        FormError: { baseStyle: { text: { color: "brand.600" }, icon: { color: "brand.600" } } },
        FormLabel: { baseStyle: { _focus: { color: "brand.600" } } },
        Checkbox: { defaultProps: { colorScheme: "brand" } },
        Switch: { defaultProps: { colorScheme: "brand" } },
        Radio: { defaultProps: { colorScheme: "brand" } },
        Progress: { defaultProps: { colorScheme: "brand" } },
        Tabs: { defaultProps: { variant: "enclosed" }, baseStyle: { tab: { _selected: { color: "brand.600", borderColor: "brand.500" }, _focusVisible: { boxShadow: "0 0 0 3px var(--chakra-colors-brand-500)" } }, tablist: { borderColor: "brand.500" } } },
        Stepper: { defaultProps: { colorScheme: "brand" } },
        Badge: { defaultProps: { colorScheme: "brand", variant: "solid" }, baseStyle: { container: { borderRadius: "md" } } },
        Tag: { defaultProps: { colorScheme: "brand", variant: "subtle" }, baseStyle: { container: { borderRadius: "md" } } },
        Alert: { defaultProps: { variant: "left-accent" } },
      },
      styles: { global: { body: { bg: "#FFF7ED", color: "#5B4636" } } },
    });
  }
  if (name === "ocean") {
    return extendTheme({
      config: { initialColorMode: "light", useSystemColorMode: false },
      colors: {
        brand: { 500: "#0EA5E9", 600: "#0284C7" },
        blue: { 500: "#0EA5E9", 600: "#0284C7" },
        gray: { 50: "#F0F9FF", 100: "#E0F2FE", 200: "#BAE6FD", 700: "#0F172A", 800: "#0B1220" },
      },
      components: {
        Button: { defaultProps: { colorScheme: "brand" }, baseStyle: { _focusVisible: { boxShadow: "0 0 0 3px var(--chakra-colors-brand-500)" } }, variants: { outline: { borderColor: "brand.500", color: "brand.600", _hover: { borderColor: "brand.600", color: "brand.600" } } } },
        Input: { defaultProps: { focusBorderColor: "brand.500" }, variants: { outline: { field: { _focusVisible: { boxShadow: "0 0 0 3px var(--chakra-colors-brand-500)" }, borderColor: "brand.500", _invalid: { borderColor: "brand.600", boxShadow: "0 0 0 3px var(--chakra-colors-brand-600)" } }, addon: { borderColor: "brand.500" } } } },
        Select: { defaultProps: { focusBorderColor: "brand.500" }, variants: { outline: { field: { _focusVisible: { boxShadow: "0 0 0 3px var(--chakra-colors-brand-500)" }, borderColor: "brand.500", _invalid: { borderColor: "brand.600", boxShadow: "0 0 0 3px var(--chakra-colors-brand-600)" } } } } },
        Textarea: { defaultProps: { focusBorderColor: "brand.500" }, variants: { outline: { field: { _focusVisible: { boxShadow: "0 0 0 3px var(--chakra-colors-brand-500)" }, borderColor: "brand.500", _invalid: { borderColor: "brand.600", boxShadow: "0 0 0 3px var(--chakra-colors-brand-600)" } } } } },
        FormError: { baseStyle: { text: { color: "brand.600" }, icon: { color: "brand.600" } } },
        FormLabel: { baseStyle: { _focus: { color: "brand.600" } } },
        Checkbox: { defaultProps: { colorScheme: "brand" } },
        Switch: { defaultProps: { colorScheme: "brand" } },
        Radio: { defaultProps: { colorScheme: "brand" } },
        Progress: { defaultProps: { colorScheme: "brand" } },
        Tabs: { defaultProps: { variant: "enclosed" }, baseStyle: { tab: { _selected: { color: "brand.600", borderColor: "brand.500" }, _focusVisible: { boxShadow: "0 0 0 3px var(--chakra-colors-brand-500)" } }, tablist: { borderColor: "brand.500" } } },
        Stepper: { defaultProps: { colorScheme: "brand" } },
        Badge: { defaultProps: { colorScheme: "brand", variant: "solid" }, baseStyle: { container: { borderRadius: "md" } } },
        Tag: { defaultProps: { colorScheme: "brand", variant: "subtle" }, baseStyle: { container: { borderRadius: "md" } } },
        Alert: { defaultProps: { variant: "left-accent" } },
      },
      styles: { global: { body: { bg: "#F0F9FF", color: "#0F172A" } } },
    });
  }
  return extendTheme({
    config: { initialColorMode: "light", useSystemColorMode: false },
    colors: { brand: { 500: "#3182CE", 600: "#2B6CB0" } },
    components: {
      Button: { defaultProps: { colorScheme: "brand" }, baseStyle: { _focusVisible: { boxShadow: "0 0 0 3px var(--chakra-colors-brand-500)" } }, variants: { outline: { borderColor: "brand.500", color: "brand.600", _hover: { borderColor: "brand.600", color: "brand.600" } } } },
      Input: { defaultProps: { focusBorderColor: "brand.500" }, variants: { outline: { field: { _focusVisible: { boxShadow: "0 0 0 3px var(--chakra-colors-brand-500)" }, borderColor: "brand.500", _invalid: { borderColor: "brand.600", boxShadow: "0 0 0 3px var(--chakra-colors-brand-600)" } }, addon: { borderColor: "brand.500" } } } },
      Select: { defaultProps: { focusBorderColor: "brand.500" }, variants: { outline: { field: { _focusVisible: { boxShadow: "0 0 0 3px var(--chakra-colors-brand-500)" }, borderColor: "brand.500", _invalid: { borderColor: "brand.600", boxShadow: "0 0 0 3px var(--chakra-colors-brand-600)" } } } } },
      Textarea: { defaultProps: { focusBorderColor: "brand.500" }, variants: { outline: { field: { _focusVisible: { boxShadow: "0 0 0 3px var(--chakra-colors-brand-500)" }, borderColor: "brand.500", _invalid: { borderColor: "brand.600", boxShadow: "0 0 0 3px var(--chakra-colors-brand-600)" } } } } },
      FormError: { baseStyle: { text: { color: "brand.600" }, icon: { color: "brand.600" } } },
      FormLabel: { baseStyle: { _focus: { color: "brand.600" } } },
      Checkbox: { defaultProps: { colorScheme: "brand" } },
      Switch: { defaultProps: { colorScheme: "brand" } },
      Radio: { defaultProps: { colorScheme: "brand" } },
      Progress: { defaultProps: { colorScheme: "brand" } },
      Tabs: { defaultProps: { variant: "enclosed" }, baseStyle: { tab: { _selected: { color: "brand.600", borderColor: "brand.500" }, _focusVisible: { boxShadow: "0 0 0 3px var(--chakra-colors-brand-500)" } }, tablist: { borderColor: "brand.500" } } },
      Stepper: { defaultProps: { colorScheme: "brand" } },
      Badge: { defaultProps: { colorScheme: "brand", variant: "solid" }, baseStyle: { container: { borderRadius: "md" } } },
      Tag: { defaultProps: { colorScheme: "brand", variant: "subtle" }, baseStyle: { container: { borderRadius: "md" } } },
      Alert: { defaultProps: { variant: "left-accent" } },
    },
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
