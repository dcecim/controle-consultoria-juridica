-- DDLs do CRM com comentários explicativos (PostgreSQL)
-- Tabelas: tenants, organizations, contacts, stages, deals, audit_logs, lead_scores

BEGIN;

-- Tenants
CREATE TABLE IF NOT EXISTS tenants (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL
);

COMMENT ON TABLE tenants IS 'Locatários (multi-tenant). Controla a segregação de dados por cliente.';
COMMENT ON COLUMN tenants.id IS 'Identificador único do tenant.';
COMMENT ON COLUMN tenants.name IS 'Nome do tenant (ex.: nome do escritório ou unidade).';

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id),
  sector     TEXT NULL
);

COMMENT ON TABLE organizations IS 'Organizações (empresas ou entidades) vinculadas a um tenant.';
COMMENT ON COLUMN organizations.id IS 'Identificador único da organização.';
COMMENT ON COLUMN organizations.name IS 'Nome da organização.';
COMMENT ON COLUMN organizations.tenant_id IS 'Tenant ao qual a organização pertence (multi-tenant).';
COMMENT ON COLUMN organizations.sector IS 'Setor/indústria da organização (sinal para Lead Scoring).';

-- Contacts
CREATE TABLE IF NOT EXISTS contacts (
  id              SERIAL PRIMARY KEY,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  email           TEXT UNIQUE NULL,
  phone           TEXT NULL,
  organization_id INTEGER NULL REFERENCES organizations(id),
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
  client_type     TEXT NULL,
  lead_source     TEXT NULL
);

COMMENT ON TABLE contacts IS 'Contatos (pessoas) associados a organizações e tenants.';
COMMENT ON COLUMN contacts.id IS 'Identificador único do contato.';
COMMENT ON COLUMN contacts.first_name IS 'Primeiro nome do contato.';
COMMENT ON COLUMN contacts.last_name IS 'Sobrenome do contato.';
COMMENT ON COLUMN contacts.email IS 'E-mail do contato (pode ser único quando presente).';
COMMENT ON COLUMN contacts.phone IS 'Telefone do contato.';
COMMENT ON COLUMN contacts.organization_id IS 'Organização do contato (opcional).';
COMMENT ON COLUMN contacts.tenant_id IS 'Tenant ao qual o contato pertence.';
COMMENT ON COLUMN contacts.client_type IS 'Tipo de cliente (PF/PJ/Público), usado em Lead Scoring.';
COMMENT ON COLUMN contacts.lead_source IS 'Origem do lead (indicação, website, redes, evento, etc.).';

-- Stages
CREATE TABLE IF NOT EXISTS stages (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  "order"    INTEGER NOT NULL,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id)
);

COMMENT ON TABLE stages IS 'Etapas do funil (pipeline) por tenant.';
COMMENT ON COLUMN stages.id IS 'Identificador único da etapa.';
COMMENT ON COLUMN stages.name IS 'Nome da etapa do funil (ex.: Inicial, Proposta, Fechamento).';
COMMENT ON COLUMN stages."order" IS 'Ordem/posição da etapa no funil.';
COMMENT ON COLUMN stages.tenant_id IS 'Tenant ao qual a etapa pertence.';

-- Deals
CREATE TABLE IF NOT EXISTS deals (
  id                 SERIAL PRIMARY KEY,
  title              TEXT NOT NULL,
  value              DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  status             TEXT NULL,
  stage_id           INTEGER NULL REFERENCES stages(id),
  contact_id         INTEGER NULL REFERENCES contacts(id),
  organization_id    INTEGER NULL REFERENCES organizations(id),
  tenant_id          INTEGER NOT NULL REFERENCES tenants(id),
  -- Novos campos de Lead Scoring
  main_issue         TEXT NULL,
  estimated_value    DOUBLE PRECISION NULL,
  opened_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at          TIMESTAMPTZ NULL,
  email_open_rate    DOUBLE PRECISION NULL,
  interactions_total INTEGER NOT NULL DEFAULT 0,
  docs_shared        BOOLEAN NOT NULL DEFAULT FALSE
);

COMMENT ON TABLE deals IS 'Negócios (deals/casos) vinculados a contatos/organizações e etapas do funil.';
COMMENT ON COLUMN deals.id IS 'Identificador único do negócio.';
COMMENT ON COLUMN deals.title IS 'Título do negócio/caso.';
COMMENT ON COLUMN deals.value IS 'Valor base atual do negócio (financeiro).';
COMMENT ON COLUMN deals.status IS 'Status textual (ex.: open, won, lost, Inicial, etc.).';
COMMENT ON COLUMN deals.stage_id IS 'Etapa atual do negócio (funil).';
COMMENT ON COLUMN deals.contact_id IS 'Contato principal associado ao negócio.';
COMMENT ON COLUMN deals.organization_id IS 'Organização associada ao negócio.';
COMMENT ON COLUMN deals.tenant_id IS 'Tenant ao qual o negócio pertence.';
COMMENT ON COLUMN deals.main_issue IS 'Questão jurídica principal (sinal para Lead Scoring).';
COMMENT ON COLUMN deals.estimated_value IS 'Valor estimado do caso, usado para priorização.';
COMMENT ON COLUMN deals.opened_at IS 'Data/hora de abertura do negócio.';
COMMENT ON COLUMN deals.closed_at IS 'Data/hora de fechamento (se aplicável).';
COMMENT ON COLUMN deals.email_open_rate IS 'Taxa de abertura de e-mails (0.0–1.0).';
COMMENT ON COLUMN deals.interactions_total IS 'Total de interações registradas (e-mails, reuniões, ligações).';
COMMENT ON COLUMN deals.docs_shared IS 'Indicador se houve compartilhamento de documentos.';

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id          SERIAL PRIMARY KEY,
  tenant_id   INTEGER NOT NULL REFERENCES tenants(id),
  entity_name VARCHAR(64) NOT NULL,
  entity_id   VARCHAR(128) NOT NULL,
  action      VARCHAR(16) NOT NULL,
  actor       VARCHAR(128) NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now(),
  before      JSONB NULL,
  after       JSONB NULL,
  details     JSONB NULL
);

COMMENT ON TABLE audit_logs IS 'Trilha de auditoria para operações CRUD e eventos relevantes.';
COMMENT ON COLUMN audit_logs.id IS 'Identificador único do registro de auditoria.';
COMMENT ON COLUMN audit_logs.tenant_id IS 'Tenant em que o evento ocorreu.';
COMMENT ON COLUMN audit_logs.entity_name IS 'Tipo de entidade afetada (Deal, Contact, Organization, Stage, LeadScore).';
COMMENT ON COLUMN audit_logs.entity_id IS 'ID da entidade afetada (como string).';
COMMENT ON COLUMN audit_logs.action IS 'Ação executada (CREATE, UPDATE, DELETE, SCORE, etc.).';
COMMENT ON COLUMN audit_logs.actor IS 'Responsável pela ação (usuário/sistema).';
COMMENT ON COLUMN audit_logs."timestamp" IS 'Data/hora do evento.';
COMMENT ON COLUMN audit_logs.before IS 'Snapshot dos campos-chave antes da operação.';
COMMENT ON COLUMN audit_logs.after IS 'Snapshot dos campos-chave após a operação.';
COMMENT ON COLUMN audit_logs.details IS 'Detalhes adicionais (ex.: fatores do score).';

-- Lead Scores
CREATE TABLE IF NOT EXISTS lead_scores (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id),
  contact_id   INTEGER NULL REFERENCES contacts(id),
  deal_id      INTEGER NULL REFERENCES deals(id),
  score        INTEGER NOT NULL,
  model_version TEXT NOT NULL,
  factors      JSONB NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE lead_scores IS 'Pontuações de lead por contato/negócio, para priorização de follow-ups.';
COMMENT ON COLUMN lead_scores.id IS 'Identificador único do score.';
COMMENT ON COLUMN lead_scores.tenant_id IS 'Tenant ao qual o score pertence.';
COMMENT ON COLUMN lead_scores.contact_id IS 'Contato avaliado (opcional se o score for do negócio).';
COMMENT ON COLUMN lead_scores.deal_id IS 'Negócio avaliado (opcional se o score for do contato).';
COMMENT ON COLUMN lead_scores.score IS 'Pontuação (0–100) indicando potencial/prioridade.';
COMMENT ON COLUMN lead_scores.model_version IS 'Versão do modelo ou regra de scoring utilizada.';
COMMENT ON COLUMN lead_scores.factors IS 'Sinais/fatores explicativos do score (JSON).';
COMMENT ON COLUMN lead_scores.created_at IS 'Data/hora de geração do score.';

COMMIT;