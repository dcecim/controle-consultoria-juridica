import { useEffect, useMemo, useState } from "react";
import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Select, Checkbox, Button, Text, HStack, Input, FormControl, FormLabel, useColorModeValue } from "@chakra-ui/react";
import { useI18n } from "../useI18n";
import { getRolePermissions, setRolePermissions, listProfiles, createProfile, deleteProfile, syncRBACFromLocalToServer } from "../lib/api";

type Role = "Master" | "Projetista" | "Financeiro" | "Comercial" | "Guest";
type Feature = "dashboard" | "deals" | "upload" | "contacts" | "organizations" | "stages" | "business_types" | "profiles_admin";
const ALL_ACTIONS = ["view", "edit", "delete"] as const;
type Action = typeof ALL_ACTIONS[number];

export default function Profiles() {
  const { t } = useI18n();
  const [role, setRole] = useState<Role>("Master");
  const [profiles, setProfiles] = useState<Array<{ id: number; name: string; code?: string }>>([]);
  const [newProfile, setNewProfile] = useState<{ name: string; code?: string }>({ name: "", code: "" });
  const features: Feature[] = useMemo(() => ["dashboard", "deals", "upload", "contacts", "organizations", "stages", "business_types", "profiles_admin"], []);
  const defaultPerms: Record<Feature, Action[]> = useMemo(() => ({
    dashboard: ["view"],
    deals: ["view"],
    upload: [],
    contacts: [],
    organizations: [],
    stages: [],
    business_types: [],
    profiles_admin: [],
  }), []);
  const calcPerms = (r: Role): Record<Feature, Action[]> => {
    if (r === "Master" || r === "Projetista") {
      return Object.fromEntries(features.map(f => [f, [...ALL_ACTIONS]])) as Record<Feature, Action[]>;
    }
    const tenantId = Number(localStorage.getItem("tenantId") || 1);
    const raw = localStorage.getItem(`tenant:${tenantId}:role:${r}:permissions`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Record<string, string[]>;
        return Object.fromEntries(features.map(f => [f, (parsed[f] || defaultPerms[f]) as Action[]])) as Record<Feature, Action[]>;
      } catch { return defaultPerms; }
    }
    return defaultPerms;
  };
  const [perms, setPerms] = useState<Record<Feature, Action[]>>(() => calcPerms(role));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const panelBg = useColorModeValue("white","gray.800");
  const panelBorder = useColorModeValue("gray.200","gray.700");
  const tableBg = useColorModeValue("white","gray.800");

  useEffect(() => { /* noop to satisfy hook rules */ }, []);

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const list = await listProfiles();
        setProfiles(list);
      } catch (e) { void e; }
    };
    void loadProfiles();
  }, []);

  const toggle = (f: Feature, a: Action, checked: boolean) => {
    setPerms(prev => {
      const next = { ...prev };
      const arr = new Set(next[f] || []);
      if (checked) arr.add(a); else arr.delete(a);
      next[f] = Array.from(arr) as Action[];
      return next;
    });
  };

  useEffect(() => {
    const loadPerms = async () => {
      if (role === "Master" || role === "Projetista") return;
      try {
        const server = await getRolePermissions(role);
        const map = Object.fromEntries(features.map(f => [f, (server[f] || defaultPerms[f]) as Action[]])) as Record<Feature, Action[]>;
        setPerms(map);
      } catch (e) { setError(String(e)); }
    };
    void loadPerms();
  }, [role, features, defaultPerms]);

  const save = async () => {
    try {
      const toSave: Record<string, string[]> = {};
      features.forEach(f => { toSave[f] = perms[f] as string[]; });
      await setRolePermissions(role, toSave);
      const tenantId = Number(localStorage.getItem("tenantId") || 1);
      localStorage.setItem(`tenant:${tenantId}:role:${role}:permissions`, JSON.stringify(toSave));
      setSuccess(t("save") || "Salvo");
    } catch (e) {
      setError(String(e));
    }
  };

  const addProfile = async () => {
    if (!newProfile.name.trim()) return;
    const created = await createProfile({ name: newProfile.name.trim(), code: newProfile.code?.trim() || undefined });
    setProfiles(prev => [created, ...prev]);
    setNewProfile({ name: "", code: "" });
  };

  const removeProfile = async (id: number) => {
    await deleteProfile(id);
    setProfiles(prev => prev.filter(p => p.id !== id));
  };

  return (
    <Box>
      <Heading size="md" mb={4}>{t("profiles_admin") || "Perfis e Permissões"}</Heading>
      <Select maxW="240px" mb={3} value={role} onChange={(e) => { const r = e.target.value as Role; setRole(r); setPerms(calcPerms(r)); setError(null); setSuccess(null); }}>
        <option value="Master">Master</option>
        <option value="Projetista">Projetista</option>
        {profiles.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
        <option value="Financeiro">Financeiro</option>
        <option value="Comercial">Comercial</option>
        <option value="Guest">Guest</option>
      </Select>
      <Box bg={panelBg} p={3} borderRadius="md" border="1px solid" borderColor={panelBorder} mb={4}>
        <Heading size="sm" mb={2}>{t("profiles_admin") || "Perfis e Permissões"}</Heading>
        <HStack align="start">
          <FormControl>
            <FormLabel>{t("name")}</FormLabel>
            <Input value={newProfile.name} onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })} />
          </FormControl>
          <FormControl>
            <FormLabel>Code</FormLabel>
            <Input value={newProfile.code} onChange={(e) => setNewProfile({ ...newProfile, code: e.target.value })} />
          </FormControl>
          <Button onClick={addProfile}>{t("save")}</Button>
        </HStack>
        <HStack mt={3} spacing={3}>
          {profiles.map(p => (
            <Button key={p.id} variant="outline" size="sm" onClick={() => removeProfile(p.id)}>{t("delete")} {p.name}</Button>
          ))}
        </HStack>
      </Box>
      {error && <Text color="red.500" mb={2}>{error}</Text>}
      {success && <Text color="green.600" mb={2}>{success}</Text>}
      <Table bg={tableBg}>
        <Thead>
          <Tr>
            <Th>{t("feature") || "Funcionalidade"}</Th>
            {ALL_ACTIONS.map(a => <Th key={a}>{t(a)}</Th>)}
          </Tr>
        </Thead>
        <Tbody>
          {features.map(f => (
            <Tr key={f}>
              <Td>{t(f) || f}</Td>
              {ALL_ACTIONS.map(a => (
                <Td key={a}>
                  <Checkbox isChecked={(perms[f] || []).includes(a)} onChange={(e) => toggle(f, a, e.target.checked)} />
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
      <Button colorScheme="blue" mt={3} onClick={save}>{t("save")}</Button>
      <Button variant="outline" mt={3} ml={3} onClick={async () => { setError(null); setSuccess(null); try { const r = await syncRBACFromLocalToServer(); setSuccess(`${t("synced") || "Sincronizado"}: ${r.profiles} ${t("profiles_admin") || "Perfis"}, ${r.roles} ${t("feature") || "Funcionalidades"}, ${r.users} ${t("users") || "Usuários"}`); } catch (e) { setError(String(e)); } }}>{t("sync") || "Sincronizar"}</Button>
    </Box>
  );
}
