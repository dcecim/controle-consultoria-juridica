import { useEffect, useState, useCallback } from "react";
import { Box, Heading, HStack, Button, Table, Thead, Tbody, Tr, Th, Td, Text, VStack, Input, FormControl, FormLabel, FormHelperText, Tooltip, Icon, Alert, AlertIcon, AlertDescription, Link, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure, ModalFooter, useToast, useColorModeValue, useMediaQuery, Badge } from "@chakra-ui/react";
import { useHelp } from "../help-context";
import { MdInfoOutline } from "react-icons/md";
import { listOrganizations, createOrganization, updateOrganization, deleteOrganization, logOrganizationFormExample, updateDeal } from "../lib/api";
import { useI18n } from "../useI18n";
import { useAuth } from "../useAuth";
import { useSearchParams, useNavigate } from "react-router-dom";

type Org = { id: number; name: string; sector?: string };

export default function Organizations() {
  const { t } = useI18n();
  const { canAccess } = useAuth();
  const help = useHelp();
  const learn = useDisclosure();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Org>({ id: 0, name: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [initialForm, setInitialForm] = useState<Org>({ id: 0, name: "", sector: "" });
  const [saving, setSaving] = useState(false);
  const [isSmall] = useMediaQuery("(max-width: 768px)");

  const panelBg = useColorModeValue("white","gray.800");
  const panelBorder = useColorModeValue("gray.200","gray.700");
  const tableBg = useColorModeValue("white","gray.800");
  const btnBg = useColorModeValue("brand.500","brand.600");
  const btnHoverBg = useColorModeValue("brand.600","brand.500");

  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  const load = () => { listOrganizations({ limit: 100, sort_by: "name", sort_dir: "asc" }).then(setOrgs).catch((e) => setError(String(e))); };
  useEffect(() => { load(); }, []);

  const startCreate = () => { const f = { id: 0, name: "", sector: "" } as Org; setEditingId(null); setForm(f); setInitialForm(f); };
  const startEdit = (o: Org) => { const f = { ...o } as Org; setEditingId(o.id); setForm(f); setInitialForm(f); };
  const cancel = () => { setEditingId(null); setForm({ id: 0, name: "" }); };

  const submit = useCallback(async () => {
    setSaving(true); setError(null);
    try {
      const payload: { name: string; sector?: string } = { name: form.name, sector: form.sector };
      if (editingId) {
        await updateOrganization(editingId, payload);
      } else {
        const created = await createOrganization(payload) as { id: number; name: string; sector?: string };
        const dealParam = searchParams.get("deal");
        const dealId = dealParam ? Number(dealParam) : undefined;
        if (dealId) {
          toast({
            title: t("organizations"),
            description: (
              <Box>
                <Text mb={2}>{`${t("save")}: ${created.name}`}</Text>
                <HStack>
                  <Button colorScheme="blue" size="sm" onClick={async () => {
                    try {
                      await updateDeal(dealId, { organization_id: created.id });
                      toast({
                        title: t("organizations"),
                        description: `Vinculado ao Deal #${dealId}.`,
                        status: "success",
                        duration: 4000,
                        isClosable: true,
                      });
                      navigate(`/deals?edit=${dealId}`);
                    } catch (e) {
                      toast({
                        title: t("organizations"),
                        description: `Falha ao vincular ao Deal #${dealId}: ${String(e)}`,
                        status: "error",
                        duration: 5000,
                        isClosable: true,
                      });
                    }
                  }}>Vincular ao Deal #{dealId}</Button>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/deals?edit=${dealId}`)}>Abrir Deal</Button>
                </HStack>
              </Box>
            ),
            status: "info",
            duration: 6000,
            isClosable: true,
          });
        }
      }
      setInitialForm(form);
      cancel();
      load();
    } catch (e) { setError(String(e)); }
    finally { setSaving(false); }
  }, [form, editingId, navigate, searchParams, t, toast]);

  const remove = async (id: number) => { await deleteOrganization(id); load(); };
  useEffect(() => {
    const create = searchParams.get("create");
    if (create === "1") {
      setTimeout(() => { startCreate(); }, 0);
    }
  }, [searchParams]);

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
        <Heading size="md">{t("organizations")}</Heading>
        <HStack>
          <Button size="sm" variant="ghost" onClick={() => help.open("organizacoes")}>Ajuda</Button>
          {(editingId !== null || form.id === 0) && <Button size="sm" variant="solid" bg={btnBg} _hover={{ bg: btnHoverBg }} color="white" onClick={submit} isLoading={saving}>Salvar</Button>}
          {dirty && (editingId !== null || form.id === 0) && <Badge colorScheme="orange" variant="solid">Alterações não salvas</Badge>}
        </HStack>
      </HStack>
      {error && <Text color="red.500" mb={3}>{error}</Text>}
      <HStack mb={3} spacing={3}>{canAccess("organizations","edit") && <Button colorScheme="brand" onClick={startCreate}>{t("new")}</Button>}</HStack>
      {(editingId !== null || form.id === 0) && (
        <VStack align="stretch" spacing={3} bg={panelBg} p={4} borderRadius="md" border="1px solid" borderColor={panelBorder} mb={4}>
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <AlertDescription>
              {t("organizations_form_intro")} <Link color="blue.600" onClick={learn.onOpen}>{t("learn_more")}</Link>
            </AlertDescription>
          </Alert>
          <Modal isOpen={learn.isOpen} onClose={learn.onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>{t("organizations_learn_more_title")}</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack align="stretch" spacing={2}>
                  <Text>{t("organization_name_help")}</Text>
                  <Text>{t("organization_sector_help")}</Text>
                </VStack>
              </ModalBody>
              <ModalFooter>
                <Button colorScheme="brand" onClick={() => {
                  setForm({ id: form.id, name: form.name || "Montreal Logística", sector: form.sector || "Logística" });
                  logOrganizationFormExample("logistica", { sector: "Logística" }).catch(() => {});
                  learn.onClose();
                }}>{t("organizations_apply_example_1")}</Button>
                <Button variant="outline" ml={3} onClick={() => {
                  setForm({ id: form.id, name: form.name || "TechNova Ltda", sector: form.sector || "Tecnologia" });
                  logOrganizationFormExample("tecnologia", { sector: "Tecnologia" }).catch(() => {});
                  learn.onClose();
                }}>{t("organizations_apply_example_2")}</Button>
                <Button variant="outline" ml={3} onClick={() => {
                  setForm({ id: form.id, name: form.name || "Prefeitura de Campinas", sector: form.sector || "Público" });
                  logOrganizationFormExample("publico", { sector: "Público" }).catch(() => {});
                  learn.onClose();
                }}>{t("organizations_apply_example_3")}</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
          <FormControl>
            <FormLabel display="flex" alignItems="center" gap={2}>{t("name")}
              <Tooltip label={t("organization_name_help")} placement="top" hasArrow>
                <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
              </Tooltip>
            </FormLabel>
            <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <FormHelperText>{t("organization_name_help")}</FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel display="flex" alignItems="center" gap={2}>{t("sector")}
              <Tooltip label={t("organization_sector_help")} placement="top" hasArrow>
                <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
              </Tooltip>
            </FormLabel>
            <Input value={form.sector ?? ""} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
            <FormHelperText>{t("organization_sector_help")}</FormHelperText>
          </FormControl>
          <HStack>
            <Button variant="solid" bg={btnBg} _hover={{ bg: btnHoverBg }} color="white" onClick={submit} isDisabled={!canAccess("organizations","edit")} isLoading={saving}>{t("save")}</Button>
            <Button variant="outline" onClick={cancel}>{t("cancel")}</Button>
          </HStack>
        </VStack>
      )}
      <Table bg={tableBg}> 
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
                  {canAccess("organizations","edit") && <Button size="sm" onClick={() => startEdit(o)}>{t("edit")}</Button>}
                  {canAccess("organizations","delete") && <Button size="sm" colorScheme="red" onClick={() => remove(o.id)}>{t("delete")}</Button>}
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
