document.addEventListener('DOMContentLoaded', () => {
    const playerShip = document.getElementById('player-ship');
    const gameArea = document.getElementById('game-area');
    const scoreElement = document.getElementById('score');
    const lanes = [
        document.getElementById('lane-left'),
        document.getElementById('lane-center'),
        document.getElementById('lane-right')
    ];
    
    if (!playerShip || !gameArea) return;

    let currentLane = 1;
    let isGameRunning = false;
    let score = 0;
    let lives = 3;
    
    // Variabili per l'algoritmo della difficoltà
    let spawnRate = 5000; // Tempo in ms tra la comparsa di un alieno e l'altro
    let enemySpeed = 10.0; // Tempo in secondi impiegato dall'alieno per cadere (più lento)
    let spawnTimeoutId;
    let animationFrameId; // Motore di gioco continuo

    function updateShipPosition() {
        playerShip.classList.remove('lane-0', 'lane-1', 'lane-2');
        playerShip.classList.add(`lane-${currentLane}`);
    }

    // Ascolta i comandi di movimento da tastiera
    document.addEventListener('keydown', (e) => {
        if (!isGameRunning) return;

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
        } else if (e.code === 'Space') {
            e.preventDefault(); // Evita scroll dello schermo
            shoot();
        }
    });

    // Crea un nuovo nemico in una corsia casuale
    function spawnEnemy() {
        const laneIndex = Math.floor(Math.random() * 3); // Sceglie 0, 1 o 2 a caso
        const alien = document.createElement('div');
        alien.className = 'alien';
        
        // Sceglie a caso una delle 4 immagini degli alieni
        const alienType = Math.floor(Math.random() * 4) + 1; // Genera 1, 2, 3 o 4
        alien.style.backgroundImage = `url('src/assets/images/aliens${alienType}.webp')`;
        
        // Assegna la velocità di discesa e usa "steps" per farli scendere a scatti
        alien.style.animation = `fallDown ${enemySpeed}s steps(20) forwards`;
        
        // Quando l'alieno esce dallo schermo, viene ripulito per non appesantire la memoria
        alien.addEventListener('animationend', () => {
            alien.remove();
        });

        lanes[laneIndex].appendChild(alien);
    }

    // Gestisce il loop e l'incremento di difficoltà
    function scheduleNextSpawn() {
        if (!isGameRunning) return;
        
        spawnEnemy();
        
        // ALGORITMO DI DIFFICOLTÀ:
        // Aumenta la frequenza di comparsa (-2% di tempo tra uno spawn e l'altro)
        spawnRate = Math.max(400, spawnRate * 0.98); 
        
        // Aumenta la velocità fisica del nemico (-1% di durata dell'animazione)
        enemySpeed = Math.max(1.2, enemySpeed * 0.99); 
        
        spawnTimeoutId = setTimeout(scheduleNextSpawn, spawnRate);
    }

    // Spara un colpo verso l'alto
    function shoot() {
        if (!isGameRunning) return;
        const laser = document.createElement('div');
        laser.className = 'laser';
        lanes[currentLane].appendChild(laser); // Il laser compare nella colonna dove si trova il giocatore
        
        laser.style.animation = `shootUp 0.5s linear forwards`; // Molto veloce!
        // Pulisce la memoria quando il laser esce dallo schermo in alto
        laser.addEventListener('animationend', () => laser.remove());
    }

    // Il vero "Cuore" del Gioco: Loop ad alte prestazioni per calcolare le collisioni (60 volte al secondo)
    function gameLoop() {
        if (!isGameRunning) return;
        
        const aliens = document.querySelectorAll('.alien');
        const lasers = document.querySelectorAll('.laser');
        const shipRect = playerShip.getBoundingClientRect(); // Posizione fisica esatta della navicella sullo schermo
        const gameAreaRect = gameArea.getBoundingClientRect(); // Coordinate dell'area di gioco
        
        // 1. Controlla collisioni tra Laser (Sparati) e Alieni
        lasers.forEach(laser => {
            const laserRect = laser.getBoundingClientRect();
            aliens.forEach(alien => {
                const alienRect = alien.getBoundingClientRect();
                // Se si intersecano e l'alieno è almeno in parte visibile nello schermo, è un COLPO A SEGNO!
                if (isColliding(laserRect, alienRect) && alienRect.bottom > gameAreaRect.top) {
                    laser.remove(); // Rimuove il proiettile
                    alien.remove(); // Distrugge l'alieno
                    
                    score += 10;    // +10 Punti!
                    if (scoreElement) scoreElement.textContent = score.toString().padStart(4, '0');
                }
            });
        });
        
        // 2. Controlla se un Alieno, in qualsiasi corsia, è arrivato all'altezza della navicella senza essere stato colpito
        aliens.forEach(alien => {
            const alienRect = alien.getBoundingClientRect();
            // Se la base dell'alieno tocca o supera la punta della navicella (con un leggero margine di grazia per il giocatore)
            if (alienRect.bottom >= shipRect.top + (shipRect.height * 0.2)) {
                alien.remove(); // Lo facciamo sparire per non farlo scattare 100 volte
                loseLife();     // Togliamo un cuore
            }
        });
        
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // Matematica semplice per capire se due quadrati si toccano
    function isColliding(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                 rect1.left > rect2.right || 
                 rect1.bottom < rect2.top || 
                 rect1.top > rect2.bottom);
    }
    
    // Toglie le vite e controlla la Sconfitta
    function loseLife() {
        if (lives <= 0) return;
        const lifeIcon = document.getElementById(`life-${lives}`);
        if (lifeIcon) {
            lifeIcon.src = 'src/assets/images/heart_empty.png'; // Cambia l'immagine del cuoricino in alto a destra
        }
        lives--;
        
        if (lives <= 0) {
            gameOver();
        }
    }

    function gameOver() {
        isGameRunning = false;
        clearTimeout(spawnTimeoutId);
        cancelAnimationFrame(animationFrameId);
        
        // Ripulisce lo schermo
        document.querySelectorAll('.alien, .laser').forEach(el => el.remove());
        
        // Ritardo di 100ms per permettere all'interfaccia di aggiornare l'ultimo cuore perso
        setTimeout(() => {
            alert(`GAME OVER!\nLa Terra è stata invasa...\nPunteggio Finale: ${score}`);
            window.location.href = 'menu.php'; // Torna al menu principale per ora
        }, 100);
    }

    // Funzione globale chiamata da loader.js per iniziare la partita
    window.startCosmicSonarGame = function() {
        if (isGameRunning) return;
        isGameRunning = true;
        
        scheduleNextSpawn();
        animationFrameId = requestAnimationFrame(gameLoop); // Accende il motore delle collisioni
    };
});