import { useEffect, useState } from "react";
import { Box, Heading, HStack, Button, Table, Thead, Tbody, Tr, Th, Td, Text, VStack, Input, Select, FormControl, FormLabel, FormHelperText, Tooltip, Icon, Alert, AlertIcon, AlertDescription, Link, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure, ModalFooter } from "@chakra-ui/react";
import { MdInfoOutline } from "react-icons/md";
import { listContacts, createContact, updateContact, deleteContact, listOrganizations, logContactFormExample } from "../lib/api";
import { useI18n } from "../useI18n";

type Contact = { id: number; first_name?: string; last_name?: string; email?: string; organization_id?: number; client_type?: string; lead_source?: string };
type Org = { id: number; name: string };

export default function Contacts() {
  const { t } = useI18n();
  const learn = useDisclosure();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Contact>({ id: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = () => {
    listContacts({ limit: 50, sort_by: "last_name", sort_dir: "asc" }).then(setContacts).catch((e) => setError(String(e)));
    listOrganizations({ limit: 100 }).then(setOrgs).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const startCreate = () => { setEditingId(null); setForm({ id: 0, first_name: "", last_name: "", email: "" }); };
  const startEdit = (c: Contact) => { setEditingId(c.id); setForm({ ...c }); };
  const cancel = () => { setEditingId(null); setForm({ id: 0 }); };

  const submit = async () => {
    try {
      const { id: _unused, ...payload } = form; void _unused;
      if (editingId) {
        await updateContact(editingId, payload);
      } else {
        await createContact(payload);
      }
      cancel();
      load();
    } catch (e) { setError(String(e)); }
  };

  const remove = async (id: number) => { await deleteContact(id); load(); };

  return (
    <Box>
      <Heading size="md" mb={4}>{t("contacts")}</Heading>
      {error && <Text color="red.500" mb={3}>{error}</Text>}
      <HStack mb={3} spacing={3}>
        <Button onClick={startCreate}>{t("new")}</Button>
      </HStack>
      {editingId !== null || form.id === 0 ? (
        <VStack align="stretch" spacing={3} bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200" mb={4}>
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
                <Button colorScheme="blue" onClick={() => {
                  const orgId = orgs[0]?.id;
                  setForm({ id: form.id, first_name: form.first_name || "Ana", last_name: form.last_name || "Silva", email: form.email || "ana.silva@example.com", organization_id: orgId, client_type: form.client_type || "Pessoa Física", lead_source: form.lead_source || "Indicação" });
                  logContactFormExample("pf_indicacao", { organization_id: orgId, client_type: "Pessoa Física", lead_source: "Indicação" }).catch(() => {});
                  learn.onClose();
                }}>{t("contacts_apply_example_1")}</Button>
                <Button variant="outline" ml={3} onClick={() => {
                  const orgId = orgs[0]?.id;
                  setForm({ id: form.id, first_name: form.first_name || "Carlos", last_name: form.last_name || "Pereira", email: form.email || "c.pereira@empresa.com", organization_id: orgId, client_type: form.client_type || "Pessoa Jurídica", lead_source: form.lead_source || "Website" });
                  logContactFormExample("pj_site", { organization_id: orgId, client_type: "Pessoa Jurídica", lead_source: "Website" }).catch(() => {});
                  learn.onClose();
                }}>{t("contacts_apply_example_2")}</Button>
                <Button variant="outline" ml={3} onClick={() => {
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
            <Button colorScheme="blue" onClick={submit}>{t("save")}</Button>
            <Button variant="outline" onClick={cancel}>{t("cancel")}</Button>
          </HStack>
        </VStack>
      ) : null}
      <Table bg="white">
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
                  <Button size="sm" onClick={() => startEdit(c)}>{t("edit")}</Button>
                  <Button size="sm" colorScheme="red" onClick={() => remove(c.id)}>{t("delete")}</Button>
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
