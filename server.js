const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Middleware de arquivos estáticos
app.use("/uploads", express.static("uploads"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Configuração do Multer para upload
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

// Rota principal: exibe formulário e lista PDFs da pasta
app.get("/", (req, res) => {
  fs.readdir("uploads", (err, files) => {
    if (err) {
      return res.status(500).send("Erro ao listar arquivos.");
    }

    let html = `
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
      <meta charset="UTF-8" />
      <title>Painel Admin - Upload de Edital</title>
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

    if (files.length === 0) {
      html += `<p>Nenhum edital encontrado.</p>`;
    } else {
      for (const filename of files) {
        html += `
        <div class="card">
          <h3>${filename}</h3>
          <p><strong>Descrição:</strong> (descrição indisponível)</p>
          <a href="/uploads/${encodeURIComponent(
            filename
          )}" target="_blank">Abrir PDF</a>
          <form action="/delete/${encodeURIComponent(
            filename
          )}" method="POST" onsubmit="return confirm('Tem certeza que quer excluir este edital?');">
            <button type="submit">Excluir</button>
          </form>
        </div>
        `;
      }
    }

    html += `
        </div>
      </div>
    </body>
    </html>`;
    res.send(html);
  });
});

// Rota para upload de arquivo
app.post("/upload", upload.single("pdfFile"), (req, res) => {
  if (!req.file) return res.status(400).send("Nenhum arquivo enviado.");
  res.redirect("/");
});

// Rota para deletar arquivo
app.post("/delete/:nomeArquivo", (req, res) => {
  const nomeArquivo = req.params.nomeArquivo;
  const caminho = path.join(__dirname, "uploads", nomeArquivo);

  fs.unlink(caminho, (err) => {
    if (err) {
      console.error("Erro ao deletar arquivo:", err);
      return res.status(500).send("Erro ao deletar arquivo.");
    }
    res.redirect("/");
  });
});

// Tratamento de erros gerais
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).send("Arquivo muito grande. Limite: 10MB.");
  }
  if (err.message) {
    return res.status(400).send(err.message);
  }
  res.status(500).send("Erro interno do servidor.");
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em: http://localhost:${PORT}`);
});
