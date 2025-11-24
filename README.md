# 🥬 Sistema de Gestão de Quitanda - Verduras Ouro Verde

Sistema completo de gestão para quitanda de hortifrúti, desenvolvido com React, FastAPI e MongoDB.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Arquitetura](#arquitetura)
- [Requisitos](#requisitos)
- [Instalação e Execução](#instalação-e-execução)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Como Usar](#como-usar)
- [Importação de Dados via CSV](#importação-de-dados-via-csv)
- [Manutenção](#manutenção)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Sobre o Projeto

Sistema web completo para gerenciamento de quitanda de hortifrúti, substituindo planilhas Excel por uma solução profissional e integrada.

### Funcionalidades Principais

✅ **Gestão de Clientes**
- Cadastro completo de clientes
- Importação em lote via CSV
- Busca e filtros avançados

✅ **Gestão de Produtos**
- Cadastro de produtos com código (CP)
- Controle de estoque
- Categorização por tipo
- Importação em massa via CSV

✅ **Sistema de Vendas**
- Painel de vendas intuitivo
- Busca de produtos por código ou nome (com preview)
- Vendas com ou sem cadastro de cliente
- Impressão de nota térmica (80mm)

✅ **Histórico e Analytics**
- Lista completa de vendas com filtros
- Dashboard com gráficos interativos
- Análise por período, produto, categoria
- Relatórios de faturamento

✅ **Sistema 100% Local**
- Sem necessidade de autenticação
- Acesso direto a todas as funcionalidades
- Pronto para uso imediato

---

## 🛠 Tecnologias Utilizadas

### Backend
- **FastAPI** (Python) - Framework web moderno e rápido
- **MongoDB** - Banco de dados NoSQL
- **JWT** - Autenticação segura
- **Motor** - Driver async para MongoDB

### Frontend
- **React** - Biblioteca JavaScript para UI
- **React Router** - Navegação SPA
- **Axios** - Cliente HTTP
- **Recharts** - Gráficos interativos
- **Sonner** - Sistema de notificações
- **Shadcn/UI** - Componentes de interface

### Infraestrutura
- **Docker** - Containerização
- **Docker Compose** - Orquestração de containers
- **Nginx** - Servidor web e proxy reverso

---

## 🏗 Arquitetura

```
┌─────────────────────────────────────────────┐
│           PORTA 80 (Host Machine)            │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         NGINX (Container Frontend)           │
│  - Serve arquivos estáticos do React        │
│  - Proxy reverso: /api/* → Backend          │
└────────────┬────────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────────┐  ┌────▼─────────┐
│  Frontend  │  │   Backend    │
│  (React)   │  │  (FastAPI)   │
│  Build     │  │  Port: 8001  │
└────────────┘  └────┬─────────┘
                     │
                ┌────▼──────┐
                │  MongoDB  │
                │ Port:27017│
                └───────────┘
```

---

## 📦 Requisitos

- **Docker** 20.10 ou superior
- **Docker Compose** 2.0 ou superior

**Verificar instalação:**
```bash
docker --version
docker-compose --version
```

---

## 🚀 Instalação e Execução

### 1. Configure as variáveis de ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar conforme necessário (opcional)
nano .env
```

### 2. Build dos containers
```bash
docker-compose build
```

### 3. Iniciar a aplicação
```bash
docker-compose up -d
```

### 4. Verificar status dos containers
```bash
docker-compose ps
```

### 5. Acessar a aplicação
Abra seu navegador em: **http://localhost**

### 6. Login
- **Usuário:** beicola
- **Senha:** adm@123

---

## 📁 Estrutura do Projeto

```
.
├── backend/
│   ├── server.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env
│
├── docker/
│   ├── backend/Dockerfile
│   ├── frontend/Dockerfile
│   └── nginx/default.conf
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔐 Variáveis de Ambiente

### Arquivo `.env`

```env
MONGO_USERNAME=admin
MONGO_PASSWORD=admin123
DB_NAME=quitanda
JWT_SECRET_KEY=verduras-ouro-verde-secret-key-2025
CORS_ORIGINS=*
APP_LOGIN=beicola
APP_PASSWORD=adm@123
```

### Como Alterar Login e Senha

1. Edite o arquivo `.env`
2. Modifique APP_LOGIN e APP_PASSWORD
3. Reinicie: `docker-compose restart backend`

---

## 💻 Como Usar

### Login
1. Acesse http://localhost
2. Faça login com as credenciais

### Cadastro de Clientes
1. Navegue para **Clientes**
2. Preencha o formulário ou use **Importar CSV**

### Realizar Venda
1. Navegue para **Vendas**
2. Digite código ou nome do produto
3. Adicione quantidade e cliente
4. Clique em **EFETUAR VENDA**

### Histórico e Analytics
1. Navegue para **Histórico**
2. Use filtros e visualize gráficos

---

## 📊 Importação CSV

### Clientes
```csv
nome;telefone;email;endereco;sexo;observacao
João Silva;(11) 98765-4321;joao@email.com;Rua A, 123;M;VIP
```

### Vendas
```csv
data_pedido;cliente_nome;cliente_telefone;total_itens;valor_total;observacao
19/11/2025;João Silva;(11) 98765-4321;5;45.50;Teste
```

---

## 🔧 Manutenção

### Ver logs
```bash
docker-compose logs -f
docker-compose logs -f backend
```

### Reiniciar
```bash
docker-compose restart
```

### Parar
```bash
docker-compose down
```

### Rebuild
```bash
docker-compose down
docker-compose build
docker-compose up -d
```

### Backup MongoDB
```bash
docker exec quitanda-mongodb mongodump --username admin --password admin123 --out /backup
docker cp quitanda-mongodb:/backup ./backup-$(date +%Y%m%d)
```

---

## 🐛 Troubleshooting

### Containers não iniciam
```bash
docker-compose logs
docker system prune -f
docker-compose up -d
```

### Porta 80 em uso
```bash
sudo lsof -i :80
sudo service apache2 stop
```

### Erro de autenticação
1. Verifique `.env`
2. Reinicie backend
3. Limpe cache do navegador

---

## 🎉 Começando

```bash
# Inicie
docker-compose up -d

# Acesse
http://localhost

# Login
Usuário: beicola
Senha: adm@123
```

**Boas vendas! 🥬🍅🥕**