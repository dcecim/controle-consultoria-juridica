import { useEffect, useState, useCallback } from "react";
import { Box, Heading, VStack, FormControl, FormLabel, Input, Button, Text, useColorModeValue, HStack, FormHelperText, useToast, useMediaQuery, Alert, AlertIcon, Badge } from "@chakra-ui/react";
import { useHelp } from "../help-context";
import { getTenant, updateTenant } from "../lib/api";

type TenantForm = { name?: string; address?: string; responsible_name?: string; responsible_oab?: string; phone?: string; email?: string; website?: string; instagram?: string; linkedin?: string; logo_url?: string; session_idle_minutes?: number };

export default function Tenant() {
  const panelBg = useColorModeValue("white","gray.800");
  const panelBorder = useColorModeValue("gray.200","gray.700");
  const help = useHelp();
  const toast = useToast();
  const [form, setForm] = useState<TenantForm>({});
  const [initial, setInitial] = useState<TenantForm>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const tenantId = Number(localStorage.getItem("tenantId") || 1);
  const [isSmall] = useMediaQuery("(max-width: 768px)");
  const btnBg = useColorModeValue("brand.500","brand.600");
  const btnHoverBg = useColorModeValue("brand.600","brand.500");
  const [lastChangeAt, setLastChangeAt] = useState<number | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    getTenant(tenantId).then((t) => {
      const data = {
      name: t.name,
      address: t.address,
      responsible_name: t.responsible_name,
      responsible_oab: t.responsible_oab,
      phone: t.phone,
      email: t.email,
      website: t.website,
      instagram: t.instagram,
      linkedin: t.linkedin,
      logo_url: t.logo_url,
      session_idle_minutes: t.session_idle_minutes ?? 4,
      } as TenantForm;
      setForm(data);
      setInitial(data);
    }).catch((e) => setError(String(e)));
  }, [tenantId]);

  const save = useCallback(async () => {
    setError(null); setSuccess(null); setSaving(true);
    try {
      await updateTenant(tenantId, form);
      try { window.dispatchEvent(new Event("tenant:updated")); } catch (e) { void e; }
      setSuccess("Salvo");
      toast({ title: "Empresa", description: "Dados salvos", status: "success", duration: 3000, isClosable: true });
      setInitial(form);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      toast({ title: "Empresa", description: msg, status: "error", duration: 5000, isClosable: true });
    } finally {
      setSaving(false);
    }
  }, [tenantId, form, toast]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const k = String(e.key || "").toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === "s") { e.preventDefault(); if (!saving) save(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saving, save]);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  useEffect(() => { if (dirty) setLastChangeAt(Date.now()); else setLastChangeAt(null); }, [dirty, form, initial]);
  useEffect(() => { const id = window.setInterval(() => setTick((t) => t + 1), 1000); return () => window.clearInterval(id); }, []);
  const elapsedSec = dirty && lastChangeAt ? Math.max(0, Math.floor((Date.now() - lastChangeAt) / 1000)) : 0;

  return (
    <Box>
      <HStack justify="space-between" mb={3}>
        <Heading size="md">Empresa</Heading>
        <HStack>
          <Button size="sm" variant="ghost" onClick={() => help.open("empresa")}>Ajuda</Button>
          <Button size="sm" variant="solid" bg={btnBg} _hover={{ bg: btnHoverBg }} color="white" onClick={save} isLoading={saving} isDisabled={saving}>Salvar</Button>
          {dirty && <Badge colorScheme="orange" variant="solid">Alterações não salvas · {elapsedSec}s</Badge>}
        </HStack>
      </HStack>
      {error && <Text color="red.500" mb={2}>{error}</Text>}
      {success && <Text color="green.600" mb={2}>{success}</Text>}
      <VStack align="stretch" spacing={3} bg={panelBg} p={4} borderRadius="md" border="1px solid" borderColor={panelBorder}>
        <FormControl>
          <FormLabel>Nome</FormLabel>
          <Input value={form.name || ""} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} />
        </FormControl>
        <FormControl>
          <FormLabel>Endereço</FormLabel>
          <Input value={form.address || ""} onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))} />
        </FormControl>
        <FormControl>
          <FormLabel>Responsável</FormLabel>
          <Input value={form.responsible_name || ""} onChange={(e) => setForm(prev => ({ ...prev, responsible_name: e.target.value }))} />
        </FormControl>
        <FormControl>
          <FormLabel>OAB</FormLabel>
          <Input value={form.responsible_oab || ""} onChange={(e) => setForm(prev => ({ ...prev, responsible_oab: e.target.value }))} />
        </FormControl>
        <FormControl>
          <FormLabel>Telefone</FormLabel>
          <Input value={form.phone || ""} onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))} />
        </FormControl>
        <FormControl>
          <FormLabel>E-mail</FormLabel>
          <Input value={form.email || ""} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} />
        </FormControl>
        <FormControl>
          <FormLabel>Website</FormLabel>
          <Input value={form.website || ""} onChange={(e) => setForm(prev => ({ ...prev, website: e.target.value }))} />
        </FormControl>
        <FormControl>
          <FormLabel>Instagram</FormLabel>
          <Input value={form.instagram || ""} onChange={(e) => setForm(prev => ({ ...prev, instagram: e.target.value }))} />
        </FormControl>
        <FormControl>
          <FormLabel>LinkedIn</FormLabel>
          <Input value={form.linkedin || ""} onChange={(e) => setForm(prev => ({ ...prev, linkedin: e.target.value }))} />
        </FormControl>
        <FormControl>
          <FormLabel>Logo URL</FormLabel>
          <Input placeholder="https://..." value={form.logo_url || ""} onChange={(e) => setForm(prev => ({ ...prev, logo_url: e.target.value }))} />
          <FormHelperText>Use um endereço público http/https acessível.</FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel>Sessão (minutos de inatividade)</FormLabel>
          <Input type="number" min={1} value={String(form.session_idle_minutes ?? 4)} onChange={(e) => setForm(prev => ({ ...prev, session_idle_minutes: Math.max(1, Number(e.target.value) || 4) }))} />
        </FormControl>
        <Button variant="solid" bg={btnBg} _hover={{ bg: btnHoverBg }} color="white" onClick={save} isLoading={saving} isDisabled={saving}>Salvar</Button>
      </VStack>
      {!isSmall && (
        <Box position="fixed" bottom={6} right={6} zIndex={4000}>
          <Button variant="solid" bg={btnBg} _hover={{ bg: btnHoverBg }} color="white" size="lg" shadow="md" onClick={save} isLoading={saving} isDisabled={saving}>Salvar</Button>
        </Box>
      )}
      {dirty && (
        <Box position="fixed" bottom={6} left={6} zIndex={4000}>
          <Alert status="info" borderRadius="md" shadow="md">
            <AlertIcon />
            Pressione Ctrl+S para salvar
          </Alert>
        </Box>
      )}
    </Box>
  );
}

