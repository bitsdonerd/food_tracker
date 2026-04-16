# Plano de Implementação — Food Tracker (Gerenciador de Marmitas)

> Documento de referência do plano de implementação do sistema. Use como fonte
> da verdade sobre arquitetura, design patterns, estrutura de classes e
> metodologia de trabalho do projeto.

---

## 1. Visão Geral do Projeto

Sistema de gerenciamento de pedidos para restaurantes que vendem **marmitas** e
**pratos feitos (PF)**. Fluxo principal:

```
Garçom (PWA Mobile) → API (Next.js) → Banco (PostgreSQL) → Pusher (WebSocket) → Cozinha (Dashboard)
```

### Requisitos Não-Funcionais

- Latência < 500ms entre Garçom e Cozinha
- Pico de 200 pedidos/dia
- PWA com suporte offline (UI apenas)
- Botões com toque mínimo de 44×44px
- 3 roles: garçom, cozinha, admin
- Stack gratuita (Vercel + Supabase + Pusher Sandbox)

### Estado Atual do Projeto

Já implementado:
- Infraestrutura Docker + PostgreSQL 16
- Camada de banco ([infra/database.js](../infra/database.js))
- Sistema de erros customizados ([infra/errors.js](../infra/errors.js))
- Controller com error handling ([infra/controller.js](../infra/controller.js))
- Middleware de autenticação ([infra/auth_middleware.js](../infra/auth_middleware.js))
- Migrator ([models/migrator.js](../models/migrator.js))
- Endpoints: `GET/POST /api/v1/migrations` e `GET /api/v1/status`
- Testes de integração para os endpoints acima
- Husky + Commitlint + ESLint + Prettier configurados

---

## 2. Arquitetura: Layered Architecture + Domain-Driven

```
┌──────────────────────────────────────────────────┐
│                  PAGES / API ROUTES               │  ← Camada de Apresentação
│   /api/v1/orders, /api/v1/reports, /dashboard     │
├──────────────────────────────────────────────────┤
│                   CONTROLLERS                     │  ← Orquestra request/response
│   Valida input, chama services, retorna JSON      │
├──────────────────────────────────────────────────┤
│                    SERVICES                       │  ← Lógica de aplicação
│   OrderService, ReportService, AuthService        │
├──────────────────────────────────────────────────┤
│                     DOMAIN                        │  ← Regras de negócio PURAS
│   PedidoFactory, PedidoBuilder, entidades         │
├──────────────────────────────────────────────────┤
│                  MODELS / REPOS                   │  ← Acesso a dados
│   OrderModel, ProductModel, ProfileModel          │
├──────────────────────────────────────────────────┤
│                  INFRASTRUCTURE                   │  ← Serviços externos
│   database.js, pusher.js, errors.js               │
└──────────────────────────────────────────────────┘
```

### Por que essa arquitetura?

1. **Separação clara de responsabilidades** — cada camada tem um papel bem definido
2. **Domain Layer puro** — regras de negócio isoladas, sem depender de banco ou HTTP
3. **Testabilidade** — Domain testado unitariamente, endpoints testados por integração
4. **Performance na comunicação** — Services orquestram persistência + notificação

### Estrutura de Pastas Proposta

```
food_tracker/
├── domain/                          ← NOVO: Regras de negócio puras
│   ├── pedido_factory.js            ← Factory Pattern
│   ├── pedido_builder.js            ← Builder Pattern
│   ├── entities/
│   │   ├── marmita.js
│   │   └── prato_feito.js
│   └── constants/
│       ├── acompanhamentos.js
│       └── precos.js
├── infra/                           ← JÁ EXISTE
│   ├── database.js
│   ├── errors.js
│   ├── controller.js
│   ├── auth_middleware.js
│   ├── pusher.js                    ← NOVO
│   └── migrations/                  ← NOVO: Arquivos SQL
├── models/                          ← EXPANDIR
│   ├── migrator.js
│   ├── order.js                     ← NOVO
│   ├── product.js                   ← NOVO
│   └── profile.js                   ← NOVO
├── services/                        ← NOVO
│   ├── order_service.js
│   └── report_service.js
├── pages/api/v1/                    ← EXPANDIR
│   ├── orders/
│   │   ├── index.js                 ← POST + GET
│   │   └── [id]/status.js           ← PATCH
│   ├── reports/daily.js             ← GET
│   ├── products/index.js            ← GET
│   ├── migrations/                  ← JÁ EXISTE
│   └── status/                      ← JÁ EXISTE
└── tests/
    ├── unit/                        ← NOVO
    │   └── domain/
    │       ├── pedido_factory.test.js
    │       └── pedido_builder.test.js
    └── integration/                 ← JÁ EXISTE
        └── api/v1/
            └── orders/
                ├── post.test.js
                ├── get.test.js
                └── patch_status.test.js
```

---

## 3. Design Patterns

### 3.1 Factory Pattern — `PedidoFactory`

Centraliza criação de objetos. Em vez de espalhar `if/else` pelo código, a
Factory decide qual entidade instanciar.

```javascript
// domain/pedido_factory.js

class PedidoFactory {
  static criar(tipo, dados) {
    switch (tipo) {
      case "MARMITA":
        return new Marmita(dados);   // 1 carne=R$18, 2 carnes=R$20
      case "PF":
        return new PratoFeito(dados); // preço fixo + carne dobrada
      default:
        throw new ValidationError("Tipo de pedido inválido");
    }
  }
}
```

```javascript
// domain/entities/marmita.js

class Marmita {
  constructor({ carnes, acompanhamentos, mesa, observacoes }) {
    this.tipo = "MARMITA";
    this.carnes = carnes;
    this.acompanhamentos = acompanhamentos;
    this.mesa = mesa;
    this.observacoes = observacoes;
    this.preco = this.calcularPreco();
  }

  calcularPreco() {
    if (this.carnes.length === 1) return 18.00;
    if (this.carnes.length === 2) return 20.00;
    throw new ValidationError("Marmita aceita 1 ou 2 carnes");
  }
}
```

```javascript
// domain/entities/prato_feito.js

class PratoFeito {
  constructor({ carne, acompanhamentos, mesa, observacoes, carneDobrada }) {
    this.tipo = "PF";
    this.carne = carne;
    this.carneDobrada = carneDobrada || false;
    this.acompanhamentos = acompanhamentos;
    this.mesa = mesa;
    this.observacoes = observacoes;
    this.preco = this.calcularPreco();
  }

  calcularPreco() {
    return this.carneDobrada ? 22.00 : 18.00;
  }
}
```

### 3.2 Builder Pattern — `PedidoBuilder`

Constrói objetos complexos passo a passo. Espelha o fluxo interativo do garçom.

```javascript
// domain/pedido_builder.js

const ACOMPANHAMENTOS_PADRAO = ["Arroz", "Feijão", "Farofa", "Salada", "Vinagrete"];

class PedidoBuilder {
  constructor() {
    this.dados = {
      carnes: [],
      acompanhamentos: [],
      mesa: null,
      observacoes: "",
    };
  }

  setCompleto() {
    this.dados.acompanhamentos = [...ACOMPANHAMENTOS_PADRAO];
    return this;
  }

  addCarne(carne) {
    this.dados.carnes.push(carne);
    return this;
  }

  addAcompanhamento(acomp) {
    this.dados.acompanhamentos.push(acomp);
    return this;
  }

  setMesa(numero) {
    this.dados.mesa = numero;
    return this;
  }

  setObservacoes(obs) {
    this.dados.observacoes = obs;
    return this;
  }

  build(tipo) {
    return PedidoFactory.criar(tipo, this.dados);
  }
}

// Uso:
// const pedido = new PedidoBuilder()
//   .setCompleto()
//   .addCarne("Frango")
//   .addCarne("Carne")
//   .setMesa(5)
//   .build("MARMITA");
```

### 3.3 Observer Pattern — Pusher (WebSocket)

Cozinha se inscreve em um canal e recebe eventos em tempo real quando a API
dispara.

```javascript
// infra/pusher.js (server-side)
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
});

export default pusher;

// No OrderService após salvar:
// await pusher.trigger("kitchen-channel", "new-order", pedidoSalvo);
```

Canais:
- `kitchen-channel` → eventos de novo pedido
- `order-{id}` → atualizações de status de pedido específico

---

## 4. Schema do Banco de Dados

### Migração 1: `products`
```sql
CREATE TYPE product_category AS ENUM ('PROTEINA', 'ACOMPANHAMENTO');

CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  category    product_category NOT NULL,
  is_protein  BOOLEAN DEFAULT false,
  available   BOOLEAN DEFAULT true,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

### Migração 2: `profiles`
```sql
CREATE TYPE user_role AS ENUM ('WAITER', 'KITCHEN', 'ADMIN');

CREATE TABLE profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        user_role NOT NULL DEFAULT 'WAITER',
  created_at  TIMESTAMP DEFAULT NOW()
);
```

### Migração 3: `orders`
```sql
CREATE TYPE order_type AS ENUM ('MARMITA', 'PF');
CREATE TYPE order_status AS ENUM ('PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED');

CREATE TABLE orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waiter_id     UUID REFERENCES profiles(id),
  type          order_type NOT NULL,
  status        order_status NOT NULL DEFAULT 'PENDING',
  total_price   DECIMAL(10,2) NOT NULL,
  table_number  INTEGER NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  delivered_at  TIMESTAMP
);

CREATE INDEX idx_orders_status_created ON orders(status, created_at);
```

### Migração 4: `order_items`
```sql
CREATE TYPE item_type AS ENUM ('PROTEINA', 'ACOMPANHAMENTO');

CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id),
  item_type   item_type NOT NULL,
  quantity    INTEGER DEFAULT 1,
  is_doubled  BOOLEAN DEFAULT false,
  notes       TEXT
);
```

### Transições Válidas de Status

```
PENDING → PREPARING → READY → DELIVERED
    ↓         ↓         ↓
CANCELLED CANCELLED CANCELLED
```

---

## 5. Principais Classes e Responsabilidades

| Módulo | Camada | Responsabilidade |
|--------|--------|-----------------|
| `Marmita` | Domain | Entidade marmita. Valida carnes (max 2) e calcula preço |
| `PratoFeito` | Domain | Entidade PF. Lida com carne dobrada e calcula preço |
| `PedidoFactory` | Domain | Decide qual entidade instanciar com base no tipo |
| `PedidoBuilder` | Domain | Constrói pedidos passo a passo com interface fluente |
| `OrderModel` | Models | CRUD: `create()`, `findById()`, `updateStatus()`, `findByDate()` |
| `ProductModel` | Models | `findAll()`, `findByCategory()` |
| `ProfileModel` | Models | `create()`, `findByEmail()`, `authenticate()` |
| `OrderService` | Services | Orquestra: valida → Factory → Model → Pusher |
| `ReportService` | Services | Agrega dados: totais, contagens, ticket médio |
| `pusher.js` | Infra | Client Pusher server-side para disparar eventos |

---

## 6. Metodologia TDD

### Ciclo: Red → Green → Refactor

1. **RED** — Escreva um teste que FALHA (porque a funcionalidade não existe ainda)
2. **GREEN** — Escreva o MÍNIMO de código para o teste PASSAR
3. **REFACTOR** — Melhore o código mantendo os testes passando

### 6.1 Testes Unitários (Domain)

Testam regras de negócio sem banco, sem HTTP, sem externos. São rápidos.

```javascript
// tests/unit/domain/pedido_factory.test.js

const PedidoFactory = require("domain/pedido_factory");

describe("PedidoFactory", () => {
  describe("quando tipo é MARMITA", () => {
    test("com 1 carne deve custar R$18", () => {
      const pedido = PedidoFactory.criar("MARMITA", {
        carnes: ["Frango"],
        acompanhamentos: ["Arroz", "Feijão"],
        mesa: 3,
      });
      expect(pedido.preco).toBe(18.00);
    });

    test("com 2 carnes deve custar R$20", () => {
      const pedido = PedidoFactory.criar("MARMITA", {
        carnes: ["Frango", "Carne"],
        acompanhamentos: ["Arroz"],
        mesa: 5,
      });
      expect(pedido.preco).toBe(20.00);
    });

    test("com 0 ou 3 carnes deve lançar erro", () => {
      expect(() => PedidoFactory.criar("MARMITA", { carnes: [], mesa: 1 }))
        .toThrow();
    });
  });

  describe("quando tipo é PF", () => {
    test("sem carne dobrada deve custar R$18", () => {
      const pedido = PedidoFactory.criar("PF", {
        carne: "Frango",
        acompanhamentos: ["Arroz"],
        mesa: 2,
        carneDobrada: false,
      });
      expect(pedido.preco).toBe(18.00);
    });

    test("com carne dobrada deve custar R$22", () => {
      const pedido = PedidoFactory.criar("PF", {
        carne: "Carne",
        acompanhamentos: ["Arroz"],
        mesa: 4,
        carneDobrada: true,
      });
      expect(pedido.preco).toBe(22.00);
    });
  });
});
```

```javascript
// tests/unit/domain/pedido_builder.test.js

const PedidoBuilder = require("domain/pedido_builder");

describe("PedidoBuilder", () => {
  test("setCompleto() deve adicionar 5 acompanhamentos padrão", () => {
    const builder = new PedidoBuilder().setCompleto();
    expect(builder.dados.acompanhamentos).toHaveLength(5);
  });

  test("deve permitir encadeamento de métodos", () => {
    const pedido = new PedidoBuilder()
      .setCompleto()
      .addCarne("Frango")
      .setMesa(3)
      .build("MARMITA");

    expect(pedido.tipo).toBe("MARMITA");
    expect(pedido.preco).toBe(18.00);
    expect(pedido.mesa).toBe(3);
  });
});
```

### 6.2 Testes de Integração (Endpoints)

Testam o fluxo completo: HTTP → Controller → Service → Model → Banco.

```javascript
// tests/integration/api/v1/orders/post.test.js

const orchestrator = require("tests/orchestrator");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.seedProducts();
  await orchestrator.createTestWaiter();
});

describe("POST /api/v1/orders", () => {
  describe("Garçom autenticado", () => {
    test("deve criar marmita 1 carne → 201 + R$18", async () => {
      const response = await fetch("http://localhost:3000/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "MARMITA",
          carnes: ["Frango"],
          acompanhamentos: ["Arroz", "Feijão"],
          mesa: 5,
        }),
      });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.type).toBe("MARMITA");
      expect(body.status).toBe("PENDING");
      expect(body.total_price).toBe("18.00");
      expect(body.id).toBeDefined();
    });

    test("deve criar PF com carne dobrada → R$22", async () => {
      const response = await fetch("http://localhost:3000/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "PF",
          carne: "Carne",
          carneDobrada: true,
          acompanhamentos: ["Arroz"],
          mesa: 1,
        }),
      });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.total_price).toBe("22.00");
    });
  });

  describe("Validação de input", () => {
    test("sem 'tipo' → 400", async () => {
      const response = await fetch("http://localhost:3000/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carnes: ["Frango"], mesa: 1 }),
      });
      expect(response.status).toBe(400);
    });
  });

  describe("Não autenticado", () => {
    test("→ 403", async () => {
      const response = await fetch("http://localhost:3000/api/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-test-auth": "fail",
        },
        body: JSON.stringify({
          tipo: "MARMITA",
          carnes: ["Frango"],
          mesa: 1,
        }),
      });
      expect(response.status).toBe(403);
    });
  });
});
```

```javascript
// tests/integration/api/v1/orders/patch_status.test.js

describe("PATCH /api/v1/orders/:id/status", () => {
  test("PENDING → PREPARING → 200", async () => {
    // criar pedido...
    const response = await fetch(
      `http://localhost:3000/api/v1/orders/${orderId}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PREPARING" }),
      }
    );
    expect(response.status).toBe(200);
  });

  test("transição inválida PENDING → DELIVERED → 400", async () => {
    // ...
  });
});
```

---

## 7. Fluxo Tempo Real (Comunicação Garçom → Cozinha)

```
1. Garçom clica "Confirmar Pedido"
2. Frontend: POST /api/v1/orders
3. API: valida (Zod) → PedidoFactory.criar() → prisma.order.create()
4. API: pusher.trigger("kitchen-channel", "new-order", pedidoSalvo)
5. Cozinha (inscrita em "kitchen-channel") recebe evento via WebSocket
6. Cozinha: "Iniciar" → PATCH /api/v1/orders/:id/status → PREPARING
7. API: pusher.trigger("order-{id}", "status-update", {...})
8. Garçom recebe notificação de preparo
```

Latência target: **< 500ms** do POST até dashboard atualizar.

---

## 8. Plano Sprint por Sprint

### Sprint S1 — Setup & Infraestrutura (parcialmente feito)

- [x] Docker + PostgreSQL
- [x] database.js + errors.js + controller.js
- [x] Migrator + endpoints /status e /migrations
- [ ] Vercel + CI/CD
- [ ] Pusher (conta + libs + `infra/pusher.js`)
- [ ] Migrações SQL (products, profiles, orders, order_items)

### Sprint S2 — Core Domain + Backend (FOCO)

**Ordem TDD:**
1. Testes unitários do Domain (RED)
2. Implementar `domain/entities/`, `pedido_factory.js`, `pedido_builder.js` (GREEN)
3. Testes de integração dos endpoints (RED)
4. Implementar `models/order.js`, `services/order_service.js`, rotas (GREEN)
5. Seed do banco

### Sprint S3 — Interface do Garçom

- Layout mobile-first, bottom navigation
- Wizard: Tipo → Montagem → Confirmação
- PedidoBuilder no cliente
- Preview de preço em tempo real
- Submit com loading + toast

### Sprint S4 — Dashboard da Cozinha

- Rota `/dashboard` protegida (KITCHEN/ADMIN)
- Pusher subscribe `kitchen-channel`
- Cards com status visual
- Som de alerta
- Botão atualizar status com 1 toque

### Sprint S5 — Admin & Fechamento

- `GET /api/v1/reports/daily`
- Dashboard admin com totais
- PWA (manifest.json + service worker)
- Sentry
- Testes E2E com Playwright

---

## 9. Regras e Convenções do Projeto

| Regra | Detalhe |
|-------|---------|
| **Commits** | Conventional Commits (`feat:`, `fix:`, `test:`, `refactor:`) — enforçado por commitlint |
| **Estilo** | Prettier + ESLint, indent 2 espaços, sempre ponto-e-vírgula |
| **Imports** | Paths absolutos via jsconfig (`infra/database`, `models/order`) |
| **Erros** | Usar classes de [infra/errors.js](../infra/errors.js), nunca `Error` genérico |
| **Routes** | `next-connect` + `controller.errorHandlers` |
| **Testes** | Jest + fetch direto (integração); arquivos em `tests/` |
| **Banco** | SQL puro via `database.query()`, migrações via `node-pg-migrate` |
| **Naming** | `snake_case` para arquivos e variáveis, `PascalCase` para classes |

---

## 10. Referências Internas

- Roadmap visual: [roadmap/index.html](../roadmap/index.html)
- Dados do roadmap: [roadmap/js/script.js](../roadmap/js/script.js)
- Código atual (infra): [infra/](../infra/)
- Testes atuais: [tests/integration/](../tests/integration/)
