const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

app.get('/getSounds', (req, res) => {
    const soundsDir = path.join(__dirname, 'sounds');
    fs.readdir(soundsDir, (err, files) => {
        if (err) {
            res.status(500).send({ error: 'Falha ao ler a pasta de sons.' });
            return;
        }
        const audioFiles = files.filter(file => ['.mp3', '.wav'].includes(path.extname(file)));
        res.send(audioFiles);
    });
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000.');
});
