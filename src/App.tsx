import { useEffect, useState } from "react";
import { Box, Container, Text, Flex, useColorModeValue, Alert, AlertIcon, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Heading, VStack, HStack, Image, Spacer } from "@chakra-ui/react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import NavBar from "./components/NavBar";
import { useAuth } from "./useAuth";
import { getTenant } from "./lib/api";
import { useI18n } from "./useI18n";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Deals from "./pages/Deals";
import Upload from "./pages/Upload";
import Contacts from "./pages/Contacts";
import Organizations from "./pages/Organizations";
import Stages from "./pages/Stages";
import BusinessTypes from "./pages/BusinessTypes";
import Profiles from "./pages/Profiles";
import Users from "./pages/Users";
import ChangePassword from "./pages/ChangePassword";
import Tenant from "./pages/Tenant";
import HelpProvider from "./HelpProvider";
import { useHelp } from "./help-context";

function Protected({ feature, children }: { feature: string; children: React.ReactNode }) {
  const { canAccess, token } = useAuth();
  const hasToken = token || (typeof sessionStorage !== "undefined" ? (sessionStorage.getItem("token") || null) : null);
  if (!hasToken) return <Navigate to="/login" replace />;
  return canAccess(feature) ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, logout, role } = useAuth();
  const { t } = useI18n();
  const [showWarn, setShowWarn] = useState(false);
  const [idleLeft, setIdleLeft] = useState(0);
  const [idleMs, setIdleMs] = useState(4 * 60 * 1000);
  const [showWelcome, setShowWelcome] = useState(false);
  const [tenantName, setTenantName] = useState<string>("");
  const [tenantLogo, setTenantLogo] = useState<string>("");
  const help = useHelp();
  useEffect(() => {
    if (!token) return;
    const tenantId = Number(localStorage.getItem("tenantId") || 1);
    getTenant(tenantId).then((t) => {
      const mins = Number(t.session_idle_minutes ?? 4);
      setIdleMs(Math.max(1, mins) * 60 * 1000);
      setTenantName(t.name || "");
      setTenantLogo(t.logo_url || "/vite.svg");
    }).catch(() => {
      setIdleMs(4 * 60 * 1000);
    });
    if ((role || "") === "Master") {
      const key = `tenant:${tenantId}:welcome_master_shown`;
      const seen = localStorage.getItem(key);
      if (!seen) setTimeout(() => setShowWelcome(true), 0);
    }
    const blockPop = (e: PopStateEvent) => {
      void e;
      try { window.history.pushState(null, "", location.pathname); } catch { /* noop */ }
      navigate(location.pathname, { replace: true });
    };
    const blockKeys = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || "").toUpperCase();
      const isEditable = !!(target && target.isContentEditable);
      const inField = tag === "INPUT" || tag === "TEXTAREA" || isEditable;
      if ((e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) || (!inField && e.key === "Backspace")) {
        e.preventDefault();
      }
    };
    window.addEventListener("popstate", blockPop);
    window.addEventListener("keydown", blockKeys);
    const onTenantUpdated = () => {
      getTenant(tenantId).then((t) => {
        const mins = Number(t.session_idle_minutes ?? 4);
        setIdleMs(Math.max(1, mins) * 60 * 1000);
        setTenantName(t.name || "");
        setTenantLogo(t.logo_url || "/vite.svg");
      }).catch(() => void 0);
    };
    window.addEventListener("tenant:updated", onTenantUpdated as EventListener);

    let last = Date.now();
    const WARN_MS = 30 * 1000;
    const bump = () => { last = Date.now(); };
    ["mousemove","keydown","click","touchstart","scroll"].forEach(evt => window.addEventListener(evt, bump, { passive: true } as EventListenerOptions));
    const onVisibility = () => { if (!document.hidden) bump(); };
    document.addEventListener("visibilitychange", onVisibility);
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - last;
      const left = idleMs - elapsed;
      setIdleLeft(left);
      setShowWarn(left > 0 && left <= WARN_MS);
      if (elapsed > idleMs) {
        try { sessionStorage.setItem("session:expired", "idle"); } catch (e) { void e; }
        try { sessionStorage.removeItem("token"); } catch (e) { void e; }
        logout();
        navigate("/login", { replace: true });
      }
    }, 1000);

    return () => {
      window.removeEventListener("popstate", blockPop);
      window.removeEventListener("keydown", blockKeys);
      ["mousemove","keydown","click","touchstart","scroll"].forEach(evt => window.removeEventListener(evt, bump));
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
      window.removeEventListener("tenant:updated", onTenantUpdated as EventListener);
    };
  }, [token, role, location.pathname, navigate, logout, idleMs]);
  const appBg = useColorModeValue("gray.50", "#0b1220");
  const bannerBg = useColorModeValue("yellow.300", "yellow.700");
  const bannerColor = useColorModeValue("black", "yellow.50");
  return (
    <>
      <Flex align="center" px={6} py={4} bg={bannerBg} color={bannerColor} borderBottomWidth="1px" borderColor={useColorModeValue("yellow.400","yellow.800")}>        
        <Text fontSize="lg">Diagnóstico: React está renderizando.</Text>
        <Spacer />
        <VStack spacing={1} align="flex-end">
          <HStack spacing={3} align="center">
            <Image src={tenantLogo} alt="Logo" boxSize="32px" borderRadius="md" />
            <Text fontWeight="semibold">{tenantName}</Text>
          </HStack>
          <Text fontSize="xs" color={useColorModeValue("gray.700","yellow.100")}>Crédito: Diretoria de Informática da Cecim Advogados</Text>
        </VStack>
      </Flex>
      <Box minH="100vh" bg={appBg}>
        {showWarn && (
          <Alert status="warning" borderRadius={0} position="fixed" top={0} left={0} right={0} zIndex={5000}>
            <AlertIcon />
            {t("session_expiring")}: {Math.max(1, Math.ceil(idleLeft / 1000))}s
          </Alert>
        )}
        <HelpProvider>
          <Flex>
            <NavBar />
            <Box flex="1">
              <Container maxW="7xl" py={6}>
                <Modal isOpen={showWelcome} onClose={() => { const tenantId = Number(localStorage.getItem("tenantId") || 1); try { localStorage.setItem(`tenant:${tenantId}:welcome_master_shown`, "true"); } catch (e) { void e; } setShowWelcome(false); }} isCentered>
                  <ModalOverlay />
                  <ModalContent>
                    <ModalHeader>{t("welcome_master_title")}</ModalHeader>
                    <ModalBody>
                      <Text mb={4}>{t("welcome_master_body")}</Text>
                      <Heading size="sm" mb={2}>{t("workflow_setup_title")}</Heading>
                      <VStack align="stretch" spacing={2}>
                        <HStack justify="space-between">
                          <Text>{t("welcome_master_cta")}</Text>
                          <HStack>
                            <Button size="xs" variant="ghost" onClick={() => { try { help.open("empresa"); } catch (e) { void e; } }}>{t("workflow_help")}</Button>
                            <Button size="xs" colorScheme="blue" onClick={() => { const tenantId = Number(localStorage.getItem("tenantId") || 1); try { localStorage.setItem(`tenant:${tenantId}:welcome_master_shown`, "true"); } catch (e) { void e; } setShowWelcome(false); navigate("/tenant"); }}>{t("workflow_go")}</Button>
                          </HStack>
                        </HStack>
                        <HStack justify="space-between">
                          <Text>{t("workflow_profiles")}</Text>
                          <HStack>
                            <Button size="xs" variant="ghost" onClick={() => { try { help.open("perfis"); } catch (e) { void e; } }}>{t("workflow_help")}</Button>
                            <Button size="xs" colorScheme="blue" onClick={() => { setShowWelcome(false); navigate("/profiles"); }}>{t("workflow_go")}</Button>
                          </HStack>
                        </HStack>
                        <HStack justify="space-between">
                          <Text>{t("workflow_users")}</Text>
                          <HStack>
                            <Button size="xs" variant="ghost" onClick={() => { try { help.open("usuarios_mfa"); } catch (e) { void e; } }}>{t("workflow_help")}</Button>
                            <Button size="xs" colorScheme="blue" onClick={() => { setShowWelcome(false); navigate("/users"); }}>{t("workflow_go")}</Button>
                          </HStack>
                        </HStack>
                        <HStack justify="space-between">
                          <Text>{t("workflow_stages")}</Text>
                          <HStack>
                            <Button size="xs" variant="ghost" onClick={() => { try { help.open("fases"); } catch (e) { void e; } }}>{t("workflow_help")}</Button>
                            <Button size="xs" colorScheme="blue" onClick={() => { setShowWelcome(false); navigate("/stages"); }}>{t("workflow_go")}</Button>
                          </HStack>
                        </HStack>
                        <HStack justify="space-between">
                          <Text>{t("workflow_business_types")}</Text>
                          <HStack>
                            <Button size="xs" variant="ghost" onClick={() => { try { help.open("tipos_negocio"); } catch (e) { void e; } }}>{t("workflow_help")}</Button>
                            <Button size="xs" colorScheme="blue" onClick={() => { setShowWelcome(false); navigate("/business-types"); }}>{t("workflow_go")}</Button>
                          </HStack>
                        </HStack>
                      </VStack>
                    </ModalBody>
                    <ModalFooter>
                      <Button variant="ghost" mr={3} onClick={() => { const tenantId = Number(localStorage.getItem("tenantId") || 1); try { localStorage.setItem(`tenant:${tenantId}:welcome_master_shown`, "true"); } catch (e) { void e; } setShowWelcome(false); }}>
                        Fechar
                      </Button>
                    </ModalFooter>
                  </ModalContent>
                </Modal>
                <Text>Teste de renderização</Text>
                <Routes>
                  <Route path="/" element={<Protected feature="dashboard"><Dashboard /></Protected>} />
                  <Route path="/deals" element={<Protected feature="deals"><Deals /></Protected>} />
                  <Route path="/upload" element={<Protected feature="upload"><Upload /></Protected>} />
                  <Route path="/contacts" element={<Protected feature="contacts"><Contacts /></Protected>} />
                  <Route path="/organizations" element={<Protected feature="organizations"><Organizations /></Protected>} />
                  <Route path="/stages" element={<Protected feature="stages"><Stages /></Protected>} />
                  <Route path="/business-types" element={<Protected feature="business_types"><BusinessTypes /></Protected>} />
                  <Route path="/profiles" element={<Protected feature="profiles_admin"><Profiles /></Protected>} />
                  <Route path="/tenant" element={<Protected feature="profiles_admin"><Tenant /></Protected>} />
                  <Route path="/users" element={<Protected feature="profiles_admin"><Users /></Protected>} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/change-password" element={<Protected feature="profiles_admin"><ChangePassword /></Protected>} />
                </Routes>
              </Container>
            </Box>
          </Flex>
        </HelpProvider>
      </Box>
    </>
  );
}
