import { useCallback, useEffect, useState } from "react";
import { Table, Thead, Tbody, Tr, Th, Td, Box, Heading, Select, HStack, Button, Text, VStack, Input } from "@chakra-ui/react";
import { getDeals, createDeal, updateDeal, deleteDeal, listStages } from "../lib/api";
import { useI18n } from "../i18n";

type Deal = {
  id: number;
  title: string;
  status: string;
  stage_id: number;
  organization_id?: number;
  value?: number;
  estimated_value?: number;
  opened_at?: string;
  closed_at?: string;
};
type DealForm = { title: string; stage_id?: number; estimated_value?: number; status?: string };

export default function Deals() {
  const { t } = useI18n();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [sortBy, setSortBy] = useState("opened_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<DealForm>({ title: "", stage_id: undefined, estimated_value: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [stages, setStages] = useState<{ id: number; name: string }[]>([]);

  const load = useCallback(() => {
    getDeals({ limit, offset, sort_by: sortBy, sort_dir: sortDir })
      .then(setDeals)
      .catch((e) => setError(String(e)));
    listStages().then((arr) => {
      setStages(arr);
      if (!editingId) {
        setForm((prev) => ({ ...prev, stage_id: prev.stage_id ?? arr[0]?.id }));
      }
    }).catch(() => {});
  }, [limit, offset, sortBy, sortDir, editingId]);

  useEffect(() => { load(); }, [load]);

  const startCreate = () => {
    setEditingId(null);
    setForm({ title: "", stage_id: stages[0]?.id, estimated_value: 0, status: "Novo" });
  };
  const startEdit = (d: Deal) => {
    setEditingId(d.id);
    setForm({ title: d.title, stage_id: d.stage_id, estimated_value: d.estimated_value ?? 0, status: d.status });
  };
  const cancel = () => {
    setEditingId(null);
    setForm({ title: "", stage_id: stages[0]?.id, estimated_value: 0 });
  };

  const submit = async () => {
    try {
      const payload = { ...form };
      if (editingId) {
        await updateDeal(editingId, payload);
      } else {
        await createDeal(payload);
      }
      cancel();
      load();
    } catch (e: any) {
      setError(String(e));
    }
  };

  const remove = async (id: number) => { await deleteDeal(id); load(); };

  return (
    <Box>
      <Heading size="md" mb={4}>{t("deals")}</Heading>
      {error && <Text color="red.500" mb={4}>{error}</Text>}
      <HStack mb={3}><Button onClick={startCreate}>{t("new")}</Button></HStack>
      <VStack align="stretch" spacing={3} bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200" mb={4}>
        <Input placeholder={t("title")} value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Select value={String(form.stage_id ?? "")} onChange={(e) => setForm({ ...form, stage_id: Number(e.target.value) })}>
          {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Input type="number" placeholder={t("estimated_value")} value={String(form.estimated_value ?? 0)} onChange={(e) => setForm({ ...form, estimated_value: Number(e.target.value) })} />
        <HStack>
          <Button colorScheme="blue" onClick={submit}>{editingId ? t("save") : t("new")}</Button>
          {editingId && <Button variant="outline" onClick={cancel}>{t("cancel")}</Button>}
        </HStack>
      </VStack>
      <HStack mb={3} spacing={3}>
        <Select value={String(limit)} onChange={(e) => setLimit(Number(e.target.value))} maxW="120px">
          {[10, 20, 50].map(v => <option key={v} value={v}>{v}/página</option>)}
        </Select>
        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} maxW="180px">
          <option value="opened_at">{t("opened_at")}</option>
          <option value="closed_at">Fechado em</option>
          <option value="estimated_value">{t("estimated_value")}</option>
          <option value="title">{t("title")}</option>
          <option value="status">{t("status")}</option>
        </Select>
        <Select value={sortDir} onChange={(e) => setSortDir(e.target.value as "asc" | "desc")} maxW="140px">
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </Select>
        <Button onClick={() => setOffset(Math.max(0, offset - limit))}>Anterior</Button>
        <Button onClick={() => setOffset(offset + limit)}>Próximo</Button>
      </HStack>
      <Table bg="white">
        <Thead>
          <Tr>
            <Th>{t("id")}</Th>
            <Th>{t("title")}</Th>
            <Th>{t("status")}</Th>
            <Th>{t("stage")}</Th>
            <Th>{t("estimated_value")}</Th>
            <Th>{t("opened_at")}</Th>
            <Th>{t("actions")}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {deals.map(d => (
            <Tr key={d.id}>
              <Td>{d.id}</Td>
              <Td>{d.title}</Td>
              <Td>{d.status}</Td>
              <Td>{d.stage_id}</Td>
              <Td>{d.estimated_value ?? "-"}</Td>
              <Td>{d.opened_at ? new Date(d.opened_at).toLocaleString() : "-"}</Td>
              <Td>
                <HStack>
                  <Button size="sm" onClick={() => startEdit(d)}>{t("edit")}</Button>
                  <Button size="sm" colorScheme="red" onClick={() => remove(d.id)}>{t("delete")}</Button>
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
