import { useEffect, useState } from "react";
import { Box, Heading, HStack, Button, Table, Thead, Tbody, Tr, Th, Td, Text, VStack, Input, Select } from "@chakra-ui/react";
import { listOrganizations, createOrganization, updateOrganization, deleteOrganization } from "../lib/api";
import { useI18n } from "../i18n";

type Org = { id: number; name: string; sector?: string };

export default function Organizations() {
  const { t } = useI18n();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Org>({ id: 0, name: "" });
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = () => { listOrganizations({ limit: 100, sort_by: "name", sort_dir: "asc" }).then(setOrgs).catch((e) => setError(String(e))); };
  useEffect(() => { load(); }, []);

  const startCreate = () => { setEditingId(null); setForm({ id: 0, name: "", sector: "" }); };
  const startEdit = (o: Org) => { setEditingId(o.id); setForm({ ...o }); };
  const cancel = () => { setEditingId(null); setForm({ id: 0, name: "" }); };

  const submit = async () => {
    try {
      const payload: any = { name: form.name, sector: form.sector };
      if (editingId) await updateOrganization(editingId, payload); else await createOrganization(payload);
      cancel();
      load();
    } catch (e: any) { setError(String(e)); }
  };

  const remove = async (id: number) => { await deleteOrganization(id); load(); };

  return (
    <Box>
      <Heading size="md" mb={4}>{t("organizations")}</Heading>
      {error && <Text color="red.500" mb={3}>{error}</Text>}
      <HStack mb={3} spacing={3}><Button onClick={startCreate}>{t("new")}</Button></HStack>
      {(editingId !== null || form.id === 0) && (
        <VStack align="stretch" spacing={3} bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200" mb={4}>
          <Input placeholder={t("name")} value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder={t("sector")} value={form.sector ?? ""} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
          <HStack>
            <Button colorScheme="blue" onClick={submit}>{t("save")}</Button>
            <Button variant="outline" onClick={cancel}>{t("cancel")}</Button>
          </HStack>
        </VStack>
      )}
      <Table bg="white">
        <Thead>
          <Tr>
            <Th>{t("id")}</Th>
            <Th>{t("name")}</Th>
            <Th>{t("sector")}</Th>
            <Th>{t("actions")}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {orgs.map(o => (
            <Tr key={o.id}>
              <Td>{o.id}</Td>
              <Td>{o.name}</Td>
              <Td>{o.sector ?? "-"}</Td>
              <Td>
                <HStack>
                  <Button size="sm" onClick={() => startEdit(o)}>{t("edit")}</Button>
                  <Button size="sm" colorScheme="red" onClick={() => remove(o.id)}>{t("delete")}</Button>
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
