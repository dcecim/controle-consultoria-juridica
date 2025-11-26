import React from "react";
import { Box, VStack, Text, Select, IconButton, Button, Divider, Icon, Tooltip, Badge } from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { MdRefresh, MdDashboard, MdList, MdUpload, MdContacts, MdBusiness, MdTimeline, MdCategory, MdAdminPanelSettings, MdPeople } from "react-icons/md";
import { useI18n } from "../useI18n";
import { getCurrency } from "../config";
import { useAuth } from "../useAuth";
import { listTenants, type TenantRow } from "../lib/api";

export default function NavBar() {
  const location = useLocation();
  const tenantId = Number(localStorage.getItem("tenantId") || 1);
  const { t, lang, setLang } = useI18n();
  const { role, logout, canAccess } = useAuth();
  const [currency, setCurrencyState] = React.useState<string>(getCurrency());
  const [tenants, setTenants] = React.useState<TenantRow[]>([]);
  const pendingUploads = Number(localStorage.getItem(`tenant:${tenantId}:uploads_pending_total`) || 0);
  const contactsMissingEmail = Number(localStorage.getItem(`tenant:${tenantId}:contacts_missing_email_total`) || 0);
  const dealsMissingOrg = Number(localStorage.getItem(`tenant:${tenantId}:deals_missing_org_total`) || 0);

  const setTenant = (v: string) => localStorage.setItem("tenantId", v);
  const setCurrency = (v: string) => { localStorage.setItem("currency", v); setCurrencyState(v); window.dispatchEvent(new Event("app:currency_changed")); };

  React.useEffect(() => {
    const allowed = role === "Master" || role === "Projetista";
    listTenants().then((rows) => {
      const list = rows || [];
      if (allowed) {
        setTenants(list);
      } else {
        const cur = Number(localStorage.getItem("tenantId") || 1);
        const found = list.find((t) => t.id === cur);
        setTenants(found ? [found] : [{ id: cur, name: `Tenant ${cur}` }]);
      }
    }).catch(() => {
      const cur = Number(localStorage.getItem("tenantId") || 1);
      const fallback = [{ id: 1, name: "Tenant 1" }, { id: 2, name: "Tenant 2" }];
      const allowed2 = role === "Master" || role === "Projetista";
      setTenants(allowed2 ? fallback : fallback.filter(t => t.id === cur));
    });
  }, [role]);

  return (
    <Box bg="white" borderRight="1px solid" borderColor="gray.200" minH="100vh" w="260px" position="sticky" top={0}>
      <VStack align="stretch" spacing={3} px={4} py={4}>
        <Text fontWeight="bold" fontSize="lg">Consultor Jurídico</Text>
        <Divider />
        {canAccess("dashboard") && (
          <Tooltip label={t("dashboard")} placement="right" hasArrow>
            <Button as={RouterLink} to="/" leftIcon={<Icon as={MdDashboard} />} variant={location.pathname === "/" ? "solid" : "ghost"} colorScheme="blue" justifyContent="flex-start" size="sm" w="full" aria-current={location.pathname === "/" ? "page" : undefined} _hover={{ bg: "gray.100" }} _focusVisible={{ boxShadow: "0 0 0 3px rgba(66,153,225,0.6)" }} _active={{ bg: "gray.200" }}>{t("dashboard")}</Button>
          </Tooltip>
        )}
        {canAccess("deals") && (
          <Tooltip label={t("deals")} placement="right" hasArrow>
            <Box position="relative">
              <Button as={RouterLink} to="/deals" leftIcon={<Icon as={MdList} />} variant={location.pathname === "/deals" ? "solid" : "ghost"} colorScheme="blue" justifyContent="flex-start" size="sm" w="full" aria-current={location.pathname === "/deals" ? "page" : undefined} _hover={{ bg: "gray.100" }} _focusVisible={{ boxShadow: "0 0 0 3px rgba(66,153,225,0.6)" }} _active={{ bg: "gray.200" }}>{t("deals")}</Button>
              {dealsMissingOrg > 0 && (
                <Badge position="absolute" top={1} right={2} colorScheme="orange" borderRadius="full">{dealsMissingOrg}</Badge>
              )}
            </Box>
          </Tooltip>
        )}
        {canAccess("upload") && (
          <Tooltip label={t("upload")} placement="right" hasArrow>
            <Box position="relative">
              <Button as={RouterLink} to="/upload" leftIcon={<Icon as={MdUpload} />} variant={location.pathname === "/upload" ? "solid" : "ghost"} colorScheme="blue" justifyContent="flex-start" size="sm" w="full" aria-current={location.pathname === "/upload" ? "page" : undefined} _hover={{ bg: "gray.100" }} _focusVisible={{ boxShadow: "0 0 0 3px rgba(66,153,225,0.6)" }} _active={{ bg: "gray.200" }}>{t("upload")}</Button>
              {pendingUploads > 0 && (
                <Badge position="absolute" top={1} right={2} colorScheme="red" borderRadius="full">{pendingUploads}</Badge>
              )}
            </Box>
          </Tooltip>
        )}
        {canAccess("contacts") && (
          <Tooltip label={t("contacts")} placement="right" hasArrow>
            <Box position="relative">
              <Button as={RouterLink} to="/contacts" leftIcon={<Icon as={MdContacts} />} variant={location.pathname === "/contacts" ? "solid" : "ghost"} colorScheme="blue" justifyContent="flex-start" size="sm" w="full" aria-current={location.pathname === "/contacts" ? "page" : undefined} _hover={{ bg: "gray.100" }} _focusVisible={{ boxShadow: "0 0 0 3px rgba(66,153,225,0.6)" }} _active={{ bg: "gray.200" }}>{t("contacts")}</Button>
              {contactsMissingEmail > 0 && (
                <Badge position="absolute" top={1} right={2} colorScheme="purple" borderRadius="full">{contactsMissingEmail}</Badge>
              )}
            </Box>
          </Tooltip>
        )}
        {canAccess("organizations") && (
          <Tooltip label={t("organizations")} placement="right" hasArrow>
            <Button as={RouterLink} to="/organizations" leftIcon={<Icon as={MdBusiness} />} variant={location.pathname === "/organizations" ? "solid" : "ghost"} colorScheme="blue" justifyContent="flex-start" size="sm" w="full" aria-current={location.pathname === "/organizations" ? "page" : undefined} _hover={{ bg: "gray.100" }} _focusVisible={{ boxShadow: "0 0 0 3px rgba(66,153,225,0.6)" }} _active={{ bg: "gray.200" }}>{t("organizations")}</Button>
          </Tooltip>
        )}
        {canAccess("stages") && (
          <Tooltip label={t("stages")} placement="right" hasArrow>
            <Button as={RouterLink} to="/stages" leftIcon={<Icon as={MdTimeline} />} variant={location.pathname === "/stages" ? "solid" : "ghost"} colorScheme="blue" justifyContent="flex-start" size="sm" w="full" aria-current={location.pathname === "/stages" ? "page" : undefined} _hover={{ bg: "gray.100" }} _focusVisible={{ boxShadow: "0 0 0 3px rgba(66,153,225,0.6)" }} _active={{ bg: "gray.200" }}>{t("stages")}</Button>
          </Tooltip>
        )}
        {canAccess("business_types") && (
          <Tooltip label={t("business_types") || "Tipos de Negócio"} placement="right" hasArrow>
            <Button as={RouterLink} to="/business-types" leftIcon={<Icon as={MdCategory} />} variant={location.pathname === "/business-types" ? "solid" : "ghost"} colorScheme="blue" justifyContent="flex-start" size="sm" w="full" aria-current={location.pathname === "/business-types" ? "page" : undefined} _hover={{ bg: "gray.100" }} _focusVisible={{ boxShadow: "0 0 0 3px rgba(66,153,225,0.6)" }} _active={{ bg: "gray.200" }}>{t("business_types") || "Tipos de Negócio"}</Button>
          </Tooltip>
        )}
        {canAccess("profiles_admin") && (
          <Tooltip label={t("profiles_admin") || "Perfis"} placement="right" hasArrow>
            <Button as={RouterLink} to="/profiles" leftIcon={<Icon as={MdAdminPanelSettings} />} variant={location.pathname === "/profiles" ? "solid" : "ghost"} colorScheme="blue" justifyContent="flex-start" size="sm" w="full" aria-current={location.pathname === "/profiles" ? "page" : undefined} _hover={{ bg: "gray.100" }} _focusVisible={{ boxShadow: "0 0 0 3px rgba(66,153,225,0.6)" }} _active={{ bg: "gray.200" }}>{t("profiles_admin") || "Perfis"}</Button>
          </Tooltip>
        )}
        {canAccess("profiles_admin") && (
          <Tooltip label={t("users") || "Usuários"} placement="right" hasArrow>
            <Button as={RouterLink} to="/users" leftIcon={<Icon as={MdPeople} />} variant={location.pathname === "/users" ? "solid" : "ghost"} colorScheme="blue" justifyContent="flex-start" size="sm" w="full" aria-current={location.pathname === "/users" ? "page" : undefined} _hover={{ bg: "gray.100" }} _focusVisible={{ boxShadow: "0 0 0 3px rgba(66,153,225,0.6)" }} _active={{ bg: "gray.200" }}>{t("users") || "Usuários"}</Button>
          </Tooltip>
        )}
        <Divider />
        <Select size="sm" value={String(tenantId)} onChange={(e) => setTenant(e.target.value)} isDisabled={!(role === "Master" || role === "Projetista")}> 
          {tenants.map(ti => (
            <option key={ti.id} value={String(ti.id)}>{ti.name}</option>
          ))}
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
        <Text>Perfil: {role || "Guest"}</Text>
        {!localStorage.getItem("token") && <Button size="sm" as={RouterLink} to="/login">{t("login") || "Login"}</Button>}
        {localStorage.getItem("token") && <Button size="sm" variant="outline" onClick={logout}>Sair</Button>}
        <IconButton aria-label="Atualizar" icon={<MdRefresh />} />
      </VStack>
    </Box>
  );
}
