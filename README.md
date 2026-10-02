# UP Play — A Sintonia Inteligente da UP Fitness

Plataforma inteligente de experiência musical, gestão de trilha sonora em tempo real, dedicatórias e interatividade para academias UP Fitness.

---

## 🚀 Visão Geral da Arquitetura

* **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion.
* **Backend:** Node.js, Express, Socket.IO (transmissão de estado em tempo real).
* **Banco de Dados:** PostgreSQL com Drizzle ORM.
* **Autenticação & Segurança:** JWT assinado criptograficamente, senhas com hash `bcrypt` (10 rounds), validação criptográfica de Google ID Token (`google-auth-library`), RBAC com controle estrito nos endpoints do servidor.
* **Áudio Contínuo:** `BackgroundAudioEngine` com suporte à W3C Media Session API para controles de tela bloqueada e integração com o elemento de mídia nativo.

---

## 🔒 Perfis de Acesso (RBAC)

1. **Gestor (`GESTOR`):** Controle mestre da reprodução (Play, Pause, Stop, Seek, Next, Previous), seleção direta de faixas, aprovação/rejeição de pedidos, gerenciamento de alunos, anúncios e relatórios.
2. **Professor (`PROFESSOR`):** Prioridade em pedidos musicais, interação no chat/dedicatórias e visualização da fila.
3. **Aluno (`ALUNO`):** Sugestões de músicas via link do YouTube ou catálogo direto em 1 clique, votos na Fila da Galera, curtidas e dedicatórias moderadas por IA.

---

## 🛠️ Instalação e Execução

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
Copie o arquivo `.env.example` para `.env` e defina suas credenciais:
```bash
cp .env.example .env
```

### 3. Executar em modo de desenvolvimento
```bash
npm run dev
```
O servidor será iniciado na porta configurada (padrão: `3000`).

### 4. Build de produção
```bash
npm run build
```

### 5. Iniciar em produção
```bash
npm run start
```

---

## 📋 Verificação e Qualidade
* **Tipagem & Linter:** `npm run lint` (`tsc --noEmit`)
* **Compilação:** `npm run build` (Vite + esbuild para o servidor CJS)
