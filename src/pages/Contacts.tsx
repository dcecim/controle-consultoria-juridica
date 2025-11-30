import { useEffect, useState, useCallback } from "react";
import { Box, Heading, HStack, Button, Table, Thead, Tbody, Tr, Th, Td, Text, VStack, Input, Select, FormControl, FormLabel, FormHelperText, Tooltip, Icon, Alert, AlertIcon, AlertDescription, Link, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure, ModalFooter, useColorModeValue, useMediaQuery, Badge } from "@chakra-ui/react";
import { useHelp } from "../help-context";
import { MdInfoOutline } from "react-icons/md";
import { listContacts, createContact, updateContact, deleteContact, listOrganizations, logContactFormExample } from "../lib/api";
import { useI18n } from "../useI18n";
import { useAuth } from "../useAuth";

type Contact = { id: number; first_name?: string; last_name?: string; email?: string; organization_id?: number; client_type?: string; lead_source?: string };
type Org = { id: number; name: string };

export default function Contacts() {
  const { t } = useI18n();
  const { canAccess } = useAuth();
  const help = useHelp();
  const learn = useDisclosure();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Contact>({ id: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [initialForm, setInitialForm] = useState<Contact>({ id: 0 });
  const [saving, setSaving] = useState(false);
  const [isSmall] = useMediaQuery("(max-width: 768px)");

  const load = () => {
    listContacts({ limit: 50, sort_by: "last_name", sort_dir: "asc" }).then((rows) => {
      const arr = rows || [];
      setContacts(arr);
      try {
        const tenantId = Number(localStorage.getItem("tenantId") || 1);
        const missing = arr.filter((c: Contact) => {
          const email = (c.email || "").trim();
          const ok = /.+@.+\..+/.test(email);
          return !email || !ok;
        }).length;
        localStorage.setItem(`tenant:${tenantId}:contacts_missing_email_total`, String(missing));
      } catch (e) { void e; }
    }).catch((e) => setError(String(e)));
    listOrganizations({ limit: 100 }).then(setOrgs).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const startCreate = () => { const f = { id: 0, first_name: "", last_name: "", email: "" } as Contact; setEditingId(null); setForm(f); setInitialForm(f); };
  const startEdit = (c: Contact) => { const f = { ...c } as Contact; setEditingId(c.id); setForm(f); setInitialForm(f); };
  const cancel = () => { setEditingId(null); setForm({ id: 0 }); };

  const submit = useCallback(async () => {
    setSaving(true); setError(null);
    try {
      const { id: _unused, ...payload } = form; void _unused;
      if (editingId) {
        await updateContact(editingId, payload);
      } else {
        await createContact(payload);
      }
      setInitialForm(form);
      cancel();
      load();
    } catch (e) { setError(String(e)); }
    finally { setSaving(false); }
  }, [form, editingId]);

  const remove = async (id: number) => { await deleteContact(id); load(); };

  const bgPanel = useColorModeValue("white","gray.800");
  const borderPanel = useColorModeValue("gray.200","gray.700");
  const tableBg = useColorModeValue("white","gray.800");
  const btnBg = useColorModeValue("brand.500","brand.600");
  const btnHoverBg = useColorModeValue("brand.600","brand.500");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const k = String(e.key || "").toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === "s") { e.preventDefault(); if ((editingId !== null || form.id === 0) && !saving) submit(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editingId, form.id, saving, submit]);

  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <Heading size="md">{t("contacts")}</Heading>
        <HStack>
          <Button size="sm" variant="ghost" onClick={() => help.open("contatos")}>Ajuda</Button>
          {(editingId !== null || form.id === 0) && <Button size="sm" variant="solid" bg={btnBg} _hover={{ bg: btnHoverBg }} color="white" onClick={submit} isLoading={saving}>Salvar</Button>}
          {dirty && (editingId !== null || form.id === 0) && <Badge colorScheme="orange" variant="solid">Alterações não salvas</Badge>}
        </HStack>
      </HStack>
      {error && <Text color="red.500" mb={3}>{error}</Text>}
      <HStack mb={3} spacing={3}>
        {canAccess("contacts","edit") && <Button colorScheme="brand" onClick={startCreate}>{t("new")}</Button>}
      </HStack>
      {editingId !== null || form.id === 0 ? (
        <VStack align="stretch" spacing={3} bg={bgPanel} p={4} borderRadius="md" border="1px solid" borderColor={borderPanel} mb={4}>
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <AlertDescription>
              {t("contacts_form_intro")} <Link color="blue.600" onClick={learn.onOpen}>{t("learn_more")}</Link>
            </AlertDescription>
          </Alert>
          <Modal isOpen={learn.isOpen} onClose={learn.onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>{t("contacts_learn_more_title")}</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack align="stretch" spacing={2}>
                  <Text>{t("contact_first_name_help")}</Text>
                  <Text>{t("contact_last_name_help")}</Text>
                  <Text>{t("contact_email_help")}</Text>
                  <Text>{t("contact_organization_help")}</Text>
                  <Text>{t("client_type_help")}</Text>
                  <Text>{t("lead_source_help")}</Text>
                </VStack>
              </ModalBody>
              <ModalFooter>
                <Button colorScheme="brand" onClick={() => {
                  const orgId = orgs[0]?.id;
                  setForm({ id: form.id, first_name: form.first_name || "Ana", last_name: form.last_name || "Silva", email: form.email || "ana.silva@example.com", organization_id: orgId, client_type: form.client_type || "Pessoa Física", lead_source: form.lead_source || "Indicação" });
                  logContactFormExample("pf_indicacao", { organization_id: orgId, client_type: "Pessoa Física", lead_source: "Indicação" }).catch(() => {});
                  learn.onClose();
                }}>{t("contacts_apply_example_1")}</Button>
                <Button variant="outline" colorScheme="brand" ml={3} onClick={() => {
                  const orgId = orgs[0]?.id;
                  setForm({ id: form.id, first_name: form.first_name || "Carlos", last_name: form.last_name || "Pereira", email: form.email || "c.pereira@empresa.com", organization_id: orgId, client_type: form.client_type || "Pessoa Jurídica", lead_source: form.lead_source || "Website" });
                  logContactFormExample("pj_site", { organization_id: orgId, client_type: "Pessoa Jurídica", lead_source: "Website" }).catch(() => {});
                  learn.onClose();
                }}>{t("contacts_apply_example_2")}</Button>
                <Button variant="outline" colorScheme="brand" ml={3} onClick={() => {
                  setForm({ id: form.id, first_name: form.first_name || "Maria", last_name: form.last_name || "Gomez", email: form.email || "maria.gomez@example.org", organization_id: undefined, client_type: form.client_type || "Pessoa Física", lead_source: form.lead_source || "Evento" });
                  logContactFormExample("pf_evento", { client_type: "Pessoa Física", lead_source: "Evento" }).catch(() => {});
                  learn.onClose();
                }}>{t("contacts_apply_example_3")}</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
          <FormControl>
            <FormLabel display="flex" alignItems="center" gap={2}>Primeiro nome
              <Tooltip label={t("contact_first_name_help")} placement="top" hasArrow>
                <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
              </Tooltip>
            </FormLabel>
            <Input value={form.first_name ?? ""} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            <FormHelperText>{t("contact_first_name_help")}</FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel display="flex" alignItems="center" gap={2}>Sobrenome
              <Tooltip label={t("contact_last_name_help")} placement="top" hasArrow>
                <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
              </Tooltip>
            </FormLabel>
            <Input value={form.last_name ?? ""} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            <FormHelperText>{t("contact_last_name_help")}</FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel display="flex" alignItems="center" gap={2}>Email
              <Tooltip label={t("contact_email_help")} placement="top" hasArrow>
                <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
              </Tooltip>
            </FormLabel>
            <Input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <FormHelperText>{t("contact_email_help")}</FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel display="flex" alignItems="center" gap={2}>{t("organization")}
              <Tooltip label={t("contact_organization_help")} placement="top" hasArrow>
                <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
              </Tooltip>
            </FormLabel>
            <Select placeholder={t("organization")} value={String(form.organization_id ?? "")} onChange={(e) => setForm({ ...form, organization_id: Number(e.target.value) || undefined })}>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </Select>
            <FormHelperText>{t("contact_organization_help")}</FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel display="flex" alignItems="center" gap={2}>{t("client_type")}
              <Tooltip label={t("client_type_help")} placement="top" hasArrow>
                <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
              </Tooltip>
            </FormLabel>
            <Select placeholder={t("client_type")} value={form.client_type ?? ""} onChange={(e) => setForm({ ...form, client_type: e.target.value || undefined })}>
              <option value="Pessoa Física">Pessoa Física</option>
              <option value="Pessoa Jurídica">Pessoa Jurídica</option>
            </Select>
            <FormHelperText>{t("client_type_help")}</FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel display="flex" alignItems="center" gap={2}>{t("lead_source")}
              <Tooltip label={t("lead_source_help")} placement="top" hasArrow>
                <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
              </Tooltip>
            </FormLabel>
            <Select placeholder={t("lead_source")} value={form.lead_source ?? ""} onChange={(e) => setForm({ ...form, lead_source: e.target.value || undefined })}>
              <option value="Indicação">Indicação</option>
              <option value="Website">Website</option>
              <option value="Redes Sociais">Redes Sociais</option>
              <option value="Evento">Evento</option>
            </Select>
            <FormHelperText>{t("lead_source_help")}</FormHelperText>
          </FormControl>
          <HStack>
            <Button variant="solid" bg={btnBg} _hover={{ bg: btnHoverBg }} color="white" onClick={submit} isDisabled={!canAccess("contacts","edit")} isLoading={saving}>{t("save")}</Button>
            <Button variant="outline" onClick={cancel}>{t("cancel")}</Button>
          </HStack>
        </VStack>
      ) : null}
      <Table bg={tableBg}>
        <Thead>
          <Tr>
            <Th>{t("id")}</Th>
            <Th>{t("name")}</Th>
            <Th>Email</Th>
            <Th>{t("organization")}</Th>
            <Th>{t("actions")}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {contacts.map(c => (
            <Tr key={c.id}>
              <Td>{c.id}</Td>
              <Td>{[c.first_name, c.last_name].filter(Boolean).join(" ")}</Td>
              <Td>{c.email ?? "-"}</Td>
              <Td>{c.organization_id ?? "-"}</Td>
              <Td>
                <HStack>
                  {canAccess("contacts","edit") && <Button size="sm" onClick={() => startEdit(c)}>{t("edit")}</Button>}
                  {canAccess("contacts","delete") && <Button size="sm" colorScheme="red" onClick={() => remove(c.id)}>{t("delete")}</Button>}
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
