import { players, addPlayer } from './state.js';
import { updatePlayerList } from './ui.js';

export function uploadCSV() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];

    if (!file) {
        alert('CSV 파일을 선택해주세요.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        if (text.includes('\UFFFD') || text.includes('fffd')) {
            const reReader = new FileReader();
            reReader.onload = function(reEvent) {
                processCSVText(reEvent.target.result);
            };
            reReader.readAsText(file, 'UTF-8');
        } else {
            processCSVText(text);
        }
    };
    reader.readAsText(file, 'EUC-KR');
}

function processCSVText(text) {
    const lines = text.split('\n');
    lines.forEach(line => {
        if (line.trim() === '') return;
        const parts = line.split(',');

        if (parts.length >= 3) {
            const name = parts[0].trim();
            const birth = parts[1].trim();
            const rank = parts[2].trim();
            let equipment = '개량궁';
            if (parts[3] && (parts[3].trim() === '각궁' || parts[3].trim() === '개량궁')) {
                equipment = parts[3].trim();
            }
            addPlayer({ name, birth, rank, equipment });
        }
    });
    updatePlayerList();
    alert('CSV 데이터가 정상 등록되었습니다.');
    document.getElementById('csvFile').value = '';
}

export function downloadCSV() {
    if (players.length === 0) {
        alert('저장할 선수 명단이 없습니다.');
        return;
    }
    let filename = document.getElementById('fileNameInput').value.trim();
    if (filename === '') {
        filename = '대회선수명단';
    }
    let csvContent = "이름, 생년, 급수단수, 장비\n";
    players.forEach(player => {
        csvContent += `${player.name},${player.birth},${player.rank},${player.equipment}\n`;
    });

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename + ".csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
