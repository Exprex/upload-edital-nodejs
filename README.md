# 📑 Painel de Upload de Editais

Este é um projeto web criado com **Node.js**, **Express**, **Multer** e **PostgreSQL**, que permite o **upload, listagem e exclusão de arquivos PDF** com uma descrição.

---

## 🚀 Funcionalidades

- 📤 Upload de arquivos PDF com descrição
- 📋 Listagem de todos os arquivos enviados
- 📁 Abertura dos PDFs direto no navegador
- 🗑️ Exclusão de arquivos do banco de dados e do servidor
- 💅 Interface básica com HTML + CSS

---

## ⚙️ Tecnologias usadas

- Node.js + Express
- Multer (para upload de arquivos)
- PostgreSQL (armazenamento dos dados dos editais)
- HTML + CSS

---

## 🛠️ Como rodar o projeto

### 1. Instale as dependências
npm install
### 2. Configurar Banco de Dados
CREATE TABLE editais (
  id SERIAL PRIMARY KEY,
  nome_original TEXT NOT NULL,
  nome_salvo TEXT NOT NULL,
  descricao TEXT NOT NULL
);
### 3. Atualize os dados de conexão com o banco
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "editais_db",
  password: "ufc123",
  port: 5432
})
### 4. Crie a pasta para os uploads
mkdir uploads
### 5. Inicie o Servidor 
node server.js
