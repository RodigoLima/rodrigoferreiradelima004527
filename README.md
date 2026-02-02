# Pet Core MT

SPA em Angular 21 para gerenciamento de pets e tutores (autenticação JWT, lazy loading, Facades + BehaviorSubject).

---

## Dados da Inscrição e Vaga

| Campo | Valor |
|-------|--------|
| **Candidato** | Rodrigo Ferreira de Lima |
| **E-mail** | ferreirarodrigo230@gmail.com |
| **Vaga** | Engenheiro da Computação - Sênior |
| **Projeto** | Projeto Desenvolvedor Front End |

---

## Índice

1. [Dependências](#dependências)
2. [Como rodar localmente](#como-rodar-localmente)
3. [Como executar os testes](#como-executar-os-testes)
4. [Deploy](#deploy)
5. [Arquitetura](#arquitetura)
6. [Decisões técnicas](#decisões-técnicas)
7. [Estrutura do projeto](#estrutura-do-projeto)

---

## Dependências

| Dependência | Versão | Uso |
|-------------|--------|-----|
| Node.js | 20+ | Build e servidor de desenvolvimento |
| npm | 11.6+ | Instalação de pacotes |
| API backend | — | `https://pet-manager-api.geia.vip` (dev e prod) |

**Configuração da API:**  
- Dev: `pet-core-mt/src/environments/environment.ts` → `apiBaseUrl`  
- Prod: `pet-core-mt/src/environments/environment.prod.ts` → `apiBaseUrl`  

A aplicação **não sobe** a API; ela consome o backend na URL acima. Ajuste esses arquivos se usar outra base URL.

---

## Como rodar localmente

1. Entrar na pasta do frontend:
   ```bash
   cd pet-core-mt
   ```
2. Instalar dependências:
   ```bash
   npm install
   ```
3. Subir o servidor:
   ```bash
   npm start
   ```
4. Acessar no navegador: **http://localhost:4200**  
   (após o login, a rota inicial é `/pets`.)

**Credenciais para testes e validação:**  
- **Usuário:** `admin`  
- **Senha:** `admin`

---

## Como executar os testes

Na pasta `pet-core-mt`:

```bash
npm test
```

Ambiente: **Vitest**. Cobrem facades, interceptors, guards, serviços HTTP e componentes (login, formulários, listagens).

---

## Deploy

**Build de produção:** artefatos em `dist/pet-core-mt/browser/`.

```bash
cd pet-core-mt
npm run build
```

**Container:** imagem final só com Nginx + estáticos (multi-stage: Node build → `nginx:alpine`). O frontend chama a API via `apiBaseUrl` do build (ex.: `https://pet-manager-api.geia.vip`); não é necessário backend na mesma rede.

```bash
cd pet-core-mt
docker build -t pet-core-mt:latest .
docker run --rm -p 8080:80 pet-core-mt:latest
```

Acesso: **http://localhost:8080**.

**Health checks (liveness/readiness):**  
- `GET http://localhost:8080/healthz` → 200 "healthy"  
- `GET http://localhost:8080/readyz` → 200 "ready"  

---

## Arquitetura

Camadas: **Componentes (pages)** → **Facades** (estado via BehaviorSubject) → **API Services** (HTTP) → **Interceptor** (JWT + refresh em 401) → **Backend**.

```
Componentes  →  Facades  →  API Services  →  Interceptor  →  Backend
                 (estado)     (HTTP)          (JWT)
```

- **Lazy loading:** rotas de pets e tutores carregadas sob demanda (`loadChildren`).
- **Estado:** um facade por domínio (Pets, Tutores, Auth); BehaviorSubject + Observables; sem store global.
- **Features:** pastas em `features/` com `models`, `pages` e `services`; novas features seguem o mesmo padrão e são registradas em `app.routes.ts` via `loadChildren`.

---

## Decisões técnicas

| Decisão | Motivo |
|--------|--------|
| **Facade + BehaviorSubject** | Um facade por domínio concentra estado e chamadas à API; BehaviorSubject oferece cache em memória e reatividade sem lib extra (NgRx). |
| **Rotas com loadChildren** | Lazy loading reduz o bundle inicial; `/pets` e `/tutores` só carregam quando acessados. |
| **Interceptor com refresh em 401** | Renovação transparente do token evita logout a cada expiração; fila com BehaviorSubject evita múltiplos refreshes simultâneos. |
| **Vitest** | Testes rápidos, boa integração com Angular e uso de padrões modernos (describe/it). |
| **PrimeNG + Tailwind** | UI consistente e acessível (PrimeNG); layout responsivo e utilitários (Tailwind) com pouco CSS custom. |
| **Docker multi-stage** | Build em Node e runtime só com Nginx + estáticos; imagem menor e sem dependências de build em produção. |
| **Query params em listagens** | Filtros e página na URL permitem compartilhar e recarregar com o mesmo estado (nome, raça, page). |

---

## Estrutura do projeto

```
pet-core-mt/
├── src/app/
│   ├── core/               # Auth, config, HTTP
│   │   ├── auth/
│   │   ├── config/
│   │   └── http/
│   ├── features/           # Módulos lazy
│   │   ├── auth/pages/login/
│   │   ├── pets/           # models, pages, services, pets.routes.ts
│   │   └── tutores/        # models, pages, services, tutores.routes.ts
│   └── shared/forms/       # Diretivas (cpf, telefone)
├── src/environments/       # apiBaseUrl por ambiente
├── Dockerfile              # Multi-stage: Node build → Nginx runtime
├── nginx.conf              # SPA + /healthz, /readyz
└── package.json
```
