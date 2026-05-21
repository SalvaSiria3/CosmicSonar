document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.getElementById('leaderboard-list');
    const filterClassicBtn = document.getElementById('filter-classic');
    const filterHardBtn = document.getElementById('filter-hard');
    if (!listContainer) return;

    let leaderboard = JSON.parse(localStorage.getItem('cosmicSonarLeaderboard')) || [];
    const lastPlayedId = parseInt(sessionStorage.getItem('lastPlayedId'));

    leaderboard.sort((a, b) => b.score - a.score);

    let currentFilter = 'classic';

    // Se c'è un ultimo punteggio salvato in questa sessione, usa la sua modalità come filtro predefinito
    if (lastPlayedId) {
        const lastPlayedEntry = leaderboard.find(entry => entry.id === lastPlayedId);
        if (lastPlayedEntry && lastPlayedEntry.mode) {
            currentFilter = lastPlayedEntry.mode;
        }
    }

    function createRowHTML(entry, rank, isHighlight) {
        const highlightClass = isHighlight ? 'highlight' : '';
        const srText = isHighlight ? '<span class="sr-only">Il tuo punteggio: </span>' : '';

        return `
            <li class="leaderboard-row ${highlightClass}">
                ${srText}
                <span class="rank">
                    <span class="sr-only">Posizione ${rank}</span>
                    <span aria-hidden="true">${rank}°</span>
                </span>
                <span class="name"><span class="sr-only">Giocatore </span>${entry.name}</span>
                <span class="score">
                    <span class="sr-only">Punteggio ${entry.score}</span>
                    <span aria-hidden="true">${entry.score.toString().padStart(4, '0')}</span>
                </span>
            </li>
        `;
    }

    function renderLeaderboard() {
        const filteredBoard = leaderboard.filter(entry => entry.mode === currentFilter);
        
        const userIndex = filteredBoard.findIndex(entry => entry.id === lastPlayedId);
        const userRank = userIndex !== -1 ? userIndex + 1 : null;

        let html = '';

        if (filteredBoard.length === 0) {
            html = '<li class="leaderboard-row empty">Nessun punteggio registrato.</li>';
        } else {
            const displayCount = (userRank && userRank > 6) ? 6 : 8;
            const visibleScores = filteredBoard.slice(0, displayCount);
            visibleScores.forEach((entry, index) => {
                const rank = index + 1;
                html += createRowHTML(entry, rank, entry.id === lastPlayedId);
            });

            // Se l'utente ha giocato a questa modalità e non è in top 6, appare in fondo
            if (userRank && userRank > 6) {
                html += `
                    <li class="leaderboard-separator" aria-hidden="true">
                        <span>...</span>
                    </li>
                `;
                html += createRowHTML(filteredBoard[userIndex], userRank, true);
            }
        }

        listContainer.innerHTML = html;
    }

    if (filterClassicBtn && filterHardBtn) {
        const setFilter = (mode, activeBtn, inactiveBtn) => {
            currentFilter = mode;
            activeBtn.classList.add('active');
            activeBtn.setAttribute('aria-pressed', 'true');
            inactiveBtn.classList.remove('active');
            inactiveBtn.setAttribute('aria-pressed', 'false');
            renderLeaderboard();
        };

        filterClassicBtn.addEventListener('click', () => setFilter('classic', filterClassicBtn, filterHardBtn));
        filterHardBtn.addEventListener('click', () => setFilter('hard', filterHardBtn, filterClassicBtn));
        
        // Imposta visivamente il bottone attivo corretto all'avvio in base al filtro
        if (currentFilter === 'hard') {
            filterHardBtn.classList.add('active');
            filterHardBtn.setAttribute('aria-pressed', 'true');
            filterClassicBtn.classList.remove('active');
            filterClassicBtn.setAttribute('aria-pressed', 'false');
        }
    }

    renderLeaderboard();
});