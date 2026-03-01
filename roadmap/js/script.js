// ══ FLOW DATA ══
const flowNodes = [
    {
        id: 'garcom', icon: '📱', name: 'Garçom', tech: 'PWA · Mobile',
        cols: [
            { title: 'Responsabilidades', items: ['Selecionar tipo: Marmita ou PF', 'Usar Builder: Completo ou Custom', 'Informar número da mesa', 'Adicionar observações'] },
            { title: 'Stack', items: ['Next.js App Router', 'React State (useState)', 'PedidoBuilder no cliente', 'Tailwind + botões 44px'] },
            { title: 'UX Mobile', items: ['Bottom navigation para polegares', 'Botões grandes, sem hover', 'Confirmação com feedback visual', 'Funciona offline (UI apenas)'] }
        ]
    },
    {
        id: 'api', icon: '⚙️', name: 'API Route', tech: 'Next.js Serverless',
        cols: [
            { title: 'Responsabilidades', items: ['Validar payload com Zod', 'Chamar PedidoFactory.criar()', 'Persistir via Prisma ORM', 'Disparar evento Pusher'] },
            { title: 'Stack', items: ['POST /api/orders', 'Zod para validação', 'PedidoFactory.criar()', 'prisma.order.create()'] },
            { title: 'Segurança', items: ['Verificar sessão (auth middleware)', 'Rate limiting por IP', 'Validar role = WAITER', 'Retornar erro 401 se inválido'] }
        ]
    },
    {
        id: 'db', icon: '🗄️', name: 'PostgreSQL', tech: 'Prisma · Supabase/Neon',
        cols: [
            { title: 'O que é persistido', items: ['Order com type + status + price', 'OrderItems com carnes e acompanhamentos', 'isDoubled=true para carne dobrada PF', 'waiterId para rastreio'] },
            { title: 'Stack', items: ['Prisma ORM (type-safe queries)', 'Supabase ou Neon (PostgreSQL)', 'Migrations versionadas', 'RLS para segurança por role'] },
            { title: 'Performance', items: ['Índice em status + created_at', 'Query diária para fechamento de caixa', 'pg_cron para arquivar pedidos antigos'] }
        ]
    },
    {
        id: 'pusher', icon: '⚡', name: 'Pusher', tech: 'WebSocket · Event Bus',
        cols: [
            { title: 'Responsabilidades', items: ['Receber trigger da API após salvar', 'Distribuir evento new-order', 'Manter WebSocket com dashboard', 'Reconexão automática'] },
            { title: 'Canais', items: ['kitchen-channel → novo pedido', 'order-{id} → status update', 'Presence channel → quem está online'] },
            { title: 'Por que Pusher?', items: ['Sandbox gratuito (200 conexões)', 'SDK simples para Next.js', 'Fallback HTTP automático', 'Dashboard de debug em tempo real'] }
        ]
    },
    {
        id: 'cozinha', icon: '🍳', name: 'Cozinha', tech: 'Dashboard · Tablet',
        cols: [
            { title: 'Responsabilidades', items: ['Observer: ouve new-order via Pusher', 'Exibe fila em tempo real', 'Atualiza status (Preparando → Pronto)', 'Toca som ao chegar pedido'] },
            { title: 'Stack', items: ['Next.js Client Component', 'pusher-js para WebSocket', 'channel.bind(\'new-order\', ...)', 'Audio API para som de alerta'] },
            { title: 'UX Cozinha', items: ['Tela sempre ligada no tablet', 'Cards grandes legíveis de longe', 'Swipe ou botão para atualizar status', 'Cor de fundo muda por urgência'] }
        ]
    }
];

const flowArrows = [
    { label: 'POST /api/orders' },
    { label: 'Prisma.create()' },
    { label: 'pusher.trigger()' },
    { label: 'WebSocket event' },
];

let activeFlow = null;

function buildFlow() {
    const diag = document.getElementById('flow-diagram');
    flowNodes.forEach((node, i) => {
        const div = document.createElement('div');
        div.className = 'flow-node';
        div.id = 'fn-' + node.id;
        div.innerHTML = `<div class="flow-node-icon">${node.icon}</div><div class="flow-node-name">${node.name}</div><div class="flow-node-tech">${node.tech}</div>`;
        div.onclick = () => showFlowDetail(i);
        diag.appendChild(div);

        if (i < flowArrows.length) {
            const arr = document.createElement('div');
            arr.className = 'flow-arrow';
            arr.innerHTML = `<div class="flow-arrow-line"></div><div class="flow-arrow-label">${flowArrows[i].label}</div>`;
            diag.appendChild(arr);
        }
    });
}

function showFlowDetail(idx) {
    const node = flowNodes[idx];
    const detail = document.getElementById('flow-detail');
    document.querySelectorAll('.flow-node').forEach((n, i) => n.classList.toggle('active', i === idx));

    if (activeFlow === idx) {
        detail.classList.remove('open');
        document.querySelectorAll('.flow-node').forEach(n => n.classList.remove('active'));
        activeFlow = null;
        return;
    }
    activeFlow = idx;

    detail.innerHTML = `
    <div class="detail-title">${node.icon} ${node.name} — ${node.tech}</div>
    <div class="detail-grid">
      ${node.cols.map(c => `
        <div>
          <div class="detail-col-label">${c.title}</div>
          <ul class="detail-list">${c.items.map(i => `<li>${i}</li>`).join('')}</ul>
        </div>
      `).join('')}
    </div>
  `;
    detail.classList.add('open');
    setTimeout(() => detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
}

// ══ TABS ══
function switchTab(id) {
    const ids = ['fluxo', 'patterns', 'database', 'precos', 'roadmap'];
    document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', ids[i] === id));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === 'tab-' + id));
}

// ══ ROADMAP ══
const phases = [
    {
        num: 'S1', title: 'Setup & Infraestrutura', meta: 'Semana 1 · ~6h',
        tasks: [
            { name: 'Inicializar Next.js com TypeScript + Tailwind', desc: 'npx create-next-app@latest --typescript --tailwind --app. Estrutura: /app, /domain, /lib, /components', tag: 'DevOps', tc: 'rgba(245,166,35,0.15)', tt: '#f5a623' },
            { name: 'Configurar ESLint + Prettier + Husky', desc: 'Husky com pre-commit: npx lint-staged. Prettier no save. Regras: no-console em produção', tag: 'DevOps', tc: 'rgba(245,166,35,0.15)', tt: '#f5a623' },
            { name: 'Criar projeto Vercel + CI/CD', desc: 'Conectar repo GitHub → Vercel. Deploy automático em main. Preview URL em cada PR', tag: 'Deploy', tc: 'rgba(74,158,255,0.15)', tt: '#4a9eff' },
            { name: 'Configurar Supabase/Neon + Prisma', desc: 'npm install prisma @prisma/client. npx prisma init. Definir DATABASE_URL no .env. Configurar Prisma Client singleton em /lib/db.ts', tag: 'Database', tc: 'rgba(60,185,122,0.15)', tt: '#3cb97a' },
            { name: 'Configurar conta Pusher', desc: 'Criar app no Pusher Dashboard. Instalar pusher + pusher-js. Criar /lib/pusher.ts (server) e /lib/pusherClient.ts (browser)', tag: 'Realtime', tc: 'rgba(232,69,69,0.15)', tt: '#e84545' },
        ]
    },
    {
        num: 'S2', title: 'Core Domain — Backend', meta: 'Semana 2 · ~8h',
        tasks: [
            { name: 'Modelar e migrar o banco (Prisma Schema)', desc: 'Definir models: Order, OrderItem, Product, Profile. Enums: OrderType, OrderStatus, Role. Rodar npx prisma migrate dev --name init', tag: 'Database', tc: 'rgba(60,185,122,0.15)', tt: '#3cb97a' },
            { name: 'Implementar PedidoFactory', desc: 'Criar /domain/PedidoFactory.ts com classes Marmita e PratoFeito. Lógica: 1 carne=R$18, 2 carnes=R$20. isDoubled para PF. Testes unitários com Vitest', tag: 'Factory', tc: 'rgba(245,166,35,0.15)', tt: '#f5a623' },
            { name: 'Implementar PedidoBuilder', desc: 'Criar /domain/PedidoBuilder.ts. Métodos encadeáveis: setCompleto(), addCarne(), addAcompanhamento(), build(). Definir ACOMPANHAMENTOS_PADRAO em /domain/acompanhamentos.ts', tag: 'Builder', tc: 'rgba(176,106,255,0.15)', tt: '#b06aff' },
            { name: 'Criar POST /api/orders', desc: 'Validar body com Zod (tipo, carnes, acompanhamentos, mesa). Chamar PedidoFactory.criar(). prisma.order.create(). Disparar pusher.trigger("kitchen-channel", "new-order", payload)', tag: 'API', tc: 'rgba(74,158,255,0.15)', tt: '#4a9eff' },
            { name: 'Criar PATCH /api/orders/[id]/status', desc: 'Atualizar status do pedido (apenas KITCHEN e ADMIN). Validar transição válida (ex: PENDING→PREPARING). Disparar evento Pusher no canal order-{id}', tag: 'API', tc: 'rgba(74,158,255,0.15)', tt: '#4a9eff' },
            { name: 'Seed do banco com produtos', desc: 'Criar /prisma/seed.ts com carnes (Frango, Carne, Ovo...) e acompanhamentos (Arroz, Feijão, Salada...). npx prisma db seed', tag: 'Database', tc: 'rgba(60,185,122,0.15)', tt: '#3cb97a' },
        ]
    },
    {
        num: 'S3', title: 'Interface do Garçom', meta: 'Semana 3 · ~8h',
        tasks: [
            { name: 'Layout Mobile-First com bottom navigation', desc: 'Bottom nav fixo com: Home, Novo Pedido, Histórico. Botões mínimo 44×44px. Tailwind: touch-manipulation, active:scale-95', tag: 'UI', tc: 'rgba(245,166,35,0.15)', tt: '#f5a623' },
            { name: 'Seleção de Tipo: card Marmita vs PF', desc: 'Cards grandes ocupando 50% da tela cada. Ao selecionar, animar e mostrar próxima etapa. Usar useState para controlar etapa do wizard', tag: 'UI', tc: 'rgba(245,166,35,0.15)', tt: '#f5a623' },
            { name: 'Tela de montagem: Completo vs Custom', desc: 'Botão "Completo" usa PedidoBuilder.setCompleto(). "Custom" mostra lista de itens selecionáveis. Lista de proteínas com rádio (Marmita: max 2)', tag: 'Builder', tc: 'rgba(176,106,255,0.15)', tt: '#b06aff' },
            { name: 'Lógica de preço em tempo real', desc: 'useEffect que chama PedidoFactory ao mudar seleção e exibe preço calculado antes de confirmar. Preview: "Marmita 2 carnes — R$ 20,00"', tag: 'Factory', tc: 'rgba(245,166,35,0.15)', tt: '#f5a623' },
            { name: 'Submeter pedido + feedback', desc: 'fetch POST /api/orders com estado de loading. Toast de sucesso com número do pedido. Limpar formulário e voltar para home', tag: 'Feature', tc: 'rgba(60,185,122,0.15)', tt: '#3cb97a' },
        ]
    },
    {
        num: 'S4', title: 'Dashboard da Cozinha (Realtime)', meta: 'Semana 4 · ~6h',
        tasks: [
            { name: 'Página /dashboard (rota protegida)', desc: 'Middleware Next.js verifica role === KITCHEN ou ADMIN. Redireciona para /login se não autorizado. Busca pedidos PENDING + PREPARING no SSR', tag: 'Auth', tc: 'rgba(232,69,69,0.15)', tt: '#e84545' },
            { name: 'Integrar Observer via Pusher', desc: '"use client". pusher.subscribe("kitchen-channel"). channel.bind("new-order", handler). Handler: setPedidos(prev => [novo, ...prev]). Cleanup no return do useEffect', tag: 'Observer', tc: 'rgba(232,69,69,0.15)', tt: '#e84545' },
            { name: 'Cards de pedido para cozinha', desc: 'Card grande com: número da mesa, tipo (Marmita/PF), lista de itens (destacar carnes), observações, tempo desde criação. Cor diferente: PENDING=amarelo, PREPARING=laranja', tag: 'UI', tc: 'rgba(245,166,35,0.15)', tt: '#f5a623' },
            { name: 'Som de alerta ao chegar pedido', desc: 'new Audio("/alert.mp3").play() no handler do Pusher. Arquivo de som em /public/alert.mp3. Botão na tela para ativar/silenciar (política de autoplay)', tag: 'Feature', tc: 'rgba(60,185,122,0.15)', tt: '#3cb97a' },
            { name: 'Atualizar status com 1 toque', desc: 'Botão "Iniciar" → PATCH /api/orders/:id/status para PREPARING. Botão "Pronto!" → READY. Garçom recebe notificação via canal order-{id}', tag: 'Realtime', tc: 'rgba(232,69,69,0.15)', tt: '#e84545' },
        ]
    },
    {
        num: 'S5', title: 'Fechamento de Caixa & Admin', meta: 'Semana 5 · ~5h',
        tasks: [
            { name: 'GET /api/reports/daily', desc: 'Query Prisma: COUNT pedidos + SUM totalPrice WHERE date = today AND status = DELIVERED. Agrupar por tipo (Marmita vs PF). Retornar JSON estruturado', tag: 'API', tc: 'rgba(74,158,255,0.15)', tt: '#4a9eff' },
            { name: 'Dashboard admin /admin', desc: 'Cards: Total do dia (R$), Qtd Marmitas, Qtd PFs, Ticket médio, Pedidos em aberto. Gráfico simples de horário de pico (opcional)', tag: 'UI', tc: 'rgba(245,166,35,0.15)', tt: '#f5a623' },
            { name: 'PWA: manifest.json + next-pwa', desc: 'npm install next-pwa. Criar /public/manifest.json com name, short_name, icons (512px), theme_color, display: standalone. Cachear /cardapio e /dashboard', tag: 'PWA', tc: 'rgba(176,106,255,0.15)', tt: '#b06aff' },
            { name: 'Instalar Sentry para monitoramento', desc: 'npx @sentry/wizard@latest -i nextjs. Configurar SENTRY_DSN no Vercel. Testar que erro de produção chega no dashboard Sentry', tag: 'Ops', tc: 'rgba(232,69,69,0.15)', tt: '#e84545' },
            { name: 'Testes E2E do fluxo crítico', desc: 'Playwright: login garçom → selecionar Marmita 2 carnes → confirmar → verificar que aparece no dashboard cozinha. CI roda os testes antes do deploy', tag: 'QA', tc: 'rgba(60,185,122,0.15)', tt: '#3cb97a' },
        ]
    }
];

const state = {};

function buildRoadmap() {
    const root = document.getElementById('roadmap-root');
    phases.forEach((p, pi) => {
        p.tasks.forEach((_, ti) => state[`${pi}-${ti}`] = false);

        const el = document.createElement('div');
        el.className = 'phase';
        el.id = `ph-${pi}`;

        const tasksHtml = p.tasks.map((t, ti) => `
      <div class="task" id="tk-${pi}-${ti}" onclick="toggleTask(${pi},${ti})">
        <div class="task-check" id="ck-${pi}-${ti}"></div>
        <div class="task-body">
          <div class="task-name">${t.name}</div>
          <div class="task-desc">${t.desc}</div>
        </div>
        <span class="task-tag" style="background:${t.tc};color:${t.tt}">${t.tag}</span>
      </div>
    `).join('');

        el.innerHTML = `
      <div class="phase-header" onclick="togglePhase(${pi})">
        <div class="phase-num">Sprint ${p.num}</div>
        <div class="phase-title">${p.title}</div>
        <div class="phase-meta">${p.meta}</div>
        <div class="phase-progress" id="pp-${pi}">0/${p.tasks.length}</div>
        <div class="phase-chevron">▾</div>
      </div>
      <div class="phase-body">
        <div class="pbar-wrap">
          <div class="pbar"><div class="pbar-fill" id="pb-${pi}" style="width:0%"></div></div>
          <div class="pbar-label" id="pl-${pi}">0 de ${p.tasks.length}</div>
        </div>
        <div class="tasks">${tasksHtml}</div>
      </div>
    `;
        root.appendChild(el);
    });
    updateGlobal();
}

function toggleTask(pi, ti) {
    const key = `${pi}-${ti}`;
    state[key] = !state[key];
    const tk = document.getElementById(`tk-${pi}-${ti}`);
    const ck = document.getElementById(`ck-${pi}-${ti}`);
    tk.classList.toggle('done', state[key]);
    ck.textContent = state[key] ? '✓' : '';
    updatePhase(pi);
    updateGlobal();
}

function updatePhase(pi) {
    const total = phases[pi].tasks.length;
    const done = phases[pi].tasks.filter((_, ti) => state[`${pi}-${ti}`]).length;
    const pct = done / total * 100;
    document.getElementById(`pb-${pi}`).style.width = pct + '%';
    document.getElementById(`pl-${pi}`).textContent = `${done} de ${total}`;
    document.getElementById(`pp-${pi}`).textContent = `${done}/${total}`;
}

function updateGlobal() {
    const keys = Object.keys(state);
    const done = keys.filter(k => state[k]).length;
    const total = keys.length;
    const pct = total ? Math.round(done / total * 100) : 0;
    document.getElementById('g-bar').style.width = pct + '%';
    document.getElementById('g-label').textContent = `${done} de ${total} tarefas concluídas — ${pct}% do roadmap`;
}

function togglePhase(pi) {
    document.getElementById(`ph-${pi}`).classList.toggle('collapsed');
}

buildFlow();
buildRoadmap();
