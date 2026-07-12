import { editIndex, addPlayer, updatePlayer } from './state.js';
import { updatePlayerList, startEdit, resetForm } from './ui.js';
import { uploadCSV, downloadCSV } from './fileService.js';

// 1. 선수 추가 / 수정 제출(Submit) 이벤트
document.getElementById('playerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('playerName').value.trim();
    const birth = document.getElementById('playerBirth').value;
    const rank = document.getElementById('playerRank').value.trim();
    const equipment = document.querySelector('input[name="playerEquipment"]:checked').value;

    if (editIndex === -1) {
        addPlayer({ name, birth, rank, equipment });
    } else {
        updatePlayer(editIndex, { name, birth, rank, equipment });
    }
    
    updatePlayerList();
    resetForm();
});

// 2. 동적 생성된 '편집' 버튼 클릭 이벤트 (이벤트 위임 패턴)
document.getElementById('playerListBody').addEventListener('click', function(e) {
    if (e.target.classList.contains('edit-btn')) {
        const index = parseInt(e.target.getAttribute('data-index'), 10);
        startEdit(index);
    }
});

// 3. 백업 및 업로드 버튼 이벤트 바인딩
document.getElementById('uploadBtn').addEventListener('click', uploadCSV);
document.getElementById('downloadBtn').addEventListener('click', downloadCSV);
