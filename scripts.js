// Inicialização do IndexedDB
let db;
let nextSoundId = 1;
const request = indexedDB.open('playList', 1);
request.onerror = function() {
    console.log('Erro ao abrir o banco de dados');
};
request.onsuccess = function() {
    db = request.result;
    carregarPlaylist();
};
request.onupgradeneeded = function(e) {
    const db = e.target.result;
    if (!db.objectStoreNames.contains('sons')) {
        db.createObjectStore('sons', { keyPath: 'id' });
    }
};

const controleVolume = document.getElementById('volume');
let lastAudio;
const sonsCarregados = {};

controleVolume.addEventListener('input', function() {
    let valorVolume = controleVolume.value;
    if (lastAudio) {
        lastAudio.volume = valorVolume / 100;
    }
    atualizarLabelVolume(valorVolume); // Chama a função para atualizar a label
});
function atualizarLabelVolume(valorVolume) {
    document.getElementById('volume-label').innerText = 'Volume: ' + valorVolume + '%';
}


function carregarPlaylist() {
    const store = db.transaction('sons').objectStore('sons');
    store.openCursor().onsuccess = function(e) {
        const cursor = e.target.result;
        if (cursor) {
            const idNum = parseInt(cursor.value.id.replace('sound', ''), 10);
            if (idNum >= nextSoundId) {
                nextSoundId = idNum + 1;
            }
            sonsCarregados[cursor.value.id] = cursor.value.src;
            generateNewButton(cursor.value.fileName, cursor.value.id);
            cursor.continue();
        }
    };
}


function saveSounds() {
    const transaction = db.transaction(['sons'], 'readwrite');
    const store = transaction.objectStore('sons');
    store.clear();

    const buttons = document.querySelectorAll('.button-sound');
    buttons.forEach((button, index) => {
        store.put({
            id: button.id,
            src: sonsCarregados[button.id],
            fileName: button.innerText,
            position: index
        });
    });

    alert('Sons salvos com sucesso!');
}

function deletePlaylist() {
    if (confirm('Você realmente deseja apagar toda a playlist?')) {
        const transaction = db.transaction(['sons'], 'readwrite');
        const store = transaction.objectStore('sons');
        store.clear();
        document.getElementById('buttons-container').innerHTML = '';
        alert('Playlist apagada com sucesso!');
    }
}

function playSound(id) {
    const botao = document.getElementById(id);
    if (!botao) return;

    if (lastAudio) {
        lastAudio.pause();
        lastAudio.currentTime = 0;
        const playingButton = document.querySelector('.playing');
        if (playingButton) {
            playingButton.classList.remove('playing');
        }
    }

    botao.classList.add('playing');
    const srcAudio = sonsCarregados[id];
    let audio = new Audio(srcAudio);
    lastAudio = audio;

    audio.volume = controleVolume.value / 100;

    audio.addEventListener('timeupdate', function() {
        updateProgressiveTime(audio);
        updateRegressiveTime(audio);
    });

    audio.play();

    audio.addEventListener('ended', function() {
        botao.classList.remove('playing');
    });
}

function updateProgressiveTime(audio) {
    const time = formatTime(audio.currentTime);
    document.getElementById('progressive-time').innerText = time;
}

function updateRegressiveTime(audio) {
    const time = formatTime(audio.duration - audio.currentTime);
    document.getElementById('regressive-time').innerText = time;
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds - (hours * 3600)) / 60);
    const remainingSeconds = seconds % 60;

    return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds.toFixed(0))}`;
}

function pad(number) {
    return String(number).padStart(2, '0');
}

function uploadAudio() {
    const entradaAudio = document.getElementById('audio-upload');
    const arquivos = entradaAudio.files;

    Array.from(arquivos).forEach((arquivo, index) => {
        const id = `sound${index + 1}`;
        const nomeCodificado = encodeURIComponent(arquivo.name); // Codifica o nome do arquivo
        const leitor = new FileReader();

        leitor.onload = function(e) {
            sonsCarregados[id] = e.target.result;
            generateNewButton(nomeCodificado, id); // Chama com o nome codificado
        };

        leitor.readAsDataURL(arquivo);
    });

    const mensagemUpload = document.getElementById('upload-message');
    mensagemUpload.innerText = 'Áudios carregados com sucesso!';
}


function generateNewButton(fileName, id) {
    const containerBotoes = document.getElementById('buttons-container');
    const nomeDecodificado = decodeURIComponent(fileName); // Decodifica o nome do arquivo
    const nomeSemExtensao = nomeDecodificado.split('.').slice(0, -1).join('.');
    const nomeBotao = nomeSemExtensao.length <= 30 ? nomeSemExtensao : nomeSemExtensao.substring(0, 30);
    // console.log(`Buttaum ${nomeDecodificado}`);
    // console.log(nomeSemExtensao.length <= 30);

    const botao = document.createElement('button');
    botao.id = id;
    botao.innerText = nomeDecodificado;
    botao.onclick = () => playSound(id);
    botao.classList.add('button-sound');
    botao.draggable = true;
    botao.addEventListener('contextmenu', deleteButton);

    botao.addEventListener('dragstart', dragStart);
    containerBotoes.addEventListener('dragover', dragOver);
    containerBotoes.addEventListener('drop', drop);
    botao.addEventListener('dragend', dragEnd);

    containerBotoes.appendChild(botao);
}

function deleteButton(e) {
    e.preventDefault();
    if (confirm('Você realmente deseja excluir este áudio da lista?')) {
        const id = e.currentTarget.id;
        e.currentTarget.remove();
        const transaction = db.transaction(['sons'], 'readwrite');
        const store = transaction.objectStore('sons');
        store.delete(id);
        delete sonsCarregados[id];
    }
}

let draggedElement = null;

function dragStart(e) {
    draggedElement = e.currentTarget;
    e.dataTransfer.setData('text/plain', e.currentTarget.id);
}

function dragOver(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const dropTarget = e.target;
    const containerBotoes = document.getElementById('buttons-container');

    if (dropTarget.className === 'button-sound') {
        containerBotoes.insertBefore(draggedElement, dropTarget);
    } else {
        containerBotoes.appendChild(draggedElement);
    }
}

function dragEnd() {
    draggedElement = null;
}

function stopSound() {
    if (lastAudio) {
        lastAudio.pause();
        lastAudio.currentTime = 0;
        const playingButton = document.querySelector('.playing');
        if (playingButton) {
            playingButton.classList.remove('playing');
        }
    }
}

function searchSound() {
    const query = document.getElementById('search-input').value.trim().toLowerCase();
    const buttons = document.querySelectorAll('.button-sound');
    let found = false;

    buttons.forEach((button) => {
        if (query === '' || button.innerText.trim().toLowerCase().includes(query)) {
            button.style.display = 'block';
            found = true;
        } else {
            button.style.display = 'none';
        }
    });

    const mensagemBusca = document.getElementById('search-message');
    if (!found && query !== '') {
        mensagemBusca.innerText = 'Nenhum áudio correspondente encontrado!';
    } else {
        mensagemBusca.innerText = '';
    }
}
const searchInput = document.getElementById('search-input');
searchInput.addEventListener('keyup', function(e) {
    if (e.key === 'Enter' || e.keyCode === 13) {
        searchSound();
    }
});

function carregarAudiosPredefinidos() {
    fetch('/getSounds')
        .then(response => response.json())
        .then(audioFiles => {
            audioFiles.forEach(fileName => {
                const id = 'sound' + nextSoundId;
                nextSoundId++;
                const src = '/sounds/' + fileName;
                sonsCarregados[id] = src;
                generateNewButton(fileName, id);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar áudios predefinidos:', error);
        });
}
