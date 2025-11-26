import { useEffect } from "react";
import { Box, Container, Text } from "@chakra-ui/react";
import { Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";
import Dashboard from "./pages/Dashboard";
import Deals from "./pages/Deals";
import Upload from "./pages/Upload";
import Contacts from "./pages/Contacts";
import Organizations from "./pages/Organizations";
import Stages from "./pages/Stages";
import BusinessTypes from "./pages/BusinessTypes";

export default function App() {
  useEffect(() => {
    console.log("App montado");
  }, []);
  return (
    <>
      <div style={{ padding: 24, fontSize: 24, color: "#000", backgroundColor: "#ffeb3b" }}>
        Diagnóstico: React está renderizando.
      </div>
      <Box minH="100vh" bg="white">
        <NavBar />
        <Container maxW="7xl" py={6}>
          <Text>Teste de renderização</Text>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/organizations" element={<Organizations />} />
            <Route path="/stages" element={<Stages />} />
            <Route path="/business-types" element={<BusinessTypes />} />
            {/* fallback para rotas desconhecidas */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Container>
      </Box>
    </>
  );
}
