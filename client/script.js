let playerId = null;
let gameState = null;
let selectedCharacter = null;

const boardElement = document.getElementById('board');
const currentPlayerElement = document.getElementById('current-player');
const selectedCharacterElement = document.getElementById('selected-character');
const moveButtonsElement = document.getElementById('move-buttons');
const moveHistoryElement = document.getElementById('move-history');
const gameOverElement = document.getElementById('game-over');
const winnerAnnouncementElement = document.getElementById('winner-announcement');

const chatMessagesElement = document.getElementById('chat-messages');
const chatInputElement = document.getElementById('chat-input');
const chatSendButton = document.getElementById('chat-send');

const socket = new WebSocket('ws://localhost:6789');

socket.addEventListener('open', function () {
    console.log('Connected to the game server.');
});

socket.addEventListener('message', function (event) {
    const data = JSON.parse(event.data);

    if (data.type === 'player_assignment') {
        playerId = data.player_id;
        console.log(`You are player: ${playerId}`);
    }

    if (data.type === 'update') {
        gameState = data.state;
        renderBoard();
        currentPlayerElement.textContent = `Current Player: ${gameState.current_player}`;
        if (data.message) {
            console.log(data.message);
            if (data.message.includes('wins')) {
                handleGameOver(data.message);
            }
        }
        renderMoveHistory();
    }

    if (data.type === 'chat') {
        addChatMessage(data.message);
    }
});

function renderBoard() {
    boardElement.innerHTML = '';
    gameState.board.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const cellElement = document.createElement('div');
            cellElement.textContent = cell;
            cellElement.dataset.row = rowIndex;
            cellElement.dataset.col = colIndex;
            cellElement.className = cell === "" ? "empty" : cell[0];
            cellElement.addEventListener('click', () => onCellClick(rowIndex, colIndex, cell));
            boardElement.appendChild(cellElement);
        });
    });
}

function onCellClick(row, col, character) {
    if (character.startsWith(playerId) && playerId === gameState.current_player) {
        selectedCharacter = character;
        selectedCharacterElement.textContent = character;
        renderMoveButtons(character);
    }
}

function renderMoveButtons(character) {
    moveButtonsElement.innerHTML = '';
    let moves;
    if (character.includes('H3')) {
        moves = ['FL', 'FR', 'BL', 'BR', 'RF', 'LF', 'RB', 'LB'];
    } else if (character.includes('H2')) {
        moves = ['FL', 'FR', 'BL', 'BR'];
    } else if (character.includes('H1')) {
        moves = ['L', 'R', 'F', 'B'];
    } else {
        moves = ['L', 'R', 'F', 'B'];
    }
    moves.forEach(move => {
        const button = document.createElement('button');
        button.textContent = move;
        button.className = 'move-button';
        button.addEventListener('click', () => makeMove(character, move));
        moveButtonsElement.appendChild(button);
    });
}

function makeMove(character, move) {
    socket.send(JSON.stringify({
        type: 'move',
        player: playerId,
        character: character,
        move: move
    }));
}

function renderMoveHistory() {
    moveHistoryElement.innerHTML = '<h3>Move History</h3><ul>';
    gameState.move_history.forEach(move => {
        const li = document.createElement('li');
        li.textContent = move;
        moveHistoryElement.appendChild(li);
    });
    moveHistoryElement.innerHTML += '</ul>';
}

function handleGameOver(message) {
    winnerAnnouncementElement.textContent = message;
    gameOverElement.style.display = 'block';
}

function restartGame() {
    gameOverElement.style.display = 'none';
    socket.send(JSON.stringify({ type: 'restart' }));
}

// Chat Functionality
chatSendButton.addEventListener('click', function () {
    const message = chatInputElement.value;
    if (message.trim() !== '') {
        socket.send(JSON.stringify({
            type: 'chat',
            message: `[${playerId}] ${message}`
        }));
        chatInputElement.value = '';
    }
});

function addChatMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    chatMessagesElement.appendChild(messageElement);
    chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
}
