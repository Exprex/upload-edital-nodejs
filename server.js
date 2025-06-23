const express = require("express");
const multer = require("multer");
const path = require("path");
const { Pool } = require("pg");
const fs = require("fs");
const app = express();
const PORT = 3000;

//banco
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "editais_db",
  password: "ufc123",
  port: 5432,
});

//css
app.use(express.static("public"));

//svpdf
app.use("/uploads", express.static("uploads"));

//visulari form
app.use(express.urlencoded({ extended: true }));

//confmulter
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, file.originalname.replace(".pdf", "") + "-" + uniqueSuffix);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Apenas arquivos PDF são permitidos!"), false);
    }
    cb(null, true);
  },
});

// route de upload + listagem
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM editais ORDER BY id DESC");
    const editais = result.rows;

    let html = `
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
      <meta charset="UTF-8" />
      <title>Painel Admin - Upload e Listagem de Editais</title>
      <link rel="stylesheet" href="/style.css" />
    </head>
    <body>
      <div class="container">
        <h1>Upload de Edital</h1>
        <form action="/upload" method="POST" enctype="multipart/form-data">
          <label for="pdfFile">Escolha um arquivo PDF:</label>
          <input type="file" name="pdfFile" accept="application/pdf" required />
          <label for="descricao">Descrição:</label>
          <textarea id="descricao" name="descricao" rows="4" placeholder="Digite uma descrição aqui..." required></textarea>
          <button type="submit">Enviar</button>
        </form>

        <h2>Editais Enviados</h2>
        <div class="cards">
    `;

    for (const edital of editais) {
      html += `
        <div class="card">
          <h3>${edital.nome_original}</h3>
          <p><strong>Descrição:</strong> ${edital.descricao}</p>
          <a href="/uploads/${encodeURIComponent(
            edital.nome_salvo
          )}" target="_blank">Abrir PDF</a>
          <form action="/delete/${
            edital.id
          }" method="POST" onsubmit="return confirm('Tem certeza que quer excluir este edital?');">
            <button type="submit">Excluir</button>
          </form>
        </div>
      `;
    }

    html += `
        </div>
      </div>
    </body>
    </html>
    `;

    res.send(html);
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao buscar dados.");
  }
});

// Up Edital
app.post("/upload", upload.single("pdfFile"), async (req, res) => {
  if (!req.file) return res.status(400).send("Nenhum arquivo enviado.");

  const descricao = req.body.descricao || "Sem descrição";

  try {
    await pool.query(
      "INSERT INTO editais (nome_original, nome_salvo, descricao) VALUES ($1, $2, $3)",
      [req.file.originalname, req.file.filename, descricao]
    );
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao salvar no banco.");
  }
});

// excluir edital
app.post("/delete/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const result = await pool.query(
      "SELECT nome_salvo FROM editais WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Edital não encontrado.");
    }

    const nomeArquivo = result.rows[0].nome_salvo;

    await pool.query("DELETE FROM editais WHERE id = $1", [id]);

    fs.unlink(path.join(__dirname, "uploads", nomeArquivo), (err) => {
      if (err) console.error("Erro ao deletar arquivo:", err);
    });

    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao excluir edital.");
  }
});

// erros
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).send("Arquivo muito grande. Limite: 10MB.");
  }
  if (err.message) {
    return res.status(400).send(err.message);
  }
  res.status(500).send("Erro interno do servidor.");
});

// servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em: http://localhost:${PORT}`);
});
