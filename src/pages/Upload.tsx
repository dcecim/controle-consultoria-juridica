import { useEffect, useState } from "react";
import { Box, Heading, HStack, Input, Select, Button, Text, VStack, Table, Thead, Tbody, Tr, Th, Td, FormControl, FormLabel, FormHelperText, Tooltip, Icon, Alert, AlertIcon, AlertDescription, Link, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure, ModalFooter, Checkbox, useToast } from "@chakra-ui/react";
import { MdInfoOutline } from "react-icons/md";
import { getDocumentTypes, getDealUploads, uploadDocument, logDocumentsExample, getDeals, createDocumentType, listContacts, listOrganizations, getRequiredDocumentsForDeal, setRequiredDocumentsForDeal, getOrganizationRequiredDocuments, setOrganizationRequiredDocuments } from "../lib/api";
import { useI18n } from "../useI18n";
import { useSearchParams } from "react-router-dom";

type DocType = { id: number; name: string; description?: string; allowed_mime_types?: string[] };
type UploadEntry = { id: number; original_filename: string; mime_type: string; size_bytes: number; uploaded_at?: string; document_type_id: number; contact_id?: number | null };
type DealSummary = { id: number; title: string; organization_id?: number };
type ContactSummary = { id: number; first_name: string; last_name: string };

export default function Upload() {
  const { t } = useI18n();
  const learn = useDisclosure();
  const typeModal = useDisclosure();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [dealId, setDealId] = useState<number>(7);
  const [deals, setDeals] = useState<DealSummary[]>([]);
  const [docTypes, setDocTypes] = useState<DocType[]>([]);
  const [documentTypeId, setDocumentTypeId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newType, setNewType] = useState<{ name: string; code?: string; description?: string; allowed_mime_types?: string }>(() => ({ name: "", code: "", description: "", allowed_mime_types: "" }));
  const [contacts, setContacts] = useState<ContactSummary[]>([]);
  const [contactId, setContactId] = useState<number | null>(null);
  const [orgs, setOrgs] = useState<Array<{ id: number; name: string }>>([]);
  const [requiredDocs, setRequiredDocs] = useState<Array<{ id: number; document_type_id: number; fulfilled: boolean; uploads_count: number; document_type?: { id: number; name: string } }>>([]);
  const [requiredSelection, setRequiredSelection] = useState<number[]>([]);
  const [orgRequiredSelection, setOrgRequiredSelection] = useState<number[]>([]);
  const [dealDocStatus, setDealDocStatus] = useState<Record<number, { pending: number; total: number }>>({});

  useEffect(() => {
    getDocumentTypes().then(setDocTypes).catch((e) => setError(String(e)));
    getDeals({ limit: 200, sort_by: "id", sort_dir: "desc" }).then((res) => setDeals(res || [])).catch(() => setDeals([]));
    listOrganizations({ limit: 500, sort_by: "id", sort_dir: "asc" }).then((rows) => {
      const mapped = Array.isArray(rows) ? (rows as Array<{ id: number; name: string }>).map((o) => ({ id: o.id, name: String(o.name ?? "") })) : [];
      setOrgs(mapped);
    }).catch(() => setOrgs([]));
  }, []);

  useEffect(() => {
    const d = searchParams.get("deal");
    const id = d ? Number(d) : undefined;
    if (id) {
      setTimeout(() => { setDealId(id); }, 0);
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    async function sync() {
      if (dealId) {
        getDealUploads(dealId).then((rows) => { if (!cancelled) setUploads(rows || []); }).catch(() => {});
        getRequiredDocumentsForDeal(dealId)
          .then((rows) => {
            if (cancelled) return;
            setRequiredDocs(rows || []);
            setRequiredSelection((rows || []).map((r: { document_type_id: number }) => r.document_type_id));
            const total = (rows || []).length;
            const pending = (rows || []).filter((r: { fulfilled: boolean }) => !r.fulfilled).length;
            setDealDocStatus((prev) => ({ ...prev, [dealId]: { pending, total } }));
          })
          .catch(() => { if (!cancelled) setRequiredDocs([]); });
      }
      const deal = deals.find(d => d.id === dealId);
      const orgId = deal?.organization_id;
      if (orgId) {
        try {
          const rows = await listContacts({ organization_id: orgId });
          if (!cancelled) setContacts(rows || []);
          const orgReq = await getOrganizationRequiredDocuments(orgId);
          if (!cancelled) {
            setOrgRequiredSelection((orgReq || []).map((r: { document_type_id: number }) => r.document_type_id));
          }
        } catch {
          if (!cancelled) setContacts([]);
        }
      } else {
        if (!cancelled) setContacts([]);
      }
      if (!cancelled) setContactId(null);
    }
    void sync();
    return () => { cancelled = true; };
  }, [dealId, deals]);


  useEffect(() => {
    let cancelled = false;
    async function loadStatuses() {
      const ids = deals.map(d => d.id);
      if (ids.length === 0) return;
      try {
        const results = await Promise.all(ids.map(id => getRequiredDocumentsForDeal(id).catch(() => [])));
        if (cancelled) return;
        const map: Record<number, { pending: number; total: number }> = {};
        ids.forEach((id, i) => {
          const rows = results[i] as Array<{ fulfilled: boolean }>;
          const total = rows.length;
          const pending = rows.filter(r => !r.fulfilled).length;
          map[id] = { pending, total };
        });
        setDealDocStatus(map);
      } catch { void 0; }
    }
    void loadStatuses();
    return () => { cancelled = true; };
  }, [deals]);

  const onUpload = async () => {
    setError(null); setSuccess(null);
    if (!dealId || !documentTypeId || !file) {
      setError("Informe Deal ID, tipo de documento e selecione um arquivo.");
      return;
    }
    try {
      await uploadDocument(dealId, documentTypeId, file, notes || undefined, contactId ?? undefined);
      setSuccess("Upload realizado com sucesso.");
      setFile(null);
      setNotes("");
      getDealUploads(dealId).then(setUploads).catch(() => {});
      const rows = await getRequiredDocumentsForDeal(dealId).catch(() => []);
      setRequiredDocs(rows || []);
      const total = (rows || []).length;
      const pending = (rows || []).filter((r: { fulfilled: boolean }) => !r.fulfilled).length;
      setDealDocStatus((prev) => ({ ...prev, [dealId]: { pending, total } }));
    } catch (e) {
      const msg = String((e as Error).message || e);
      const mbMatch = msg.match(/>\s*(\d+)\s*MB/);
      if (/413|File too large/i.test(msg)) {
        const mb = mbMatch ? mbMatch[1] : undefined;
        setError(mb ? `${t("upload_error_too_large")} (${mb} MB)` : t("upload_error_too_large"));
      } else {
        setError(msg);
      }
    }
  };

  return (
    <Box>
      <Heading size="md" mb={4}>{t("upload")}</Heading>
      <VStack align="stretch" spacing={3} bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <AlertDescription>
            {t("upload_form_intro")} <Link color="blue.600" onClick={learn.onOpen}>{t("learn_more")}</Link>
          </AlertDescription>
        </Alert>
        <Modal isOpen={learn.isOpen} onClose={learn.onClose} isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{t("upload_learn_more_title")}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align="stretch" spacing={2}>
                <Text>{t("upload_deal_id_help")}</Text>
                <Text>{t("upload_doc_type_help")}</Text>
                <Text>{t("upload_file_help")}</Text>
                <Text>{t("upload_notes_help")}</Text>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" onClick={() => {
                const firstType = docTypes[0]?.id;
                const dId = dealId || 1;
                setDealId(dId);
                setDocumentTypeId(firstType ?? null);
                setNotes(notes || "Contrato de prestação de serviços");
                logDocumentsExample("upload_exemplo", { deal_id: dId, document_type_id: firstType, notes: "Contrato de prestação de serviços" }).catch(() => {});
                learn.onClose();
              }}>{t("upload_apply_example")}</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <FormControl>
          <FormLabel display="flex" alignItems="center" gap={2}>{t("upload_deal_label")}
            <Tooltip label={t("upload_deal_id_help")} placement="top" hasArrow>
              <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
            </Tooltip>
          </FormLabel>
          <Select placeholder={t("upload_deal_placeholder")} value={dealId ? String(dealId) : ""} onChange={(e) => setDealId(Number(e.target.value))}>
            {deals.map(d => {
              const s = dealDocStatus[d.id];
              const suffix = s && s.total > 0 ? ` (${s.pending} ${t("pending_docs_label")})` : "";
              return (<option key={d.id} value={d.id}>{`#${d.id} - ${d.title}${suffix}`}</option>);
            })}
          </Select>
          {(() => {
            const s = dealDocStatus[dealId];
            if (!s || s.total === 0) return null;
            return <FormHelperText>{`${t("required_docs_title")}: ${s.pending}/${s.total} ${t("pending_docs_label")}`}</FormHelperText>;
          })()}
          <FormHelperText>{t("upload_deal_id_help")}</FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel display="flex" alignItems="center" gap={2}>{t("upload_doc_type_label")}
            <Tooltip label={t("upload_doc_type_help")} placement="top" hasArrow>
              <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
            </Tooltip>
          </FormLabel>
          <HStack>
            <Select flex="1" placeholder={t("upload_doc_type_placeholder")} value={documentTypeId ?? ""} onChange={(e) => setDocumentTypeId(Number(e.target.value))}>
              {docTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
            </Select>
            <Button variant="outline" onClick={typeModal.onOpen}>{t("upload_add_doc_type")}</Button>
          </HStack>
          <FormHelperText>{t("upload_doc_type_help")}</FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel display="flex" alignItems="center" gap={2}>{t("upload_contact_label")}
            <Tooltip label={t("upload_contact_help")} placement="top" hasArrow>
              <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
            </Tooltip>
          </FormLabel>
          <Select placeholder={t("upload_contact_placeholder")} value={contactId ? String(contactId) : ""} onChange={(e) => setContactId(Number(e.target.value))}>
            {contacts.map(c => <option key={c.id} value={c.id}>{`${c.first_name} ${c.last_name}`}</option>)}
          </Select>
          <FormHelperText>{t("upload_contact_help")}</FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel display="flex" alignItems="center" gap={2}>{t("upload_file_label")}
            <Tooltip label={t("upload_file_help")} placement="top" hasArrow>
              <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
            </Tooltip>
          </FormLabel>
          <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <FormHelperText>{t("upload_file_help")}</FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel display="flex" alignItems="center" gap={2}>{t("upload_notes_label")}
            <Tooltip label={t("upload_notes_help")} placement="top" hasArrow>
              <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
            </Tooltip>
          </FormLabel>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          <FormHelperText>{t("upload_notes_help")}</FormHelperText>
        </FormControl>
        <HStack>
          <Button colorScheme="blue" onClick={onUpload}>{t("upload_button")}</Button>
          {error && <Text color="red.500">{error}</Text>}
          {success && <Text color="green.600">{success}</Text>}
        </HStack>
        <Modal isOpen={typeModal.isOpen} onClose={typeModal.onClose} isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{t("upload_new_doc_type_title")}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align="stretch" spacing={3}>
                <FormControl>
                  <FormLabel>{t("upload_new_doc_type_name")}</FormLabel>
                  <Input value={newType.name} onChange={(e) => setNewType({ ...newType, name: e.target.value })} />
                </FormControl>
                <FormControl>
                  <FormLabel>{t("upload_new_doc_type_code")}</FormLabel>
                  <Input value={newType.code ?? ""} onChange={(e) => setNewType({ ...newType, code: e.target.value })} />
                </FormControl>
                <FormControl>
                  <FormLabel>{t("upload_new_doc_type_desc")}</FormLabel>
                  <Input value={newType.description ?? ""} onChange={(e) => setNewType({ ...newType, description: e.target.value })} />
                </FormControl>
                <FormControl>
                  <FormLabel>{t("upload_new_doc_type_mime")}</FormLabel>
                  <Input placeholder="application/pdf,image/png" value={newType.allowed_mime_types ?? ""} onChange={(e) => setNewType({ ...newType, allowed_mime_types: e.target.value })} />
                  <FormHelperText>{t("upload_new_doc_type_mime_help")}</FormHelperText>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" onClick={async () => {
                try {
                  const payload = {
                    name: newType.name,
                    code: newType.code || undefined,
                    description: newType.description || undefined,
                    allowed_mime_types: (newType.allowed_mime_types || "").split(",").map(s => s.trim()).filter(Boolean),
                  };
                  const created = await createDocumentType(payload);
                  setDocTypes(prev => [{ id: created.id, name: created.name }, ...prev]);
                  setDocumentTypeId(created.id);
                  typeModal.onClose();
                  setNewType({ name: "", code: "", description: "", allowed_mime_types: "" });
                } catch (e: unknown) {
                  setError(e instanceof Error ? e.message : String(e));
                }
              }}>{t("upload_new_doc_type_save")}</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>

      <Heading size="sm" mt={6} mb={3}>{t("required_docs_title")}</Heading>
      <VStack align="stretch" spacing={3} bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
        <Table>
          <Thead>
            <Tr>
              <Th>{t("upload_doc_type_label")}</Th>
              <Th>{t("required_docs_status")}</Th>
              <Th>{t("required_docs_uploads")}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {requiredDocs.map(r => (
              <Tr key={r.id}>
                <Td>{r.document_type?.name ?? r.document_type_id}</Td>
                <Td>{r.fulfilled ? t("required_docs_fulfilled") : t("required_docs_missing")}</Td>
                <Td>{r.uploads_count}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        <Heading size="xs" mt={2}>{t("required_docs_manage")}</Heading>
        <VStack align="stretch">
          {docTypes.map(dt => (
            <HStack key={dt.id}>
              <Checkbox isChecked={requiredSelection.includes(dt.id)} onChange={(e) => {
                setRequiredSelection(prev => e.target.checked ? [...prev, dt.id] : prev.filter(id => id !== dt.id));
              }} />
              <Text>{dt.name}</Text>
            </HStack>
          ))}
        </VStack>
        <HStack>
          <Button onClick={async () => {
            try {
              const rows = await setRequiredDocumentsForDeal(dealId, requiredSelection);
              setRequiredDocs(rows || []);
              setSuccess(t("required_docs_saved"));
              const total = (rows || []).length;
              const pending = (rows || []).filter((r: { fulfilled: boolean }) => !r.fulfilled).length;
              setDealDocStatus((prev) => ({ ...prev, [dealId]: { pending, total } }));
            } catch (e) {
              setError(String((e as Error).message || e));
            }
          }}>{t("required_docs_save")}</Button>
        </HStack>
      </VStack>

      {deals.find(d => d.id === dealId)?.organization_id ? (
        <>
          <Heading size="sm" mt={6} mb={3}>{t("org_template_title")}</Heading>
          <VStack align="stretch" spacing={3} bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
            <Heading size="xs" mt={0}>{t("org_template_manage")}</Heading>
            <VStack align="stretch">
              {docTypes.map(dt => (
                <HStack key={dt.id}>
                  <Checkbox isChecked={orgRequiredSelection.includes(dt.id)} onChange={(e) => {
                    setOrgRequiredSelection(prev => e.target.checked ? [...prev, dt.id] : prev.filter(id => id !== dt.id));
                  }} />
                  <Text>{dt.name}</Text>
                </HStack>
              ))}
            </VStack>
            <HStack>
              <Button onClick={async () => {
              try {
                const orgIdMaybe = deals.find(d => d.id === dealId)?.organization_id;
                if (!orgIdMaybe) { setError(t("upload_error_no_org")); return; }
                const orgId = orgIdMaybe;
                await setOrganizationRequiredDocuments(orgId, orgRequiredSelection);
                setSuccess(t("org_template_saved"));
                const affectedIds = deals.filter(d => d.organization_id === orgId).map(d => d.id);
                if (affectedIds.length > 0) {
                  const results = await Promise.all(affectedIds.map(id => getRequiredDocumentsForDeal(id).catch(() => [])));
                  setDealDocStatus(prev => {
                    const next = { ...prev };
                    affectedIds.forEach((id, i) => {
                      const rows = results[i] as Array<{ fulfilled: boolean }>;
                      const total = rows.length;
                      const pending = rows.filter(r => !r.fulfilled).length;
                      next[id] = { pending, total };
                    });
                    return next;
                  });
                }
              } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                if (/404|Not\s*Found/i.test(msg)) {
                  const d = deals.find(x => x.id === dealId);
                  const orgId = d?.organization_id;
                  const orgName = orgId ? (orgs.find(o => o.id === orgId)?.name ?? `#${orgId}`) : undefined;
                  const orgInfo = orgId ? `${t("organizations") || t("organization")}: ${orgName}` : "";
                  toast({
                    title: t("org_template_save"),
                    description: (
                      <Box>
                        <Text mb={2}>{`${t("upload_error_no_org")} (${t("deals")}: #${dealId}${orgInfo ? ", " + orgInfo : ""})`}</Text>
                        <HStack>
                          <Link href={`/organizations?deal=${dealId}`} color="blue.600">{t("organizations")}</Link>
                          <Link href={`/organizations?create=1&deal=${dealId}`} color="blue.600">{`${t("new")} ${t("organizations")}`}</Link>
                        </HStack>
                      </Box>
                    ),
                    status: "warning",
                    duration: 5000,
                    isClosable: true,
                  });
                } else {
                  setError(msg);
                }
              }
            }}>{t("org_template_save")}</Button>
              <Button variant="outline" onClick={() => {
                // sincronizar: aplica do template para o deal se conjunto atual estiver vazio
                if (requiredSelection.length === 0) {
                  const union = Array.from(new Set([...orgRequiredSelection]));
                  setRequiredSelection(union);
                }
              }}>{t("org_template_apply_to_deal")}</Button>
            </HStack>
          </VStack>
        </>
      ) : null}

      <Heading size="sm" mt={6} mb={3}>{t("uploads_for_deal")}</Heading>
      <Table bg="white">
        <Thead>
          <Tr>
              <Th>ID</Th>
              <Th>Arquivo</Th>
              <Th>MIME</Th>
              <Th>Tamanho</Th>
              <Th>{t("upload_contact_col")}</Th>
              <Th>{t("uploaded_at")}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {uploads.map(u => (
            <Tr key={u.id}>
              <Td>{u.id}</Td>
              <Td>{u.original_filename}</Td>
              <Td>{u.mime_type}</Td>
              <Td>{(u.size_bytes / 1024 / 1024).toFixed(2)} MB</Td>
              <Td>{u.contact_id ? (() => { const c = contacts.find(x => x.id === u.contact_id); return c ? `${c.first_name} ${c.last_name}` : `#${u.contact_id}`; })() : "-"}</Td>
              <Td>{u.uploaded_at ? new Date(u.uploaded_at).toLocaleString() : "-"}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
