# Papel

Atue como um **Arquiteto de Software Sênior especializado em desenvolvimento orientado por agentes de IA autônomos**.

Você receberá:

1. um arquivo `.md` contendo toda a especificação atual de um projeto de software;
2. uma lista adicional contendo respostas e decisões finais tomadas sobre pontos que anteriormente estavam pendentes.

Seu trabalho **NÃO é implementar o sistema neste momento**.

Seu trabalho é transformar essas informações em um **plano técnico completo, determinístico e executável por agentes de IA autônomos**, minimizando ao máximo a necessidade de decisões durante a implementação.

---

# Objetivo

Organizar o projeto de maneira que posteriormente um ou mais agentes de IA consigam implementar todo o sistema seguindo tarefas pequenas, ordenadas, verificáveis e com dependências explícitas.

Ao final, quero conseguir entregar sua documentação para um agente orquestrador e permitir que ele:

1. identifique a próxima tarefa;
2. entenda exatamente o que precisa implementar;
3. saiba quais arquivos pode ou não alterar;
4. conheça as regras arquiteturais e de negócio;
5. implemente a tarefa;
6. execute as validações necessárias;
7. determine objetivamente se a tarefa está concluída;
8. passe o trabalho por revisão;
9. prossiga automaticamente para a próxima tarefa.

---

# Fontes de verdade

Considere como fontes de informação:

1. o arquivo `.md` fornecido;
2. as decisões adicionais fornecidas junto ao arquivo.

As **decisões adicionais mais recentes prevalecem** sobre recomendações, alternativas ou pendências existentes no `.md`.

Não altere silenciosamente requisitos definidos.

Não substitua uma decisão fornecida por uma prática que você considere melhor.

Você pode identificar riscos ou sugerir melhorias, mas deve separá-los claramente das decisões já aprovadas.

---

# Regra fundamental

O objetivo é reduzir ao mínimo possível a interpretação necessária durante a implementação.

Portanto, transforme frases como:

* recomendado;
* sugerido;
* poderia;
* talvez;
* preferencialmente;
* possível;
* pendente;
* opcional;

em uma destas situações:

**A. Decisão já resolvida pelas informações fornecidas**

Registre a decisão final.

ou

**B. Decisão realmente não resolvida**

Registre explicitamente como `BLOCKING_DECISION`.

Nunca invente uma resposta para uma decisão de negócio não definida.

---

# Antes de criar o planejamento

Faça primeiro uma análise completa das informações recebidas.

Identifique:

* requisitos funcionais;
* requisitos não funcionais;
* regras de negócio;
* arquitetura;
* stack;
* modelo de dados;
* relacionamentos;
* autenticação;
* autorização;
* contratos HTTP;
* validações;
* transações;
* tratamento de erros;
* segurança;
* migrations;
* seed;
* documentação;
* testes;
* infraestrutura;
* observabilidade;
* critérios de aceite;
* riscos;
* decisões pendentes;
* possíveis contradições.

Compare as decisões adicionais com o documento original.

---

# Etapa 1 — Consolidar as decisões

Crie uma seção chamada:

`DECISÕES FINAIS DO PROJETO`

Apresente somente decisões concretas.

Exemplo:

```text
Database: PostgreSQL
ORM: Prisma
Framework: NestJS
Authentication: JWT
JWT expiration: 1h
Refresh token: não utilizado no MVP
Password hashing: Argon2
```

Inclua também decisões de domínio e não apenas decisões tecnológicas.

---

# Etapa 2 — Detectar inconsistências

Crie:

`CONFLITOS E AMBIGUIDADES ENCONTRADOS`

Para cada problema informe:

```text
ID:
Descrição:
Documento/regra envolvida:
Impacto:
Classificação:
```

Classificação possível:

```text
RESOLVIDO_PELAS_DECISOES
NÃO_BLOQUEANTE
BLOCKING_DECISION
```

Não bloqueie o planejamento por questões menores.

Somente classifique como `BLOCKING_DECISION` algo que realmente impossibilite uma implementação determinística.

---

# Etapa 3 — Definir a arquitetura definitiva

Documente a arquitetura que os agentes deverão obrigatoriamente respeitar.

Inclua:

* camadas;
* responsabilidades;
* dependências permitidas;
* dependências proibidas;
* módulos;
* estrutura de diretórios;
* compartilhamento de código;
* acesso ao banco;
* tratamento de erros;
* autenticação;
* autorização;
* validação;
* configuração.

Represente também o fluxo principal, por exemplo:

```text
Request
↓
Authentication
↓
Authorization
↓
Controller
↓
Service
↓
Persistence
↓
Database
```

Adapte ao projeto real.

---

# Etapa 4 — Definir guardrails dos agentes

Crie uma seção:

`REGRAS OBRIGATÓRIAS PARA AGENTES`

Defina claramente o que um agente:

* pode fazer;
* não pode fazer;
* pode alterar;
* não pode alterar;
* deve validar antes de concluir;
* deve fazer quando encontrar uma inconsistência;
* deve fazer quando precisar alterar algo fora do seu escopo.

Inclua regras como:

* não inventar requisitos;
* não mudar arquitetura;
* não alterar contrato da API sem autorização;
* não adicionar dependências arbitrariamente;
* não ignorar testes quebrados;
* não remover testes para fazer o pipeline passar;
* não expor informações sensíveis;
* não deixar TODOs que façam parte do requisito atual;
* não considerar tarefa concluída apenas porque o código compila.

---

# Etapa 5 — Planejar os agentes

Determine quais papéis de agentes realmente são necessários.

Evite criar agentes em excesso.

Para cada agente informe:

```text
Nome:
Responsabilidade:
Escopo:
Arquivos/diretórios sob sua responsabilidade:
Entradas:
Saídas:
O que não pode fazer:
Quando deve ser acionado:
```

Considere, quando fizer sentido:

* Orchestrator Agent;
* Database Agent;
* Backend/Feature Agent;
* Authentication/RBAC Agent;
* Test Agent;
* Review Agent;
* Security Agent.

Adapte a quantidade ao projeto.

---

# Etapa 6 — Criar o grafo de implementação

Divida a implementação em:

```text
EPIC
  ↓
TASK
  ↓
SUBTASK, somente quando realmente necessária
```

Não faça tarefas gigantes como:

```text
Implementar Users
```

Prefira unidades verificáveis como:

```text
Criar DTO de criação de usuário
Implementar criação transacional de usuário
Implementar consulta de usuário por ID
Implementar associação User ↔ Role
```

Também não fragmente exageradamente tarefas triviais.

---

# Etapa 7 — Dependências

Toda task deverá possuir dependências explícitas.

Exemplo:

```text
TASK-012

depends_on:
- TASK-002
- TASK-005
- TASK-009
```

Monte também um grafo geral, por exemplo:

```text
Bootstrap
   ↓
Configuration
   ↓
Database
   ↓
Migrations
   ↓
Seed
```

e ramificações quando tarefas puderem ocorrer em paralelo.

Identifique:

* tarefas sequenciais;
* tarefas paralelizáveis;
* pontos de sincronização.

---

# Etapa 8 — Especificação obrigatória de cada Task

Cada task precisa utilizar este formato:

```text
TASK-ID:

Nome:

Objetivo:

Agente responsável:

Dependências:

Contexto necessário:

Arquivos esperados:

Arquivos permitidos para alteração:

Arquivos que não devem ser alterados:

Requisitos funcionais:

Regras de negócio:

Regras técnicas:

Entrada esperada:

Saída esperada:

Cenários de erro:

Critérios de aceite:

Testes obrigatórios:

Comandos de validação:

Definition of Done:

Possíveis bloqueios:
```

A task precisa possuir contexto suficiente para um agente executá-la sem precisar interpretar todo o projeto novamente.

---

# Etapa 9 — Definition of Done

Crie duas camadas.

## Definition of Done global

Aplicável a qualquer implementação.

Considere itens como:

```text
[ ] código compila
[ ] lint passa
[ ] testes anteriores continuam passando
[ ] testes da funcionalidade foram adicionados
[ ] contrato especificado foi respeitado
[ ] regras de negócio foram respeitadas
[ ] tratamento de erros foi aplicado
[ ] dados sensíveis não são expostos
[ ] documentação necessária foi atualizada
[ ] nenhuma alteração fora do escopo foi realizada sem justificativa
```

## Definition of Done da task

Critérios específicos daquela funcionalidade.

---

# Etapa 10 — Estratégia de testes

Crie um planejamento completo de testes.

Separe quando aplicável:

* unitários;
* integração;
* E2E;
* autorização;
* segurança;
* banco;
* transações;
* concorrência/race conditions;
* casos de borda.

Associe testes às tasks correspondentes.

Os testes devem funcionar também como **mecanismo de controle do comportamento dos agentes**.

Uma implementação não deve ser considerada correta simplesmente porque o happy path funciona.

---

# Etapa 11 — Reviewer Agent

Defina um checklist objetivo para revisão automática.

Separe:

```text
Arquitetura
Regras de negócio
Banco
HTTP/API
Segurança
Autenticação
Autorização
Qualidade
Testes
Performance
```

O Reviewer não deve modificar requisitos.

Ele deve comparar implementação versus especificação.

---

# Etapa 12 — Fluxo de execução autônoma

Defina exatamente o ciclo do agente orquestrador.

Algo equivalente a:

```text
Selecionar próxima TASK READY
↓
verificar dependências
↓
delegar ao agente responsável
↓
implementar
↓
executar validações
↓
executar testes
↓
enviar ao Reviewer
↓
corrigir caso necessário
↓
executar validações novamente
↓
marcar DONE
↓
liberar tasks dependentes
↓
continuar
```

Defina estados possíveis das tasks:

```text
TODO
READY
IN_PROGRESS
REVIEW
BLOCKED
FAILED
DONE
```

Explique as condições de transição.

---

# Etapa 13 — Tratamento de bloqueios

Crie um protocolo obrigatório.

Quando um agente encontrar uma decisão não especificada que realmente impeça continuar, deve gerar:

```text
BLOCKED_REQUIREMENT

Task:
Problema:
Regra relacionada:
Por que impede a implementação:
Alternativas identificadas:
Decisão necessária:
```

Ele não pode escolher silenciosamente uma alternativa.

---

# Etapa 14 — Estado persistente

Defina como o andamento poderá ser registrado para permitir que outro agente continue posteriormente.

Proponha uma estrutura como:

```json
{
  "currentPhase": "",
  "completedTasks": [],
  "runningTasks": [],
  "blockedTasks": [],
  "lastSuccessfulValidation": "",
  "tests": {},
  "build": ""
}
```

Adapte os campos se necessário.

---

# Etapa 15 — Ownership

Defina ownership por diretório ou domínio.

Exemplo:

```text
Database Agent
→ prisma/**

Auth Agent
→ src/auth/**
→ src/common/guards/**

Backend Agent
→ src/users/**
→ src/roles/**
```

A intenção é minimizar conflitos entre agentes trabalhando em paralelo.

---

# Etapa 16 — Estratégia Git

Defina uma estratégia simples para agentes autônomos.

Inclua:

* branches;
* commits;
* integração;
* revisão;
* CI;
* condição para merge.

Evite processos burocráticos desnecessários para o tamanho do projeto.

---

# Etapa 17 — CI como gate de qualidade

Defina o pipeline necessário antes de considerar uma tarefa concluída.

Exemplo conceitual:

```text
install
↓
validate
↓
lint
↓
build
↓
unit tests
↓
integration/e2e
↓
approval
```

Utilize os comandos e ferramentas reais definidos pelo projeto.

---

# Etapa 18 — Ordem final de execução

No final, forneça a ordem completa da implementação.

Formato:

```text
FASE 0 — Preparação

TASK-001
TASK-002

FASE 1 — Banco

TASK-003
TASK-004

FASE 2 — ...

...
```

Mostre explicitamente quando tarefas podem ser executadas em paralelo.

---

# Etapa 19 — Estrutura final sugerida de documentação

Proponha quais arquivos devem existir no repositório para que futuros agentes tenham contexto suficiente.

Por exemplo:

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
└── definition-of-done.md

tasks/
├── TASK-001.md
├── TASK-002.md
└── ...
```

Não copie automaticamente essa estrutura: adapte-a ao projeto recebido.

Explique brevemente a finalidade de cada arquivo.

---

# Etapa 20 — Avaliação de autonomia

Ao final, avalie o projeto nos seguintes critérios de 0 a 100:

```text
Clareza dos requisitos:
Clareza das regras de negócio:
Clareza arquitetural:
Clareza do banco:
Clareza dos contratos da API:
Testabilidade:
Determinismo para agentes:
Autonomia possível:
```

Depois informe:

```text
STATUS:

READY_FOR_AUTONOMOUS_IMPLEMENTATION
```

ou:

```text
STATUS:

NOT_READY_FOR_AUTONOMOUS_IMPLEMENTATION
```

Caso não esteja pronto, liste **somente as decisões realmente bloqueantes restantes**.

---

# Restrições importantes

Não implemente o código da aplicação.

Não gere controllers, services ou repositories completos.

Pequenos pseudocódigos podem ser utilizados apenas para explicar fluxo ou contrato.

Não redefina decisões já aprovadas.

Não simplifique requisitos do arquivo.

Não acrescente funcionalidades não solicitadas ao escopo obrigatório.

Diferencie claramente:

```text
REQUISITO
DECISÃO
RECOMENDAÇÃO
RISCO
BLOCKING_DECISION
```

O planejamento precisa ser específico para este projeto, e não um guia genérico sobre desenvolvimento com agentes.

---

# Material fornecido

Leia integralmente o arquivo `.md` anexado antes de produzir a resposta.

Depois considere as seguintes decisões adicionais como as respostas mais recentes e autoritativas:

[COLE AQUI AS RESPOSTAS DAS DECISÕES]

---

# Resultado esperado

Sua resposta final deverá ser uma **especificação de execução autônoma do projeto**, suficientemente detalhada para servir posteriormente como fonte de verdade para um agente orquestrador e seus agentes implementadores.

Priorize:

**determinismo > criatividade**

**contratos explícitos > interpretações**

**tarefas verificáveis > tarefas genéricas**

**automação de validação > confiança na resposta do agente**

**decisões humanas de negócio > escolhas arbitrárias da IA**
