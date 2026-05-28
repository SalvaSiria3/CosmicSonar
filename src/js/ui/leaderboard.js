document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.getElementById('leaderboard-list');
    const filterClassicBtn = document.getElementById('filter-classic');
    const filterHardBtn = document.getElementById('filter-hard');
    const filterPacmanBtn = document.getElementById('filter-pacman');
    if (!listContainer) return;

    // Mostra il bottone Pac-Man solo se l'utente ha sbloccato il segreto
    if (filterPacmanBtn && localStorage.getItem('pacmanUnlocked') === 'true') {
        filterPacmanBtn.classList.remove('hide');
    }

    let leaderboard = [];
    const lastPlayedId = parseInt(sessionStorage.getItem('lastPlayedId'));

    let currentFilter = 'classic';

    function createRowHTML(entry, rank, isHighlight) {
        const highlightClass = isHighlight ? 'highlight' : '';
        const srText = isHighlight ? '<span class="sr-only">Questo è il tuo ultimo punteggio: </span>' : '';

        return `
            <li class="leaderboard-row ${highlightClass}">
                ${srText}
                <span class="rank">
                    <span class="sr-only">Posizione ${rank} </span>
                    <span aria-hidden="true">${rank}°</span>
                </span>
                <span class="name"><span class="sr-only">Giocatore </span>${entry.name} </span>
                <span class="score">
                    <span class="sr-only">Punteggio ${entry.score}</span>
                    <span aria-hidden="true">${entry.score.toString().padStart(5, '0')}</span>
                </span>
            </li>
        `;
    }

    function renderLeaderboard() {
        const filteredBoard = leaderboard.filter(entry => entry.mode === currentFilter);
        
        const modeName = currentFilter === 'classic' ? 'Classica' : (currentFilter === 'hard' ? 'Difficile' : 'Pac-Man');
        listContainer.setAttribute('aria-label', `Migliori Punteggi Modalità ${modeName}`);

        const userIndex = filteredBoard.findIndex(entry => entry.id === lastPlayedId);
        const userRank = userIndex !== -1 ? userIndex + 1 : null;

        let html = '';

        if (filteredBoard.length === 0) {
            html = '<li class="leaderboard-row empty">Nessun punteggio registrato.</li>';
        } else {
            const displayCount = (userRank && userRank > 7) ? 6 : 7;
            const visibleScores = filteredBoard.slice(0, displayCount);
            visibleScores.forEach((entry, index) => {
                const rank = index + 1;
                html += createRowHTML(entry, rank, entry.id === lastPlayedId);
            });

            // Se l'utente ha giocato a questa modalità e non è in top 7, appare in fondo
            if (userRank && userRank > 7) {
                html += `
                    <li class="leaderboard-separator" aria-hidden="true">
                        <span>...</span>
                    </li>
                `;
                html += createRowHTML(filteredBoard[userIndex], userRank, true);
            } else if (filteredBoard.length > displayCount) {
                html += `
                    <li class="leaderboard-separator" aria-hidden="true">
                        <span>...</span>
                    </li>
                `;
            }
        }

        listContainer.innerHTML = html;
    }

    if (filterClassicBtn && filterHardBtn && filterPacmanBtn) {
        const setFilter = (mode, activeBtn, inactiveBtns) => {
            currentFilter = mode;
            activeBtn.classList.add('active');
            activeBtn.setAttribute('aria-pressed', 'true');
            inactiveBtns.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            });
            renderLeaderboard();
        };

        filterClassicBtn.addEventListener('click', () => setFilter('classic', filterClassicBtn, [filterHardBtn, filterPacmanBtn]));
        filterHardBtn.addEventListener('click', () => setFilter('hard', filterHardBtn, [filterClassicBtn, filterPacmanBtn]));
        filterPacmanBtn.addEventListener('click', () => setFilter('pacman', filterPacmanBtn, [filterClassicBtn, filterHardBtn]));
    }

    // Funzione di inizializzazione dopo il caricamento dei dati
    function initLeaderboard() {
        // Se c'è un ultimo punteggio salvato in questa sessione, usa la sua modalità come filtro predefinito
        if (lastPlayedId) {
            const lastPlayedEntry = leaderboard.find(entry => entry.id === lastPlayedId);
            if (lastPlayedEntry && lastPlayedEntry.mode) {
                currentFilter = lastPlayedEntry.mode;
            }
            
            // Se l'ultima giocata era pacman, assicurati che il bottone sia visibile
            if (currentFilter === 'pacman' && filterPacmanBtn) {
                filterPacmanBtn.classList.remove('hide');
            }
        }
        
        // Imposta visivamente il bottone attivo corretto all'avvio in base al filtro
        if (currentFilter === 'hard' && filterHardBtn && filterClassicBtn && filterPacmanBtn) {
            filterHardBtn.classList.add('active');
            filterHardBtn.setAttribute('aria-pressed', 'true');
            filterClassicBtn.classList.remove('active');
            filterClassicBtn.setAttribute('aria-pressed', 'false');
            filterPacmanBtn.classList.remove('active');
            filterPacmanBtn.setAttribute('aria-pressed', 'false');
        } else if (currentFilter === 'pacman' && filterPacmanBtn && filterClassicBtn && filterHardBtn) {
            filterPacmanBtn.classList.add('active');
            filterPacmanBtn.setAttribute('aria-pressed', 'true');
            filterClassicBtn.classList.remove('active');
            filterClassicBtn.setAttribute('aria-pressed', 'false');
            filterHardBtn.classList.remove('active');
            filterHardBtn.setAttribute('aria-pressed', 'false');
        }
        
        renderLeaderboard();
    }

    // Scarica i punteggi dal database
    fetch('load_scores.php', {
        headers: {
            'X-Requested-With': 'XMLHttpRequest' // Header per identificare la richiesta come AJAX
        }
    })
        .then(response => response.json())
        .then(res => {
            if (res.success) {
                leaderboard = res.data.map(entry => ({ ...entry, id: parseInt(entry.id), score: parseInt(entry.score) }));
            }
        })
        .catch(err => console.error("Errore recupero classifica:", err))
        .finally(() => initLeaderboard());
});