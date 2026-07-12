import { players, setEditIndex } from './state.js';

export function updatePlayerList() {
    const listBody = document.getElementById('playerListBody');
    const countSpan = document.getElementById('playerCount');
    listBody.innerHTML = '';
    countSpan.textContent = players.length;

    players.forEach((player, index) => {
        const li = document.createElement('li');
        li.className = 'player-item';
        const badgeClass = player.equipment === '각궁' ? 'badge-gak' : 'badge-gae';
        
        li.innerHTML = `
            <div class="player-info-main">
                <div class="player-name-row">
                    <span class="player-index">${index + 1}</span>
                    <span class="player-name">${player.name}</span>
                </div>
                <div class="player-sub">${player.birth}년생 · ${player.rank}</div>
            </div>
            <div class="player-right-zone">
                <span class="badge ${badgeClass}">${player.equipment}</span>
                <button type="button" class="edit-btn" data-index="${index}">편집</button>
            </div>
        `;
        listBody.appendChild(li);
    });
}

export function startEdit(index) {
    setEditIndex(index);
    const player = players[index];

    document.getElementById('playerName').value = player.name;
    document.getElementById('playerBirth').value = player.birth;
    document.getElementById('playerRank').value = player.rank;
    document.querySelector(`input[name="playerEquipment"][value="${player.equipment}"]`).checked = true;

    document.getElementById('formTitle').textContent = `선수 정보 수정 (명단 번호: ${index + 1})`;
    document.getElementById('submitBtn').textContent = "수정 완료";
    document.getElementById('submitBtn').style.backgroundColor = "#34c759";
    document.getElementById('formTitle').scrollIntoView({ behavior: 'smooth' });
}

export function resetForm() {
    document.getElementById('playerForm').reset();
    document.getElementById('formTitle').textContent = "개별 선수 등록";
    document.getElementById('submitBtn').textContent = "선수 추가";
    document.getElementById('submitBtn').style.backgroundColor = "#007aff";
}
