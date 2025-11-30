import { Box, Heading, Text, UnorderedList, ListItem, Code, Image, Divider, Table, Thead, Tbody, Tr, Th, Td } from "@chakra-ui/react";
import loginImg from "./assets/login.svg";
import usersImg from "./assets/users.svg";
import uploadImg from "./assets/upload.svg";
import contractsImg from "./assets/contracts.svg";
import procuracaoImg from "./assets/procuracao.svg";
import dealsImg from "./assets/deals.svg";
import tagsImg from "./assets/tags.svg";
import previewImg from "./assets/preview.svg";

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
          <ListItem>Usabilidade: voltar/avançar do navegador é bloqueado em telas protegidas; a sessão expira após inatividade conforme configuração do Master.</ListItem>
        </UnorderedList>
        <Heading size="sm" mt={4} mb={2}>Workflow sugerido</Heading>
        <UnorderedList>
          <ListItem>Preencher dados da Empresa (Tenant).</ListItem>
          <ListItem>Configurar Perfis/Permissões e criar Usuários.</ListItem>
          <ListItem>Definir Fases e Tipos de Negócio.</ListItem>
          <ListItem>Cadastrar Contatos e Organizações.</ListItem>
          <ListItem>Criar Negócios e anexar documentos.</ListItem>
        </UnorderedList>
      </Box>
    ),
  },
  {
    id: "login_mfa",
    title: "Login e MFA",
    render: () => (
      <Box>
        <Image src={loginImg} alt="Tela de Login" mb={4} />
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
        <Divider my={4} />
        <Heading size="sm" mb={2}>Exemplo de verificação</Heading>
        <Text>Após o login com senha, digite o código de 6 dígitos do autenticador (TOTP) ou o recebido por e-mail/SMS/WhatsApp.</Text>
      </Box>
    ),
  },
  {
    id: "negocios",
    title: "Negócios",
    render: () => (
      <Box>
        <Image src={dealsImg} alt="Tela de Negócios" mb={4} />
        <UnorderedList>
          <ListItem>Cadastro: título, partes, tipo de negócio, fase e principais issues.</ListItem>
          <ListItem>Acompanhamento: alteração de fase, anexos e observações.</ListItem>
        </UnorderedList>
        <Heading size="sm" mt={4} mb={2}>Campos e exemplos</Heading>
        <UnorderedList>
          <ListItem>Título: ex. "Ação de Cobrança".</ListItem>
          <ListItem>Organização: ex. "Empresa X Ltda".</ListItem>
          <ListItem>Contato: ex. "João Silva".</ListItem>
          <ListItem>Fase: ex. "Negociação".</ListItem>
          <ListItem>Valor estimado: ex. 15000,00.</ListItem>
          <ListItem>Questão principal: ex. "Inadimplência contratual".</ListItem>
        </UnorderedList>
      </Box>
    ),
  },
  {
    id: "envio_docs_tags",
    title: "Envio de Documentos e Tags de Modelos",
    render: () => (
      <Box>
        <Image src={uploadImg} alt="Tela de Envio de Documentos" mb={4} />
        <Heading size="sm" mb={2}>Modelos</Heading>
        <Text>Use modelos com tags que serão substituídas por dados do sistema. Exemplos:</Text>
        <UnorderedList mt={2}>
           <ListItem><Code>{"{{empresa.nome}}"}</Code>, <Code>{"{{empresa.website}}"}</Code>, <Code>{"{{empresa.instagram}}"}</Code>, <Code>{"{{empresa.linkedin}}"}</Code>, <Code>{"{{empresa.address}}"}</Code>, <Code>{"{{empresa.phone}}"}</Code>, <Code>{"{{empresa.email}}"}</Code>, <Code>{"{{empresa.responsible_name}}"}</Code>, <Code>{"{{empresa.responsible_oab}}"}</Code></ListItem>
          <ListItem><Code>{"{{contato.nome}}"}</Code>, <Code>{"{{contato.email}}"}</Code>, <Code>{"{{contato.telefone}}"}</Code></ListItem>
          <ListItem><Code>{"{{organizacao.nome}}"}</Code>, <Code>{"{{organizacao.cnpj}}"}</Code></ListItem>
          <ListItem><Code>{"{{negocio.id}}"}</Code>, <Code>{"{{negocio.titulo}}"}</Code>, <Code>{"{{negocio.tipo}}"}</Code>, <Code>{"{{negocio.fase}}"}</Code></ListItem>
          <ListItem><Code>{"{{data.atual}}"}</Code> (YYYY-MM-DD)</ListItem>
        </UnorderedList>
        <Heading size="sm" mt={4} mb={2}>Contratos</Heading>
        <Image src={contractsImg} alt="Exemplo de Contrato com Tags" mb={3} />
        <Text>Exemplo de modelo:</Text>
        <Box bg="gray.50" border="1px solid" borderColor="gray.200" p={3} borderRadius="md" fontSize="sm" mb={3}>
{`CONTRATO DE PRESTAÇÃO DE SERVIÇOS
Entre {{empresa.nome}}, doravante CONTRATANTE, e {{contato.nome}}, doravante CONTRATADO,
inscrito no CPF {{contato.cpf}}, residente à {{contato.endereco}}.
Objeto: {{negocio.titulo}}.
Data: {{data.atual}}.`}
        </Box>
        <Text>Com dados:</Text>
        <Box bg="gray.50" border="1px solid" borderColor="gray.200" p={3} borderRadius="md" fontSize="sm" mb={3}>
{`CONTRATO DE PRESTAÇÃO DE SERVIÇOS
Entre Consultor Juridico Ltda, doravante CONTRATANTE, e João Silva, doravante CONTRATADO,
inscrito no CPF 123.456.789-00, residente à Rua Exemplo, 100, Brasília-DF.
Objeto: Elaboração de parecer.
Data: 2025-11-30.`}
        </Box>
        <Heading size="sm" mt={4} mb={2}>Procurações</Heading>
        <Image src={procuracaoImg} alt="Exemplo de Procuração com Tags" mb={3} />
        <Text>Exemplo de modelo:</Text>
        <Box bg="gray.50" border="1px solid" borderColor="gray.200" p={3} borderRadius="md" fontSize="sm" mb={3}>
{`PROCURAÇÃO AD JUDICIA ET EXTRA
Outorgante: {{contato.nome}}, CPF {{contato.cpf}}, residente à {{contato.endereco}}
Outorgado: {{empresa.responsible_name}}, OAB {{empresa.responsible_oab}}.`}
        </Box>
        <Text>Com dados:</Text>
        <Box bg="gray.50" border="1px solid" borderColor="gray.200" p={3} borderRadius="md" fontSize="sm">
{`PROCURAÇÃO AD JUDICIA ET EXTRA
Outorgante: João Silva, CPF 123.456.789-00, residente à Rua Exemplo, 100, Brasília-DF
Outorgado: Dr. Maria Souza, OAB DF 12345.`}
        </Box>
        <Heading size="sm" mt={4} mb={2}>Formatação e normalização</Heading>
        <UnorderedList>
          <ListItem>CPF: 000.000.000-00.</ListItem>
          <ListItem>CNPJ: 00.000.000/0000-00.</ListItem>
          <ListItem>Telefone: E.164 (+55DDDNUMERO) para SMS/WhatsApp.</ListItem>
          <ListItem>OAB: UF e número (ex.: DF 12345).</ListItem>
          <ListItem>Endereço: Rua, número, cidade-UF.</ListItem>
        </UnorderedList>
        <Heading size="sm" mt={4} mb={2}>Passo a passo de envio</Heading>
        <UnorderedList>
          <ListItem>Selecione o negócio e o tipo de documento.</ListItem>
          <ListItem>Anexe o arquivo modelo com tags.</ListItem>
          <ListItem>Pré-visualize o preenchimento e ajuste se necessário.</ListItem>
          <ListItem>Gere o PDF e associe ao negócio.</ListItem>
        </UnorderedList>
        <Image src={previewImg} alt="Pré-visualização e Geração" mt={3} />
        <Heading size="sm" mt={4} mb={2}>Referência de tags</Heading>
        <Image src={tagsImg} alt="Referência visual de Tags" mb={3} />
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>Módulo</Th>
              <Th>Tags</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td>Empresa</Td>
              <Td><Code>{'{{empresa.nome}}'}</Code>, <Code>{'{{empresa.address}}'}</Code>, <Code>{'{{empresa.phone}}'}</Code>, <Code>{'{{empresa.email}}'}</Code>, <Code>{'{{empresa.website}}'}</Code>, <Code>{'{{empresa.instagram}}'}</Code>, <Code>{'{{empresa.linkedin}}'}</Code>, <Code>{'{{empresa.responsible_name}}'}</Code>, <Code>{'{{empresa.responsible_oab}}'}</Code></Td>
            </Tr>
            <Tr>
              <Td>Contato</Td>
              <Td><Code>{'{{contato.nome}}'}</Code>, <Code>{'{{contato.email}}'}</Code>, <Code>{'{{contato.telefone}}'}</Code>, <Code>{'{{contato.cpf}}'}</Code>, <Code>{'{{contato.endereco}}'}</Code></Td>
            </Tr>
            <Tr>
              <Td>Organização</Td>
              <Td><Code>{'{{organizacao.nome}}'}</Code>, <Code>{'{{organizacao.cnpj}}'}</Code>, <Code>{'{{organizacao.endereco}}'}</Code></Td>
            </Tr>
            <Tr>
              <Td>Negócio</Td>
              <Td><Code>{'{{negocio.id}}'}</Code>, <Code>{'{{negocio.titulo}}'}</Code>, <Code>{'{{negocio.tipo}}'}</Code>, <Code>{'{{negocio.fase}}'}</Code>, <Code>{'{{negocio.valor}}'}</Code>, <Code>{'{{negocio.estimated_value}}'}</Code></Td>
            </Tr>
            <Tr>
              <Td>Data</Td>
              <Td><Code>{'{{data.atual}}'}</Code></Td>
            </Tr>
          </Tbody>
        </Table>
      </Box>
    ),
  },
  {
    id: "contatos",
    title: "Contatos",
    render: () => (
      <Box>
        <Heading size="sm" mb={2}>Campos principais</Heading>
        <Table size="sm" variant="simple" mb={3}>
          <Thead>
            <Tr>
              <Th>Campo</Th>
              <Th>Descrição</Th>
              <Th>Exemplo</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td>Nome</Td>
              <Td>Nome completo do contato</Td>
              <Td>João Silva</Td>
            </Tr>
            <Tr>
              <Td>E-mail</Td>
              <Td>Endereço para comunicação</Td>
              <Td>joao.silva@exemplo.com</Td>
            </Tr>
            <Tr>
              <Td>Telefone</Td>
              <Td>Contato preferencial</Td>
              <Td>+5561987654321</Td>
            </Tr>
            <Tr>
              <Td>Endereço</Td>
              <Td>Residência do contato</Td>
              <Td>Rua Exemplo, 100, Brasília-DF</Td>
            </Tr>
            <Tr>
              <Td>CPF</Td>
              <Td>Documento pessoal</Td>
              <Td>123.456.789-00</Td>
            </Tr>
          </Tbody>
        </Table>
        <Heading size="sm" mb={2}>Relacionamentos</Heading>
        <UnorderedList>
          <ListItem>Associe contatos a organizações e negócios para preencher modelos.</ListItem>
        </UnorderedList>
      </Box>
    ),
  },
  {
    id: "organizacoes",
    title: "Organizações",
    render: () => (
      <Box>
        <Heading size="sm" mb={2}>Campos principais</Heading>
        <Table size="sm" variant="simple" mb={3}>
          <Thead>
            <Tr>
              <Th>Campo</Th>
              <Th>Descrição</Th>
              <Th>Exemplo</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td>Nome</Td>
              <Td>Razão social ou denominação</Td>
              <Td>Empresa X Ltda</Td>
            </Tr>
            <Tr>
              <Td>CNPJ</Td>
              <Td>Cadastro nacional da empresa</Td>
              <Td>00.000.000/0000-00</Td>
            </Tr>
            <Tr>
              <Td>Endereço</Td>
              <Td>Sede ou filial</Td>
              <Td>Av. Central, 200, Brasília-DF</Td>
            </Tr>
            <Tr>
              <Td>Telefone</Td>
              <Td>Contato institucional</Td>
              <Td>+556133334444</Td>
            </Tr>
            <Tr>
              <Td>Website</Td>
              <Td>Site da organização</Td>
              <Td>https://exemplo.com.br</Td>
            </Tr>
          </Tbody>
        </Table>
        <Heading size="sm" mb={2}>Uso em modelos</Heading>
        <UnorderedList>
          <ListItem>Tags: <Code>{"{{organizacao.nome}}"}</Code>, <Code>{"{{organizacao.cnpj}}"}</Code>, <Code>{"{{organizacao.endereco}}"}</Code>.</ListItem>
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
        <Image src={usersImg} alt="Tela de Usuários e MFA" mb={4} />
        <UnorderedList>
          <ListItem>Criação, edição e exclusão de usuários.</ListItem>
          <ListItem>Senha temporária pode ser gerada na criação.</ListItem>
          <ListItem>MFA: defina método e habilite; para TOTP, gere segredo e QR.</ListItem>
        </UnorderedList>
        <Heading size="sm" mt={4} mb={2}>Passo a passo (TOTP)</Heading>
        <UnorderedList>
          <ListItem>Editar usuário → Habilitar MFA → Método “Autenticador (TOTP)” → “Configurar TOTP”.</ListItem>
          <ListItem>Escanear o QR no app autenticador (Google Authenticator, Authy).</ListItem>
          <ListItem>Fazer login com senha e digitar o código do autenticador.</ListItem>
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
          <ListItem>Dados do tenant: nome, endereço, responsável, OAB, telefone, e-mail, website, instagram, linkedin.</ListItem>
          <ListItem>Sessão: minutos de inatividade para expiração automática (padrão 4). O alerta aparece fixo no topo, acima de modais.</ListItem>
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
