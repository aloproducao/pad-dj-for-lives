// Inicialização do IndexedDB
let db;
let nextSoundId = 1;
const request = indexedDB.open('playList', 2);
request.onerror = function() {
    console.log('Erro ao abrir o banco de dados');
};
request.onsuccess = function() {
    db = request.result;
    carregarPlaylist();
};
request.onupgradeneeded = function(e) {
    const db = e.target.result;
    if (!db.objectStoreNames.contains('videos')) {
        db.createObjectStore('videos', { keyPath: 'id' });
    }
};

const controleVolume = document.getElementById('volume');
let lastVideo;
const videosCarregados = {};

controleVolume.addEventListener('input', function() {
    let valorVolume = controleVolume.value;
    if (lastVideo) {
        lastVideo.volume = valorVolume / 100;
    }
    atualizarLabelVolume(valorVolume); // Chama a função para atualizar a label
});
function atualizarLabelVolume(valorVolume) {
    document.getElementById('volume-label').innerText = 'Volume: ' + valorVolume + '%';
}


function carregarPlaylist() {
    const store = db.transaction('videos').objectStore('videos');
    store.openCursor().onsuccess = function(e) {
        const cursor = e.target.result;
        if (cursor) {
            const idNum = parseInt(cursor.value.id.replace('video', ''), 10);
            if (idNum >= nextSoundId) {
                nextSoundId = idNum + 1;
            }
            videosCarregados[cursor.value.id] = cursor.value.src;
            generateNewButton(cursor.value.fileName, cursor.value.id);
            cursor.continue();
        }
    };
}


function saveVideos() {
    const transaction = db.transaction(['videos'], 'readwrite');
    const store = transaction.objectStore('videos');
    store.clear();

    const buttons = document.querySelectorAll('.button-video');
    buttons.forEach((button, index) => {
        store.put({
            id: button.id,
            src: videosCarregados[button.id],
            fileName: button.innerText,
            position: index
        });
    });

    alert('Sons salvos com sucesso!');
}

function deletePlaylist() {
    if (confirm('Você realmente deseja apagar toda a playlist?')) {
        const transaction = db.transaction(['videos'], 'readwrite');
        const store = transaction.objectStore('videos');
        store.clear();
        document.getElementById('buttons-container').innerHTML = '';
        alert('Playlist apagada com sucesso!');
    }
}


function playSound(id) {
    const botao = document.getElementById(id);
    if (!botao) return;

    if (lastVideo) {
        lastVideo.pause();
        lastVideo.currentTime = 0;
        const playingButton = document.querySelector('.playing');
        if (playingButton) {
            playingButton.classList.remove('playing');
        }
    }

    botao.classList.add('playing');
    const srcVideo = videosCarregados[id];
    let video = document.getElementById('video-player');
    video.src = srcVideo;
    lastVideo = video;

    video.volume = controleVolume.value / 100;

    video.addEventListener('timeupdate', function() {
        updateProgressiveTime(video);
        updateRegressiveTime(video);
    });

    video.play();

    video.addEventListener('ended', function() {
        botao.classList.remove('playing');
    });
}


function updateProgressiveTime(video) {
    const time = formatTime(video.currentTime);
    document.getElementById('progressive-time').innerText = time;
}

function updateRegressiveTime(video) {
    const time = formatTime(video.duration - video.currentTime);
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

function uploadVideo() {
    
    const entradaVideo = document.getElementById('video-upload');
    const arquivos = entradaVideo.files;

    Array.from(arquivos).forEach((arquivo) => {
        const id = `video${nextSoundId}`;
        nextSoundId++;
        const nomeCodificado = encodeURIComponent(arquivo.name); // Codifica o nome do arquivo
        const leitor = new FileReader();

        leitor.onload = function(e) {
            videosCarregados[id] = e.target.result;
            generateNewButton(nomeCodificado, id); // Chama com o nome codificado
        };

        leitor.readAsDataURL(arquivo);
    });
var mensagemUpload = document.getElementById('mensagem-upload');
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
    botao.classList.add('button-video');
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
        const transaction = db.transaction(['videos'], 'readwrite');
        const store = transaction.objectStore('videos');
        store.delete(id);
        delete videosCarregados[id];
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

    if (dropTarget.className === 'button-video') {
        containerBotoes.insertBefore(draggedElement, dropTarget);
    } else {
        containerBotoes.appendChild(draggedElement);
    }
}

function dragEnd() {
    draggedElement = null;
}

function stopSound() {
    if (lastVideo) {
        lastVideo.pause();
        lastVideo.currentTime = 0;
        const playingButton = document.querySelector('.playing');
        if (playingButton) {
            playingButton.classList.remove('playing');
        }
    }
}

function searchSound() {
    const query = document.getElementById('search-input').value.trim().toLowerCase();
    const buttons = document.querySelectorAll('.button-video');
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

function carregarVideosPredefinidos() {
    fetch('/getVideos')
        .then(response => response.json())
        .then(videoFiles => {
            videoFiles.forEach(fileName => {
                const id = 'video' + nextSoundId;
                nextSoundId++;
                const src = '/videos/' + fileName;
                videosCarregados[id] = src;
                generateNewButton(fileName, id);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar áudios predefinidos:', error);
        });
}
function carregarVideosDaPasta() {
    fetch('/getVideos')
        .then(response => response.json())
        .then(videoFiles => {
            videoFiles.forEach(fileName => {
                const id = 'video' + nextSoundId;
                nextSoundId++;
                const src = '/videos/' + fileName;
                videosCarregados[id] = src;
                generateNewButton(fileName, id);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar áudios da pasta:', error);
        });
}
document.addEventListener('keydown', function(event) {
    if (event.key === "ArrowDown") {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }
});
