document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.getElementById('leaderboard-list');
    if (!listContainer) return;

    // Recupera i dati
    let leaderboard = JSON.parse(localStorage.getItem('cosmicSonarLeaderboard')) || [];
    const lastPlayedId = parseInt(sessionStorage.getItem('lastPlayedId'));

    // Assicuriamoci che sia ordinata
    leaderboard.sort((a, b) => b.score - a.score);

    // Trova la posizione dell'utente attuale (se ha appena giocato)
    const userIndex = leaderboard.findIndex(entry => entry.id === lastPlayedId);
    const userRank = userIndex !== -1 ? userIndex + 1 : null;

    // Genera l'HTML di una singola riga
    function createRowHTML(entry, rank, isHighlight) {
        const highlightClass = isHighlight ? 'highlight' : '';
        const srText = isHighlight ? '<span class="sr-only">Il tuo punteggio: </span>' : '';
        // L'occhio: 👁️ (aperto, modalità classica). In futuro potrai mettere un occhio chiuso se mode === 'blind'
        const modeIcon = entry.mode === 'blind' ? '🙈' : '👁️'; 
        const modeAria = entry.mode === 'blind' ? 'Modalità senza vista' : 'Modalità classica';

        return `
            <li class="leaderboard-row ${highlightClass}">
                ${srText}
                <span class="rank"><span class="sr-only">Posizione </span>${rank}°</span>
                <span class="name"><span class="sr-only">Giocatore </span>${entry.name}</span>
                <span class="score"><span class="sr-only">Punteggio </span>${entry.score.toString().padStart(4, '0')}</span>
                <span class="mode-icon" title="${modeAria}">
                    <span class="sr-only">${modeAria}</span>
                    <span aria-hidden="true">${modeIcon}</span>
                </span>
            </li>
        `;
    }

    let html = '';

    if (leaderboard.length === 0) {
        html = '<li class="leaderboard-row empty">Nessun punteggio registrato.</li>';
    } else {
        // Mostra i primi 7
        const top7 = leaderboard.slice(0, 7);
        top7.forEach((entry, index) => {
            const rank = index + 1;
            html += createRowHTML(entry, rank, entry.id === lastPlayedId);
        });

        // Se l'utente ha appena giocato e NON è tra i primi 7, aggiungilo in fondo
        if (userRank && userRank > 7) {
            html += `
                <li class="leaderboard-separator" aria-hidden="true">
                    <span>...</span>
                </li>
            `;
            html += createRowHTML(leaderboard[userIndex], userRank, true);
        }
    }

    listContainer.innerHTML = html;
});