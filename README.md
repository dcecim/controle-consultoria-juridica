# Consultoria Jurídica — CRM (MVP)

Sistema CRM inicial para consultoria jurídica, com foco em cadastro de contatos, organizações, oportunidades (deals) e etapas de pipeline (stages). Este MVP entrega um backend funcional em FastAPI + SQLAlchemy com SQLite local em desenvolvimento.

## Visão Geral

- Contatos: cadastro, edição, listagem e exclusão.
- Organizações: cadastro e relacionamento com contatos e oportunidades.
- Oportunidades (Deals): título, valor, status, etapa (pipeline), vínculo com contato/organização.
- Etapas (Stages): lista ordenada de etapas, com *seed* inicial.

## Stack e Arquitetura

- Backend: FastAPI (roteadores por domínio), SQLAlchemy (ORM), Pydantic v2 (schemas).
- Banco de dados: SQLite em `data/crm.db` para dev; previsto upgrade para PostgreSQL.
- Organização modular:
  - `routers/` por recurso (`contacts`, `deals`, `organizations`, `stages`).
  - `models.py` com entidades ORM.
  - `schemas.py` com DTOs Pydantic (v2, `from_attributes`).
  - `database.py` com engine e sessão.
  - `main.py` com app, rotas e *seed* de stages.

## Estrutura do Projeto
c:\Demandas\Consultor-juridico
├── backend │   
    └── app │       
        ├── database.py           # Engine SQLite, SessionLocal e Base
│       ├── main.py               # FastAPI app, include_routers e seed de stages
│       ├── models.py             # ORM: Organization, Contact, Stage, Deal
│       ├── routers │       
│       │   ├── contacts.py       # CRUD de contatos
│       │   ├── deals.py          # CRUD de oportunidades
│       │   ├── organizations.py  # CRUD de organizações
│       │   └── stages.py         # CRUD de etapas
│       └── schemas.py            # Pydantic v2: DTOs e ConfigDict(from_attributes)
├── data 
│    └── crm.db                    # Banco local (ignorado no Git)
├── .gitignore
├── requirements.txt
└── README.md

### Componentes por Pasta

- `backend/app`
  - `database.py`: cria diretório `data`, configura `engine` SQLite e `SessionLocal`.
  - `models.py`: mapeamentos SQLAlchemy e relacionamentos.
  - `schemas.py`: modelos Pydantic v2 para entrada/saída.
  - `main.py`: inicializa DB, inclui routers, rota `/health` e raiz que redireciona para `/docs`; aplica *seed* de stages.
  - `routers/`: endpoints REST por recurso (prefixos `/contacts`, `/deals`, `/organizations`, `/stages`).

- `data/`: contém `crm.db` (apenas dev; ignorado pelo `.gitignore`).

## Como Rodar (Windows)

1. Criar ambiente virtual: `python -m venv .venv`
2. Ativar: `.\.venv\Scripts\activate`
3. Instalar dependências: `pip install -r requirements.txt`
4. Subir API: `uvicorn backend.app.main:app --reload`
5. Acessar:
   - Documentação: `http://127.0.0.1:8000/docs`
   - Saúde: `http://127.0.0.1:8000/health`

## Endpoints Principais

- `GET /health` — status do serviço
- Contatos: `GET/POST/PUT/DELETE /contacts`
- Organizações: `GET/POST/PUT/DELETE /organizations`
- Etapas (ordenadas): `GET/POST/PUT/DELETE /stages`
- Oportunidades: `GET/POST/PUT/DELETE /deals`

## Dados de Exemplo (Seed)

No startup, se não houver etapas, são criadas:
- `Novo` (1), `Qualificação` (2), `Proposta` (3), `Fechamento` (4)

## Próximos Passos

- Paginação, filtros (por `email`, `status`, intervalo de valor).
- Relatórios e integrações (agenda, tarefas, automações de pipeline).
- Migração para PostgreSQL e autenticação.

## PostgreSQL com Docker (Dev)

Suba uma instância local de PostgreSQL usando Docker para desenvolvimento.

### Subir containers

```bash
docker compose up -d
```

A instância ficará acessível em `localhost:5432` (DB `crm`, user `postgres`, senha `postgres`). O pgAdmin abre em `http://127.0.0.1:8080` (email `admin@local`, senha `admin`).

### Parar e remover containers

```bash
docker compose down
```

Depois rode:
```bash
uvicorn backend.app.main:app --reload
```
## Configuração (.env)
Crie um arquivo `.env` na raiz do projeto:

## Troubleshooting
- Erro: `UnicodeDecodeError` no startup do PostgreSQL (psycopg2)
  - Causa: `DATABASE_URL` com caracteres não UTF-8 ou acentos não codificados.
  - Solução:
    - Remova `DATABASE_URL` da sessão atual e use `PG*`:
      - PowerShell: `$env:DATABASE_URL=$null`
    - Confirme que o `.env` está salvo em UTF-8 e sem acentos nos valores.
    - Verifique a URL usada:
      - `python -c "from backend.app.database import engine; print(engine.dialect.name, engine.url.render_as_string(hide_password=True))"`
    - Se cair em SQLite, revise o `.env` e reinicie. Para limpar residual:
      - `Remove-Item -Force .\data\crm.db`

## Auditoria e Logging
- Cada request recebe `X-Request-ID` e logs no formato:
ts=
lvl=<nível> logger=
req_id=
tenant=
actor=
msg=
- Até termos autenticação, use `X-Actor` para registrar o autor.
- `audit_logs` registra `CREATE/UPDATE/DELETE` para `stages`, `contacts`, `organizations`, `deals`.
## Lead Scoring (Dados e Endpoints)
- Campos adicionados:
  - `Organization.sector`: setor de atuação (PJ).
  - `Contact.client_type`: tipo de cliente (`PF`, `PJ`, `Publico`).
  - `Contact.lead_source`: origem do lead (`indicacao`, `website`, `redes`, `evento`).
  - `Deal.main_issue`: assunto principal do contato.
  - `Deal.estimated_value`: valor estimado da causa.
  - `Deal.opened_at` / `Deal.closed_at`: datas para medir duração/fechamento.
  - `Deal.email_open_rate`, `Deal.interactions_total`, `Deal.docs_shared`: métricas de engajamento.
- Nova entidade: `LeadScore`
  - `tenant_id`, `contact_id` (opcional), `deal_id` (opcional), `score` (0–100), `model_version`, `factors (JSON)`, `created_at`.
- Endpoints:
  - `POST /lead-scores` — cria pontuação (requer `X-Tenant-ID`, opcionalmente `contact_id` ou `deal_id`). Auditado como `SCORE`.
  - `GET /lead-scores?contact_id=&deal_id=` — lista pontuações por contato/negócio do tenant.
- Auditoria:
  - Eventos `CREATE/UPDATE/DELETE` já são registrados nos roteadores de CRM.
  - `SCORE` é registrado ao criar pontuações com `LeadScore`.
- Observações de migração:
  - Sem Alembic, adicionar colunas não atualiza tabelas já existentes. Em desenvolvimento, recrie o schema; em produção, configure Alembic para migrações.