export let players = [];
export let editIndex = -1;

export function setEditIndex(index) {
    editIndex = index;
}

export function addPlayer(player) {
    players.push(player);
}

export function updatePlayer(index, updatedPlayer) {
    players[index] = updatedPlayer;
}

export function clearPlayers() {
    players = [];
}
