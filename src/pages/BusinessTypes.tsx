import { useEffect, useState, useCallback } from "react";
import { Box, Heading, HStack, Button, Table, Thead, Tbody, Tr, Th, Td, Text, VStack, Input, FormControl, FormLabel, FormHelperText, Tooltip, Icon, Alert, AlertIcon, AlertDescription, Select, useToast, useColorModeValue, useMediaQuery, Badge } from "@chakra-ui/react";
import { useHelp } from "../help-context";
import { MdInfoOutline } from "react-icons/md";
import { listBusinessTypes, createBusinessType, updateBusinessType, deleteBusinessType, listContractTemplates, uploadContractTemplate } from "../lib/api";
import { useI18n } from "../useI18n";
import { useAuth } from "../useAuth";

type BT = { id: number; name: string; code?: string; description?: string };
type TemplateRow = { id: number; filename: string; locale?: string; uploaded_at?: string };

export default function BusinessTypes() {
  const { t } = useI18n();
  const { canAccess } = useAuth();
  const help = useHelp();
  const toast = useToast();
  const [isSmall] = useMediaQuery("(max-width: 768px)");
  const [types, setTypes] = useState<BT[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<BT>({ id: 0, name: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [initialForm, setInitialForm] = useState<BT>({ id: 0, name: "" });
  const [saving, setSaving] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [locale, setLocale] = useState<string>("");
  const [category, setCategory] = useState<"contract" | "poa" | "">("");

  const panelBg = useColorModeValue("white","gray.800");
  const panelBorder = useColorModeValue("gray.200","gray.700");
  const tableBg = useColorModeValue("white","gray.800");
  const btnBg = useColorModeValue("brand.500","brand.600");
  const btnHoverBg = useColorModeValue("brand.600","brand.500");

  const loadTypes = () => { listBusinessTypes({ limit: 100, sort_by: "name", sort_dir: "asc" }).then(setTypes).catch((e) => setError(String(e))); };
  const loadTemplates = (btId: number) => { listContractTemplates({ business_type_id: btId }).then(setTemplates).catch(() => setTemplates([])); };
  useEffect(() => { loadTypes(); }, []);
  useEffect(() => { if (selectedTypeId) loadTemplates(selectedTypeId); }, [selectedTypeId]);

  const startCreate = () => { const f = { id: 0, name: "", code: "", description: "" } as BT; setEditingId(null); setForm(f); setInitialForm(f); };
  const startEdit = (bt: BT) => { const f = { ...bt } as BT; setEditingId(bt.id); setForm(f); setInitialForm(f); };
  const cancel = () => { setEditingId(null); setForm({ id: 0, name: "" }); };

  const submit = useCallback(async () => {
    setSaving(true); setError(null);
    try {
      const payload: { name: string; code?: string; description?: string } = { name: form.name, code: form.code, description: form.description };
      if (editingId) await updateBusinessType(editingId, payload); else await createBusinessType(payload);
      setInitialForm(form);
      toast({ title: t("business_types") || "Tipos de Negócio", description: t("save") || "Salvo", status: "success", duration: 3000, isClosable: true });
      cancel();
      loadTypes();
    } catch (e) { const msg = String(e); setError(msg); toast({ title: t("business_types") || "Tipos de Negócio", description: msg, status: "error", duration: 5000, isClosable: true }); }
    finally { setSaving(false); }
  }, [form, editingId, t, toast]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const k = String(e.key || "").toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === "s") { e.preventDefault(); if ((editingId !== null || form.id === 0) && !saving) submit(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editingId, form.id, saving, submit]);

  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm);

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
      <HStack justify="space-between" mb={4}>
        <Heading size="md">{t("business_types") || "Tipos de Negócio"}</Heading>
        <HStack>
          <Button size="sm" variant="ghost" onClick={() => help.open("tipos_negocio")}>Ajuda</Button>
          {(editingId !== null || form.id === 0) && <Button size="sm" variant="solid" bg={btnBg} _hover={{ bg: btnHoverBg }} color="white" onClick={submit} isLoading={saving}>Salvar</Button>}
          {dirty && (editingId !== null || form.id === 0) && <Badge colorScheme="orange" variant="solid">Alterações não salvas</Badge>}
        </HStack>
      </HStack>
      {error && <Text color="red.500" mb={3}>{error}</Text>}
      <HStack mb={3} spacing={3}>{canAccess("business_types","edit") && <Button colorScheme="brand" onClick={startCreate}>{t("new")}</Button>}</HStack>
      {(editingId !== null || form.id === 0) && (
        <VStack align="stretch" spacing={3} bg={panelBg} p={4} borderRadius="md" border="1px solid" borderColor={panelBorder} mb={4}>
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
            <Button variant="solid" bg={btnBg} _hover={{ bg: btnHoverBg }} color="white" onClick={submit} isDisabled={!canAccess("business_types","edit")} isLoading={saving}>{t("save")}</Button>
            <Button variant="outline" onClick={cancel}>{t("cancel")}</Button>
          </HStack>
        </VStack>
      )}
      <Table bg={tableBg} mb={6}>
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
                  {canAccess("business_types","edit") && <Button size="sm" onClick={() => { setSelectedTypeId(bt.id); startEdit(bt); }}>{t("edit")}</Button>}
                  {canAccess("business_types","delete") && <Button size="sm" colorScheme="red" onClick={() => remove(bt.id)}>{t("delete")}</Button>}
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Heading size="sm" mb={2}>{t("contract_templates") || "Modelos de Contrato"}</Heading>
      <VStack align="stretch" spacing={3} bg={panelBg} p={4} borderRadius="md" border="1px solid" borderColor={panelBorder}>
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
          <Button colorScheme="blue" onClick={upload} isDisabled={!selectedTypeId || !file || !canAccess("business_types","edit")}>{t("upload")}</Button>
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
      {!isSmall && (editingId !== null || form.id === 0) && (
        <Box position="fixed" bottom={6} right={6} zIndex={4000}>
          <Button variant="solid" bg={btnBg} _hover={{ bg: btnHoverBg }} color="white" size="lg" shadow="md" onClick={submit} isLoading={saving}>Salvar</Button>
        </Box>
      )}
    </Box>
  );
}
