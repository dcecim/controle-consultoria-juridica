import { useEffect, useState } from "react";
import { Box, Heading, HStack, Input, Select, Button, Text, VStack, Table, Thead, Tbody, Tr, Th, Td } from "@chakra-ui/react";
import { getDocumentTypes, getDealUploads, uploadDocument } from "../lib/api";

type DocType = { id: number; name: string; description?: string; allowed_mime_types?: string[] };
type UploadEntry = { id: number; original_filename: string; mime_type: string; size_bytes: number; created_at?: string; document_type_id: number; };

export default function Upload() {
  const [dealId, setDealId] = useState<number>(7);
  const [docTypes, setDocTypes] = useState<DocType[]>([]);
  const [documentTypeId, setDocumentTypeId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = () => {
    getDocumentTypes().then(setDocTypes).catch((e) => setError(String(e)));
    if (dealId) getDealUploads(dealId).then(setUploads).catch(() => {});
  };

  useEffect(() => { load(); }, [dealId]);

  const onUpload = async () => {
    setError(null); setSuccess(null);
    if (!dealId || !documentTypeId || !file) {
      setError("Informe Deal ID, tipo de documento e selecione um arquivo.");
      return;
    }
    try {
      await uploadDocument(dealId, documentTypeId, file, notes || undefined);
      setSuccess("Upload realizado com sucesso.");
      setFile(null);
      setNotes("");
      load();
    } catch (e: any) {
      setError(String(e.message || e));
    }
  };

  return (
    <Box>
      <Heading size="md" mb={4}>Upload de Documentos</Heading>
      <VStack align="stretch" spacing={3} bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
        <HStack>
          <Box flex="1">
            <Text fontSize="sm" mb={1}>Deal ID</Text>
            <Input value={dealId} onChange={(e) => setDealId(Number(e.target.value))} />
          </Box>
          <Box flex="1">
            <Text fontSize="sm" mb={1}>Tipo de Documento</Text>
            <Select placeholder="Selecione..." value={documentTypeId ?? ""} onChange={(e) => setDocumentTypeId(Number(e.target.value))}>
              {docTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
            </Select>
          </Box>
        </HStack>
        <Box>
          <Text fontSize="sm" mb={1}>Arquivo</Text>
          <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </Box>
        <Box>
          <Text fontSize="sm" mb={1}>Notas</Text>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Box>
        <HStack>
          <Button colorScheme="blue" onClick={onUpload}>Enviar</Button>
          {error && <Text color="red.500">{error}</Text>}
          {success && <Text color="green.600">{success}</Text>}
        </HStack>
      </VStack>

      <Heading size="sm" mt={6} mb={3}>Uploads do Deal</Heading>
      <Table bg="white">
        <Thead>
          <Tr>
            <Th>ID</Th>
            <Th>Arquivo</Th>
            <Th>MIME</Th>
            <Th>Tamanho</Th>
            <Th>Criado em</Th>
          </Tr>
        </Thead>
        <Tbody>
          {uploads.map(u => (
            <Tr key={u.id}>
              <Td>{u.id}</Td>
              <Td>{u.original_filename}</Td>
              <Td>{u.mime_type}</Td>
              <Td>{(u.size_bytes / 1024 / 1024).toFixed(2)} MB</Td>
              <Td>{u.created_at ? new Date(u.created_at).toLocaleString() : "-"}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}