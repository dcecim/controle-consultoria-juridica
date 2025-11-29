import { useState } from "react";
import { Box, Heading, VStack, FormControl, FormLabel, Input, Button, Text, useColorModeValue } from "@chakra-ui/react";
import { verifyMfa } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../useAuth";
import { useI18n } from "../useI18n";

export default function Login() {
  const { t } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState<string>("");

  const panelBg = useColorModeValue("white","gray.800");
  const panelBorder = useColorModeValue("gray.200","gray.700");

  const submit = async () => {
    setError(null);
    try {
      if (!email || !password) { setError("Informe e-mail e senha"); return; }
      localStorage.setItem("lastLoginEmail", email);
      const res = await login(email, password);
      if (res?.mfa_required && res?.mfa_token) { setMfaToken(res.mfa_token); return; }
      if (res?.must_change_password) {
        navigate("/change-password");
      } else {
        navigate("/");
      }
    } catch (e) {
      setError(String(e));
    }
  };

  const submitMfa = async () => {
    setError(null);
    try {
      if (!mfaToken || !mfaCode) { setError("Informe o código MFA"); return; }
      const res = await verifyMfa({ mfa_token: mfaToken, code: mfaCode });
      if (res?.must_change_password) { navigate("/change-password"); } else { navigate("/"); }
    } catch (e) { setError(String(e)); }
  };

  return (
    <Box>
      <Heading size="md" mb={4}>{t("login") || "Login"}</Heading>
      <VStack align="stretch" spacing={3} bg={panelBg} p={4} borderRadius="md" border="1px solid" borderColor={panelBorder}>
        <FormControl>
          <FormLabel>{t("email") || "E-mail"}</FormLabel>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormControl>
        {!mfaToken ? (
          <>
            <FormControl>
              <FormLabel>{t("password") || "Senha"}</FormLabel>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </FormControl>
            <Button colorScheme="blue" onClick={submit}>{t("login") || "Login"}</Button>
          </>
        ) : (
          <>
            <FormControl>
              <FormLabel>Codigo MFA</FormLabel>
              <Input type="text" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} placeholder="000000" />
            </FormControl>
            <Button colorScheme="blue" onClick={submitMfa}>Verificar</Button>
          </>
        )}
        {error && <Text color="red.500">{error}</Text>}
      </VStack>
    </Box>
  );
}
