# Pet Core MT - Sistema de Gerenciamento de Pets e Tutores

SPA (Single Page Application) desenvolvida em Angular 21 para gerenciamento de pets e tutores, com autenticação JWT, lazy loading de rotas e arquitetura escalável baseada em Facades e BehaviorSubject.

## 📋 Índice

- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Como Rodar Localmente](#como-rodar-localmente)
- [Testes](#testes)
- [Build e Deploy](#build-e-deploy)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Funcionalidades Implementadas](#funcionalidades-implementadas)
- [Decisões e Limites](#decisões-e-limites)

## 🛠 Tecnologias

- **Angular 21** (standalone components, sem NgModules)
- **TypeScript 5.9**
- **TailwindCSS 4** (estilização)
- **PrimeNG 21** (componentes UI)
- **RxJS 7.8** (programação reativa)
- **Vitest** (testes unitários)
- **Docker** + **Nginx** (deploy)

## 🏗 Arquitetura

### Padrão de Arquitetura em Camadas

O projeto segue uma arquitetura em camadas com separação clara de responsabilidades:

```
┌─────────────────────────────────────────┐
│         Componentes (Pages)            │
│  (ListPets, PetDetail, PetForm, etc.) │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│            Facades                      │
│  (PetsFacade, TutoresFacade, AuthFacade)│
│  - BehaviorSubject para estado         │
│  - Lógica de negócio                   │
│  - Observables reativos                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         API Services                    │
│  (PetsApiService, TutoresApiService)    │
│  - Chamadas HTTP tipadas                │
│  - Transformação de dados               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      HTTP Interceptors                  │
│  (AuthInterceptor)                     │
│  - Adiciona token JWT                   │
│  - Refresh automático em 401            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Backend API                     │
│  (PetManagerAPI)                        │
└─────────────────────────────────────────┘
```

### Fluxo de Dados

1. **Componente** → Chama método do **Facade**
2. **Facade** → Gerencia estado via **BehaviorSubject** e chama **API Service**
3. **API Service** → Faz requisição HTTP através do **HttpClient**
4. **Interceptor** → Adiciona token de autenticação automaticamente
5. **Backend** → Processa e retorna dados
6. **Facade** → Atualiza estado e emite novos valores via Observable
7. **Componente** → Reage às mudanças de estado via `async pipe` ou `subscribe`

### Lazy Loading de Rotas

As features são carregadas sob demanda usando lazy loading:

```typescript
{
  path: 'pets',
  loadChildren: () => import('./features/pets/pets.routes').then(m => m.petsRoutes),
  canActivate: [authGuard]
}
```

Isso reduz o bundle inicial e melhora o tempo de carregamento da aplicação.

### Gerenciamento de Estado com BehaviorSubject

Cada Facade mantém seu próprio estado usando `BehaviorSubject`:

- **Estado imutável**: Novos estados são criados via spread operator
- **Observables públicos**: Componentes se inscrevem via `async pipe`
- **Estado centralizado**: Toda lógica de estado fica no Facade

Exemplo:
```typescript
private stateSubject = new BehaviorSubject<PetsState>(INITIAL_STATE);
state$ = this.stateSubject.asObservable();
pets$ = this.state$.pipe(map(state => state.pets));
```

## 🚀 Como Rodar Localmente

### Pré-requisitos

- Node.js 20 ou superior
- npm 11.6.2 ou superior
- Backend PetManagerAPI rodando em `http://localhost:8080/api`

### Instalação

1. Clone o repositório e entre no diretório do projeto:
```bash
cd pet-core-mt
```

2. Instale as dependências:
```bash
npm install
```

3. Configure a URL da API por ambiente (se necessário):
   - Desenvolvimento: `src/environments/environment.ts` → `apiBaseUrl`
   - Produção: `src/environments/environment.prod.ts` → `apiBaseUrl`

4. Inicie o servidor de desenvolvimento:
```bash
npm start
```

Ou usando Angular CLI diretamente:
```bash
ng serve
```

5. Acesse a aplicação:
   - Abra o navegador em `http://localhost:4200`
   - A aplicação redireciona automaticamente para `/pets` após login

### Variáveis de Ambiente

Por padrão:

- **Dev (`ng serve`)**: `apiBaseUrl = http://localhost:8080/api` em `src/environments/environment.ts`
- **Prod (`ng build` / Docker)**: `apiBaseUrl = /api` em `src/environments/environment.prod.ts`

Para alterar:

1. Edite `src/environments/environment.ts` (desenvolvimento) e/ou `src/environments/environment.prod.ts` (produção)
2. Ajuste `apiBaseUrl` para a URL desejada (ex.: `https://api.seudominio.com/api`)

## 🧪 Testes

### Executar Testes Unitários

```bash
npm test
```

Ou usando Angular CLI:
```bash
ng test
```

Os testes são executados com **Vitest** e incluem:

- Testes de Facades (estado, loading, erros)
- Testes de Interceptors (autenticação, refresh)
- Testes de Guards (proteção de rotas)
- Testes de Componentes (montagem, interações)

## 📦 Build e Deploy

### Build para Produção

```bash
npm run build
```

O build gera os artefatos em `dist/pet-core-mt/browser/`.

### Build para Desenvolvimento

Se precisar gerar um build com as configurações de desenvolvimento:

```bash
ng build --configuration development
```

### Deploy com Docker 

O projeto inclui um Dockerfile multi-stage otimizado:

1. **Build da imagem**:
```bash
docker build -t pet-core-mt:latest .
```

2. **Executar o container**:
```bash
docker run -d -p 8080:80 --name pet-core-mt pet-core-mt:latest
```

3. **Verificar health checks**:
```bash
curl http://localhost:8080/healthz
curl http://localhost:8080/readyz
```

4. **Acessar a aplicação**:
   - Abra `http://localhost:8080` no navegador

### Health Checks

O container inclui health checks configurados:

- **`/healthz`**: Endpoint de liveness (saúde do container)
- **`/readyz`**: Endpoint de readiness (pronto para receber tráfego)

Ambos retornam `200 OK` quando o Nginx está funcionando.

## 📁 Estrutura do Projeto

```
pet-core-mt/
├── src/
│   ├── app/
│   │   ├── core/                    # Infraestrutura central
│   │   │   ├── auth/                # Autenticação JWT
│   │   │   │   ├── auth-api.service.ts
│   │   │   │   ├── auth.facade.ts
│   │   │   │   ├── auth.guard.ts
│   │   │   │   ├── auth.interceptor.ts
│   │   │   │   └── auth-storage.service.ts
│   │   │   ├── config/              # Configurações
│   │   │   │   └── api.config.ts
│   │   │   └── http/                # Helpers HTTP
│   │   │       ├── error-handler.service.ts
│   │   │       └── http-helper.service.ts
│   │   ├── features/                # Features (lazy loaded)
│   │   │   ├── pets/
│   │   │   │   ├── models/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── list-pets/
│   │   │   │   │   ├── pet-detail/
│   │   │   │   │   └── pet-form/
│   │   │   │   ├── services/
│   │   │   │   │   ├── pets-api.service.ts
│   │   │   │   │   └── pets.facade.ts
│   │   │   │   └── pets.routes.ts
│   │   │   └── tutores/
│   │   │       ├── models/
│   │   │       ├── pages/
│   │   │       │   ├── list-tutores/
│   │   │       │   ├── tutor-detail/
│   │   │       │   └── tutor-form/
│   │   │       ├── services/
│   │   │       │   ├── tutores-api.service.ts
│   │   │       │   └── tutores.facade.ts
│   │   │       └── tutores.routes.ts
│   │   ├── pages/                   # Páginas públicas
│   │   │   └── login/
│   │   ├── shared/                   # Componentes compartilhados
│   │   │   └── forms/
│   │   │       ├── cpf-mask.directive.ts
│   │   │       └── phone-mask.directive.ts
│   │   ├── app.config.ts            # Configuração da aplicação
│   │   ├── app.routes.ts            # Rotas principais
│   │   └── app.html                 # Shell da aplicação
│   ├── styles.css                    # Estilos globais
│   └── index.html
├── Dockerfile                        # Build multi-stage
├── nginx.conf                        # Configuração Nginx
├── package.json
└── README.md
```

## ✅ Funcionalidades Implementadas

### Autenticação
- [x] Login com JWT
- [x] Refresh automático de token
- [x] Interceptor para adicionar token nas requisições
- [x] Guard para proteger rotas privadas
- [x] Armazenamento seguro de tokens (sessionStorage)

### Feature Pets
- [x] Listagem com paginação (10 por página)
- [x] Busca por nome com debounce
- [x] Detalhamento do pet
- [x] Exibição de tutor(es) vinculado(s) no detalhe
- [x] Cadastro de novo pet
- [x] Edição de pet existente
- [x] Upload de foto do pet
- [x] Exclusão de pet com confirmação

### Feature Tutores
- [x] Listagem de tutores
- [x] Detalhamento do tutor
- [x] Cadastro de novo tutor
- [x] Edição de tutor existente
- [x] Upload de foto do tutor
- [x] Máscara de telefone (diretiva)
- [x] Vinculação de pet ao tutor
- [x] Desvinculação de pet do tutor
- [x] Exclusão de tutor com confirmação

### Infraestrutura
- [x] Configuração HTTP centralizada
- [x] Tratamento de erros consistente
- [x] Lazy loading de rotas
- [x] Health checks (`/healthz` e `/readyz`)
- [x] Dockerfile multi-stage otimizado
- [x] Nginx configurado para SPA

### UI/UX
- [x] Layout responsivo com TailwindCSS
- [x] Componentes PrimeNG para UI consistente
- [x] Feedback visual (loading, erros, sucesso)
- [x] Confirmações para ações destrutivas

## 🎯 Decisões e Limites

### Decisões Arquiteturais

1. **Facade Pattern**: Escolhido para centralizar lógica de negócio e estado, facilitando testes e manutenção.

2. **BehaviorSubject**: Usado em vez de NgRx para manter simplicidade, já que o estado é relativamente simples.

3. **Standalone Components**: Angular 21 sem NgModules para reduzir boilerplate e melhorar tree-shaking.

4. **Lazy Loading**: Todas as features são carregadas sob demanda para otimizar bundle inicial.

5. **SessionStorage**: Tokens armazenados em sessionStorage (limpa ao fechar aba) em vez de localStorage por segurança.

6. **Docker Multi-stage**: Build separado do runtime para reduzir tamanho da imagem final.
