const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

// Servir arquivos estáticos do diretório /public
app.use(express.static(path.join(__dirname, 'public')));

app.get('/getSounds', (req, res) => {
  // Ajustar o caminho para a pasta sounds que está dentro de /public
  const soundsDir = path.join(__dirname, 'public', 'sounds');

  fs.readdir(soundsDir, (err, files) => {
    if (err) {
      res.status(500).send({ error: 'Falha ao ler a pasta de sons.' });
      return;
    }
    const audioFiles = files.filter(file =>
      ['.mp3', '.wav'].includes(path.extname(file)),
    );
    res.send(audioFiles);
  });
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000.');
});
