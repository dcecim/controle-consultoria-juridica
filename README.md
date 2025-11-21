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
