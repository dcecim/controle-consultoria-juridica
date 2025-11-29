import React from "react";
import { useLocation } from "react-router-dom";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Box, Heading, Text, Link, VStack } from "@chakra-ui/react";
import { manualSections, routeToSection } from "./manual/content";
import { useAuth } from "./useAuth";
import { HelpContext } from "./help-context";

export default function HelpProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = React.useState(false);
  const [sectionId, setSectionId] = React.useState<string | undefined>(undefined);
  const location = useLocation();
  const { user } = useAuth();

  const open = (sid?: string) => { setSectionId(sid); setOpen(true); };
  const close = () => setOpen(false);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "F1") { e.preventDefault(); const mapped = routeToSection[location.pathname] || "introducao"; open(mapped); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [location.pathname]);

  React.useEffect(() => {
    const email = user?.email || "guest";
    const key = `manual:seen:${email}`;
    const seen = localStorage.getItem(key);
    if (!seen) { const mapped = routeToSection[location.pathname] || "introducao"; open(mapped); localStorage.setItem(key, "true"); }
  }, [user?.email]);

  const selected = manualSections.find(s => s.id === sectionId) || manualSections[0];

  return (
    <HelpContext.Provider value={{ open, close }}>
      {children}
      <Modal isOpen={isOpen} onClose={close} size="4xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Manual do Usuário</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={6}>
              <Box>
                <Heading size="sm" mb={2}>Sumário</Heading>
                <VStack align="stretch" spacing={1}>
                  {manualSections.map(s => (
                    <Link key={s.id} onClick={() => setSectionId(s.id)}>{s.title}</Link>
                  ))}
                </VStack>
              </Box>
              <Box>
                <Heading size="md" mb={2}>{selected.title}</Heading>
                {selected.render()}
                <Text mt={6} fontSize="sm">Atalho: pressione F1 para abrir ajuda da tela atual.</Text>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </HelpContext.Provider>
  );
}

