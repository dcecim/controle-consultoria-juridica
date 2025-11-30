import { useEffect, useState, useCallback } from "react";
import { Box, Heading, HStack, Button, Table, Thead, Tbody, Tr, Th, Td, Text, VStack, Input, FormControl, FormLabel, FormHelperText, Tooltip, Icon, Alert, AlertIcon, AlertDescription, Link, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure, ModalFooter, useColorModeValue, useMediaQuery, Badge } from "@chakra-ui/react";
import { useHelp } from "../help-context";
import { MdInfoOutline } from "react-icons/md";
import { listStages, createStage, updateStage, deleteStage, seedStages, logStageFormExample } from "../lib/api";
import { useI18n } from "../useI18n";
import { useAuth } from "../useAuth";

type Stage = { id: number; name: string; order: number };

export default function Stages() {
  const { t } = useI18n();
  const { canAccess } = useAuth();
  const help = useHelp();
  const learn = useDisclosure();
  const [stages, setStages] = useState<Stage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Stage>({ id: 0, name: "", order: 1 });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [initialForm, setInitialForm] = useState<Stage>({ id: 0, name: "", order: 1 });
  const [saving, setSaving] = useState(false);
  const [isSmall] = useMediaQuery("(max-width: 768px)");

  const panelBg = useColorModeValue("white","gray.800");
  const panelBorder = useColorModeValue("gray.200","gray.700");
  const tableBg = useColorModeValue("white","gray.800");
  const btnBg = useColorModeValue("brand.500","brand.600");
  const btnHoverBg = useColorModeValue("brand.600","brand.500");

  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  const load = () => { listStages().then(setStages).catch((e) => setError(String(e))); };
  useEffect(() => { load(); }, []);

  const startCreate = () => { const f = { id: 0, name: "", order: (stages[stages.length-1]?.order ?? 0) + 1 } as Stage; setEditingId(null); setForm(f); setInitialForm(f); };
  const startEdit = (s: Stage) => { const f = { ...s } as Stage; setEditingId(s.id); setForm(f); setInitialForm(f); };
  const cancel = () => { setEditingId(null); setForm({ id: 0, name: "", order: 1 }); };

  const submit = useCallback(async () => {
    setSaving(true); setError(null);
    try {
      const payload: { name: string; order: number } = { name: form.name, order: form.order };
      if (editingId) await updateStage(editingId, payload); else await createStage(payload);
      setInitialForm(form);
      cancel();
      load();
    } catch (e) { setError(String(e)); }
    finally { setSaving(false); }
  }, [form, editingId]);

  const remove = async (id: number) => { await deleteStage(id); load(); };
  const seed = async () => { await seedStages(); load(); };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const k = String(e.key || "").toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === "s") { e.preventDefault(); if ((editingId !== null || form.id === 0) && !saving) submit(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editingId, form.id, saving, submit]);

  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <Heading size="md">{t("stages")}</Heading>
        <HStack>
          <Button size="sm" variant="ghost" onClick={() => help.open("fases")}>Ajuda</Button>
          {(editingId !== null || form.id === 0) && <Button size="sm" variant="solid" bg={btnBg} _hover={{ bg: btnHoverBg }} color="white" onClick={submit} isLoading={saving}>Salvar</Button>}
          {dirty && (editingId !== null || form.id === 0) && <Badge colorScheme="orange" variant="solid">Alterações não salvas</Badge>}
        </HStack>
      </HStack>
      {error && <Text color="red.500" mb={3}>{error}</Text>}
      <HStack mb={3} spacing={3}>{canAccess("stages","edit") && <Button colorScheme="brand" onClick={startCreate}>{t("new")}</Button>}{canAccess("stages","edit") && <Button colorScheme="brand" onClick={seed}>{t("seed")}</Button>}</HStack>
      {(editingId !== null || form.id === 0) && (
        <VStack align="stretch" spacing={3} bg={panelBg} p={4} borderRadius="md" border="1px solid" borderColor={panelBorder} mb={4}>
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <AlertDescription>
              {t("stages_form_intro")} <Link color="blue.600" onClick={learn.onOpen}>{t("learn_more")}</Link>
            </AlertDescription>
          </Alert>
          <Modal isOpen={learn.isOpen} onClose={learn.onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>{t("stages_learn_more_title")}</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack align="stretch" spacing={2}>
                  <Text>{t("stage_name_help")}</Text>
                  <Text>{t("stage_order_help")}</Text>
                </VStack>
              </ModalBody>
              <ModalFooter>
                <Button colorScheme="brand" onClick={() => {
                  setForm({ id: form.id, name: form.name || "Proposta", order: form.order || ((stages[stages.length-1]?.order ?? 0) + 1) });
                  logStageFormExample("proposta", { name: "Proposta" }).catch(() => {});
                  learn.onClose();
                }}>{t("stages_apply_example_1")}</Button>
                <Button variant="outline" colorScheme="brand" ml={3} onClick={() => {
                  setForm({ id: form.id, name: form.name || "Negociação", order: form.order || ((stages[stages.length-1]?.order ?? 0) + 1) });
                  logStageFormExample("negociacao", { name: "Negociação" }).catch(() => {});
                  learn.onClose();
                }}>{t("stages_apply_example_2")}</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
          <FormControl>
            <FormLabel display="flex" alignItems="center" gap={2}>{t("name")}
              <Tooltip label={t("stage_name_help")} placement="top" hasArrow>
                <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
              </Tooltip>
            </FormLabel>
            <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <FormHelperText>{t("stage_name_help")}</FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel display="flex" alignItems="center" gap={2}>{t("order")}
              <Tooltip label={t("stage_order_help")} placement="top" hasArrow>
                <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
              </Tooltip>
            </FormLabel>
            <Input type="number" value={String(form.order ?? 1)} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
            <FormHelperText>{t("stage_order_help")}</FormHelperText>
          </FormControl>
          <HStack>
            <Button variant="solid" bg={btnBg} _hover={{ bg: btnHoverBg }} color="white" onClick={submit} isDisabled={!canAccess("stages","edit")} isLoading={saving}>{t("save")}</Button>
            <Button variant="outline" onClick={cancel}>{t("cancel")}</Button>
          </HStack>
        </VStack>
      )}
      <Table bg={tableBg}>
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
                  {canAccess("stages","edit") && <Button size="sm" onClick={() => startEdit(s)}>{t("edit")}</Button>}
                  {canAccess("stages","delete") && <Button size="sm" colorScheme="red" onClick={() => remove(s.id)}>{t("delete")}</Button>}
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      {!isSmall && (editingId !== null || form.id === 0) && (
        <Box position="fixed" bottom={6} right={6} zIndex={4000}>
          <Button variant="solid" bg={btnBg} _hover={{ bg: btnHoverBg }} color="white" size="lg" shadow="md" onClick={submit} isLoading={saving}>Salvar</Button>
        </Box>
      )}
    </Box>
  );
}
