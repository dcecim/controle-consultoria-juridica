import React from "react";
import { Box, VStack, Text, Select, IconButton, Button, Divider, Icon, Tooltip, Badge, useColorModeValue } from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { MdRefresh, MdDashboard, MdList, MdUpload, MdContacts, MdBusiness, MdTimeline, MdCategory, MdAdminPanelSettings, MdPeople } from "react-icons/md";
import { MdHomeWork } from "react-icons/md";
import { useI18n } from "../useI18n";
import { listTenants } from "../lib/api";
import { getCurrency } from "../config";
import { useAuth } from "../useAuth";

export default function NavBar() {
  const location = useLocation();
  const tenantId = Number(localStorage.getItem("tenantId") || 1);
  const { t, lang, setLang } = useI18n();
  const { role, logout, canAccess, token } = useAuth();
  const [currency, setCurrencyState] = React.useState<string>(getCurrency());
  const [tenants, setTenants] = React.useState<Array<{ id: number; name: string }>>([]);
  const [tenant, setTenant] = React.useState<number>(tenantId);
  
  const pendingUploads = Number(localStorage.getItem(`tenant:${tenantId}:uploads_pending_total`) || 0);
  const contactsMissingEmail = Number(localStorage.getItem(`tenant:${tenantId}:contacts_missing_email_total`) || 0);
  const dealsMissingOrg = Number(localStorage.getItem(`tenant:${tenantId}:deals_missing_org_total`) || 0);

  
  const setCurrency = (v: string) => { localStorage.setItem("currency", v); setCurrencyState(v); window.dispatchEvent(new Event("app:currency_changed")); };

  
  React.useEffect(() => {
    listTenants().then((rows) => {
      setTenants(rows);
      if (!rows.find(r => r.id === tenant)) {
        const next = rows[0]?.id || 1;
        setTenant(next);
        localStorage.setItem("tenantId", String(next));
        window.dispatchEvent(new Event("tenant:changed"));
      }
    }).catch(() => {});
  }, [tenant]);

  const sideBg = useColorModeValue("white", "gray.800");
  const sideBorder = useColorModeValue("gray.200", "gray.700");
  const themeName = (localStorage.getItem("themeName") || "light");
  const setThemeName = (name: string) => { localStorage.setItem("themeName", name); window.dispatchEvent(new Event("theme:change")); };
  const isAuthed = !!token || (typeof sessionStorage !== "undefined" && !!sessionStorage.getItem("token"));
  const creditColor = useColorModeValue("gray.600","gray.300");
  return (
    <Box bg={sideBg} borderRight="1px solid" borderColor={sideBorder} minH="100vh" w="260px" position="sticky" top={0}>
      <VStack align="stretch" spacing={3} px={4} py={4}>
        <Text fontWeight="bold" fontSize="lg">Consultor Jurídico</Text>
        <Divider />
        {canAccess("dashboard") && (
          <Tooltip label={t("dashboard")} placement="right" hasArrow>
            <Button as={RouterLink} to="/" leftIcon={<Icon as={MdDashboard} />} variant={location.pathname === "/" ? "solid" : "ghost"} colorScheme="brand" justifyContent="flex-start" size="sm" w="full" aria-current={location.pathname === "/" ? "page" : undefined} _hover={{ bg: "gray.100" }} _focusVisible={{ boxShadow: "0 0 0 3px rgba(66,153,225,0.6)" }} _active={{ bg: "gray.200" }}>{t("dashboard")}</Button>
          </Tooltip>
        )}
        {canAccess("deals") && (
          <Tooltip label={t("deals")} placement="right" hasArrow>
            <Box position="relative">
              <Button as={RouterLink} to="/deals" leftIcon={<Icon as={MdList} />} variant={location.pathname === "/deals" ? "solid" : "ghost"} colorScheme="brand" justifyContent="flex-start" size="sm" w="full" aria-current={location.pathname === "/deals" ? "page" : undefined} _hover={{ bg: "gray.100" }} _focusVisible={{ boxShadow: "0 0 0 3px rgba(66,153,225,0.6)" }} _active={{ bg: "gray.200" }}>{t("deals")}</Button>
              {dealsMissingOrg > 0 && (
                <Badge position="absolute" top={1} right={2} colorScheme="orange" borderRadius="full">{dealsMissingOrg}</Badge>
              )}
            </Box>
          </Tooltip>
        )}
        {canAccess("upload") && (
          <Tooltip label={t("upload")} placement="right" hasArrow>
            <Box position="relative">
              <Button as={RouterLink} to="/upload" leftIcon={<Icon as={MdUpload} />} variant={location.pathname === "/upload" ? "solid" : "ghost"} colorScheme="brand" justifyContent="flex-start" size="sm" w="full" aria-current={location.pathname === "/upload" ? "page" : undefined} _hover={{ bg: "gray.100" }} _focusVisible={{ boxShadow: "0 0 0 3px rgba(66,153,225,0.6)" }} _active={{ bg: "gray.200" }}>{t("upload")}</Button>
              {pendingUploads > 0 && (
                <Badge position="absolute" top={1} right={2} colorScheme="red" borderRadius="full">{pendingUploads}</Badge>
              )}
            </Box>
          </Tooltip>
        )}
        {canAccess("contacts") && (
          <Tooltip label={t("contacts")} placement="right" hasArrow>
            <Box position="relative">
              <Button as={RouterLink} to="/contacts" leftIcon={<Icon as={MdContacts} />} variant={location.pathname === "/contacts" ? "solid" : "ghost"} colorScheme="brand" justifyContent="flex-start" size="sm" w="full" aria-current={location.pathname === "/contacts" ? "page" : undefined} _hover={{ bg: "gray.100" }} _focusVisible={{ boxShadow: "0 0 0 3px rgba(66,153,225,0.6)" }} _active={{ bg: "gray.200" }}>{t("contacts")}</Button>
              {contactsMissingEmail > 0 && (
                <Badge position="absolute" top={1} right={2} colorScheme="purple" borderRadius="full">{contactsMissingEmail}</Badge>
              )}
            </Box>
          </Tooltip>
        )}
        {canAccess("organizations") && (
          <Tooltip label={t("organizations")} placement="right" hasArrow>
            <Button as={RouterLink} to="/organizations" leftIcon={<Icon as={MdBusiness} />} variant={location.pathname === "/organizations" ? "solid" : "ghost"} colorScheme="brand" justifyContent="flex-start" size="sm" w="full" aria-current={location.pathname === "/organizations" ? "page" : undefined} _hover={{ bg: "gray.100" }} _focusVisible={{ boxShadow: "0 0 0 3px rgba(66,153,225,0.6)" }} _active={{ bg: "gray.200" }}>{t("organizations")}</Button>
          </Tooltip>
        )}
        {canAccess("stages") && (
          <Tooltip label={t("stages")} placement="right" hasArrow>
            <Button as={RouterLink} to="/stages" leftIcon={<Icon as={MdTimeline} />} variant={location.pathname === "/stages" ? "solid" : "ghost"} colorScheme="brand" justifyContent="flex-start" size="sm" w="full" aria-current={location.pathname === "/stages" ? "page" : undefined} _hover={{ bg: "gray.100" }} _focusVisible={{ boxShadow: "0 0 0 3px rgba(66,153,225,0.6)" }} _active={{ bg: "gray.200" }}>{t("stages")}</Button>
          </Tooltip>
        )}
        {canAccess("business_types") && (
          <Tooltip label={t("business_types") || "Tipos de Negócio"} placement="right" hasArrow>
            <Button as={RouterLink} to="/business-types" leftIcon={<Icon as={MdCategory} />} variant={location.pathname === "/business-types" ? "solid" : "ghost"} colorScheme="brand" justifyContent="flex-start" size="sm" w="full" aria-current={location.pathname === "/business-types" ? "page" : undefined} _hover={{ bg: "gray.100" }} _focusVisible={{ boxShadow: "0 0 0 3px rgba(66,153,225,0.6)" }} _active={{ bg: "gray.200" }}>{t("business_types") || "Tipos de Negócio"}</Button>
          </Tooltip>
        )}
        {canAccess("profiles_admin") && (
          <Tooltip label={t("profiles_admin") || "Perfis"} placement="right" hasArrow>
            <Button as={RouterLink} to="/profiles" leftIcon={<Icon as={MdAdminPanelSettings} />} variant={location.pathname === "/profiles" ? "solid" : "ghost"} colorScheme="brand" justifyContent="flex-start" size="sm" w="full" aria-current={location.pathname === "/profiles" ? "page" : undefined} _hover={{ bg: "gray.100" }} _focusVisible={{ boxShadow: "0 0 0 3px rgba(66,153,225,0.6)" }} _active={{ bg: "gray.200" }}>{t("profiles_admin") || "Perfis"}</Button>
          </Tooltip>
        )}
        {canAccess("profiles_admin") && (
          <Tooltip label={"Empresa"} placement="right" hasArrow>
            <Button as={RouterLink} to="/tenant" leftIcon={<Icon as={MdHomeWork} />} variant={location.pathname === "/tenant" ? "solid" : "ghost"} colorScheme="brand" justifyContent="flex-start" size="sm" w="full" aria-current={location.pathname === "/tenant" ? "page" : undefined} _hover={{ bg: "gray.100" }} _focusVisible={{ boxShadow: "0 0 0 3px rgba(66,153,225,0.6)" }} _active={{ bg: "gray.200" }}>Empresa</Button>
          </Tooltip>
        )}
        {canAccess("profiles_admin") && (
          <Tooltip label={t("users") || "Usuários"} placement="right" hasArrow>
            <Button as={RouterLink} to="/users" leftIcon={<Icon as={MdPeople} />} variant={location.pathname === "/users" ? "solid" : "ghost"} colorScheme="brand" justifyContent="flex-start" size="sm" w="full" aria-current={location.pathname === "/users" ? "page" : undefined} _hover={{ bg: "gray.100" }} _focusVisible={{ boxShadow: "0 0 0 3px rgba(66,153,225,0.6)" }} _active={{ bg: "gray.200" }}>{t("users") || "Usuários"}</Button>
          </Tooltip>
        )}
        <Divider />
        
        <Select size="sm" value={lang} onChange={(e) => { setLang(e.target.value as "pt-BR" | "en" | "es"); window.dispatchEvent(new Event("app:lang_changed")); }}> 
          <option value="pt-BR">pt-BR</option>
          <option value="en">en</option>
          <option value="es">es</option>
        </Select>
        <Select size="sm" value={String(tenant)} onChange={(e) => { const next = Number(e.target.value); setTenant(next); localStorage.setItem("tenantId", String(next)); window.dispatchEvent(new Event("tenant:changed")); }}>
          {tenants.map((tnt) => (<option key={tnt.id} value={String(tnt.id)}>{tnt.name || `Tenant ${tnt.id}`}</option>))}
        </Select>
        <Select size="sm" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          <option value="BRL">BRL</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
        </Select>
        <Select size="sm" value={themeName} onChange={(e) => setThemeName(e.target.value)}>
          <option value="light">Claro</option>
          <option value="dark">Escuro</option>
          <option value="sepia">Sépia</option>
          <option value="ocean">Oceano</option>
        </Select>
        <Text>Perfil: {role || "Guest"}</Text>
        <Button size="sm" as={RouterLink} to="/login">{t("login") || "Login"}</Button>
        {isAuthed ? <Button size="sm" variant="outline" onClick={logout}>Sair</Button> : null}
        <IconButton aria-label="Atualizar" icon={<MdRefresh />} />
        <Divider />
        <Text fontSize="xs" color={creditColor}>Crédito: Diretoria de Informática da Cecim Advogados</Text>
      </VStack>
    </Box>
  );
}
