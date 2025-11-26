import React from "react";
import { Box, Flex, HStack, Link, Text, Spacer, Select, IconButton } from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { MdRefresh } from "react-icons/md";
import { useI18n } from "../useI18n";
import { getCurrency } from "../config";

export default function NavBar() {
  const location = useLocation();
  const tenantId = Number(localStorage.getItem("tenantId") || 1);
  const actor = localStorage.getItem("actor") || "admin";
  const { t, lang, setLang } = useI18n();
  const [currency, setCurrencyState] = React.useState<string>(getCurrency());

  const setTenant = (v: string) => localStorage.setItem("tenantId", v);
  const setActor = (v: string) => localStorage.setItem("actor", v);
  const setCurrency = (v: string) => { localStorage.setItem("currency", v); setCurrencyState(v); window.dispatchEvent(new Event("app:currency_changed")); };

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
          <Link as={RouterLink} to="/business-types" fontWeight={location.pathname === "/business-types" ? "bold" : "normal"}>{t("business_types") || "Tipos de Negócio"}</Link>
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
          <Select size="sm" value={lang} onChange={(e) => { setLang(e.target.value as "pt-BR" | "en" | "es"); window.dispatchEvent(new Event("app:lang_changed")); }}> 
            <option value="pt-BR">pt-BR</option>
            <option value="en">en</option>
            <option value="es">es</option>
          </Select>
          <Select size="sm" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="BRL">BRL</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </Select>
          <IconButton aria-label="Atualizar" icon={<MdRefresh />} />
        </HStack>
      </Flex>
    </Box>
  );
}
