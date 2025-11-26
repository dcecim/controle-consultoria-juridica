import { useEffect, useState } from "react";
import { Box, Heading, HStack, Button, Table, Thead, Tbody, Tr, Th, Td, Text, VStack, Input, FormControl, FormLabel, FormHelperText, Tooltip, Icon, Alert, AlertIcon, AlertDescription, Link, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure, ModalFooter, useToast } from "@chakra-ui/react";
import { MdInfoOutline } from "react-icons/md";
import { listOrganizations, createOrganization, updateOrganization, deleteOrganization, logOrganizationFormExample, updateDeal } from "../lib/api";
import { useI18n } from "../useI18n";
import { useSearchParams, useNavigate } from "react-router-dom";

type Org = { id: number; name: string; sector?: string };

export default function Organizations() {
  const { t } = useI18n();
  const learn = useDisclosure();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
      cancel();
      load();
    } catch (e) { setError(String(e)); }
  };

  const remove = async (id: number) => { await deleteOrganization(id); load(); };

  useEffect(() => {
    const create = searchParams.get("create");
    if (create === "1") {
      setTimeout(() => { startCreate(); }, 0);
    }
  }, [searchParams]);

  return (
    <Box>
      <Heading size="md" mb={4}>{t("organizations")}</Heading>
      {error && <Text color="red.500" mb={3}>{error}</Text>}
      <HStack mb={3} spacing={3}><Button onClick={startCreate}>{t("new")}</Button></HStack>
      {(editingId !== null || form.id === 0) && (
        <VStack align="stretch" spacing={3} bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200" mb={4}>
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
                <Button colorScheme="blue" onClick={() => {
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
