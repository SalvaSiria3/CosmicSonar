document.addEventListener('DOMContentLoaded', () => {
    const playerShip = document.getElementById('player-ship');
    const gameArea = document.getElementById('game-area');
    
    if (!playerShip || !gameArea) return;

    let currentLane = 1; // Si parte sempre dalla corsia centrale (0 = sx, 1 = centro, 2 = dx)

    function updateShipPosition() {
        playerShip.classList.remove('lane-0', 'lane-1', 'lane-2');
        playerShip.classList.add(`lane-${currentLane}`);
    }

    // Ascolta i comandi di movimento da tastiera
    document.addEventListener('keydown', (e) => {
        // Ignora gli input se l'area di gioco non è ancora visibile (es. durante il caricamento)
        if (gameArea.style.display === 'none') return;

        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            if (currentLane > 0) {
                currentLane--;
                updateShipPosition();
            }
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            if (currentLane < 2) {
                currentLane++;
                updateShipPosition();
            }
        }
    });
});