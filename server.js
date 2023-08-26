const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

// Servir arquivos estáticos do diretório /public

const multer = require('multer');
const upload = multer({ dest: 'public/videos/' });

app.post('/uploadVideo', upload.array('video'), (req, res) => {
    if (!req.files) {
        return res.status(400).send('Nenhum arquivo foi enviado.');
    }
    res.status(200).send('Upload concluído com sucesso.');
});
app.use(express.static(path.join(__dirname, 'public')));

app.get('/getVideos', (req, res) => {
  // Ajustar o caminho para a pasta videos que está dentro de /public
  const videosDir = path.join(__dirname, 'public', 'videos');

  fs.readdir(videosDir, (err, files) => {
    if (err) {
      res.status(500).send({ error: 'Falha ao ler a pasta de sons.' });
      return;
    }
    const audioFiles = files.filter(file =>
      ['.mp4'].includes(path.extname(file)),
    );
    res.send(audioFiles);
  });
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000.');
});
