import { useState } from "react";
import { Box, Heading, VStack, FormControl, FormLabel, Input, Button, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../useI18n";
import { listUsers, updateUser } from "../lib/api";

export default function ChangePassword() {
  const { t } = useI18n();
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async () => {
    setError(null);
    try {
      if (!pass || pass.length < 6) { setError(t("password_too_short") || "Senha muito curta"); return; }
      if (pass !== confirm) { setError(t("password_mismatch") || "Senhas não conferem"); return; }
      const email = localStorage.getItem("lastLoginEmail") || "";
      const users = await listUsers();
      const user = users.find(u => u.email === email);
      if (!user) { setError("Usuário não encontrado"); return; }
      await updateUser(user.id, { password: pass, must_change_password: false });
      navigate("/");
    } catch (e) { setError(String(e)); }
  };

  return (
    <Box>
      <Heading size="md" mb={4}>{t("change_password") || "Trocar senha"}</Heading>
      <VStack align="stretch" spacing={3} bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
        <FormControl>
          <FormLabel>{t("password_new") || "Nova senha"}</FormLabel>
          <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>{t("password_confirm") || "Confirmar senha"}</FormLabel>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </FormControl>
        <Button colorScheme="blue" onClick={submit}>{t("save") || "Salvar"}</Button>
        {error && <Text color="red.500">{error}</Text>}
      </VStack>
    </Box>
  );
}
