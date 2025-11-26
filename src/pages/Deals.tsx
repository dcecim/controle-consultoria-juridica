import { useCallback, useEffect, useState } from "react";
import { Table, Thead, Tbody, Tr, Th, Td, Box, Heading, Select, HStack, Button, Text, VStack, Input, Checkbox, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, FormControl, FormLabel, FormHelperText, Tooltip, Icon, Alert, AlertIcon, AlertDescription, Link, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure, List, ListItem, ModalFooter, Code, useToast } from "@chakra-ui/react";
import { MdInfoOutline } from "react-icons/md";
import { getDeals, createDeal, updateDeal, deleteDeal, listStages, listLeadScores, computeLeadScore, logDealFormExample, listBusinessTypes, generateContractDocx, generatePowerOfAttorneyDocx, listOrganizations, getDocumentTypes, uploadDocument, getDealUploads, downloadUploadFile, listContacts } from "../lib/api";
import { useAuth } from "../useAuth";
import type { LeadScoreRead } from "../lib/api";
import { useI18n } from "../useI18n";
import { getLocale, getCurrency } from "../config";
import { useSearchParams } from "react-router-dom";

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
  email_open_rate?: number;
  interactions_total?: number;
  docs_shared?: boolean;
};
type DealForm = { title: string; stage_id?: number; estimated_value?: number; value?: number; status?: string; email_open_rate?: number; interactions_total?: number; docs_shared?: boolean; business_type_id?: number };

export default function Deals() {
  const { t } = useI18n();
  const learn = useDisclosure();
  const [searchParams] = useSearchParams();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [sortBy, setSortBy] = useState("opened_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<DealForm>({ title: "", stage_id: undefined, estimated_value: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [stages, setStages] = useState<{ id: number; name: string }[]>([]);
  const [businessTypes, setBusinessTypes] = useState<{ id: number; name: string }[]>([]);
  const [orgs, setOrgs] = useState<{ id: number; name: string; sector?: string }[]>([]);
  const [contacts, setContacts] = useState<Array<{ id: number; first_name?: string; last_name?: string; email?: string; organization_id?: number; client_type?: string }>>([]);
  const [dealContactId, setDealContactId] = useState<number | null>(null);
  const { canAccess } = useAuth();
  const varsPreview = useDisclosure();
  const toast = useToast();
  const [lastContract, setLastContract] = useState<{ id: number; original_filename: string; uploaded_at?: string } | null>(null);
  const [recentContractUrl, setRecentContractUrl] = useState<string | null>(null);
  const [recentContractName, setRecentContractName] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<number | null>(null);
  const [scores, setScores] = useState<LeadScoreRead[]>([]);
  const [selectedScoreId, setSelectedScoreId] = useState<number | null>(null);
  const formatNum = useCallback((n: number) => new Intl.NumberFormat(getLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n), []);
  const formatMoney = useCallback((n: number) => new Intl.NumberFormat(getLocale(), { style: "currency", currency: getCurrency(), minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n), []);
  const [estimatedMasked, setEstimatedMasked] = useState<string>(formatNum(0));
  const [valueMasked, setValueMasked] = useState<string>(formatNum(0));
  const formatPct = useCallback((n: number) => new Intl.NumberFormat(getLocale(), { style: "percent", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n), []);

  const load = useCallback(() => {
    getDeals({ limit, offset, sort_by: sortBy, sort_dir: sortDir })
      .then((rows) => {
        const arr = rows || [];
        setDeals(arr);
        try {
          const tenantId = Number(localStorage.getItem("tenantId") || 1);
          const missingOrg = arr.filter(d => !d.organization_id).length;
          localStorage.setItem(`tenant:${tenantId}:deals_missing_org_total`, String(missingOrg));
        } catch (e) { void e; }
      })
      .catch((e) => setError(String(e)));
    listStages().then((arr) => {
      setStages(arr);
      if (!editingId) {
        setForm((prev) => ({ ...prev, stage_id: prev.stage_id ?? arr[0]?.id }));
      }
    }).catch(() => {});
    listBusinessTypes({ limit: 200, sort_by: "name", sort_dir: "asc" }).then(setBusinessTypes).catch(() => {});
    listOrganizations({ limit: 500, sort_by: "name", sort_dir: "asc" }).then(setOrgs).catch(() => {});
    listContacts({ limit: 500, sort_by: "first_name", sort_dir: "asc" }).then(setContacts).catch(() => {});
  }, [limit, offset, sortBy, sortDir, editingId]);

  useEffect(() => { load(); }, [load]);

  

  const startCreate = () => {
    setEditingId(null);
    setForm({ title: "", stage_id: stages[0]?.id, estimated_value: 0, value: 0, status: "Novo", email_open_rate: 0, interactions_total: 0, docs_shared: false });
    setEstimatedMasked(formatNum(0));
    setValueMasked(formatNum(0));
  };
  const startEdit = useCallback((d: Deal) => {
    setEditingId(d.id);
    setForm({ title: d.title, stage_id: d.stage_id, estimated_value: d.estimated_value ?? 0, value: d.value ?? 0, status: d.status, email_open_rate: d.email_open_rate ?? 0, interactions_total: d.interactions_total ?? 0, docs_shared: d.docs_shared ?? false });
    setEstimatedMasked(formatNum(d.estimated_value ?? 0));
    setValueMasked(formatNum(d.value ?? 0));
  }, [formatNum]);
  const cancel = () => {
    setEditingId(null);
    setForm({ title: "", stage_id: stages[0]?.id, estimated_value: 0, value: 0, email_open_rate: 0, interactions_total: 0, docs_shared: false });
    setEstimatedMasked(formatNum(0));
    setValueMasked(formatNum(0));
  };

  useEffect(() => {
    const editParam = searchParams.get("edit");
    const editId = editParam ? Number(editParam) : undefined;
    if (editId && !editingId) {
      const found = deals.find(d => d.id === editId);
      if (found) setTimeout(() => { startEdit(found); }, 0);
    }
  }, [searchParams, deals, editingId, startEdit]);

  useEffect(() => {
    if (!editingId) { setTimeout(() => { setLastContract(null); }, 0); return; }
    getDealUploads(editingId).then((rows: Array<{ id: number; original_filename: string; mime_type: string; uploaded_at?: string }>) => {
      const isContract = (r: { original_filename: string; mime_type: string }) => /officedocument\.wordprocessingml\.document|msword/i.test(r.mime_type) || /\.docx?$/.test(r.original_filename || "");
      const filtered = (rows || []).filter(isContract);
      filtered.sort((a, b) => new Date(b.uploaded_at || 0).getTime() - new Date(a.uploaded_at || 0).getTime());
      setLastContract(filtered[0] || null);
    }).catch(() => setLastContract(null));
  }, [editingId]);

  const submit = async () => {
    try {
      const payload = { ...form, contact_id: dealContactId ?? undefined } as import("../lib/api").DealPayload;
      if (editingId) {
        await updateDeal(editingId, payload);
      } else {
        await createDeal(payload);
      }
      cancel();
      load();
    } catch (e: unknown) {
      setError(String(e));
    }
  };

  const generateContract = async () => {
    if (!editingId) return;
    try {
      const blob = await generateContractDocx(editingId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Contrato-${editingId}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const reuseUrl = URL.createObjectURL(blob);
      setRecentContractUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return reuseUrl; });
      setRecentContractName(`Contrato-${editingId}.docx`);

      try {
        const file = new File([blob], `Contrato-${editingId}.docx`, { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        const types = await getDocumentTypes().catch(() => [] as Array<{ id: number; name: string; allowed_mime_types?: string[] }>);
        const pick = (types as Array<{ id: number; name: string; allowed_mime_types?: string[] }>).find(t => /contrat|contract/i.test(t.name))
          || (types as Array<{ id: number; name: string; allowed_mime_types?: string[] }>).find(t => (t.allowed_mime_types || []).some(m => /officedocument\.wordprocessingml\.document|msword|\.docx|\.doc/i.test(m)))
          || (types as Array<{ id: number; name: string; allowed_mime_types?: string[] }>)[0];
        if (pick?.id) {
          await uploadDocument(editingId, pick.id, file, "Contrato gerado automaticamente", dealContactId ?? undefined);
          toast({ title: t("uploads_for_deal"), description: "Contrato salvo nos uploads do negócio", status: "success", duration: 4000, isClosable: true });
        } else {
          toast({ title: t("uploads_for_deal"), description: "Tipo de documento não encontrado para contrato", status: "warning", duration: 5000, isClosable: true });
        }
      } catch (e) {
        toast({ title: t("uploads_for_deal"), description: String(e), status: "error", duration: 5000, isClosable: true });
      }
    } catch (e) {
      setError(String(e));
    }
  };

  useEffect(() => {
    return () => { if (recentContractUrl) URL.revokeObjectURL(recentContractUrl); };
  }, [recentContractUrl]);

  const remove = async (id: number) => { await deleteDeal(id); load(); };

  const viewScores = async (id: number) => {
    setSelectedDealId(id);
    try {
      const rows = await listLeadScores({ deal_id: id });
      setScores(rows);
      setSelectedScoreId(rows[0]?.id ?? null);
    } catch (e: unknown) {
      setError(String(e));
    }
  };

  const compute = async (id: number) => {
    try {
      await computeLeadScore({ deal_id: id });
      await viewScores(id);
    } catch (e: unknown) {
      setError(String(e));
    }
  };

  const buildContractVariables = () => {
    const d = deals.find(x => x.id === editingId);
    const stageName = stages.find(s => s.id === (d?.stage_id ?? form.stage_id))?.name;
    const org = d?.organization_id ? orgs.find(o => o.id === d.organization_id) : undefined;
    const orgContacts = org ? contacts.filter(c => c.organization_id === org.id) : [];
    const selected = dealContactId ? orgContacts.find(c => c.id === dealContactId) || null : null;
    const primary = selected || orgContacts[0] || null;
    return {
      tenant: { id: Number(localStorage.getItem("tenantId") || 1) },
      deal: {
        id: d?.id ?? null,
        title: d?.title ?? form.title ?? "",
        stage_id: d?.stage_id ?? form.stage_id ?? null,
        stage_name: stageName ?? null,
        estimated_value: d?.estimated_value ?? form.estimated_value ?? null,
        value: d?.value ?? form.value ?? null,
        status: d?.status ?? form.status ?? "",
        email_open_rate: d?.email_open_rate ?? form.email_open_rate ?? null,
        interactions_total: d?.interactions_total ?? form.interactions_total ?? null,
        docs_shared: d?.docs_shared ?? form.docs_shared ?? false,
      },
      organization: org ? { id: org.id, name: org.name, sector: org.sector ?? null } : null,
      business_type: businessTypes.find(bt => bt.id === form.business_type_id) || null,
      contact: primary ? { id: primary.id, first_name: primary.first_name ?? "", last_name: primary.last_name ?? "", email: primary.email ?? "", organization_id: primary.organization_id ?? null, client_type: primary.client_type ?? "" } : null,
      contacts: orgContacts.map(c => ({ id: c.id, first_name: c.first_name ?? "", last_name: c.last_name ?? "", email: c.email ?? "", organization_id: c.organization_id ?? null, client_type: c.client_type ?? "" })),
    };
  };

  useEffect(() => {
    const reformat = () => {
      setEstimatedMasked(formatNum(form.estimated_value ?? 0));
      setValueMasked(formatNum(form.value ?? 0));
    };
    const onCur = () => reformat();
    const onLang = () => reformat();
    window.addEventListener("app:currency_changed", onCur);
    window.addEventListener("app:lang_changed", onLang);
    return () => {
      window.removeEventListener("app:currency_changed", onCur);
      window.removeEventListener("app:lang_changed", onLang);
    };
  }, [form.estimated_value, form.value, formatNum]);

  return (
    <Box>
      <Heading size="md" mb={4}>{t("deals")}</Heading>
      {error && <Text color="red.500" mb={4}>{error}</Text>}
      <HStack mb={3}>{canAccess("deals","edit") && <Button onClick={startCreate}>{t("new")}</Button>}</HStack>
      <VStack align="stretch" spacing={3} bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200" mb={4}>
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <AlertDescription>
            {t("deal_form_intro")} {" "}
            <Link color="blue.600" onClick={learn.onOpen}>{t("learn_more")}</Link>
          </AlertDescription>
        </Alert>
        <Modal isOpen={learn.isOpen} onClose={learn.onClose} isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{t("learn_more_title")}</ModalHeader>
            <ModalCloseButton />
          <ModalBody>
            <List spacing={2} styleType="disc" pl={4}>
              <ListItem>{t("learn_stage_example")}</ListItem>
              <ListItem>{t("learn_estimated_example")}</ListItem>
              <ListItem>{t("learn_value_example")}</ListItem>
              <ListItem>{t("learn_open_rate_example")}</ListItem>
              <ListItem>{t("learn_interactions_example")}</ListItem>
              <ListItem>{t("learn_docs_shared_example")}</ListItem>
            </List>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={() => {
              const stageId = stages.find(s => /negocia|prospect|prospec/i.test(s.name))?.id ?? stages[0]?.id;
              const est = 5000;
              const val = 4500;
              setEstimatedMasked(formatNum(est));
              setValueMasked(formatNum(val));
              setForm({
                title: form.title || "Proposta - Consultoria",
                stage_id: stageId,
                estimated_value: est,
                value: val,
                status: form.status || "Novo",
                email_open_rate: 0.42,
                interactions_total: 5,
                docs_shared: true,
              });
              logDealFormExample("negotiation", { stage_id: stageId, estimated_value: est, value: val, email_open_rate: 0.42, interactions_total: 5, docs_shared: true }).catch(() => {});
              learn.onClose();
            }}>{t("apply_example")}</Button>
            <Button variant="outline" ml={3} onClick={() => {
              const stageId = stages.find(s => /prospec|prospect/i.test(s.name))?.id ?? stages[0]?.id;
              const est = 1200;
              const val = 0;
              setEstimatedMasked(formatNum(est));
              setValueMasked(formatNum(val));
              setForm({
                title: form.title || "Prospecção - Consultoria",
                stage_id: stageId,
                estimated_value: est,
                value: val,
                status: form.status || "Novo",
                email_open_rate: 0.15,
                interactions_total: 2,
                docs_shared: false,
              });
              logDealFormExample("prospecting", { stage_id: stageId, estimated_value: est, value: val, email_open_rate: 0.15, interactions_total: 2, docs_shared: false }).catch(() => {});
              learn.onClose();
            }}>{t("apply_prospect_example")}</Button>
            <Button variant="outline" ml={3} onClick={() => {
              const stageId = stages.find(s => /fech|close|ganh|won|cierre/i.test(s.name))?.id ?? stages[stages.length-1]?.id ?? stages[0]?.id;
              const est = 10000;
              const val = 11500;
              setEstimatedMasked(formatNum(est));
              setValueMasked(formatNum(val));
              setForm({
                title: form.title || "Fechamento - Consultoria",
                stage_id: stageId,
                estimated_value: est,
                value: val,
                status: form.status || "Ganho",
                email_open_rate: 0.8,
                interactions_total: 8,
                docs_shared: true,
              });
              logDealFormExample("closing", { stage_id: stageId, estimated_value: est, value: val, email_open_rate: 0.8, interactions_total: 8, docs_shared: true }).catch(() => {});
              learn.onClose();
            }}>{t("apply_closing_example")}</Button>
          </ModalFooter>
          </ModalContent>
        </Modal>
        <FormControl>
          <FormLabel>{t("title")}</FormLabel>
          <Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </FormControl>
        <FormControl>
          <FormLabel display="flex" alignItems="center" gap={2}>
            {t("stage_label")}
            <Tooltip label={t("stage_help")} placement="top" hasArrow>
              <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
            </Tooltip>
          </FormLabel>
          <Select value={String(form.stage_id ?? "")} onChange={(e) => setForm({ ...form, stage_id: Number(e.target.value) })}>
            {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <FormHelperText>{t("stage_help")}</FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel display="flex" alignItems="center" gap={2}>{t("business_types") || "Tipo de Negócio"}
            <Tooltip label={t("business_type_help") || "Define o modelo de contrato"} placement="top" hasArrow>
              <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
            </Tooltip>
          </FormLabel>
          <Select placeholder={t("business_types") || "Tipo de Negócio"} value={String(form["business_type_id"] ?? "")} onChange={(e) => setForm({ ...form, business_type_id: Number(e.target.value) })}>
            {businessTypes.map(bt => <option key={bt.id} value={bt.id}>{bt.name}</option>)}
          </Select>
          <FormHelperText>{t("business_type_help") || "Seleciona o modelo de contrato"}</FormHelperText>
          <FormHelperText>
            {(() => {
              const d = deals.find(x => x.id === editingId);
              const org = orgs.find(o => o.id === (d?.organization_id));
              return `${t("organization")}: ${org ? org.name : "-"}`;
            })()}
          </FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel display="flex" alignItems="center" gap={2}>
            {t("estimated_value_label")}
            <Tooltip label={t("estimated_value_help")} placement="top" hasArrow>
              <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
            </Tooltip>
          </FormLabel>
          <Input
            type="text"
            value={estimatedMasked}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              const num = Number(raw) / 100;
              setEstimatedMasked(formatNum(num));
              setForm({ ...form, estimated_value: num });
            }}
          />
          <FormHelperText>{t("estimated_value_help")}</FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel display="flex" alignItems="center" gap={2}>
            {t("value_label")}
            <Tooltip label={t("value_help")} placement="top" hasArrow>
              <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
            </Tooltip>
          </FormLabel>
          <Input
            type="text"
            value={valueMasked}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              const num = Number(raw) / 100;
              setValueMasked(formatNum(num));
              setForm({ ...form, value: num });
            }}
          />
          <FormHelperText>{t("value_help")}</FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel display="flex" alignItems="center" gap={2}>
            {t("email_open_rate_label")}
            <Tooltip label={t("email_open_rate_help")} placement="top" hasArrow>
              <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
            </Tooltip>
          </FormLabel>
          <Input
            type="number"
            value={String(form.email_open_rate ?? 0)}
            min={0}
            max={1}
            step={0.01}
            onChange={(e) => setForm({ ...form, email_open_rate: Math.min(1, Math.max(0, Number(e.target.value))) })}
          />
          <FormHelperText>{t("email_open_rate_help")}</FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel display="flex" alignItems="center" gap={2}>
            {t("interactions_total_label")}
            <Tooltip label={t("interactions_total_help")} placement="top" hasArrow>
              <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
            </Tooltip>
          </FormLabel>
          <Input
            type="number"
            value={String(form.interactions_total ?? 0)}
            min={0}
            step={1}
            onChange={(e) => setForm({ ...form, interactions_total: Math.max(0, Number(e.target.value)) })}
          />
          <FormHelperText>{t("interactions_total_help")}</FormHelperText>
        </FormControl>
        <FormControl>
          <HStack alignItems="center">
            <Checkbox isChecked={!!form.docs_shared} onChange={(e) => setForm({ ...form, docs_shared: e.target.checked })}>{t("docs_shared_label")}</Checkbox>
            <Tooltip label={t("docs_shared_help")} placement="top" hasArrow>
              <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
            </Tooltip>
          </HStack>
          <FormHelperText>{t("docs_shared_help")}</FormHelperText>
        </FormControl>
        <HStack>
          <Button colorScheme="blue" onClick={submit} isDisabled={!canAccess("deals","edit")}>{editingId ? t("save") : t("new")}</Button>
          {editingId && <Button variant="outline" onClick={cancel}>{t("cancel")}</Button>}
          {editingId && canAccess("deals","edit") && <Button onClick={generateContract} isDisabled={!form["business_type_id"]}>{t("generate_contract") || "Gerar contrato"}</Button>}
          {editingId && canAccess("deals","edit") && <Button onClick={async () => {
            if (!editingId) return;
            try {
              const blob = await generatePowerOfAttorneyDocx(editingId);
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `Procuracao-${editingId}.docx`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              const reuseUrl = URL.createObjectURL(blob);
              setRecentContractUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return reuseUrl; });
              setRecentContractName(`Procuracao-${editingId}.docx`);
              try {
                const file = new File([blob], `Procuracao-${editingId}.docx`, { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
                const types = await getDocumentTypes().catch(() => [] as Array<{ id: number; name: string; allowed_mime_types?: string[] }>);
                const pick = (types as Array<{ id: number; name: string; allowed_mime_types?: string[] }>).find(t => /procur|power\s*of\s*attorney/i.test(t.name))
                  || (types as Array<{ id: number; name: string; allowed_mime_types?: string[] }>).find(t => (t.allowed_mime_types || []).some(m => /officedocument\.wordprocessingml\.document|msword|\.docx|\.doc/i.test(m)))
                  || (types as Array<{ id: number; name: string; allowed_mime_types?: string[] }>)[0];
        if (pick?.id) {
                await uploadDocument(editingId, pick.id, file, "Procuração gerada automaticamente", dealContactId ?? undefined);
                toast({ title: t("uploads_for_deal"), description: "Procuração salva nos uploads do negócio", status: "success", duration: 4000, isClosable: true });
              } else {
                toast({ title: t("uploads_for_deal"), description: "Tipo de documento não encontrado para procuração", status: "warning", duration: 5000, isClosable: true });
              }
              } catch (e) {
                toast({ title: t("uploads_for_deal"), description: String(e), status: "error", duration: 5000, isClosable: true });
              }
            } catch (e) { setError(String(e)); }
          }} isDisabled={!form["business_type_id"]}>Gerar procuração</Button>}
          {editingId && recentContractUrl && <Button variant="outline" onClick={() => {
            const a = document.createElement("a");
            a.href = recentContractUrl;
            a.download = recentContractName || `Contrato-${editingId}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }}>Baixar contrato gerado agora</Button>}
        {editingId && <Button variant="outline" onClick={varsPreview.onOpen}>{t("view_details") || "Ver variáveis"}</Button>}
        </HStack>
        {(() => {
          const d = deals.find(x => x.id === editingId);
          const org = d?.organization_id ? orgs.find(o => o.id === d.organization_id) : undefined;
          const orgContacts = org ? contacts.filter(c => c.organization_id === org.id) : [];
          return (
            <FormControl>
              <FormLabel display="flex" alignItems="center" gap={2}>{t("deal_contact_label") || "Contato do negócio"}
                <Tooltip label={t("deal_contact_help") || "Contato que alimenta as variáveis do modelo"} placement="top" hasArrow>
                  <Icon as={MdInfoOutline} color="gray.500" cursor="help" />
                </Tooltip>
              </FormLabel>
              <Select placeholder={t("deal_contact_placeholder") || "Selecione um contato..."} value={dealContactId ? String(dealContactId) : ""} onChange={(e) => setDealContactId(Number(e.target.value))}>
                {orgContacts.map(c => <option key={c.id} value={c.id}>{`${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || `#${c.id}`}</option>)}
              </Select>
              <FormHelperText>{t("deal_contact_help") || "Será usado como 'contact' nos modelos"}</FormHelperText>
            </FormControl>
          );
        })()}
        {editingId && (
          <Box mt={3} p={3} border="1px solid" borderColor="gray.200" borderRadius="md">
            <Heading size="sm" mb={2}>Último contrato gerado</Heading>
            {lastContract ? (
              <HStack justify="space-between">
                <Text>{lastContract.original_filename} {lastContract.uploaded_at ? `- ${new Date(lastContract.uploaded_at).toLocaleString()}` : ""}</Text>
                <HStack>
                  <Button size="sm" onClick={async () => {
                    try {
                      const blob = await downloadUploadFile(lastContract.id);
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = lastContract.original_filename || `Contrato-${editingId}.docx`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    } catch (e) {
                      setError(String(e));
                    }
                  }}>Baixar</Button>
                  <Button size="sm" as="a" href={`/upload?deal=${editingId}`}>Ver uploads</Button>
                </HStack>
              </HStack>
            ) : (
              <HStack justify="space-between">
                <Text color="gray.600">-</Text>
                <Button size="sm" as="a" href={`/upload?deal=${editingId}`}>Ver uploads</Button>
              </HStack>
            )}
          </Box>
        )}
        <Modal isOpen={varsPreview.isOpen} onClose={varsPreview.onClose} isCentered size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{(t("contract_templates") || "Modelos de Contrato") + " - Variáveis"}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Code width="100%" whiteSpace="pre" p={3}>
                {JSON.stringify(buildContractVariables(), null, 2)}
              </Code>
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
      <HStack mb={3} spacing={3}>
        <Select value={String(limit)} onChange={(e) => setLimit(Number(e.target.value))} maxW="120px">
          {[10, 20, 50].map(v => <option key={v} value={v}>{v}/página</option>)}
        </Select>
        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} maxW="180px">
          <option value="opened_at">{t("opened_at")}</option>
          <option value="closed_at">Fechado em</option>
          <option value="estimated_value">{t("estimated_value")}</option>
          <option value="value">{t("value")}</option>
          <option value="email_open_rate">{t("email_open_rate")}</option>
          <option value="interactions_total">{t("interactions_total")}</option>
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
            <Th>{t("email_open_rate")}</Th>
            <Th>{t("interactions_total")}</Th>
            <Th>{t("docs_shared")}</Th>
            <Th>{t("estimated_value")} ({getCurrency()})</Th>
            <Th>{t("value")} ({getCurrency()})</Th>
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
              <Td>{d.email_open_rate !== undefined && d.email_open_rate !== null ? formatPct(d.email_open_rate) : "-"}</Td>
              <Td>{d.interactions_total !== undefined ? d.interactions_total : "-"}</Td>
              <Td>{d.docs_shared ? "Sim" : "Não"}</Td>
              <Td>{d.estimated_value !== undefined ? formatMoney(d.estimated_value) : "-"}</Td>
              <Td>{d.value !== undefined ? formatMoney(d.value) : "-"}</Td>
              <Td>{d.opened_at ? new Date(d.opened_at).toLocaleString() : "-"}</Td>
              <Td>
                <HStack>
                  {canAccess("deals","edit") && <Button size="sm" onClick={() => startEdit(d)}>{t("edit")}</Button>}
                  {canAccess("deals","delete") && <Button size="sm" colorScheme="red" onClick={() => remove(d.id)}>{t("delete")}</Button>}
                  <Button size="sm" onClick={() => viewScores(d.id)}>{t("view_scores")}</Button>
                  {canAccess("deals","edit") && <Button size="sm" colorScheme="purple" onClick={() => compute(d.id)}>{t("compute_score")}</Button>}
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      {selectedDealId && (
        <Box mt={4} bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
          <Heading size="sm" mb={2}>{t("scores")} #{selectedDealId}</Heading>
          {scores.length === 0 ? (
            <Text color="gray.600">-</Text>
          ) : (
            <>
              <Table>
                <Thead>
                  <Tr>
                    <Th>{t("score")}</Th>
                    <Th>{t("model_version")}</Th>
                    <Th>{t("created_at")}</Th>
                    <Th>{t("actions")}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {scores.map(s => (
                    <Tr key={s.id}>
                      <Td>{s.score}</Td>
                      <Td>{s.model_version}</Td>
                      <Td>{new Date(s.created_at).toLocaleString()}</Td>
                      <Td><Button size="sm" onClick={() => setSelectedScoreId(s.id)}>{t("view_details")}</Button></Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              {(() => {
                const selected = scores.find(x => x.id === selectedScoreId) ?? scores[0];
                const f = (selected?.factors ?? {}) as Record<string, unknown>;
                const norm = (f["normalized"] ?? {}) as Record<string, unknown>;
                const weights = (f["weights"] ?? {}) as Record<string, unknown>;
                const raw = (f["raw"] ?? {}) as Record<string, unknown>;
                const renderObj = (obj: Record<string, unknown>) => (
                  <Table size="sm" mt={2}>
                    <Thead>
                      <Tr><Th>Key</Th><Th>Value</Th></Tr>
                    </Thead>
                    <Tbody>
                      {Object.keys(obj).length === 0 ? (
                        <Tr><Td colSpan={2}>-</Td></Tr>
                      ) : (
                        Object.entries(obj).map(([k, v]) => (
                          <Tr key={k}><Td>{k}</Td><Td>{typeof v === "object" ? JSON.stringify(v) : String(v)}</Td></Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                );
                return (
                  <Box mt={4}>
                    <Heading size="xs" mb={2}>{t("details")}</Heading>
                    <Accordion allowMultiple>
                      <AccordionItem>
                        <h2>
                          <AccordionButton>
                            <Box as="span" flex="1" textAlign="left">{t("normalized")}</Box>
                            <AccordionIcon />
                          </AccordionButton>
                        </h2>
                        <AccordionPanel pb={4}>{renderObj(norm)}</AccordionPanel>
                      </AccordionItem>
                      <AccordionItem>
                        <h2>
                          <AccordionButton>
                            <Box as="span" flex="1" textAlign="left">{t("weights")}</Box>
                            <AccordionIcon />
                          </AccordionButton>
                        </h2>
                        <AccordionPanel pb={4}>{renderObj(weights)}</AccordionPanel>
                      </AccordionItem>
                      <AccordionItem>
                        <h2>
                          <AccordionButton>
                            <Box as="span" flex="1" textAlign="left">{t("raw")}</Box>
                            <AccordionIcon />
                          </AccordionButton>
                        </h2>
                        <AccordionPanel pb={4}>{renderObj(raw)}</AccordionPanel>
                      </AccordionItem>
                    </Accordion>
                  </Box>
                );
              })()}
            </>
          )}
        </Box>
      )}
    </Box>
  );
}
