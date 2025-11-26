import { useState } from "react";
import { Box, Heading, Input, Button, VStack, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError("Informe e-mail e senha.");
      return;
    }
    // TODO: integrar com backend (ex.: POST /auth/login) e salvar token
    // Por ora, simula login e guarda ator para headers
    localStorage.setItem("actor", "admin");
    navigate("/", { replace: true });
  };

  return (
    <Box maxW="sm" mx="auto" bg="white" p={6} borderRadius="md" border="1px solid" borderColor="gray.200">
      <Heading size="md" mb={4}>Login</Heading>
      <VStack align="stretch" spacing={3}>
        <Input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button colorScheme="blue" onClick={onSubmit}>Entrar</Button>
        {error && <Text color="red.500">{error}</Text>}
      </VStack>
    </Box>
  );
}