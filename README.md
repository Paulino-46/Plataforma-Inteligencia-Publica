#  App BiT — Equipe 14

Web app responsiva com agente de IA para emprego, formação e saúde mental, desenvolvida com backend em **FastAPI** (Python) e frontend em **Next.js** (React/TypeScript).

---

##  Pré-requisitos

| Ferramenta | Versão mínima |
|------------|---------------|
| [Docker](https://docs.docker.com/get-docker/) | 20+ |
| [Docker Compose](https://docs.docker.com/compose/install/) | v2+ |
| [Make](https://www.gnu.org/software/make/) | qualquer |

> **Nota:** Não é necessário instalar Python nem Node.js localmente — tudo corre dentro dos containers Docker.

---

##  Como rodar o projecto

### 1. Clonar o repositório

```bash
git clone https://github.com/No-Country-simulation/S06-26-AB-Equipe-14.git
cd S06-26-AB-Equipe-14
```

### 2. Configurar variáveis de ambiente

Copie o ficheiro de exemplo e preencha com os valores correctos:

```bash
cp .env.example .env
```

Edite o `.env` com as suas credenciais:

```env
# Conexão com o banco de dados PostgreSQL (Supabase)
DATABASE_URL=postgresql://postgres:SUA-PASSWORD@db.xxxxx.supabase.co:5432/postgres

# Chave secreta para tokens JWT
SECRET_KEY=chave-secreta-do-appbit-2026
ALGORITHM=HS256

# URL do backend (usada pelo frontend)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Iniciar os serviços

```bash
make docker-dev
```

Isto vai:
- Construir as imagens Docker do backend e frontend
- Executar a migração do banco de dados automaticamente
- Iniciar ambos os serviços com hot-reload

### 4. Aceder à aplicação

| Serviço | URL |
|---------|-----|
|  Frontend (Next.js) | [http://localhost:3003](http://localhost:3003) |
|  Backend API (FastAPI) | [http://localhost:8000](http://localhost:8000) |
|  Documentação da API (Swagger) | [http://localhost:8000/docs](http://localhost:8000/docs) |

---

##  Comandos disponíveis (Makefile)

| Comando | Descrição |
|---------|-----------|
| `make docker-dev` | Constrói e inicia tudo (com logs visíveis) |
| `make docker-up` | Inicia os containers em segundo plano |
| `make docker-down` | Para os containers |
| `make docker-build` | Reconstrói as imagens (sem cache) |
| `make docker-logs` | Mostra os logs em tempo real |
| `make docker-clean` | Para e remove containers + volumes |
| `make db-migrate` | Executa migração dentro do container |
| `make db-migrate-local` | Executa migração localmente |

---

## Arquitectura do projecto

```
S06-26-AB-Equipe-14/
├── backend-fast/              # API Backend (FastAPI + Python)
│   ├── app/
│   │   ├── main.py            # Ponto de entrada da aplicação
│   │   ├── database.py        # Configuração do SQLAlchemy + sessão
│   │   ├── models/            # Modelos do banco de dados (ORM)
│   │   │   ├── base.py        # Base declarativa do SQLAlchemy
│   │   │   ├── user.py        # Modelo de utilizadores
│   │   │   └── antena.py      # Modelo de antenas
│   │   ├── repositories/      # Acesso directo ao banco de dados
│   │   │   └── user_repository.py  # CRUD de utilizadores
│   │   ├── routers/           # Endpoints da API
│   │   │   ├── auth.py        # Registo e Login
│   │   │   └── users.py       # Gestão de utilizadores
│   │   └── services/          # Lógica de negócio
│   │       └── auth_service.py # Autenticação, JWT e hashing
│   ├── scripts/
│   │   └── migrate.py         # Script de migração do banco
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                  # Frontend (Next.js + TypeScript)
│   ├── app/                   # Páginas e componentes (App Router)
│   ├── services/              # Serviços de comunicação com API
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml         # Orquestração dos serviços
├── Makefile                   # Atalhos de comandos
├── .env                       # Variáveis de ambiente (não versionado)
└── .env.example               # Exemplo das variáveis necessárias
```

---

##  Endpoints da API

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/auth/register` | Registar novo utilizador |
| `POST` | `/api/users/login` | Login (retorna token JWT) |

### Gestão de Utilizadores

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/users` | Listar todos os utilizadores |
| `GET` | `/api/users/{id}` | Ver um utilizador |
| `POST` | `/api/users` | Criar utilizador |
| `PUT` | `/api/users/{id}` | Actualizar utilizador |
| `PATCH` | `/api/users/{id}/deactivate` | Desactivar utilizador |
| `DELETE` | `/api/users/{id}` | Apagar utilizador |

### Exemplo de registo

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@email.com",
    "password": "senha123",
    "role": "GESTOR",
    "organisation": "BiT",
    "country": "Portugal"
  }'
```

### Exemplo de login

```bash
curl -X POST http://localhost:8000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@email.com",
    "password": "senha123"
  }'
```

---

##  Banco de dados

O projecto utiliza **PostgreSQL** hospedado no **Supabase**, com acesso via **SQLAlchemy ORM**.

A camada de acesso ao banco segue o padrão **Repository**:

- **Models** (`app/models/`) → Definem a estrutura das tabelas
- **Repositories** (`app/repositories/`) → Operações CRUD directas no banco
- **Services** (`app/services/`) → Lógica de negócio (hashing, JWT, validações)
- **Routers** (`app/routers/`) → Endpoints HTTP que orquestram tudo

As tabelas são criadas automaticamente ao iniciar o servidor (via `Base.metadata.create_all`).

---

##  Stack tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.10, SQLAlchemy 2.0 |
| Banco de dados | PostgreSQL (Supabase) |
| Autenticação | JWT (python-jose) + bcrypt (passlib) |
| Infra | Docker, Docker Compose |

---

##  Equipe 14

Projecto desenvolvido durante a simulação No Country — S06-26-AB.