import { useEffect, useState } from "react";
import { Box, Heading, HStack, Button, Table, Thead, Tbody, Tr, Th, Td, Text, VStack, Input, FormControl, FormLabel, FormHelperText, Tooltip, Icon, Alert, AlertIcon, AlertDescription, Select, useToast } from "@chakra-ui/react";
import { MdInfoOutline } from "react-icons/md";
import { listBusinessTypes, createBusinessType, updateBusinessType, deleteBusinessType, listContractTemplates, uploadContractTemplate } from "../lib/api";
import { useI18n } from "../useI18n";

type BT = { id: number; name: string; code?: string; description?: string };
type TemplateRow = { id: number; filename: string; locale?: string; uploaded_at?: string };

export default function BusinessTypes() {
  const { t } = useI18n();
  const toast = useToast();
  const [types, setTypes] = useState<BT[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<BT>({ id: 0, name: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [locale, setLocale] = useState<string>("");
  const [category, setCategory] = useState<"contract" | "poa" | "">("");

  const loadTypes = () => { listBusinessTypes({ limit: 100, sort_by: "name", sort_dir: "asc" }).then(setTypes).catch((e) => setError(String(e))); };
  const loadTemplates = (btId: number) => { listContractTemplates({ business_type_id: btId }).then(setTemplates).catch(() => setTemplates([])); };
  useEffect(() => { loadTypes(); }, []);
  useEffect(() => { if (selectedTypeId) loadTemplates(selectedTypeId); }, [selectedTypeId]);

  const startCreate = () => { setEditingId(null); setForm({ id: 0, name: "", code: "", description: "" }); };
  const startEdit = (bt: BT) => { setEditingId(bt.id); setForm({ ...bt }); };
  const cancel = () => { setEditingId(null); setForm({ id: 0, name: "" }); };

  const submit = async () => {
    try {
      const payload: { name: string; code?: string; description?: string } = { name: form.name, code: form.code, description: form.description };
      if (editingId) await updateBusinessType(editingId, payload); else await createBusinessType(payload);
      cancel();
      loadTypes();
    } catch (e) { setError(String(e)); }
  };

  const remove = async (id: number) => { await deleteBusinessType(id); loadTypes(); };

  const upload = async () => {
    if (!selectedTypeId || !file) return;
    try {
      await uploadContractTemplate(selectedTypeId, file, locale || undefined, category || undefined);
      toast({ title: t("upload"), description: t("save"), status: "success", duration: 3000, isClosable: true });
      setFile(null);
      setLocale("");
      setCategory("");
      loadTemplates(selectedTypeId);
    } catch (e) {
      toast({ title: t("upload"), description: String(e), status: "error", duration: 5000, isClosable: true });
    }
  };

  return (
    <Box>
      <Heading size="md" mb={4}>{t("business_types") || "Tipos de Negócio"}</Heading>
      {error && <Text color="red.500" mb={3}>{error}</Text>}
      <HStack mb={3} spacing={3}><Button onClick={startCreate}>{t("new")}</Button></HStack>
      {(editingId !== null || form.id === 0) && (
        <VStack align="stretch" spacing={3} bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200" mb={4}>
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <AlertDescription>
              {t("business_types_form_intro") || "Cadastre tipos de negócio e seus modelos de contrato (.doc/.docx)."}
            </AlertDescription>
          </Alert>
          <FormControl>
            <FormLabel display="flex" alignItems="center" gap={2}>{t("name")}
              <Tooltip label={t("business_type_name_help") || "Nome do tipo de negócio"} placement="top" hasArrow>
                <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
              </Tooltip>
            </FormLabel>
            <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <FormHelperText>{t("business_type_name_help") || "Nome do tipo de negócio"}</FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel display="flex" alignItems="center" gap={2}>{t("code") || "Código"}
              <Tooltip label={t("business_type_code_help") || "Código interno opcional"} placement="top" hasArrow>
                <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
              </Tooltip>
            </FormLabel>
            <Input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <FormHelperText>{t("business_type_code_help") || "Código interno opcional"}</FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel display="flex" alignItems="center" gap={2}>{t("description") || "Descrição"}
              <Tooltip label={t("business_type_description_help") || "Descrição do tipo"} placement="top" hasArrow>
                <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
              </Tooltip>
            </FormLabel>
            <Input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <FormHelperText>{t("business_type_description_help") || "Descrição do tipo"}</FormHelperText>
          </FormControl>
          <HStack>
            <Button colorScheme="blue" onClick={submit}>{t("save")}</Button>
            <Button variant="outline" onClick={cancel}>{t("cancel")}</Button>
          </HStack>
        </VStack>
      )}
      <Table bg="white" mb={6}>
        <Thead>
          <Tr>
            <Th>{t("id")}</Th>
            <Th>{t("name")}</Th>
            <Th>{t("code") || "Código"}</Th>
            <Th>{t("description") || "Descrição"}</Th>
            <Th>{t("actions")}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {types.map(bt => (
            <Tr key={bt.id}>
              <Td>{bt.id}</Td>
              <Td>{bt.name}</Td>
              <Td>{bt.code ?? "-"}</Td>
              <Td>{bt.description ?? "-"}</Td>
              <Td>
                <HStack>
                  <Button size="sm" onClick={() => { setSelectedTypeId(bt.id); startEdit(bt); }}>{t("edit")}</Button>
                  <Button size="sm" colorScheme="red" onClick={() => remove(bt.id)}>{t("delete")}</Button>
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Heading size="sm" mb={2}>{t("contract_templates") || "Modelos de Contrato"}</Heading>
      <VStack align="stretch" spacing={3} bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
        <HStack>
          <Select placeholder={t("business_types") || "Tipos de Negócio"} value={String(selectedTypeId ?? "")} onChange={(e) => setSelectedTypeId(Number(e.target.value) || null)} maxW="320px">
            {types.map(bt => <option key={bt.id} value={bt.id}>{bt.name}</option>)}
          </Select>
          <Input type="file" accept=".doc,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <Input placeholder={t("locale") || "Idioma/Local"} value={locale} onChange={(e) => setLocale(e.target.value)} maxW="200px" />
          <Select placeholder={t("category") || "Categoria"} value={category} onChange={(e) => setCategory((e.target.value as "contract" | "poa" | ""))} maxW="220px">
            <option value="contract">{t("category_contract") || "Contrato"}</option>
            <option value="poa">{t("category_poa") || "Procuração"}</option>
          </Select>
          <Button colorScheme="blue" onClick={upload} isDisabled={!selectedTypeId || !file}>{t("upload")}</Button>
        </HStack>
        <Table>
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Arquivo</Th>
              <Th>{t("locale") || "Idioma"}</Th>
              <Th>{t("uploaded_at")}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {templates.map(tp => (
              <Tr key={tp.id}>
                <Td>{tp.id}</Td>
                <Td>{tp.filename}</Td>
                <Td>{tp.locale ?? "-"}</Td>
                <Td>{tp.uploaded_at ? new Date(tp.uploaded_at).toLocaleString() : "-"}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </VStack>
    </Box>
  );
}

