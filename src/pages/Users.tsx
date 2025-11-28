import { useEffect, useState } from "react";
import { Box, Heading, HStack, Button, Table, Thead, Tbody, Tr, Th, Td, Text, VStack, Input, Select, FormControl, FormLabel, Checkbox, useColorModeValue } from "@chakra-ui/react";
import { useI18n } from "../useI18n";
import { listUsers, createUser, updateUser, deleteUser, syncRBACFromLocalToServer } from "../lib/api";
import { useAuth } from "../useAuth";

type UserRow = { id: number; name?: string; email: string; role: string };

export default function Users() {
  const { t } = useI18n();
  const { canAccess } = useAuth();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<UserRow & { password?: string; must_change_password?: boolean }>({ id: 0, name: "", email: "", role: "Guest", password: "", must_change_password: true });
  const [editingId, setEditingId] = useState<number | null>(null);

  const panelBg = useColorModeValue("white","gray.800");
  const panelBorder = useColorModeValue("gray.200","gray.700");
  const tableBg = useColorModeValue("white","gray.800");

  const load = () => { listUsers().then(setRows).catch((e) => setError(String(e))); };
  useEffect(() => { load(); }, []);

  const startCreate = () => { setEditingId(null); setForm({ id: 0, name: "", email: "", role: "Guest", password: "", must_change_password: true }); };
  const startEdit = (u: UserRow) => { setEditingId(u.id); setForm({ ...u, password: "", must_change_password: false }); };
  const cancel = () => { setEditingId(null); setForm({ id: 0, name: "", email: "", role: "Guest", password: "", must_change_password: true }); };

  const submit = async () => {
    try {
      const { id: _unused, ...payload } = form; void _unused;
      if (editingId) await updateUser(editingId, payload); else {
        const created = await createUser(payload);
        if (created.temporary_password) {
          setError(null);
          // mostra senha temporária
          alert(`${t("temporary_password") || "Senha temporária"}: ${created.temporary_password}`);
        }
      }
      cancel();
      load();
    } catch (e) { setError(String(e)); }
  };

  const remove = async (id: number) => { await deleteUser(id); load(); };

  return (
    <Box>
      <Heading size="md" mb={4}>{t("users") || "Usuários"}</Heading>
      {error && <Text color="red.500" mb={3}>{error}</Text>}
      <HStack mb={3} spacing={3}>{canAccess("profiles_admin","edit") && <Button onClick={startCreate}>{t("new")}</Button>}</HStack>
      {(editingId !== null || form.id === 0) && (
        <VStack align="stretch" spacing={3} bg={panelBg} p={4} borderRadius="md" border="1px solid" borderColor={panelBorder} mb={4}>
          <FormControl>
            <FormLabel>{t("name")}</FormLabel>
            <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormControl>
          <FormControl>
            <FormLabel>{t("email") || "E-mail"}</FormLabel>
            <Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </FormControl>
          <FormControl>
            <FormLabel>{t("profile") || "Perfil"}</FormLabel>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="Master">Master</option>
              <option value="Projetista">Projetista</option>
              <option value="Financeiro">Financeiro</option>
              <option value="Comercial">Comercial</option>
              <option value="Guest">Guest</option>
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>{t("password") || "Senha"}</FormLabel>
            <Input type="password" value={form.password ?? ""} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </FormControl>
          <FormControl display="flex" alignItems="center">
            <Checkbox isChecked={!!form.must_change_password} onChange={(e) => setForm({ ...form, must_change_password: e.target.checked })} />
            <FormLabel ml={2}>{t("must_change_password") || "Deve trocar a senha no primeiro login"}</FormLabel>
          </FormControl>
          <HStack>
            <Button colorScheme="blue" onClick={submit} isDisabled={!canAccess("profiles_admin","edit")}>{t("save")}</Button>
            <Button variant="outline" onClick={cancel}>{t("cancel")}</Button>
          </HStack>
        </VStack>
      )}
      <Table bg={tableBg}>
        <Thead>
          <Tr>
            <Th>{t("id")}</Th>
            <Th>{t("name")}</Th>
            <Th>{t("email") || "E-mail"}</Th>
            <Th>{t("profile") || "Perfil"}</Th>
            <Th>{t("actions")}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.map(u => (
            <Tr key={u.id}>
              <Td>{u.id}</Td>
              <Td>{u.name ?? "-"}</Td>
              <Td>{u.email}</Td>
              <Td>{u.role}</Td>
              <Td>
                <HStack>
                  {canAccess("profiles_admin","edit") && <Button size="sm" onClick={() => startEdit(u)}>{t("edit")}</Button>}
                  {canAccess("profiles_admin","delete") && <Button size="sm" colorScheme="red" onClick={() => remove(u.id)}>{t("delete")}</Button>}
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <HStack mt={3} spacing={3}>
        <Button variant="outline" onClick={async () => { setError(null); try { const r = await syncRBACFromLocalToServer(); alert(`${t("synced") || "Sincronizado"}: ${r.users} ${t("users") || "Usuários"}`); } catch (e) { setError(String(e)); } }}>{t("sync") || "Sincronizar"}</Button>
      </HStack>
    </Box>
  );
}
