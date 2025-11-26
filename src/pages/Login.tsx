import { useState } from "react";
import { Box, Heading, VStack, FormControl, FormLabel, Input, Button, Text, Select } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../useAuth";
import { useI18n } from "../useI18n";

export default function Login() {
  const { t } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Master");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    try {
      if (!email || !password) { setError("Informe e-mail e senha"); return; }
      localStorage.setItem("actor", role);
      localStorage.setItem("lastLoginEmail", email);
      const res = await login(email, password);
      if (res?.must_change_password) {
        navigate("/change-password");
      } else {
        navigate("/");
      }
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <Box>
      <Heading size="md" mb={4}>{t("login") || "Login"}</Heading>
      <VStack align="stretch" spacing={3} bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
        <FormControl>
          <FormLabel>{t("email") || "E-mail"}</FormLabel>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>{t("password") || "Senha"}</FormLabel>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>{t("profile") || "Perfil"}</FormLabel>
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="Master">Master</option>
            <option value="Projetista">Projetista</option>
            <option value="Financeiro">Financeiro</option>
            <option value="Comercial">Comercial</option>
            <option value="Guest">Guest</option>
          </Select>
        </FormControl>
        <Button colorScheme="blue" onClick={submit}>{t("login") || "Login"}</Button>
        {error && <Text color="red.500">{error}</Text>}
      </VStack>
    </Box>
  );
}
