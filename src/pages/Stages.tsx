import { useEffect, useState } from "react";
import { Box, Heading, HStack, Button, Table, Thead, Tbody, Tr, Th, Td, Text, VStack, Input } from "@chakra-ui/react";
import { listStages, createStage, updateStage, deleteStage, seedStages } from "../lib/api";
import { useI18n } from "../i18n";

type Stage = { id: number; name: string; order: number };

export default function Stages() {
  const { t } = useI18n();
  const [stages, setStages] = useState<Stage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Stage>({ id: 0, name: "", order: 1 });
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = () => { listStages().then(setStages).catch((e) => setError(String(e))); };
  useEffect(() => { load(); }, []);

  const startCreate = () => { setEditingId(null); setForm({ id: 0, name: "", order: (stages[stages.length-1]?.order ?? 0) + 1 }); };
  const startEdit = (s: Stage) => { setEditingId(s.id); setForm({ ...s }); };
  const cancel = () => { setEditingId(null); setForm({ id: 0, name: "", order: 1 }); };

  const submit = async () => {
    try {
      const payload: any = { name: form.name, order: form.order };
      if (editingId) await updateStage(editingId, payload); else await createStage(payload);
      cancel();
      load();
    } catch (e: any) { setError(String(e)); }
  };

  const remove = async (id: number) => { await deleteStage(id); load(); };
  const seed = async () => { await seedStages(); load(); };

  return (
    <Box>
      <Heading size="md" mb={4}>{t("stages")}</Heading>
      {error && <Text color="red.500" mb={3}>{error}</Text>}
      <HStack mb={3} spacing={3}><Button onClick={startCreate}>{t("new")}</Button><Button onClick={seed}>{t("seed")}</Button></HStack>
      {(editingId !== null || form.id === 0) && (
        <VStack align="stretch" spacing={3} bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200" mb={4}>
          <Input placeholder={t("name")} value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input type="number" placeholder={t("order")} value={String(form.order ?? 1)} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
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
            <Th>{t("order")}</Th>
            <Th>{t("actions")}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {stages.map(s => (
            <Tr key={s.id}>
              <Td>{s.id}</Td>
              <Td>{s.name}</Td>
              <Td>{s.order}</Td>
              <Td>
                <HStack>
                  <Button size="sm" onClick={() => startEdit(s)}>{t("edit")}</Button>
                  <Button size="sm" colorScheme="red" onClick={() => remove(s.id)}>{t("delete")}</Button>
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
