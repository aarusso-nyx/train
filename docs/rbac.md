
# Especificação de Execução Autônoma — RBAC API NestJS

## 0. Propósito e precedência

Este documento transforma a especificação do projeto e as decisões adicionais em um plano técnico executável por agentes de IA autônomos.

**Ordem de precedência obrigatória:**
1. decisões adicionais mais recentes;
2. requisitos concretos do documento-base;
3. decisões arquiteturais derivadas neste planejamento, somente quando não alteram regra de negócio;
4. recomendações não aprovadas permanecem como recomendação ou bloqueio, conforme impacto.

Nenhum agente pode substituir uma decisão humana por uma preferência técnica própria.

---

# 1. DECISÕES FINAIS DO PROJETO

## 1.1 Escopo obrigatório

- API REST de RBAC em NestJS.
- CRUD de users.
- CRUD de roles.
- Gerenciamento controlado de permissions.
- Associação users ↔ roles.
- Associação roles ↔ permissions.
- Consulta de user com roles e permissions efetivas.
- Login com JWT.
- Swagger/OpenAPI.
- Migrations.
- Seed inicial.
- Testes unitários.
- Testes de integração.
- Docker Compose para API e PostgreSQL.
- Listagem de permissions.
- Busca de permission por ID.
- Atualização somente da `description` de permission.
- Sem criação manual de permission no MVP.
- Sem exclusão de permission no MVP.
- `resource`, `action` e `code` de permission são imutáveis.

## 1.2 Stack

- Runtime: Node.js.
- Linguagem: TypeScript.
- Framework: NestJS.
- Banco: PostgreSQL.
- ORM: TypeORM.
- Persistência por `Repository<Entity>` injetado nos Services.
- Validação: `class-validator` + `class-transformer`.
- Autenticação: JWT Bearer.
- Documentação: Swagger/OpenAPI.
- Testes: Jest; Supertest para testes HTTP de integração.
- Infraestrutura local: Docker + Docker Compose.
- Package manager operacional: npm.

## 1.3 Arquitetura

Fluxo obrigatório:

```text
Request
  ↓
Authentication Guard
  ↓
Authorization Guard
  ↓
Controller
  ↓
Service
  ↓
Repository<Entity>
  ↓
PostgreSQL
```

Arquitetura modular em camadas do NestJS.

## 1.4 Modelo RBAC

```text
users N:N roles
roles N:N permissions
```

- Um user possui uma ou mais roles.
- Não existe herança automática entre roles.
- Permissions efetivas de um user = união das permissions de todas as suas roles, sem duplicações.
- Formato de permission: `action:resource`.
- Catálogo inicial:
  - `create:user`
  - `read:user`
  - `update:user`
  - `delete:user`
  - `create:role`
  - `read:role`
  - `update:role`
  - `delete:role`
  - `create:permission`
  - `read:permission`
  - `update:permission`
  - `delete:permission`

Matriz inicial:

```text
USER
- read:user

ANALYST
- read:user
- update:user
- read:role

AUDITOR
- read:user
- update:user
- read:role
- read:permission

ADMIN
- todas as 12 permissions do catálogo
- pode gerenciar users ↔ roles
- pode gerenciar roles ↔ permissions
```

## 1.5 Roles de sistema

Roles nativas:

- `USER`
- `ANALYST`
- `AUDITOR`
- `ADMIN`

Regras:
- não podem ser excluídas;
- nome não pode ser alterado;
- description pode ser alterada;
- nomes persistidos em uppercase.

**Decisão técnica derivada:** não adicionar `is_system` ao banco neste MVP. A proteção será feita por uma constante/enum de nomes de roles do sistema. Isso respeita o schema-base e evita criar campo não aprovado.

## 1.6 Permissions

- Permissions do catálogo são provisionadas exclusivamente por migration/seed.
- Não existe `POST /permissions` no MVP.
- Não existe `DELETE /permissions/:id` no MVP.
- `PATCH /permissions/:id` aceita somente `description`.
- `resource`, `action`, `code` não podem ser alterados por endpoint.
- `code` é persistido em lowercase no formato `action:resource`.
- Os códigos `create:permission` e `delete:permission` existem no catálogo, mas não habilitam endpoints que estão fora do escopo atual.

## 1.7 Autenticação

- `POST /api/v1/auth/login`.
- Login por email + password.
- Somente access token.
- Sem refresh token.
- Expiração: 1 hora.
- Header: `Authorization: Bearer <token>`.
- Payload: `userId` e `username`.
- Secret via variável de ambiente.
- Permissions não são gravadas no token.
- Em cada request protegida, o backend consulta o estado atual do usuário e suas permissions.
- Usuário inativo não autentica.
- Usuário tornado inativo após emissão do token não pode continuar usando endpoints protegidos.

## 1.8 Rotas públicas

```text
GET  /api/v1/help
POST /api/v1/auth/login
```

`GET /api/v1/help/health` está removido do MVP.

## 1.9 Rotas autenticadas

```text
GET /api/v1/auth/me
```

Demais endpoints administrativos exigem autenticação + permission.

## 1.10 Mapeamento endpoint → permission

```text
Users
GET    /users                         -> read:user
GET    /users/:userId                 -> read:user
GET    /users/:userId/access          -> read:user
POST   /users                         -> create:user
PATCH  /users/:userId                 -> update:user
PATCH  /users/:userId/password        -> update:user
PATCH  /users/:userId/status          -> update:user
DELETE /users/:userId                 -> delete:user
POST   /users/:userId/roles           -> update:user
PUT    /users/:userId/roles           -> update:user
DELETE /users/:userId/roles/:roleId   -> update:user

Roles
GET    /roles                         -> read:role
GET    /roles/:roleId                 -> read:role
POST   /roles                         -> create:role
PATCH  /roles/:roleId                 -> update:role
DELETE /roles/:roleId                 -> delete:role
POST   /roles/:roleId/permissions     -> update:role
PUT    /roles/:roleId/permissions     -> update:role
DELETE /roles/:roleId/permissions/:permissionId -> update:role

Permissions
GET    /permissions                   -> read:permission
GET    /permissions/:permissionId     -> read:permission
PATCH  /permissions/:permissionId     -> update:permission
```

A terminologia `make/break membership/privilege` da decisão de ADMIN é tratada como capacidade de associação, e não como novos códigos de permission, pois o catálogo autorizado contém somente as 12 permissions acima.

## 1.11 Respostas

Recurso único:

```json
{
  "data": {}
}
```

Coleção:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

`204 No Content` não possui body.

Erro padronizado:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["..."],
  "path": "/api/v1/...",
  "timestamp": "ISO-8601"
}
```

## 1.12 HTTP errors

- 400: DTO, query ou parâmetro inválido.
- 401: credenciais inválidas, token ausente, inválido ou expirado.
- 403: autenticado sem permission; user inativo.
- 404: user, role ou permission inexistente.
- 409: duplicidade; associação duplicada; exclusão de role em uso.
- 500: erro inesperado sem stack trace sensível.

## 1.13 Normalização

- username: `trim` + lowercase.
- email: `trim` + lowercase.
- role.name: `trim` + uppercase.
- permission.resource/action: lowercase.
- datas persistidas em UTC.
- datas retornadas em ISO 8601.

## 1.14 Transações obrigatórias

- criar user + associar roles;
- criar role + associar permissions, quando `permissionIds` vierem no request;
- substituir todas as roles de user;
- substituir todas as permissions de role;
- qualquer operação administrativa que exija múltiplas alterações para preservar invariantes.

`PUT` de associações não aceita array vazio.

## 1.15 Infra

- Dockerfile.
- `.dockerignore`.
- `docker-compose.yml`.
- serviços `api` e `postgres`.
- volume persistente do PostgreSQL.
- migrations obrigatórias; `synchronize: false`.
- seed inicial idempotente.
- `.env.example`.
- `.env` não versionado.
- Swagger em `/api/docs`.

## 1.16 Logging e segurança obrigatória do escopo

- tratamento centralizado de erros;
- usar logger da aplicação para inicialização e erros;
- não logar password;
- não logar token completo;
- não retornar password hash;
- não retornar stack trace interno em produção;
- `ValidationPipe` global com `whitelist`, `forbidNonWhitelisted` e `transform`.

Não incluir no MVP por requisito:
- Helmet obrigatório;
- rate limiting;
- políticas extras de CORS;
- outros pacotes de segurança não solicitados.

---

# 2. CONFLITOS E AMBIGUIDADES ENCONTRADOS

## C-001 — Prisma vs TypeORM

**Descrição:** documento-base recomenda Prisma; decisões finais escolhem TypeORM.  
**Impacto:** estrutura de persistência, migrations, injeção e diretórios.  
**Classificação:** `RESOLVIDO_PELAS_DECISOES`.  
**Regra final:** TypeORM + `Repository<Entity>`.

## C-002 — Health endpoint

**Descrição:** documento-base contém `/help/health`; decisão final mantém somente `/help`.  
**Impacto:** API contract e testes.  
**Classificação:** `RESOLVIDO_PELAS_DECISOES`.  
**Regra final:** não implementar `/help/health`.

## C-003 — POST/DELETE de permissions

**Descrição:** documento-base continha endpoints de criação/exclusão; decisões finais proíbem ambos.  
**Impacto:** controllers, Swagger, testes e autorização.  
**Classificação:** `RESOLVIDO_PELAS_DECISOES`.  
**Regra final:** apenas listar, buscar e atualizar description.

## C-004 — Capabilities `make/break membership/privilege`

**Descrição:** ADMIN pode gerenciar associações, mas esses nomes não aparecem no catálogo de permission.  
**Impacto:** definição dos Guards das rotas de associação.  
**Classificação:** `RESOLVIDO_PELAS_DECISOES`.  
**Regra final:** user↔role usa `update:user`; role↔permission usa `update:role`. Não criar novos códigos.

## C-005 — Algoritmo de password hashing

**Descrição:** documento-base deixou Argon2 vs bcrypt pendente; decisões finais não escolhem um.  
**Impacto:** dependência, seed, criação de usuário, login e alteração de senha.  
**Classificação:** `BLOCKING_DECISION`.

## C-006 — Exclusão lógica de user

**Descrição:** foi aprovado que user usa exclusão lógica, porém não foi definido se DELETE apenas define `is_active=false` ou se existe também `deleted_at`.  
**Impacto:** schema, migration, filtros, DELETE e reativação.  
**Classificação:** `BLOCKING_DECISION`.

## C-007 — Role padrão na criação de user

**Descrição:** foi aprovado que um user possui uma ou mais roles, mas não foi confirmado se ausência de `roleIds` deve atribuir `USER` automaticamente ou gerar 400.  
**Impacto:** CreateUserDto, Service e testes.  
**Classificação:** `BLOCKING_DECISION`.

## C-008 — Último ADMIN e autoalterações

**Descrição:** o documento-base identificou regras possíveis para impedir desativação do último ADMIN ativo, perda da última role ADMIN ou remoção da própria role; decisões finais não as formalizaram.  
**Impacto:** status de user, DELETE user e associações user↔role.  
**Classificação:** `BLOCKING_DECISION`.

## C-009 — Semântica de alteração de password

**Descrição:** existe endpoint `PATCH /users/:userId/password` com `currentPassword` e `newPassword`, mas não está definido se é troca pelo próprio usuário, reset administrativo, ou ambos. USER não possui `update:user`, o que torna a intenção atual ambígua.  
**Impacto:** autorização, DTO, validação e testes.  
**Classificação:** `BLOCKING_DECISION`.

## C-010 — Valores exatos do contrato de paginação

**Descrição:** foi aprovado que existe contrato único. O documento-base recomenda `page=1`, `limit=20`, máximo `100`, mas as decisões finais não repetem os valores.  
**Impacto:** API contract.  
**Classificação:** `NÃO_BLOQUEANTE`.  
**Convenção operacional deste planejamento:** usar 1/20/100 até decisão contrária, pois são os únicos valores concretos fornecidos.

## C-011 — Cobertura mínima

**Descrição:** testes unitários e integração são obrigatórios, mas não há percentual mínimo.  
**Impacto:** CI.  
**Classificação:** `NÃO_BLOQUEANTE`.  
**Regra:** CI exige sucesso da suíte, sem gate percentual.

---

# 3. ARQUITETURA DEFINITIVA

## 3.1 Diretórios

```text
src/
├── main.ts
├── app.module.ts
├── config/
│   ├── env.validation.ts
│   └── configuration.ts
├── database/
│   ├── database.module.ts
│   ├── migrations/
│   └── seeds/
├── common/
│   ├── auth/
│   │   ├── decorators/
│   │   ├── guards/
│   │   └── types/
│   ├── dto/
│   ├── filters/
│   ├── constants/
│   └── utils/
├── help/
│   ├── help.module.ts
│   ├── help.controller.ts
│   └── help.service.ts
├── auth/
│   ├── dto/
│   ├── strategies/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── authorization.service.ts
├── users/
│   ├── dto/
│   ├── entities/
│   ├── users.module.ts
│   ├── users.controller.ts
│   └── users.service.ts
├── roles/
│   ├── dto/
│   ├── entities/
│   ├── roles.module.ts
│   ├── roles.controller.ts
│   └── roles.service.ts
└── permissions/
    ├── dto/
    ├── entities/
    ├── permissions.module.ts
    ├── permissions.controller.ts
    └── permissions.service.ts

test/
├── integration/
├── helpers/
└── fixtures/

docs/
tasks/
AGENTS.md
```

## 3.2 Entidades TypeORM

### User
- `id`: BIGINT identity PK.
- `username`: varchar(50), unique, not null.
- `fullName`: varchar(150), not null.
- `email`: varchar(255), unique, not null.
- `passwordHash`: varchar(255), not null.
- `isActive`: boolean, default true.
- `createdAt`: timestamptz.
- `updatedAt`: timestamptz.
- possível `deletedAt`: **bloqueado por C-006**.

### Role
- `id`: BIGINT identity PK.
- `name`: varchar(50), unique, not null.
- `description`: varchar(255), nullable.
- `createdAt`: timestamptz.
- `updatedAt`: timestamptz.

### Permission
- `id`: BIGINT identity PK.
- `resource`: varchar(50), not null.
- `action`: varchar(20), not null.
- `code`: varchar(100), unique, not null.
- `description`: varchar(255), nullable.
- `createdAt`: timestamptz.
- unique `(resource, action)`.

### UserRole
Entidade explícita para preservar `assigned_at`:
- `userId` PK/FK.
- `roleId` PK/FK.
- `assignedAt` timestamptz.

### RolePermission
Entidade explícita:
- `roleId` PK/FK.
- `permissionId` PK/FK.
- `assignedAt` timestamptz.

## 3.3 Índices

- unique `users.username`.
- unique `users.email`.
- unique `roles.name`.
- unique `permissions.code`.
- unique `permissions(resource, action)`.
- index `user_roles(role_id)`.
- index `role_permissions(permission_id)`.

## 3.4 Dependências permitidas

- Controller → Service.
- Service → TypeORM Repository.
- Guard → AuthorizationService/AuthService.
- AuthorizationService → Repository.
- Modules podem importar outros modules somente via providers exportados.
- DTO não importa Entity.
- Entity não importa Controller/Service.
- Common não depende de feature module, exceto tipos puramente abstratos.

## 3.5 Dependências proibidas

- Controller → Repository diretamente.
- Controller com regra de negócio.
- Service → Controller.
- Entity → Service.
- chamadas HTTP internas entre módulos da mesma aplicação.
- Guard consultando endpoint HTTP interno.
- acesso ao `DataSource` fora de Service/seed/migration, salvo transação explicitamente necessária.
- query SQL dinâmica montada com `sortBy` não validado.
- retorno direto de Entity que exponha `passwordHash`.

## 3.6 Autenticação e autorização

- `@Public()` marca `/help` e `/auth/login`.
- `JwtAuthGuard` global: exige JWT nas demais rotas.
- `PermissionsGuard` global: lê metadata `@Permissions()`.
- `/auth/me` exige autenticação, mas não permission específica.
- `AuthorizationService` calcula permissions efetivas via banco a cada request protegido.
- Permission requerida ausente → 403.
- User inativo → 403 para token previamente emitido.

---

# 4. REGRAS OBRIGATÓRIAS PARA AGENTES

1. Não inventar requisito de negócio.
2. Não trocar TypeORM por Prisma.
3. Não criar camada Repository customizada obrigatória; usar `Repository<Entity>` do TypeORM, salvo task explicitamente autorizada.
4. Não alterar contratos HTTP definidos.
5. Não adicionar endpoints opcionais.
6. Não criar `/help/health`.
7. Não criar `POST` ou `DELETE` de permissions.
8. Não permitir atualização de `resource`, `action` ou `code`.
9. Não adicionar nova permission sem alteração explícita da fonte de verdade.
10. Não adicionar bibliotecas arbitrariamente.
11. Toda dependência nova precisa ser necessária à task e registrada no diff/PR.
12. Não remover teste para obter pipeline verde.
13. Não alterar teste correto para mascarar bug de produção.
14. Não concluir task apenas porque compila.
15. Não versionar `.env`.
16. Não registrar password, password hash ou JWT completo.
17. Não retornar `passwordHash`.
18. Não usar `synchronize: true`.
19. Não deixar TODO referente ao requisito da task.
20. Não editar arquivo fora do escopo permitido sem devolver `SCOPE_CHANGE_REQUEST`.
21. Se uma regra necessária estiver em `BLOCKING_DECISION`, interromper apenas a task afetada.
22. Tasks independentes devem continuar mesmo com outras bloqueadas.
23. Qualquer mudança de schema exige migration.
24. Qualquer mudança de contrato público exige atualização Swagger + testes.
25. Qualquer bug encontrado fora do escopo deve ser registrado, não corrigido silenciosamente.
26. O Reviewer compara implementação com especificação; não redefine requisitos.

Formato obrigatório para mudança de escopo:

```text
SCOPE_CHANGE_REQUEST
Task:
Arquivo necessário:
Motivo:
Impacto:
```

---

# 5. AGENTES

## Orchestrator Agent
**Responsabilidade:** controlar DAG, estados, delegação, retries e integração.  
**Escopo:** `tasks/**`, estado de execução, branches, dependências.  
**Entradas:** especificação, estado persistido, resultado de CI/review.  
**Saídas:** task READY, transições de estado, bloqueios.  
**Não pode:** implementar feature ou decidir negócio.  
**Acionamento:** ciclo inteiro.

## Platform & Database Agent
**Responsabilidade:** bootstrap técnico, config, TypeORM, entities, migrations, seed, Docker.  
**Ownership:** `src/config/**`, `src/database/**`, `src/**/entities/**`, arquivos Docker e configuração de banco.  
**Não pode:** alterar contrato HTTP ou regra de autorização.  
**Acionamento:** fases 0, 1 e infraestrutura.

## Backend Feature Agent
**Responsabilidade:** Help, Users, Roles, Permissions; controllers, services, DTOs e mappers.  
**Ownership:** `src/help/**`, `src/users/**` exceto entities, `src/roles/**` exceto entities, `src/permissions/**` exceto entities.  
**Não pode:** modificar guards/JWT/schema sem autorização.  
**Acionamento:** tasks de domínio.

## Auth & RBAC Agent
**Responsabilidade:** login, JWT, decorators, guards, authorization service, `/auth/me`.  
**Ownership:** `src/auth/**`, `src/common/auth/**`.  
**Não pode:** criar novas permissions ou alterar matriz.  
**Acionamento:** autenticação/autorização.

## Test Agent
**Responsabilidade:** unitários, integração, fixtures e cenários negativos.  
**Ownership:** `test/**`, `**/*.spec.ts`.  
**Não pode:** alterar produção para fazer teste passar, salvo nova task de correção delegada.  
**Acionamento:** após feature ou como par da task.

## Review Agent
**Responsabilidade:** revisão objetiva contra contrato, arquitetura, segurança e testes.  
**Ownership:** read-only por padrão.  
**Saída:** `APPROVED` ou `CHANGES_REQUESTED` com violações enumeradas.  
**Não pode:** mudar requisito nem implementar silenciosamente.  
**Acionamento:** toda task antes de DONE.

---

# 6. GRAFO GERAL

```text
T001 Bootstrap
  ↓
T002 Config/Env/Global App
  ↓
T003 TypeORM
  ↓
T004 Entities Core
  ↓
T005 Join Entities
  ↓
T006 Migration
  ↓
T007 Seed
  ├───────────────┬──────────────────┐
  ↓               ↓                  ↓
T008 Common      T009 Help          T010 Auth Foundation
  ↓                                  ↓
  └──────────────→ T011 RBAC Guards ←┘
                     ↓
            ┌────────┼─────────┐
            ↓        ↓         ↓
          T013     T014      T017
       Permissions  Roles     Users Read
            │        │          │
            │       T015        ├─T018 Create (C-007)
            │        │          ├─T019 Update/Status
            │        │          ├─T020 Password (C-005,C-009)
            │        │          ├─T021 Delete (C-006,C-008)
            │        │          └─T022 User↔Role (C-008)
            │        │
            │       T016 Role↔Permission
            │
            └─────────────→ T012 Auth/me

Features estabilizadas
  ↓
T023 Swagger
  ↓
T024 Unit Auth/Common
T025 Unit Permissions/Roles
T026 Unit Users
  ↓
T027 Integration Auth/RBAC
T028 Integration Permissions/Roles
T029 Integration Users
  ↓
T030 Docker
  ↓
T031 CI
  ↓
T032 Final Acceptance
```

Tasks não bloqueadas podem prosseguir mesmo que T018/T020/T021/T022 estejam parcialmente bloqueadas.

---

# 7. TASKS

## T001 — Bootstrap do projeto NestJS

**TASK-ID:** T001  
**Objetivo:** Bootstrap do projeto NestJS.  
**Agente responsável:** Platform & Database Agent  
**Dependências:** nenhuma  
**Contexto necessário:** Criar a base compilável do backend NestJS sem implementar domínio.  
**Arquivos esperados:** package.json, package-lock.json, tsconfig*.json, nest-cli.json, src/main.ts, src/app.module.ts, eslint/prettier config  
**Arquivos permitidos para alteração:** arquivos de bootstrap/configuração raiz e `src/main.ts`, `src/app.module.ts`  
**Arquivos que não devem ser alterados:** feature modules completos; migrations; contratos de domínio  
**Requisitos funcionais:** Aplicação deve iniciar e compilar.  
**Regras de negócio:** Nenhuma regra de negócio.  
**Regras técnicas:** NestJS + TypeScript + npm; scripts `build`, `start`, `start:dev`, `test`, `test:integration`, `lint`.  
**Entrada esperada:** repositório vazio ou skeleton.  
**Saída esperada:** aplicação NestJS mínima compilável.  
**Cenários de erro:** falha de instalação/compilação deve manter task FAILED.  
**Critérios de aceite:** `npm ci` e `npm run build` passam.  
**Testes obrigatórios:** smoke unitário padrão pode permanecer; sem feature tests.  
**Comandos de validação:** `npm ci; npm run build; npm test -- --runInBand`  
**Definition of Done:** bootstrap versionado, sem código de domínio e sem dependências não justificadas.  
**Possíveis bloqueios:** nenhum

## T002 — Configuração global, env, prefixo e ValidationPipe

**TASK-ID:** T002  
**Objetivo:** Configuração global, env, prefixo e ValidationPipe.  
**Agente responsável:** Platform & Database Agent  
**Dependências:** T001  
**Contexto necessário:** Definir comportamento transversal antes das features.  
**Arquivos esperados:** src/config/**, src/main.ts, .env.example, .gitignore  
**Arquivos permitidos para alteração:** config, main, env example, gitignore  
**Arquivos que não devem ser alterados:** entities, controllers de domínio  
**Requisitos funcionais:** Prefixo `/api/v1`; env validada; ValidationPipe global; Swagger ainda não necessário.  
**Regras de negócio:** Datas da API devem ser serializadas em ISO 8601; `.env` não pode ser versionado.  
**Regras técnicas:** whitelist=true, forbidNonWhitelisted=true, transform=true. ConfigService global.  
**Entrada esperada:** variáveis PORT, DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, seed admin.  
**Saída esperada:** app falha cedo quando env obrigatória estiver ausente.  
**Cenários de erro:** config inválida deve impedir boot com mensagem sem segredo.  
**Critérios de aceite:** prefixo ativo e `.env.example` suficiente para ambiente local.  
**Testes obrigatórios:** teste unitário da validação de env.  
**Comandos de validação:** `npm run build; npm test -- --runInBand; npm run lint`  
**Definition of Done:** nenhum segredo real versionado.  
**Possíveis bloqueios:** nenhum

## T003 — Configurar TypeORM e PostgreSQL

**TASK-ID:** T003  
**Objetivo:** Configurar TypeORM e PostgreSQL.  
**Agente responsável:** Platform & Database Agent  
**Dependências:** T002  
**Contexto necessário:** Substitui definitivamente qualquer desenho Prisma do documento-base.  
**Arquivos esperados:** src/database/**, src/app.module.ts, package.json  
**Arquivos permitidos para alteração:** database module/config e dependências TypeORM/Postgres  
**Arquivos que não devem ser alterados:** controllers/services de feature  
**Requisitos funcionais:** Aplicação conecta ao PostgreSQL por `DATABASE_URL`.  
**Regras de negócio:** Nenhuma.  
**Regras técnicas:** `@nestjs/typeorm`, `typeorm`, `pg`; `synchronize:false`; migrations habilitadas.  
**Entrada esperada:** DATABASE_URL.  
**Saída esperada:** DataSource/TypeOrmModule configurado.  
**Cenários de erro:** falha de conexão deve ser logada sem credenciais.  
**Critérios de aceite:** boot com banco disponível; nenhuma sincronização automática.  
**Testes obrigatórios:** teste de config sem conexão real + integração posterior.  
**Comandos de validação:** `npm run build; npm test -- --runInBand`  
**Definition of Done:** TypeORM é único ORM do projeto.  
**Possíveis bloqueios:** nenhum

## T004 — Criar entidades User, Role e Permission

**TASK-ID:** T004  
**Objetivo:** Criar entidades User, Role e Permission.  
**Agente responsável:** Platform & Database Agent  
**Dependências:** T003  
**Contexto necessário:** Modelar tabelas centrais conforme schema aprovado.  
**Arquivos esperados:** src/users/entities/user.entity.ts, src/roles/entities/role.entity.ts, src/permissions/entities/permission.entity.ts  
**Arquivos permitidos para alteração:** somente entities centrais  
**Arquivos que não devem ser alterados:** controllers, services, migration ainda  
**Requisitos funcionais:** Mapear colunas, uniques e timestamps.  
**Regras de negócio:** Role system names protegidos em service, não por entity; permission identifiers imutáveis por API.  
**Regras técnicas:** snake_case no banco; camelCase no TypeScript; timestamptz.  
**Entrada esperada:** modelo de dados aprovado.  
**Saída esperada:** 3 entities registráveis pelo TypeORM.  
**Cenários de erro:** nenhum tratamento HTTP nesta task.  
**Critérios de aceite:** metadata TypeORM contém todas as colunas/constraints esperadas.  
**Testes obrigatórios:** unitários simples de metadata se necessário; validação real na migration.  
**Comandos de validação:** `npm run build; npm test -- --runInBand`  
**Definition of Done:** sem `password` plain; somente `passwordHash`.  
**Possíveis bloqueios:** C-006 impede apenas adicionar `deletedAt`.

## T005 — Criar entidades de associação UserRole e RolePermission

**TASK-ID:** T005  
**Objetivo:** Criar entidades de associação UserRole e RolePermission.  
**Agente responsável:** Platform & Database Agent  
**Dependências:** T004  
**Contexto necessário:** As tabelas N:N possuem `assigned_at`, então devem ser entidades explícitas.  
**Arquivos esperados:** src/users/entities/user-role.entity.ts, src/roles/entities/role-permission.entity.ts e ajustes de relações nas entities  
**Arquivos permitidos para alteração:** entities de associação e relações  
**Arquivos que não devem ser alterados:** services/controllers  
**Requisitos funcionais:** PK composta impede associação duplicada.  
**Regras de negócio:** User↔Role e Role↔Permission são N:N.  
**Regras técnicas:** FKs com índices; relações TypeORM bidirecionais somente onde úteis.  
**Entrada esperada:** ids de entidades centrais.  
**Saída esperada:** join entities com `assignedAt`.  
**Cenários de erro:** duplicidade será protegida também no banco.  
**Critérios de aceite:** metadata representa PKs compostas e FKs corretas.  
**Testes obrigatórios:** schema validado na migration/integration.  
**Comandos de validação:** `npm run build; npm test -- --runInBand`  
**Definition of Done:** não usar `@ManyToMany` com tabela implícita que perca `assigned_at`.  
**Possíveis bloqueios:** nenhum

## T006 — Criar migration inicial do schema RBAC

**TASK-ID:** T006  
**Objetivo:** Criar migration inicial do schema RBAC.  
**Agente responsável:** Platform & Database Agent  
**Dependências:** T004,T005  
**Contexto necessário:** Banco deve ser reproduzível por migration.  
**Arquivos esperados:** src/database/migrations/**  
**Arquivos permitidos para alteração:** migrations  
**Arquivos que não devem ser alterados:** seed e feature code  
**Requisitos funcionais:** Criar users, roles, permissions, user_roles, role_permissions, constraints e índices.  
**Regras de negócio:** Sem dados de seed nesta migration estrutural.  
**Regras técnicas:** PostgreSQL; timestamptz; unique constraints; rollback `down` coerente.  
**Entrada esperada:** entities aprovadas.  
**Saída esperada:** migration inicial.  
**Cenários de erro:** migration deve falhar atomicamente.  
**Critérios de aceite:** up em banco vazio cria schema; down remove na ordem correta; up novamente funciona.  
**Testes obrigatórios:** integration de migration em banco de teste.  
**Comandos de validação:** `npm run typeorm -- migration:run; npm run typeorm -- migration:revert`  
**Definition of Done:** `synchronize:false`; schema não depende de criação manual.  
**Possíveis bloqueios:** C-006 bloqueia versão final se `deleted_at` for exigido.

## T007 — Implementar seed idempotente de RBAC e ADMIN inicial

**TASK-ID:** T007  
**Objetivo:** Implementar seed idempotente de RBAC e ADMIN inicial.  
**Agente responsável:** Platform & Database Agent  
**Dependências:** T006  
**Contexto necessário:** Sistema precisa nascer utilizável sem API administrativa prévia.  
**Arquivos esperados:** src/database/seeds/**, package.json, .env.example  
**Arquivos permitidos para alteração:** seed, script npm e env example  
**Arquivos que não devem ser alterados:** controllers/services  
**Requisitos funcionais:** Criar 12 permissions, 4 roles, matriz role_permissions, admin inicial e user_roles do admin.  
**Regras de negócio:** ADMIN recebe todas as 12 permissions; USER/ANALYST/AUDITOR recebem matriz definida; rerun não duplica.  
**Regras técnicas:** upsert/consulta por chaves naturais; password obrigatoriamente hasheado.  
**Entrada esperada:** SEED_ADMIN_USERNAME/FULL_NAME/EMAIL/PASSWORD.  
**Saída esperada:** dados iniciais consistentes.  
**Cenários de erro:** env ausente ou hash impossível deve abortar seed sem admin parcial.  
**Critérios de aceite:** rodar duas vezes mantém mesma cardinalidade.  
**Testes obrigatórios:** integration de idempotência e matriz.  
**Comandos de validação:** `npm run db:seed; npm run db:seed`  
**Definition of Done:** password plain nunca persistida/logada.  
**Possíveis bloqueios:** C-005 algoritmo de hash.

## T008 — Implementar contrato comum de respostas e erros

**TASK-ID:** T008  
**Objetivo:** Implementar contrato comum de respostas e erros.  
**Agente responsável:** Backend Feature Agent  
**Dependências:** T002  
**Contexto necessário:** Padronização transversal exigida antes das features.  
**Arquivos esperados:** src/common/dto/**, src/common/filters/**, src/common/utils/**, src/main.ts  
**Arquivos permitidos para alteração:** common e registro global do filter  
**Arquivos que não devem ser alterados:** feature business rules  
**Requisitos funcionais:** Envelope de sucesso; meta paginada; ExceptionFilter global.  
**Regras de negócio:** Mapear 400/401/403/404/409/500 conforme especificação.  
**Regras técnicas:** timestamp ISO, path real, sem stack trace em produção.  
**Entrada esperada:** exceptions Nest/TypeORM conhecidas.  
**Saída esperada:** resposta de erro uniforme.  
**Cenários de erro:** erro inesperado vira 500 sem detalhe interno.  
**Critérios de aceite:** testes demonstram formatos e ausência de stack.  
**Testes obrigatórios:** unitários do filter e paginação.  
**Comandos de validação:** `npm run build; npm test -- --runInBand`  
**Definition of Done:** nenhuma exception sensível vaza.  
**Possíveis bloqueios:** nenhum

## T009 — Implementar módulo Help

**TASK-ID:** T009  
**Objetivo:** Implementar módulo Help.  
**Agente responsável:** Backend Feature Agent  
**Dependências:** T008  
**Contexto necessário:** Rota pública simples para confirmar disponibilidade da API.  
**Arquivos esperados:** src/help/**, src/app.module.ts  
**Arquivos permitidos para alteração:** help module e import no app  
**Arquivos que não devem ser alterados:** database healthcheck, auth, outras features  
**Requisitos funcionais:** GET `/api/v1/help` retorna 200 envelope com name/status/version/timestamp.  
**Regras de negócio:** Somente esse endpoint no módulo Help.  
**Regras técnicas:** Sem consulta ao banco.  
**Entrada esperada:** GET sem body.  
**Saída esperada:** `data.status = running` e timestamp ISO.  
**Cenários de erro:** nenhum cenário de domínio.  
**Critérios de aceite:** `/help` 200; `/help/health` 404.  
**Testes obrigatórios:** unitário service/controller + integração HTTP.  
**Comandos de validação:** `npm test -- help --runInBand; npm run test:integration`  
**Definition of Done:** rota pública documentável e sem health.  
**Possíveis bloqueios:** nenhum

## T010 — Implementar foundation de autenticação JWT

**TASK-ID:** T010  
**Objetivo:** Implementar foundation de autenticação JWT.  
**Agente responsável:** Auth & RBAC Agent  
**Dependências:** T003,T004,T008  
**Contexto necessário:** Login e validação de token sem permissions embutidas.  
**Arquivos esperados:** src/auth/** exceto authorization.service, src/common/auth/decorators/public.decorator.ts, src/common/auth/guards/jwt-auth.guard.ts  
**Arquivos permitidos para alteração:** auth foundation e public decorator/guard  
**Arquivos que não devem ser alterados:** feature controllers, permission guard  
**Requisitos funcionais:** POST `/auth/login`; JWT 1h; valida user ativo; email normalizado.  
**Regras de negócio:** inativo não autentica; payload apenas userId/username.  
**Regras técnicas:** JWT secret env; Bearer; hash compare depende de C-005.  
**Entrada esperada:** email,password.  
**Saída esperada:** accessToken/tokenType/expiresIn/user envelope.  
**Cenários de erro:** credencial inválida -> 401; inativo -> 401 no login.  
**Critérios de aceite:** token não contém roles/permissions/password.  
**Testes obrigatórios:** login válido, senha inválida, user inexistente, inativo.  
**Comandos de validação:** `npm test -- auth --runInBand; npm run build`  
**Definition of Done:** segredo nunca hardcoded.  
**Possíveis bloqueios:** C-005.

## T011 — Implementar AuthorizationService, @Permissions e PermissionsGuard

**TASK-ID:** T011  
**Objetivo:** Implementar AuthorizationService, @Permissions e PermissionsGuard.  
**Agente responsável:** Auth & RBAC Agent  
**Dependências:** T005,T010  
**Contexto necessário:** Autorização precisa refletir banco em cada request protegido.  
**Arquivos esperados:** src/auth/authorization.service.ts, src/common/auth/decorators/permissions.decorator.ts, src/common/auth/guards/permissions.guard.ts, auth module wiring  
**Arquivos permitidos para alteração:** auth/rbac files  
**Arquivos que não devem ser alterados:** feature business rules  
**Requisitos funcionais:** Resolver permissions efetivas sem duplicação e negar acesso ausente.  
**Regras de negócio:** union das permissions de todas roles; usuário inativo recebe 403 mesmo com JWT válido.  
**Regras técnicas:** query eficiente; sem HTTP interno; sem cache que preserve permission removida.  
**Entrada esperada:** userId e metadata de permissions.  
**Saída esperada:** allow/403.  
**Cenários de erro:** user ausente/inativo -> 403; permission ausente -> 403.  
**Critérios de aceite:** mudança no banco afeta request seguinte.  
**Testes obrigatórios:** USER/ANALYST/AUDITOR/ADMIN e remoção dinâmica de permission.  
**Comandos de validação:** `npm test -- authorization --runInBand; npm run build`  
**Definition of Done:** guard não depende de permission armazenada no JWT.  
**Possíveis bloqueios:** nenhum

## T012 — Implementar GET /auth/me

**TASK-ID:** T012  
**Objetivo:** Implementar GET /auth/me.  
**Agente responsável:** Auth & RBAC Agent  
**Dependências:** T011  
**Contexto necessário:** Retornar identidade autenticada com roles e permissions atuais.  
**Arquivos esperados:** src/auth/auth.controller.ts, src/auth/auth.service.ts, auth DTO/mappers  
**Arquivos permitidos para alteração:** auth files  
**Arquivos que não devem ser alterados:** users controller  
**Requisitos funcionais:** GET `/auth/me` autenticado, sem permission específica.  
**Regras de negócio:** retorna id, username, fullName, email, roles, permissions deduplicadas.  
**Regras técnicas:** não retornar passwordHash.  
**Entrada esperada:** JWT válido.  
**Saída esperada:** envelope `data`.  
**Cenários de erro:** sem/invalid token 401; inativo 403.  
**Critérios de aceite:** permissions refletem banco atual.  
**Testes obrigatórios:** integration me válido/sem token/inativo.  
**Comandos de validação:** `npm test -- auth --runInBand; npm run test:integration`  
**Definition of Done:** contrato Swagger-ready.  
**Possíveis bloqueios:** C-005 apenas porque auth foundation depende de hash.

## T013 — Implementar leitura e atualização controlada de Permissions

**TASK-ID:** T013  
**Objetivo:** Implementar leitura e atualização controlada de Permissions.  
**Agente responsável:** Backend Feature Agent  
**Dependências:** T008,T011  
**Contexto necessário:** Permissions são infraestrutura controlada, não CRUD livre.  
**Arquivos esperados:** src/permissions/** exceto entities  
**Arquivos permitidos para alteração:** permissions dto/controller/service/module  
**Arquivos que não devem ser alterados:** permission entity/schema, POST/DELETE endpoints  
**Requisitos funcionais:** GET list, GET by id, PATCH description.  
**Regras de negócio:** resource/action/code imutáveis; no create/delete.  
**Regras técnicas:** paginação/filtros resource/action/search; DTO rejeita campos extras.  
**Entrada esperada:** query paginada; id; `{description}`.  
**Saída esperada:** PermissionResponseDto em envelope.  
**Cenários de erro:** 404 id inexistente; 400 campo proibido; 403 sem permission.  
**Critérios de aceite:** POST e DELETE retornam 404 por inexistência de rota; PATCH com code é 400.  
**Testes obrigatórios:** unit + integration de list/get/update e proteção.  
**Comandos de validação:** `npm test -- permissions --runInBand; npm run test:integration`  
**Definition of Done:** nenhum caminho modifica identificadores.  
**Possíveis bloqueios:** nenhum

## T014 — Implementar CRUD de Roles com proteção de roles do sistema

**TASK-ID:** T014  
**Objetivo:** Implementar CRUD de Roles com proteção de roles do sistema.  
**Agente responsável:** Backend Feature Agent  
**Dependências:** T008,T011,T005  
**Contexto necessário:** CRUD de roles customizadas e proteção das quatro roles nativas.  
**Arquivos esperados:** src/roles/** exceto entities e associação específica da T016  
**Arquivos permitidos para alteração:** role dto/controller/service/module  
**Arquivos que não devem ser alterados:** entities/migrations/auth  
**Requisitos funcionais:** POST, GET list, GET id, PATCH, DELETE.  
**Regras de negócio:** system role: só description editável; não renomear; não excluir. custom role: rename permitido se válido; DELETE bloqueado 409 se associada a users.  
**Regras técnicas:** uppercase; unique name; transação na criação se permissionIds fornecido.  
**Entrada esperada:** CreateRoleDto/UpdateRoleDto/query.  
**Saída esperada:** RoleResponseDto.  
**Cenários de erro:** 404, 409 duplicidade/em uso, 400 tentativa de nome em system role.  
**Critérios de aceite:** ADMIN/USER/ANALYST/AUDITOR protegidas; custom role CRUD funciona.  
**Testes obrigatórios:** nome duplicado, proteção system, exclusão em uso.  
**Comandos de validação:** `npm test -- roles --runInBand; npm run test:integration`  
**Definition of Done:** sem alterar matriz das system roles por PATCH.  
**Possíveis bloqueios:** nenhum

## T015 — Implementar listagem/busca de Roles com paginação e permissions opcionais

**TASK-ID:** T015  
**Objetivo:** Implementar listagem/busca de Roles com paginação e permissions opcionais.  
**Agente responsável:** Backend Feature Agent  
**Dependências:** T014  
**Contexto necessário:** Consolidar consulta sem N+1.  
**Arquivos esperados:** src/roles/dto/**, src/roles/roles.service.ts, src/roles/roles.controller.ts  
**Arquivos permitidos para alteração:** consultas de roles  
**Arquivos que não devem ser alterados:** auth/schema  
**Requisitos funcionais:** GET `/roles` com page/limit/search/includePermissions; GET id.  
**Regras de negócio:** roles nativas e custom aparecem.  
**Regras técnicas:** whitelist de ordenação se houver; evitar N+1.  
**Entrada esperada:** query.  
**Saída esperada:** envelope paginado.  
**Cenários de erro:** query inválida 400; id 404.  
**Critérios de aceite:** meta consistente e includePermissions previsível.  
**Testes obrigatórios:** filtros/paginação/404.  
**Comandos de validação:** `npm test -- roles --runInBand`  
**Definition of Done:** consulta não executa uma query por role para permissions.  
**Possíveis bloqueios:** C-010 apenas se valores de paginação forem alterados.

## T016 — Implementar associação Role ↔ Permission

**TASK-ID:** T016  
**Objetivo:** Implementar associação Role ↔ Permission.  
**Agente responsável:** Backend Feature Agent  
**Dependências:** T013,T014  
**Contexto necessário:** ADMIN gerencia privilege usando `update:role`.  
**Arquivos esperados:** src/roles/dto/**, src/roles/roles.controller.ts, src/roles/roles.service.ts  
**Arquivos permitidos para alteração:** somente endpoints/service de associação  
**Arquivos que não devem ser alterados:** permission identifiers, auth mapping global  
**Requisitos funcionais:** POST adiciona; PUT substitui; DELETE remove uma permission.  
**Regras de negócio:** PUT não aceita vazio; ids devem existir; associação duplicada -> 409.  
**Regras técnicas:** PUT transacional; POST pode inserir várias de forma atômica.  
**Entrada esperada:** permissionIds; roleId; permissionId.  
**Saída esperada:** 200/204 conforme operação e contrato.  
**Cenários de erro:** 404 role/permission; 400 array vazio PUT; 409 duplicação.  
**Critérios de aceite:** permission removida deixa de autorizar no request seguinte.  
**Testes obrigatórios:** assign/replace/remove, rollback em id inválido, empty PUT.  
**Comandos de validação:** `npm test -- roles --runInBand; npm run test:integration`  
**Definition of Done:** guard das rotas exige `update:role`.  
**Possíveis bloqueios:** C-008 não se aplica: trata role↔permission, não user ADMIN.

## T017 — Implementar leitura de Users e endpoint access

**TASK-ID:** T017  
**Objetivo:** Implementar leitura de Users e endpoint access.  
**Agente responsável:** Backend Feature Agent  
**Dependências:** T008,T011,T005  
**Contexto necessário:** Consulta central do projeto.  
**Arquivos esperados:** src/users/dto/**, src/users/users.controller.ts, src/users/users.service.ts, src/users/users.module.ts  
**Arquivos permitidos para alteração:** users read paths  
**Arquivos que não devem ser alterados:** user creation/update/delete  
**Requisitos funcionais:** GET list, GET id, GET `/:userId/access`.  
**Regras de negócio:** access retorna roles e permissions efetivas deduplicadas; inativos permanecem consultáveis administrativamente.  
**Regras técnicas:** filtros page/limit/search/isActive/role/sortBy/order; evitar N+1; nunca retornar passwordHash.  
**Entrada esperada:** query/id.  
**Saída esperada:** UserResponseDto/UserAccessResponseDto.  
**Cenários de erro:** 400 query, 404 id, 403 auth.  
**Critérios de aceite:** múltiplas roles produzem union sem duplicatas.  
**Testes obrigatórios:** listar, filtrar, 404, access, no passwordHash.  
**Comandos de validação:** `npm test -- users --runInBand; npm run test:integration`  
**Definition of Done:** query eficiente e response mapper explícito.  
**Possíveis bloqueios:** C-010 somente convenção de paginação.

## T018 — Implementar criação transacional de User

**TASK-ID:** T018  
**Objetivo:** Implementar criação transacional de User.  
**Agente responsável:** Backend Feature Agent  
**Dependências:** T014,T017  
**Contexto necessário:** POST users cria user e vínculos de role atomicamente.  
**Arquivos esperados:** src/users/dto/create-user.dto.ts, src/users/users.controller.ts, src/users/users.service.ts  
**Arquivos permitidos para alteração:** create user path  
**Arquivos que não devem ser alterados:** entities/migrations/auth  
**Requisitos funcionais:** POST `/users`.  
**Regras de negócio:** username/email únicos e normalizados; uma ou mais roles; password hash; roles existentes.  
**Regras técnicas:** transação TypeORM QueryRunner/manager; unique constraint como última defesa.  
**Entrada esperada:** username,fullName,email,password,roleIds.  
**Saída esperada:** 201 + UserResponseDto sem passwordHash.  
**Cenários de erro:** 400 validação/roleIds; 404 ou 400 role inexistente conforme contrato consolidado; 409 username/email duplicado.  
**Critérios de aceite:** falha em associação reverte user; roleIds duplicado rejeitado.  
**Testes obrigatórios:** happy path, duplicidades, role inexistente, rollback, hash não exposto.  
**Comandos de validação:** `npm test -- users --runInBand; npm run test:integration`  
**Definition of Done:** não persistir password plain.  
**Possíveis bloqueios:** C-005 e C-007.

## T019 — Implementar atualização de User e status

**TASK-ID:** T019  
**Objetivo:** Implementar atualização de User e status.  
**Agente responsável:** Backend Feature Agent  
**Dependências:** T017  
**Contexto necessário:** Atualizar dados administrativos sem alterar password.  
**Arquivos esperados:** src/users/dto/update-user.dto.ts, update-user-status.dto.ts, users controller/service  
**Arquivos permitidos para alteração:** update/status paths  
**Arquivos que não devem ser alterados:** password endpoint e delete  
**Requisitos funcionais:** PATCH `/users/:id`; PATCH `/users/:id/status`.  
**Regras de negócio:** PATCH geral não altera password; username/email normalizados; inativo permanece no banco e com associações.  
**Regras técnicas:** não aceitar campos extra; updatedAt automático.  
**Entrada esperada:** campos parciais; `{isActive}`.  
**Saída esperada:** UserResponseDto.  
**Cenários de erro:** 404; 409 duplicidade; 400 campo inválido.  
**Critérios de aceite:** desativado não faz login e token antigo recebe 403.  
**Testes obrigatórios:** update, duplicate, status off/on, auth effect.  
**Comandos de validação:** `npm test -- users --runInBand; npm run test:integration`  
**Definition of Done:** passwordHash não muda.  
**Possíveis bloqueios:** C-008 para regras do último ADMIN ao desativar.

## T020 — Implementar alteração de password

**TASK-ID:** T020  
**Objetivo:** Implementar alteração de password.  
**Agente responsável:** Backend Feature Agent  
**Dependências:** T010,T017  
**Contexto necessário:** Endpoint existe no documento-base, mas sua intenção precisa ser fechada.  
**Arquivos esperados:** src/users/dto/update-user-password.dto.ts, users controller/service  
**Arquivos permitidos para alteração:** password path  
**Arquivos que não devem ser alterados:** outros updates  
**Requisitos funcionais:** PATCH `/users/:userId/password`.  
**Regras de negócio:** A definir: self-change, admin reset ou ambos.  
**Regras técnicas:** sempre hash antes de persistir; nunca logar password.  
**Entrada esperada:** contrato depende da decisão C-009.  
**Saída esperada:** 204 ou envelope conforme decisão final.  
**Cenários de erro:** current password incorreto/sem autorização conforme decisão.  
**Critérios de aceite:** não pode ser finalizada antes de definir semântica.  
**Testes obrigatórios:** serão definidos após decisão.  
**Comandos de validação:** `npm test -- users --runInBand`  
**Definition of Done:** BLOCKED até C-005 e C-009 resolvidas.  
**Possíveis bloqueios:** C-005,C-009

## T021 — Implementar DELETE lógico de User

**TASK-ID:** T021  
**Objetivo:** Implementar DELETE lógico de User.  
**Agente responsável:** Backend Feature Agent  
**Dependências:** T017  
**Contexto necessário:** DELETE não pode remover fisicamente o registro.  
**Arquivos esperados:** user entity se necessário, migration se necessário, users controller/service  
**Arquivos permitidos para alteração:** somente mudanças necessárias ao soft delete  
**Arquivos que não devem ser alterados:** hard delete  
**Requisitos funcionais:** DELETE `/users/:userId`.  
**Regras de negócio:** user continua administrativamente rastreável e associações permanecem.  
**Regras técnicas:** mecanismo exato depende de C-006.  
**Entrada esperada:** userId.  
**Saída esperada:** 204.  
**Cenários de erro:** 404; possível 409/403 para último ADMIN após C-008.  
**Critérios de aceite:** nenhum DELETE físico em users.  
**Testes obrigatórios:** registro e associações permanecem; login impossível.  
**Comandos de validação:** `npm test -- users --runInBand; npm run test:integration`  
**Definition of Done:** BLOCKED até mecanismo e regra ADMIN definidos.  
**Possíveis bloqueios:** C-006,C-008

## T022 — Implementar associação User ↔ Role

**TASK-ID:** T022  
**Objetivo:** Implementar associação User ↔ Role.  
**Agente responsável:** Backend Feature Agent  
**Dependências:** T014,T017  
**Contexto necessário:** Gerenciamento de membership protegido por `update:user`.  
**Arquivos esperados:** src/users/dto/assign-user-roles.dto.ts, replace-user-roles.dto.ts, users controller/service  
**Arquivos permitidos para alteração:** associação user-role  
**Arquivos que não devem ser alterados:** role-permission  
**Requisitos funcionais:** POST adiciona; PUT substitui; DELETE remove uma role.  
**Regras de negócio:** PUT não aceita vazio; user deve permanecer com ao menos uma role; ids existentes; duplicidade 409.  
**Regras técnicas:** PUT transacional.  
**Entrada esperada:** roleIds/userId/roleId.  
**Saída esperada:** 200/204.  
**Cenários de erro:** 404; 400 vazio; 409 duplicação; regra ADMIN depende C-008.  
**Critérios de aceite:** membership altera permission efetiva no request seguinte.  
**Testes obrigatórios:** add/replace/remove, rollback, empty PUT, last role.  
**Comandos de validação:** `npm test -- users --runInBand; npm run test:integration`  
**Definition of Done:** não permitir user sem role.  
**Possíveis bloqueios:** C-008 para remoção/substituição envolvendo ADMIN.

## T023 — Completar Swagger/OpenAPI

**TASK-ID:** T023  
**Objetivo:** Completar Swagger/OpenAPI.  
**Agente responsável:** Backend Feature Agent  
**Dependências:** T009,T012,T013,T014,T016,T017,T018,T019,T020,T021,T022  
**Contexto necessário:** Documentação deve refletir apenas rotas realmente implementadas.  
**Arquivos esperados:** src/main.ts e decorators Swagger nos controllers/DTOs  
**Arquivos permitidos para alteração:** documentação OpenAPI  
**Arquivos que não devem ser alterados:** mudar comportamento para caber na documentação  
**Requisitos funcionais:** `/api/docs`; tags Auth/Help/Users/Roles/Permissions; Bearer auth; schemas; status/errors/examples.  
**Regras de negócio:** não documentar health, POST/DELETE permission.  
**Regras técnicas:** Swagger module/config.  
**Entrada esperada:** contratos finalizados.  
**Saída esperada:** OpenAPI navegável.  
**Cenários de erro:** nenhum.  
**Critérios de aceite:** todas rotas possuem DTO e respostas documentadas.  
**Testes obrigatórios:** smoke de geração do documento OpenAPI.  
**Comandos de validação:** `npm run build; npm test -- swagger --runInBand`  
**Definition of Done:** documento corresponde ao runtime.  
**Possíveis bloqueios:** herda C-005,C-006,C-007,C-008,C-009 via tasks dependentes.

## T024 — Testes unitários de Common/Auth/RBAC

**TASK-ID:** T024  
**Objetivo:** Testes unitários de Common/Auth/RBAC.  
**Agente responsável:** Test Agent  
**Dependências:** T008,T011,T012  
**Contexto necessário:** Controlar comportamento transversal.  
**Arquivos esperados:** src/common/**/*.spec.ts, src/auth/**/*.spec.ts  
**Arquivos permitidos para alteração:** tests  
**Arquivos que não devem ser alterados:** produção  
**Requisitos funcionais:** cobrir filter, auth service, JWT, authorization service, guards.  
**Regras de negócio:** matriz RBAC e inatividade.  
**Regras técnicas:** mocks de Repository com interfaces mínimas.  
**Entrada esperada:** implementações auth/common.  
**Saída esperada:** suite unitária.  
**Cenários de erro:** happy + negativos.  
**Critérios de aceite:** todos cenários mínimos do documento-base para auth/authorization.  
**Testes obrigatórios:** é a própria task.  
**Comandos de validação:** `npm test -- --runInBand`  
**Definition of Done:** sem testes tautológicos.  
**Possíveis bloqueios:** C-005 para login.

## T025 — Testes unitários de Permissions e Roles

**TASK-ID:** T025  
**Objetivo:** Testes unitários de Permissions e Roles.  
**Agente responsável:** Test Agent  
**Dependências:** T013,T014,T016  
**Contexto necessário:** Cobrir regras de domínio e proteção de sistema.  
**Arquivos esperados:** src/permissions/**/*.spec.ts, src/roles/**/*.spec.ts  
**Arquivos permitidos para alteração:** tests  
**Arquivos que não devem ser alterados:** produção  
**Requisitos funcionais:** list/get/update permission; CRUD role; associations.  
**Regras de negócio:** permission immutable; system role protected; PUT nonempty.  
**Regras técnicas:** mocks repository/transaction manager.  
**Entrada esperada:** services/controllers.  
**Saída esperada:** suite unitária.  
**Cenários de erro:** 404/409/400/403 por camada adequada.  
**Critérios de aceite:** branchs críticas cobertas.  
**Testes obrigatórios:** é a própria task.  
**Comandos de validação:** `npm test -- permissions roles --runInBand`  
**Definition of Done:** testes demonstram regras, não detalhes internos irrelevantes.  
**Possíveis bloqueios:** nenhum

## T026 — Testes unitários de Users

**TASK-ID:** T026  
**Objetivo:** Testes unitários de Users.  
**Agente responsável:** Test Agent  
**Dependências:** T017,T018,T019,T020,T021,T022  
**Contexto necessário:** Cobrir criação, consulta, atualização, delete, password e membership.  
**Arquivos esperados:** src/users/**/*.spec.ts  
**Arquivos permitidos para alteração:** tests  
**Arquivos que não devem ser alterados:** produção  
**Requisitos funcionais:** todos flows Users.  
**Regras de negócio:** sem role zero; soft delete; admin safety após definição; password semantics.  
**Regras técnicas:** mock transações e repositories.  
**Entrada esperada:** users module.  
**Saída esperada:** suite unitária.  
**Cenários de erro:** duplicidade, inexistência, rollback, authorization-adjacent rules.  
**Critérios de aceite:** passwordHash nunca exposto.  
**Testes obrigatórios:** é a própria task.  
**Comandos de validação:** `npm test -- users --runInBand`  
**Definition of Done:** suite completa.  
**Possíveis bloqueios:** C-005,C-006,C-007,C-008,C-009

## T027 — Integração Auth e RBAC com PostgreSQL

**TASK-ID:** T027  
**Objetivo:** Integração Auth e RBAC com PostgreSQL.  
**Agente responsável:** Test Agent  
**Dependências:** T006,T007,T011,T012  
**Contexto necessário:** Validar banco real, JWT e alteração dinâmica de permission.  
**Arquivos esperados:** test/integration/auth-rbac.e2e-spec.ts, helpers/fixtures  
**Arquivos permitidos para alteração:** integration tests/fixtures  
**Arquivos que não devem ser alterados:** produção  
**Requisitos funcionais:** login, token, me, 401/403, matriz roles.  
**Regras de negócio:** USER não update; ANALYST update; AUDITOR read permission; ADMIN acessa admin endpoints.  
**Regras técnicas:** Supertest + banco isolado de teste + migrations/seed.  
**Entrada esperada:** app real.  
**Saída esperada:** suite integração.  
**Cenários de erro:** token missing/invalid/expired, inactive.  
**Critérios de aceite:** permissions consultadas do banco a cada request.  
**Testes obrigatórios:** é a própria task.  
**Comandos de validação:** `npm run test:integration`  
**Definition of Done:** dados de teste isolados e reproduzíveis.  
**Possíveis bloqueios:** C-005

## T028 — Integração Permissions e Roles

**TASK-ID:** T028  
**Objetivo:** Integração Permissions e Roles.  
**Agente responsável:** Test Agent  
**Dependências:** T013,T014,T016,T025  
**Contexto necessário:** Validar contratos HTTP e constraints reais.  
**Arquivos esperados:** test/integration/permissions-roles.e2e-spec.ts  
**Arquivos permitidos para alteração:** integration tests  
**Arquivos que não devem ser alterados:** produção  
**Requisitos funcionais:** permission list/get/patch; role CRUD; role-permission links.  
**Regras de negócio:** sem POST/DELETE permissions; system roles protegidas.  
**Regras técnicas:** Supertest + PostgreSQL.  
**Entrada esperada:** app real autenticada como perfis adequados.  
**Saída esperada:** suite integração.  
**Cenários de erro:** 400/403/404/409.  
**Critérios de aceite:** transações rollback em falha.  
**Testes obrigatórios:** é a própria task.  
**Comandos de validação:** `npm run test:integration`  
**Definition of Done:** rotas proibidas não existem.  
**Possíveis bloqueios:** nenhum

## T029 — Integração Users

**TASK-ID:** T029  
**Objetivo:** Integração Users.  
**Agente responsável:** Test Agent  
**Dependências:** T017,T018,T019,T020,T021,T022,T026  
**Contexto necessário:** Validar fluxo completo user + membership + access.  
**Arquivos esperados:** test/integration/users.e2e-spec.ts  
**Arquivos permitidos para alteração:** integration tests  
**Arquivos que não devem ser alterados:** produção  
**Requisitos funcionais:** create/list/filter/get/access/update/status/password/delete/roles.  
**Regras de negócio:** regras finais de C-006/7/8/9.  
**Regras técnicas:** Supertest + PostgreSQL real de teste.  
**Entrada esperada:** app real.  
**Saída esperada:** suite integração.  
**Cenários de erro:** 400/401/403/404/409.  
**Critérios de aceite:** transações e constraints reais validadas.  
**Testes obrigatórios:** é a própria task.  
**Comandos de validação:** `npm run test:integration`  
**Definition of Done:** suite completa sem depender de ordem global entre testes.  
**Possíveis bloqueios:** C-005,C-006,C-007,C-008,C-009

## T030 — Containerizar API e PostgreSQL

**TASK-ID:** T030  
**Objetivo:** Containerizar API e PostgreSQL.  
**Agente responsável:** Platform & Database Agent  
**Dependências:** T006,T007,T009  
**Contexto necessário:** Ambiente reproduzível via Docker Compose.  
**Arquivos esperados:** Dockerfile, docker-compose.yml, .dockerignore, scripts necessários  
**Arquivos permitidos para alteração:** infra Docker  
**Arquivos que não devem ser alterados:** regras de negócio  
**Requisitos funcionais:** subir api + postgres.  
**Regras de negócio:** nenhuma.  
**Regras técnicas:** volume persistente; postgres healthcheck; API usa env; migrations/seed executáveis de forma explícita.  
**Entrada esperada:** env local.  
**Saída esperada:** `docker compose up --build` funcional.  
**Cenários de erro:** API não deve mascarar falha de migration.  
**Critérios de aceite:** help responde após ambiente subir e schema inicializado.  
**Testes obrigatórios:** smoke manual/CI container.  
**Comandos de validação:** `docker compose build; docker compose up -d; docker compose ps`  
**Definition of Done:** não incluir segredo real na imagem.  
**Possíveis bloqueios:** C-005 para seed completo.

## T031 — Criar pipeline CI de qualidade

**TASK-ID:** T031  
**Objetivo:** Criar pipeline CI de qualidade.  
**Agente responsável:** Platform & Database Agent  
**Dependências:** T024,T025,T026,T027,T028,T029,T030  
**Contexto necessário:** CI é gate do trabalho dos agentes.  
**Arquivos esperados:** .github/workflows/ci.yml ou pipeline equivalente existente  
**Arquivos permitidos para alteração:** CI config  
**Arquivos que não devem ser alterados:** produção  
**Requisitos funcionais:** install -> lint -> build -> unit -> integration.  
**Regras de negócio:** nenhuma.  
**Regras técnicas:** PostgreSQL service/container de teste; `npm ci` com lockfile.  
**Entrada esperada:** branch/PR.  
**Saída esperada:** status pass/fail.  
**Cenários de erro:** qualquer etapa falha bloqueia merge.  
**Critérios de aceite:** não existe `continue-on-error` para gates.  
**Testes obrigatórios:** pipeline executa suites reais.  
**Comandos de validação:** `npm ci; npm run lint; npm run build; npm test -- --runInBand; npm run test:integration`  
**Definition of Done:** merge condicionado a verde.  
**Possíveis bloqueios:** herda blockers de suites ainda não implementáveis.

## T032 — Validação final dos critérios de aceite

**TASK-ID:** T032  
**Objetivo:** Validação final dos critérios de aceite.  
**Agente responsável:** Review Agent  
**Dependências:** T023,T031  
**Contexto necessário:** Gate final antes de declarar MVP implementado.  
**Arquivos esperados:** read-only; relatório em docs/review-final.md  
**Arquivos permitidos para alteração:** somente relatório  
**Arquivos que não devem ser alterados:** produção  
**Requisitos funcionais:** verificar escopo completo, rotas, RBAC, dados, docs, tests e Docker.  
**Regras de negócio:** comparar literalmente com decisões finais.  
**Regras técnicas:** executar todos comandos de validação.  
**Entrada esperada:** branch integrada.  
**Saída esperada:** APPROVED ou CHANGES_REQUESTED.  
**Cenários de erro:** qualquer divergência gera finding com task de correção.  
**Critérios de aceite:** todos critérios globais e específicos verdes.  
**Testes obrigatórios:** executar toda suite.  
**Comandos de validação:** `npm ci; npm run lint; npm run build; npm test -- --runInBand; npm run test:integration; docker compose build`  
**Definition of Done:** nenhum blocker aberto; documentação e runtime consistentes.  
**Possíveis bloqueios:** todos BLOCKING_DECISION devem estar resolvidos.


---

# 8. DEFINITION OF DONE GLOBAL

Toda task de implementação somente pode ir para DONE quando:

- [ ] dependências estão DONE;
- [ ] código compila;
- [ ] lint passa;
- [ ] testes anteriores continuam passando;
- [ ] testes novos obrigatórios foram adicionados;
- [ ] contrato HTTP foi respeitado;
- [ ] regras de negócio foram respeitadas;
- [ ] erros definidos foram tratados;
- [ ] `passwordHash`, password e token não vazam;
- [ ] nenhuma mudança de schema existe sem migration;
- [ ] Swagger foi atualizado quando a task altera contrato público;
- [ ] não há TODO pertencente ao requisito atual;
- [ ] não houve alteração fora do scope sem `SCOPE_CHANGE_REQUEST`;
- [ ] Reviewer retornou `APPROVED`;
- [ ] CI aplicável está verde.

---

# 9. ESTRATÉGIA DE TESTES

## Unitários

Objetivo:
- validar regras de Service;
- validar guards/decorators;
- validar mappers/filters;
- simular erros de Repository;
- validar normalização;
- validar transações em nível de orchestration.

Não usar unit test para provar constraints reais do PostgreSQL.

## Integração

Usar Nest app real + PostgreSQL de teste + migrations + Supertest.

Cobrir:
- rotas e status HTTP;
- ValidationPipe;
- JWT;
- RBAC;
- unique constraints;
- composite PK;
- rollback transacional;
- seed idempotente;
- inatividade;
- remoção de permission refletida no request seguinte;
- ausência de passwordHash;
- ausência de rotas proibidas.

## Concorrência/race conditions

Mínimo obrigatório:
- duas tentativas concorrentes de username/email iguais: somente uma deve persistir;
- associação duplicada concorrente deve ser barrada por PK/unique no banco;
- Service deve converter erro de constraint no HTTP apropriado.

## Casos de borda

- ids inexistentes;
- arrays duplicados;
- `PUT []`;
- string com espaços antes/depois;
- email/username em caixa diferente;
- role system com tentativa de rename/delete;
- permission PATCH com `code`, `resource` ou `action`;
- user com múltiplas roles com permission duplicada;
- user inativo usando JWT já emitido.

---

# 10. REVIEWER AGENT — CHECKLIST

## Arquitetura
- Controller chama apenas Service?
- Service concentra regra de negócio?
- Persistência usa TypeORM Repository?
- Prisma não foi introduzido?
- Dependências entre módulos evitam ciclos?

## Regras de negócio
- user permanece com >=1 role?
- system roles protegidas?
- permission identifiers imutáveis?
- permissions efetivas são união deduplicada?
- `PUT` de associação rejeita vazio?

## Banco
- migrations reproduzem schema?
- `synchronize:false`?
- constraints e PKs compostas existem?
- transaction rollback foi preservado?
- seed é idempotente?

## HTTP/API
- prefixo `/api/v1`?
- envelope correto?
- 204 sem body?
- status 400/401/403/404/409 coerentes?
- nenhuma rota fora do escopo?

## Segurança
- password não logada?
- passwordHash não retornado?
- JWT secret somente env?
- stack trace não vaza?
- campos extras rejeitados?

## Autenticação
- somente access token?
- 1h?
- payload sem permissions?
- inativo não autentica?

## Autorização
- permissions consultadas no banco?
- guards aplicam códigos corretos?
- `/auth/me` autenticado sem permission específica?
- associação user-role usa update:user?
- associação role-permission usa update:role?

## Qualidade
- normalização consistente?
- sem duplicação desnecessária?
- sem TODO do escopo?
- logs úteis e não sensíveis?

## Testes
- happy + negativos?
- unit + integração?
- transações?
- constraints?
- alterações não quebraram testes prévios?

## Performance
- listagens sem N+1 evidente?
- filtros/ordenação usam whitelist?
- queries de permissions evitam uma consulta por role quando possível?

Resultado:

```text
REVIEW_RESULT
Task:
Status: APPROVED | CHANGES_REQUESTED
Findings:
- ...
```

---

# 11. FLUXO DE EXECUÇÃO AUTÔNOMA

Estados:

```text
TODO
READY
IN_PROGRESS
REVIEW
BLOCKED
FAILED
DONE
```

Transições:

- `TODO -> READY`: todas dependências DONE e nenhum blocker aplicável.
- `READY -> IN_PROGRESS`: Orchestrator delega a task.
- `IN_PROGRESS -> REVIEW`: implementação + validações locais passaram.
- `IN_PROGRESS -> BLOCKED`: requisito impeditivo não definido.
- `IN_PROGRESS -> FAILED`: erro técnico após tentativas permitidas, sem blocker de requisito.
- `REVIEW -> IN_PROGRESS`: Reviewer solicita correções.
- `REVIEW -> DONE`: Reviewer APPROVED e gates passam.
- `BLOCKED -> READY`: decisão humana registrada e dependências continuam DONE.
- `FAILED -> READY`: causa corrigida ou task replanejada pelo Orchestrator.

Loop:

```text
selecionar TASK READY
↓
confirmar dependências
↓
delegar ao owner
↓
implementar
↓
executar lint/build/testes da task
↓
enviar ao Reviewer
↓
corrigir findings
↓
reexecutar gates
↓
marcar DONE
↓
liberar dependentes
```

---

# 12. PROTOCOLO DE BLOQUEIO

Quando faltar uma decisão necessária:

```text
BLOCKED_REQUIREMENT

Task:
Problema:
Regra relacionada:
Por que impede a implementação:
Alternativas identificadas:
Decisão necessária:
Arquivos potencialmente afetados:
Testes potencialmente afetados:
```

O agente:
- não escolhe alternativa;
- não altera contrato para contornar;
- não marca DONE;
- devolve a task ao Orchestrator em `BLOCKED`.

---

# 13. ESTADO PERSISTENTE

Arquivo sugerido: `tasks/state.json`

```json
{
  "schemaVersion": 1,
  "currentPhase": "PHASE_0",
  "tasks": {
    "T001": {
      "status": "TODO",
      "branch": null,
      "commit": null,
      "review": null,
      "lastValidation": null
    }
  },
  "completedTasks": [],
  "runningTasks": [],
  "blockedTasks": [],
  "failedTasks": [],
  "lastSuccessfulValidation": null,
  "tests": {
    "unit": "unknown",
    "integration": "unknown"
  },
  "build": "unknown",
  "lint": "unknown",
  "databaseMigration": "unknown",
  "seed": "unknown",
  "docker": "unknown"
}
```

Atualização de estado deve ser atômica e acontecer somente após a transição realmente ocorrer.

---

# 14. OWNERSHIP

```text
Platform & Database Agent
- src/config/**
- src/database/**
- src/**/entities/**
- Dockerfile
- docker-compose.yml
- .dockerignore
- pipeline CI quando delegado

Auth & RBAC Agent
- src/auth/**
- src/common/auth/**

Backend Feature Agent
- src/help/**
- src/users/** exceto entities
- src/roles/** exceto entities
- src/permissions/** exceto entities
- src/common/dto/**
- src/common/filters/** quando delegado

Test Agent
- test/**
- **/*.spec.ts

Orchestrator
- tasks/**
- AGENTS.md
- estado de execução

Review Agent
- read-only
- docs/review-*.md
```

Se dois agents precisam do mesmo arquivo, o Orchestrator serializa as tasks correspondentes ou cria `SCOPE_CHANGE_REQUEST`.

---

# 15. ESTRATÉGIA GIT

## Branch
Uma branch por task:

```text
task/T001-bootstrap-nest
task/T018-create-user
```

## Commits
Commits pequenos e relacionados à task:

```text
chore: bootstrap nest application
feat(users): create user transactionally
test(auth): cover jwt authorization flow
```

## Integração
- branch nasce da branch principal atualizada;
- task vai para review após gates locais;
- Reviewer aprova;
- CI verde;
- merge;
- branch principal é nova base para dependentes.

## Proibições
- não misturar duas tasks independentes no mesmo commit;
- não fazer force-push na branch principal;
- não editar migrations já aplicadas em ambiente compartilhado; criar migration corretiva;
- não fazer merge com CI vermelho.

---

# 16. CI COMO GATE

Pipeline obrigatório:

```text
npm ci
  ↓
npm run lint
  ↓
npm run build
  ↓
npm test -- --runInBand
  ↓
subir PostgreSQL de teste
  ↓
executar migrations
  ↓
npm run test:integration
  ↓
APPROVAL
```

Sem cobertura percentual mínima enquanto nenhuma porcentagem tiver sido aprovada.

---

# 17. ORDEM FINAL DE EXECUÇÃO

## FASE 0 — Bootstrap e foundation
- T001
- T002
- T003
- T004
- T005
- T006

## FASE 1 — Dados iniciais e plataforma
- T007 — bloqueada por C-005.
- T008
- T009

T008 e T009 podem avançar em paralelo com partes não dependentes do seed.

## FASE 2 — Auth/RBAC
- T010 — bloqueada por C-005.
- T011
- T012

## FASE 3 — Permissions e Roles
Paralelo após Auth/RBAC:
- T013
- T014
Depois:
- T015
- T016

## FASE 4 — Users
- T017
- T018 — bloqueada por C-005 e C-007.
- T019 — parcialmente bloqueada por C-008 para ADMIN.
- T020 — bloqueada por C-005 e C-009.
- T021 — bloqueada por C-006 e C-008.
- T022 — parcialmente bloqueada por C-008.

## FASE 5 — Documentação e testes
- T023
- T024
- T025
- T026
- T027
- T028
- T029

T024/T025 podem rodar em paralelo; T026 depende do fechamento de Users.  
T027/T028 podem rodar em paralelo após suas features.

## FASE 6 — Infra e gate
- T030
- T031
- T032

---

# 18. DOCUMENTAÇÃO SUGERIDA NO REPOSITÓRIO

```text
AGENTS.md
docs/
├── product-spec.md
├── decisions.md
├── architecture.md
├── database.md
├── api-contract.md
├── business-rules.md
├── authorization.md
├── testing.md
├── definition-of-done.md
└── review-final.md
tasks/
├── state.json
├── T001.md
├── T002.md
└── ...
```

Finalidade:
- `AGENTS.md`: regras de operação e guardrails.
- `product-spec.md`: escopo funcional do MVP.
- `decisions.md`: decisões humanas consolidadas e precedência.
- `architecture.md`: camadas, dependências e módulos.
- `database.md`: entities, tabelas, constraints, migration/seed.
- `api-contract.md`: endpoints, inputs, outputs e erros.
- `business-rules.md`: invariantes de users/roles/permissions.
- `authorization.md`: matriz RBAC e endpoint→permission.
- `testing.md`: estratégia, fixtures e comandos.
- `definition-of-done.md`: gates globais.
- `tasks/Txxx.md`: unidade executável.
- `state.json`: continuidade entre agentes.

---

# 19. AVALIAÇÃO DE AUTONOMIA

| Critério | Nota |
|---|---:|
| Clareza dos requisitos | 92/100 |
| Clareza das regras de negócio | 78/100 |
| Clareza arquitetural | 96/100 |
| Clareza do banco | 88/100 |
| Clareza dos contratos da API | 86/100 |
| Testabilidade | 94/100 |
| Determinismo para agentes | 80/100 |
| Autonomia possível | 78/100 |

A maior perda de autonomia não está na arquitetura, mas em cinco decisões humanas que mudam comportamento observável e testes.

## STATUS

```text
NOT_READY_FOR_AUTONOMOUS_IMPLEMENTATION
```

## Decisões realmente bloqueantes restantes

1. **Password hashing:** Argon2 ou bcrypt?
2. **Soft delete de user:** DELETE apenas define `is_active=false` ou também existe `deleted_at`?
3. **Role padrão:** se `POST /users` não receber `roleIds`, atribuir `USER` automaticamente ou rejeitar com 400?
4. **Proteção administrativa:** impedir desativação/soft-delete do último ADMIN ativo e impedir que o último ADMIN perca a role ADMIN? O próprio ADMIN pode remover sua própria role?
5. **Password endpoint:** `PATCH /users/:userId/password` é troca pelo próprio user com `currentPassword`, reset por ADMIN, ou suporta os dois fluxos?

Quando essas cinco decisões forem respondidas, as tasks bloqueadas podem ser liberadas sem replanejar o restante da arquitetura.
