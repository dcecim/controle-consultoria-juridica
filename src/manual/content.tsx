import { Box, Heading, Text, UnorderedList, ListItem, Code } from "@chakra-ui/react";

export type ManualSection = { id: string; title: string; render: () => JSX.Element };

export const manualSections: ManualSection[] = [
  {
    id: "introducao",
    title: "Introdução e Navegação",
    render: () => (
      <Box>
        <Text>Este sistema organiza informações jurídicas em módulos: Painel, Negócios, Envio, Contatos, Organizações, Fases, Tipos de Negócio, Perfis e Usuários, além da Empresa.</Text>
        <UnorderedList mt={3}>
          <ListItem>Painel: indicadores e acesso rápido.</ListItem>
          <ListItem>Negócios: cadastro e acompanhamento de casos.</ListItem>
          <ListItem>Envio: documentos, modelos e geração por tags.</ListItem>
          <ListItem>Contatos: pessoas físicas.</ListItem>
          <ListItem>Organizações: empresas e órgãos.</ListItem>
          <ListItem>Fases: etapas do fluxo dos negócios.</ListItem>
          <ListItem>Tipos de Negócio: classificação de casos.</ListItem>
          <ListItem>Perfis e permissões: regras de acesso.</ListItem>
          <ListItem>Usuários: administração de contas e MFA.</ListItem>
          <ListItem>Empresa: dados da firma (tenant 1).</ListItem>
        </UnorderedList>
      </Box>
    ),
  },
  {
    id: "login_mfa",
    title: "Login e MFA",
    render: () => (
      <Box>
        <Heading size="sm" mb={2}>Fluxo</Heading>
        <UnorderedList>
          <ListItem>Informe e-mail e senha.</ListItem>
          <ListItem>Se MFA estiver habilitado, um segundo passo será solicitado.</ListItem>
        </UnorderedList>
        <Heading size="sm" mt={4} mb={2}>Habilitar MFA</Heading>
        <UnorderedList>
          <ListItem>Abra Usuários e edite o usuário.</ListItem>
          <ListItem>Escolha método: Autenticador (TOTP), Código por e-mail, Código por SMS ou WhatsApp.</ListItem>
          <ListItem>Para TOTP, use Configurar TOTP para gerar segredo e QR e escaneie no aplicativo autenticador.</ListItem>
          <ListItem>Para e-mail/SMS/WhatsApp, informe telefone internacional em formato E.164 para SMS/WhatsApp.</ListItem>
        </UnorderedList>
        <Heading size="sm" mt={4} mb={2}>Uso</Heading>
        <UnorderedList>
          <ListItem>TOTP: abra o autenticador e digite o código mostrado.</ListItem>
          <ListItem>OTP e-mail/SMS/WhatsApp: digite o código recebido na mensagem.</ListItem>
        </UnorderedList>
      </Box>
    ),
  },
  {
    id: "negocios",
    title: "Negócios",
    render: () => (
      <Box>
        <UnorderedList>
          <ListItem>Cadastro: título, partes, tipo de negócio, fase e principais issues.</ListItem>
          <ListItem>Acompanhamento: alteração de fase, anexos e observações.</ListItem>
        </UnorderedList>
      </Box>
    ),
  },
  {
    id: "envio_docs_tags",
    title: "Envio de Documentos e Tags de Modelos",
    render: () => (
      <Box>
        <Heading size="sm" mb={2}>Modelos</Heading>
        <Text>Use modelos com tags que serão substituídas por dados do sistema. Exemplos:</Text>
        <UnorderedList mt={2}>
          <ListItem><Code>{"{{empresa.nome}}"}</Code>, <Code>{"{{empresa.website}}"}</Code>, <Code>{"{{empresa.instagram}}"}</Code>, <Code>{"{{empresa.linkedin}}"}</Code></ListItem>
          <ListItem><Code>{"{{contato.nome}}"}</Code>, <Code>{"{{contato.email}}"}</Code>, <Code>{"{{contato.telefone}}"}</Code></ListItem>
          <ListItem><Code>{"{{organizacao.nome}}"}</Code>, <Code>{"{{organizacao.cnpj}}"}</Code></ListItem>
          <ListItem><Code>{"{{negocio.id}}"}</Code>, <Code>{"{{negocio.titulo}}"}</Code>, <Code>{"{{negocio.tipo}}"}</Code>, <Code>{"{{negocio.fase}}"}</Code></ListItem>
          <ListItem><Code>{"{{data.atual}}"}</Code> (YYYY-MM-DD)</ListItem>
        </UnorderedList>
        <Heading size="sm" mt={4} mb={2}>Contratos e Procurações</Heading>
        <Text>Em contratos e procurações, as tags acima permitem gerar documentos personalizados automaticamente. Garanta que os dados do contato, organização e empresa estejam atualizados.</Text>
      </Box>
    ),
  },
  {
    id: "contatos",
    title: "Contatos",
    render: () => (
      <Box>
        <UnorderedList>
          <ListItem>Campos principais: nome, e-mail, telefone.</ListItem>
          <ListItem>Relacionamentos: contatos podem ser vinculados a negócios.</ListItem>
        </UnorderedList>
      </Box>
    ),
  },
  {
    id: "organizacoes",
    title: "Organizações",
    render: () => (
      <Box>
        <UnorderedList>
          <ListItem>Cadastro de empresas e órgãos.</ListItem>
          <ListItem>Campos úteis para modelos: nome, CNPJ, endereço.</ListItem>
        </UnorderedList>
      </Box>
    ),
  },
  {
    id: "fases",
    title: "Fases",
    render: () => (
      <Box>
        <Text>Defina a pipeline de etapas de um negócio. Avanços de fase impactam relatórios e prazos.</Text>
      </Box>
    ),
  },
  {
    id: "tipos_negocio",
    title: "Tipos de Negócio",
    render: () => (
      <Box>
        <Text>Classificação dos casos para métricas e organização.</Text>
      </Box>
    ),
  },
  {
    id: "perfis",
    title: "Perfis e Permissões",
    render: () => (
      <Box>
        <Text>Controle de acesso por perfil. Perfis definem módulos e ações disponíveis.</Text>
      </Box>
    ),
  },
  {
    id: "usuarios_mfa",
    title: "Usuários e MFA",
    render: () => (
      <Box>
        <UnorderedList>
          <ListItem>Criação, edição e exclusão de usuários.</ListItem>
          <ListItem>Senha temporária pode ser gerada na criação.</ListItem>
          <ListItem>MFA: defina método e habilite; para TOTP, gere segredo e QR.</ListItem>
        </UnorderedList>
      </Box>
    ),
  },
  {
    id: "empresa",
    title: "Empresa",
    render: () => (
      <Box>
        <UnorderedList>
          <ListItem>Dados do tenant 1: nome, endereço, responsável, OAB, telefone, e-mail, website, instagram, linkedin.</ListItem>
          <ListItem>Atualize para refletir corretamente nos documentos por tags.</ListItem>
        </UnorderedList>
      </Box>
    ),
  },
];

export const routeToSection: Record<string, string> = {
  "/": "introducao",
  "/login": "login_mfa",
  "/dashboard": "introducao",
  "/deals": "negocios",
  "/upload": "envio_docs_tags",
  "/contacts": "contatos",
  "/organizations": "organizacoes",
  "/stages": "fases",
  "/business-types": "tipos_negocio",
  "/profiles": "perfis",
  "/users": "usuarios_mfa",
  "/tenant": "empresa",
};

