import { useEffect } from "react";
import { Box, Container, Text, Flex, useColorModeValue } from "@chakra-ui/react";
import { Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";
import { useAuth } from "./useAuth";
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

function Protected({ feature, children }: { feature: string; children: React.ReactNode }) {
  const { canAccess } = useAuth();
  return canAccess(feature) ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  useEffect(() => {
    console.log("App montado");
  }, []);
  const appBg = useColorModeValue("gray.50", "#0b1220");
  return (
    <>
      <div style={{ padding: 24, fontSize: 24, color: "#000", backgroundColor: "#ffeb3b" }}>
        Diagnóstico: React está renderizando.
      </div>
      <Box minH="100vh" bg={appBg}>
        <Flex>
          <NavBar />
          <Box flex="1">
            <Container maxW="7xl" py={6}>
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
                {/* fallback para rotas desconhecidas */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Container>
          </Box>
        </Flex>
      </Box>
    </>
  );
}
