Relatório de Progresso Diário - Backend Fast (App BiT)
Data: 14 de Junho de 2026
Desenvolvedor: Equipa de Desenvolvimento
Para: Project Manager (PM)

📋 Resumo do Dia
Hoje estabeleci a base do backend do projeto App BiT, configurando o ambiente Python com FastAPI e implementando a infraestrutura inicial de autenticação de utilizadores. O servidor está operacional e a responder corretamente, com os fluxos principais de registo e login totalmente funcionais e seguros.

🚀 Conquistas & Implementações
1. Configuração do Ambiente e Servidor
Tecnologia: Python e FastAPI.
Servidor: Configurado e a correr localmente na porta 8000.
CORS (Cross-Origin Resource Sharing): Configurado para permitir comunicações seguras a partir do frontend (por exemplo, http://localhost:3000).
Ponto de Entrada: Endpoint inicial de verificação de status (GET /) a responder com sucesso: "Backend App BiT a funcionar!".
2. Fluxo de Autenticação (/api/auth/* & /api/users/*)
Implementámos uma arquitetura limpa com separação entre a camada de rotas (
routers/auth.py
) e a camada de serviços de negócio (
services/auth_service.py
).

✅ Registo de Utilizador
Endpoint: POST /api/auth/register
Descrição: Permite o registo de novos utilizadores com validação de email único.
Segurança: A password é cifrada usando o algoritmo bcrypt via passlib antes de ser guardada na base de dados (atualmente simulada em memória).
Modelo de Entrada (DadosRegisto):
json

{
  "name": "Nome do Utilizador",
  "email": "user@example.com",
  "password": "senha_segura"
}
Resposta de Sucesso (200 OK):
json

{
  "id": 1,
  "name": "Nome do Utilizador",
  "email": "user@example.com"
}
✅ Login e Geração de Token JWT
Endpoint: POST /api/users/login
Descrição: Autentica o utilizador e gera um token de acesso seguro.
Segurança:
Verificação da password cifrada (bcrypt).
Geração de JSON Web Token (JWT) usando a biblioteca python-jose (algoritmo HS256).
O token expira automaticamente após 24 horas.
Modelo de Entrada (DadosLogin):
json

{
  "email": "user@example.com",
  "password": "senha_segura"
}
Resposta de Sucesso (200 OK):
json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Nome do Utilizador",
    "email": "user@example.com",
    "role": "GESTOR",
    "active": true,
    "createdAt": "2026-06-14T22:37:15.123456"
  }
}
🛠️ Detalhes Técnicos e Arquitetura
Segurança e Criptografia: Utilização de passlib com a suite bcrypt para hashing seguro de passwords, eliminando o armazenamento de texto limpo.
Validação de Dados: Pydantic para validação estrita dos dados de entrada no request body.
Base de Dados Temporária: Armazenamento em memória (lista mutável controlada no serviço) para permitir testes rápidos de integração com o frontend sem dependências de infraestrutura nesta fase inicial.
🎯 Próximos Passos (Planeamento)
Persistência de Dados: Integração com um sistema de base de dados relacional (ex: PostgreSQL/SQLite) usando SQLAlchemy para substituir o armazenamento em memória.
Proteção de Rotas: Criação de uma dependência (middleware/security scheme) no FastAPI para validar o token JWT nas rotas privadas.
Documentação Interativa: Customização e enriquecimento da documentação OpenAPI gerada automaticamente pelo FastAPI (disponível em /docs).
Testes Unitários: Configuração do pytest para cobrir os fluxos de registo e login.
