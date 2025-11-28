import { useEffect, useState } from "react";
import { Box, Heading, VStack, FormControl, FormLabel, Input, Button, Text, useColorModeValue } from "@chakra-ui/react";
import { getTenant, updateTenant } from "../lib/api";

type TenantForm = { name?: string; address?: string; responsible_name?: string; responsible_oab?: string; phone?: string; email?: string; website?: string; instagram?: string; linkedin?: string };

export default function Tenant() {
  const panelBg = useColorModeValue("white","gray.800");
  const panelBorder = useColorModeValue("gray.200","gray.700");
  const [form, setForm] = useState<TenantForm>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const tenantId = Number(localStorage.getItem("tenantId") || 1);

  useEffect(() => {
    getTenant(tenantId).then((t) => setForm({
      name: t.name,
      address: t.address,
      responsible_name: t.responsible_name,
      responsible_oab: t.responsible_oab,
      phone: t.phone,
      email: t.email,
      website: t.website,
      instagram: t.instagram,
      linkedin: t.linkedin,
    })).catch((e) => setError(String(e)));
  }, [tenantId]);

  const save = async () => {
    setError(null); setSuccess(null);
    try { await updateTenant(tenantId, form); setSuccess("Salvo"); } catch (e) { setError(String(e)); }
  };

  return (
    <Box>
      <Heading size="md" mb={3}>Empresa</Heading>
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
        <Button colorScheme="blue" onClick={save}>Salvar</Button>
      </VStack>
    </Box>
  );
}

