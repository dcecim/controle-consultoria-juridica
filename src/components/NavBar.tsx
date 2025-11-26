import { Box, Flex, HStack, Link, Text, Spacer, Select, IconButton } from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { MdRefresh } from "react-icons/md";
import { useI18n } from "../i18n";

export default function NavBar() {
  const location = useLocation();
  const tenantId = Number(localStorage.getItem("tenantId") || 1);
  const actor = localStorage.getItem("actor") || "admin";
  const { t, lang, setLang } = useI18n();

  const setTenant = (v: string) => localStorage.setItem("tenantId", v);
  const setActor = (v: string) => localStorage.setItem("actor", v);

  return (
    <Box bg="white" borderBottom="1px solid" borderColor="gray.200">
      <Flex maxW="7xl" mx="auto" px={6} py={3} align="center" gap={4}>
        <Text fontWeight="bold">Consultor Jurídico</Text>
        <HStack spacing={6}>
          <Link as={RouterLink} to="/" fontWeight={location.pathname === "/" ? "bold" : "normal"}>{t("dashboard")}</Link>
          <Link as={RouterLink} to="/deals" fontWeight={location.pathname === "/deals" ? "bold" : "normal"}>{t("deals")}</Link>
          <Link as={RouterLink} to="/upload" fontWeight={location.pathname === "/upload" ? "bold" : "normal"}>{t("upload")}</Link>
          <Link as={RouterLink} to="/contacts" fontWeight={location.pathname === "/contacts" ? "bold" : "normal"}>{t("contacts")}</Link>
          <Link as={RouterLink} to="/organizations" fontWeight={location.pathname === "/organizations" ? "bold" : "normal"}>{t("organizations")}</Link>
          <Link as={RouterLink} to="/stages" fontWeight={location.pathname === "/stages" ? "bold" : "normal"}>{t("stages")}</Link>
        </HStack>
        <Spacer />
        <HStack spacing={3}>
          <Select size="sm" defaultValue={String(tenantId)} onChange={(e) => setTenant(e.target.value)}>
            <option value="1">Tenant 1</option>
            <option value="2">Tenant 2</option>
          </Select>
          <Select size="sm" defaultValue={actor} onChange={(e) => setActor(e.target.value)}>
            <option value="admin">admin</option>
            <option value="system">system</option>
            <option value="user">user</option>
          </Select>
          <Select size="sm" value={lang} onChange={(e) => setLang(e.target.value as "pt-BR" | "en" | "es")}>
            <option value="pt-BR">pt-BR</option>
            <option value="en">en</option>
            <option value="es">es</option>
          </Select>
          <IconButton aria-label="Atualizar" icon={<MdRefresh />} />
        </HStack>
      </Flex>
    </Box>
  );
}
