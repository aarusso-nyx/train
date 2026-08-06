# Exercício Russo

Projeto em NestJS com PostgreSQL para gerenciar usuários, papéis, permissões e autenticação por senha.

O foco do projeto é montar uma base simples de autorização baseada em RBAC, onde:

- um usuário pode ter vários papéis;
- um papel pode ter várias permissões;
- o login valida usuário e senha com bcrypt;
- a API consulta tudo diretamente no banco usando uma estrutura de schema chamada `auth`.

## Visão geral

O projeto foi organizado para seguir a estrutura padrão do NestJS:

- `src/main.ts` inicia a aplicação;
- `src/app.module.ts` reúne os módulos principais;
- cada domínio fica em sua própria pasta dentro de `src/`;
- a conexão com o banco fica isolada em um serviço próprio.

Isso deixa a aplicação mais fácil de crescer, porque cada responsabilidade fica separada:

- autenticação em `src/auth`;
- usuários em `src/users`;
- papéis em `src/roles`;
- permissões em `src/permissions`;
- acesso ao banco em `src/database`;
- regras compartilhadas em `src/common`.

## Estrutura do projeto

    src/
      app.module.ts
      main.ts
      auth/
        auth.controller.ts
        auth.module.ts
        auth.service.ts
      common/
        decorators/
          permissions.decorator.ts
        guards/
          permissions.guard.ts
      database/
        database.module.ts
        database.service.ts
      permissions/
        permissions.controller.ts
        permissions.module.ts
        permissions.service.ts
      roles/
        roles.controller.ts
        roles.module.ts
        roles.service.ts
      users/
        users.controller.ts
        users.module.ts
        users.service.ts
        dto/
          create-user.dto.ts
          update-user.dto.ts

## Arquitetura

### Entrada da aplicação

O arquivo `src/main.ts` é o ponto de partida da aplicação. Ele:

- importa `reflect-metadata`, necessário para decorators do Nest;
- cria a aplicação com `NestFactory.create(AppModule)`;
- habilita CORS;
- sobe o servidor na porta `3000`.

### Módulo raiz

O arquivo `src/app.module.ts` junta os módulos centrais:

- `DatabaseModule`
- `UsersModule`
- `RolesModule`
- `PermissionsModule`
- `AuthModule`

Isso centraliza a composição da aplicação, mas mantém cada domínio isolado.

### Banco de dados

O `DatabaseService` encapsula o `Pool` do pacote `pg` e expõe um método genérico `query(text, params)`.

Ele usa a seguinte configuração local:

- host: `localhost`
- porta: `5432`
- usuário: `postgres`
- senha: `postgres`
- banco: `database`

Na prática, esse serviço virou a porta de entrada única para as consultas SQL do projeto.

## Módulos do domínio

### Users

O módulo de usuários cria, busca e relaciona usuários com papéis.

O controller expõe as rotas:

- `POST /users` para criar usuário;
- `GET /users/:id` para buscar usuário e seus relacionamentos;
- `POST /users/:id/roles/:roleId` para vincular um papel ao usuário;
- `DELETE /users/:id/roles/:roleId` para remover esse vínculo.

O service faz o seguinte:

- gera hash da senha com bcrypt antes de salvar;
- insere o usuário em `auth.users`;
- busca o usuário e agrega os papéis e permissões com joins;
- adiciona e remove registros em `auth.user_roles`.

Na consulta de busca, o projeto retorna:

- `username`;
- lista de papéis;
- lista de permissões associadas aos papéis.

Isso mostra que a ideia não é só armazenar usuário, mas também montar a visão de acesso dele a partir do banco.

### Roles

O módulo de papéis administra os papéis do sistema.

As rotas são:

- `POST /roles` para criar um papel;
- `POST /roles/:id/permissions/:permId` para associar permissão ao papel;
- `DELETE /roles/:id/permissions/:permId` para remover essa associação.

O service grava e remove vínculos na tabela `auth.role_permissions`.

Ou seja, papel é a camada intermediária entre usuário e permissão.

### Permissions

O módulo de permissões gerencia as permissões que podem ser atribuídas a papéis.

As rotas são:

- `POST /permissions` para criar permissão;
- `GET /permissions` para listar todas as permissões.

Esse módulo é simples porque a responsabilidade dele é só manter o catálogo de permissões.

### Auth

O módulo de autenticação faz login básico por senha.

A rota atual é:

- `POST /auth/login`

O fluxo do login é:

1. procura o usuário por `username` em `auth.users`;
2. se não encontrar, retorna `{ ok: false }`;
3. se encontrar, compara a senha informada com o hash salvo no banco usando bcrypt;
4. retorna `{ ok: true }` ou `{ ok: false }`.

Esse login ainda não emite token JWT nem sessão, então ele funciona como validação inicial de credenciais.

## Regras compartilhadas

### Decorator de permissões

O arquivo `src/common/decorators/permissions.decorator.ts` cria um decorator simples chamado `Permissions`.

Hoje ele só retorna a lista de permissões recebida.

Ele existe para preparar o projeto para anotar rotas com permissões específicas no futuro.

### Guard de permissões

O arquivo `src/common/guards/permissions.guard.ts` ainda está como base futura.

Ele foi deixado como ponto de extensão para, mais tarde, validar se o usuário autenticado tem a permissão necessária antes de entrar em uma rota.

## DTOs

O projeto usa DTOs para representar os dados de usuário:

- `CreateUserDto`
- `UpdateUserDto`

Hoje os dois contêm os mesmos campos:

- `username`
- `fullname`
- `email`
- `password`

Isso mostra que a intenção foi preparar a aplicação para separar criação e atualização de usuário, mesmo que os dois ainda estejam iguais por enquanto.

## Dependências principais

O projeto usa estas bibliotecas principais:

- `@nestjs/common`
- `@nestjs/core`
- `pg`
- `bcrypt`
- `reflect-metadata`
- `rxjs`

E também usa estas dependências de desenvolvimento:

- `typescript`
- `@types/pg`
- `@types/bcrypt`

## Scripts disponíveis

Os scripts configurados em `package.json` são:

- `npm run build` para compilar o projeto;
- `npm run start` para executar o build gerado em `dist/main.js`;
- `npm run start:dev` para manter o TypeScript em modo watch.

## Como rodar o projeto

### 1. Instalar dependências

    npm install

### 2. Configurar o PostgreSQL

Crie um banco local chamado `database` e garanta que o usuário `postgres` com senha `postgres` consiga conectar em `localhost:5432`.

### 3. Criar o schema esperado

O código espera um schema chamado `auth` com estas tabelas:

- `auth.users`
- `auth.roles`
- `auth.permissions`
- `auth.user_roles`
- `auth.role_permissions`

### 4. Compilar

    npm run build

### 5. Executar

    npm run start

## Fluxo funcional do sistema

O projeto implementa uma estrutura de autorização simples:

1. um usuário é criado com senha criptografada;
2. papéis são cadastrados;
3. permissões são cadastradas;
4. permissões são ligadas a papéis;
5. papéis são ligados a usuários;
6. o login valida a senha do usuário;
7. a consulta de usuário monta a visão final com papéis e permissões agregadas.

Essa abordagem é um formato clássico de RBAC, com o banco fazendo parte importante da lógica de composição do acesso.

## Situação atual e próximos passos naturais

O projeto já está organizado e funcional na parte estrutural, mas ainda tem espaço para evolução:

- o login ainda não gera JWT;
- o guard de permissões ainda está como base;
- os DTOs ainda são simples e sem validação formal;
- faltam migrations ou scripts SQL versionados no repositório;
- a conexão com o banco ainda está hardcoded no serviço.

Se quiser evoluir esse projeto, os próximos passos mais naturais seriam:

1. adicionar JWT no módulo de autenticação;
2. implementar o `PermissionsGuard` de verdade;
3. criar validação com `class-validator` e `class-transformer`;
4. separar a configuração do banco em variáveis de ambiente;
5. adicionar migrations para criar o schema `auth` automaticamente.
