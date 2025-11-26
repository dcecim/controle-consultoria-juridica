## Causa do erro
- O backend falha ao iniciar porque `python-dotenv` tenta carregar variáveis do arquivo `.env` e encontra caracteres nulos (`\x00`), gerando `ValueError: embedded null character`.
- Em `backend/app/database.py:11` há um `load_dotenv()` inicial e, em `backend/app/database.py:18`, outro `load_dotenv` com `encoding="utf-8"` apontando para `c:\Demandas\Consultor-juridico\.env`.
- O arquivo `.env` está corrompido/encodado incorretamente: em `c:\Demandas\Consultor-juridico\.env:6` há NULs entre caracteres (`LOG_LEVEL=INFOV\x00I\x00T\x00E...`), típico de arquivo salvo como UTF-16/"Unicode" no Windows.

## Correções no `.env`
- Recriar o `.env` em UTF-8 (sem BOM), com uma variável por linha, sem caracteres ocultos.
- Conteúdo sugerido:
  - `PGUSER=postgres`
  - `PGPASSWORD=0102`
  - `PGHOST=localhost`
  - `PGPORT=5432`
  - `PGDATABASE=crm`
  - `LOG_LEVEL=INFO`
  - `VITE_API_URL=http://localhost:8000`
- Garantir que o editor salve em `UTF-8`. Evitar salvar como "Unicode" (UTF-16), que insere NUL entre caracteres.

## Ajustes no backend
- Em `backend/app/main.py:20` há uso de `os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")` sem `import os`. Adicionar `import os` no topo para evitar `NameError` após corrigir o `.env`.
- (Opcional) Remover o `load_dotenv()` genérico em `backend/app/database.py:11` e manter apenas o carregamento explícito com caminho (`backend/app/database.py:18`) para evitar leituras inesperadas em ambientes futuros.

## Verificação
- Após corrigir o `.env` e importar `os`:
  - Iniciar o servidor com `python -m uvicorn backend.app.main:app`.
  - Esperar logs de inicialização do banco: `Database engine initialized ...` de `log_engine_info()`.
  - Acessar `http://localhost:8000/health` e validar `{ "status": "ok" }`.
- No frontend, `src/config.ts:1` usa `import.meta.env.VITE_API_URL`; com a variável no `.env` correta, as chamadas à API devem apontar para `http://localhost:8000`.

## Possíveis melhorias (opcionais)
- Adicionar validação ao carregamento do `.env` para detectar e logar valores contendo `\x00` antes de aplicar no ambiente.
- Padronizar a lista de origens CORS via variável `FRONTEND_ORIGIN` no `.env` e documentar formatos válidos.
