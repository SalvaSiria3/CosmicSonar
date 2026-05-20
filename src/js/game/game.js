document.addEventListener('DOMContentLoaded', () => {
    const playerShip = document.getElementById('player-ship');
    const gameArea = document.getElementById('game-area');
    const scoreElement = document.getElementById('score');
    const scoreContainer = document.getElementById('score-container');
    const topBarGame = document.getElementById('topbargame');
    const gameAnnouncer = document.getElementById('game-announcer');
    const lanes = [
        document.getElementById('lane-left'),
        document.getElementById('lane-center'),
        document.getElementById('lane-right')
    ];
    
    const gameOverScreen = document.getElementById('game-over-screen');
    const finalScoreElement = document.getElementById('final-score');
    const saveScoreBtn = document.getElementById('save-score-btn');
    const usernameInput = document.getElementById('player-name');
    
    if (!playerShip || !gameArea) return;

    let currentLane = 1;
    let isGameRunning = false;
    let score = 0;
    let lives = 3;
    
    let spawnRate = 5000;
    let enemySpeed = 15.0; // Secondi di discesa dei nemici (più basso = più veloce)
    let spawnTimeoutId;
    let animationFrameId; // Motore di gioco continuo
    
    const audio = new AudioEngine();
    const gameOverSound = new Audio('src/assets/sounds/game_over.mp3');
    gameOverSound.preload = 'auto';
    const shootSound = new Audio('src/assets/sounds/shot.mp3');
    shootSound.preload = 'auto';
    const explosionSound = new Audio('src/assets/sounds/death_alien.mp3');
    explosionSound.preload = 'auto';
    const loseLifeSound = new Audio('src/assets/sounds/lose_life.mp3');
    loseLifeSound.preload = 'auto';
    const wallSound = new Audio('src/assets/sounds/wall.mp3');
    wallSound.preload = 'auto';

    function updateShipPosition() {
        playerShip.classList.remove('lane-0', 'lane-1', 'lane-2');
        playerShip.classList.add(`lane-${currentLane}`);
    }

    function playWallSound() {
        const currentWallSound = wallSound.cloneNode();
        currentWallSound.volume = 0.5; // Regola il volume dell'impatto col muro
        currentWallSound.play().catch(e => console.log("Impossibile riprodurre wall.mp3", e));
    }

    document.addEventListener('keydown', (e) => {
        if (!isGameRunning) return;

        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            if (currentLane > 0) {
                currentLane--;
                updateShipPosition();
            } else {
                playWallSound(); // Ha colpito il muro a sinistra
            }
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            if (currentLane < 2) {
                currentLane++;
                updateShipPosition();
            } else {
                playWallSound(); // Ha colpito il muro a destra
            }
        } else if (e.code === 'Space') {
            e.preventDefault(); // Evita scroll schermo
            shoot();
        }
    });

    function spawnEnemy() {
        const laneIndex = Math.floor(Math.random() * 3);
        const alien = document.createElement('div');
        alien.className = 'alien';
        
        const alienType = Math.floor(Math.random() * 4) + 1;
        alien.classList.add(`alien-${alienType}`);
        alien.style.setProperty('--fall-speed', `${enemySpeed}s`);
        
        // Accende il sonar 3D per questo specifico alieno e lo memorizza
        alien.audioNode = audio.createAlienSonar(laneIndex);
        
        alien.addEventListener('animationend', () => {
            audio.stopAlienSonar(alien.audioNode);
            alien.remove();
        });

        lanes[laneIndex].appendChild(alien);
    }

    function scheduleNextSpawn() {
        if (!isGameRunning) return;
        
        spawnEnemy();
        
        // Aumenta la frequenza di comparsa (-2% di tempo tra uno spawn e l'altro)
        spawnRate = Math.max(400, spawnRate * 0.98); 
        
        // Aumenta la velocità fisica del nemico (-1% di durata dell'animazione)
        enemySpeed = Math.max(1.2, enemySpeed * 0.99); 
        
        spawnTimeoutId = setTimeout(scheduleNextSpawn, spawnRate);
    }

    function shoot() {
        if (!isGameRunning) return;
        const laser = document.createElement('div');
        laser.className = 'laser';
        lanes[currentLane].appendChild(laser);
        
        // Clona l'oggetto audio per permettere spari rapidi e sovrapposti senza blocchi
        const currentShootSound = shootSound.cloneNode();
        currentShootSound.volume = 0.05; // Abbassa il volume dello sparo al 30%
        currentShootSound.play().catch(e => console.log("Impossibile riprodurre il suono del laser:", e));
        
        laser.addEventListener('animationend', () => laser.remove());
    }

    function gameLoop() {
        if (!isGameRunning) return;
        
        const aliens = document.querySelectorAll('.alien:not(.exploded)');
        const lasers = document.querySelectorAll('.laser');
        const shipRect = playerShip.getBoundingClientRect(); // Coordinate della navicella sullo schermo
        const gameAreaRect = gameArea.getBoundingClientRect(); // Coordinate dell'area di gioco
        
        // 1. Controlla collisioni tra proiettili e alieni
        lasers.forEach(laser => {
            const laserRect = laser.getBoundingClientRect();
            aliens.forEach(alien => {
                const alienRect = alien.getBoundingClientRect();
                if (isColliding(laserRect, alienRect) && alienRect.bottom > gameAreaRect.top) {
                    laser.remove();

                    audio.stopAlienSonar(alien.audioNode);
                    const currentTop = window.getComputedStyle(alien).top;
                    alien.style.setProperty('--freeze-top', currentTop);
                    
                    alien.classList.add('exploded');

                    // Clona e riproduce il suono dell'esplosione
                    const currentExplosionSound = explosionSound.cloneNode();
                    currentExplosionSound.volume = 0.5; // Regola il volume se necessario
                    currentExplosionSound.play().catch(e => console.log("Impossibile riprodurre l'esplosione:", e));
                    
                    score += 10;    // Bastano 10?
                    if (scoreElement) scoreElement.textContent = score.toString().padStart(4, '0');
                    
                    if (scoreContainer) scoreContainer.setAttribute('aria-label', `Punteggio: ${score}`);
                    
                    // Annuncia ad alta voce solo al raggiungimento dei traguardi specifici (sennò lo screen reader annuncerebbe ogni volta che si colpisce un nemico, diventando fastidioso)
                    if (score === 10 || score === 100 || (score >= 500 && score % 500 === 0)) {
                        if (gameAnnouncer) {
                            gameAnnouncer.textContent = `Punteggio raggiunto: ${score}`;
                        }
                    }
                }
            });
        });
        
        // 2. Controlla se un alieno è arrivato all'altezza della navicella senza essere stato colpito
        aliens.forEach(alien => {
            const alienRect = alien.getBoundingClientRect();
            
            // Accende l'audio dell'alieno solo quando entra fisicamente nell'area di gioco
            if (alienRect.bottom > gameAreaRect.top) {
                audio.startAlienSound(alien.audioNode);
            }
            
            if (alienRect.bottom >= shipRect.top + (shipRect.height * 0.2)) {
                audio.stopAlienSonar(alien.audioNode);
                alien.remove();
                loseLife();
            }
            
            // Modula il pitch: 0% in cima allo schermo, 100% in fondo
            const yPercentage = Math.max(0, Math.min(1, (alienRect.bottom - gameAreaRect.top) / gameAreaRect.height));
            audio.updateAlienPitch(alien.audioNode, yPercentage);
        });
        
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function isColliding(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                 rect1.left > rect2.right || 
                 rect1.bottom < rect2.top || 
                 rect1.top > rect2.bottom);
    }
    
    function loseLife() {
        if (lives <= 0) return;

        if (lives > 1) {
            const currentLoseLifeSound = loseLifeSound.cloneNode();
            currentLoseLifeSound.volume = 1; 
            currentLoseLifeSound.play().catch(e => console.log("Impossibile riprodurre lose_life.mp3", e));
        }

        const lifeIcon = document.getElementById(`life-${lives}`);
        if (lifeIcon) {
            lifeIcon.src = 'src/assets/images/heart_empty.png';
        }
        lives--;
        
        const livesContainer = document.getElementById('lives-container');
        if (livesContainer) {
            livesContainer.setAttribute('aria-label', `Vite: ${lives}`);
        }
        
        if (gameAnnouncer && lives > 0) {
            gameAnnouncer.textContent = `Nave colpita! Vite rimaste: ${lives}`;
        }
        
        if (lives <= 0) {
            gameOver();
        }
    }

    function gameOver() {
        isGameRunning = false;
        clearTimeout(spawnTimeoutId);
        cancelAnimationFrame(animationFrameId);
        
        document.querySelectorAll('.alien, .laser').forEach(el => {
            // Spegne il suono dell'alieno prima di rimuoverlo dallo schermo (rimaneva anche se eliminato)
            if (el.classList.contains('alien') && el.audioNode) {
                audio.stopAlienSonar(el.audioNode);
            }
            el.remove();
        });
        
        gameOverSound.currentTime = 0;
        gameOverSound.play().catch(e => console.log("Impossibile riprodurre game_over.mp3", e));
        
        // Nasconde l'interfaccia di gioco
        if (gameArea) gameArea.classList.remove('active');
        if (topBarGame) topBarGame.classList.remove('active');
        
        // Annuncia la sconfitta in modo chiaro
        if (gameAnnouncer) {
            gameAnnouncer.textContent = `Game Over. Punteggio finale: ${score}. Inserisci il tuo nome per la classifica oppure clicca direttamente salva e rimani anonimo.`;
        }
        
        if (gameOverScreen) {
            gameOverScreen.classList.remove('hide');
            gameOverScreen.classList.add('active');
            finalScoreElement.textContent = score.toString().padStart(4, '0');
            
            setTimeout(() => usernameInput.focus(), 100);
        }
    }

    function saveScoreAndRedirect() {
        let username = usernameInput.value.trim().toUpperCase();
        
        if (username.length === 0) {
            username = "ANONIMUS";
        }
        
        const newScore = { 
            id: Date.now(),
            name: username.substring(0, 10), 
            score: score,
            mode: 'classic' // Poi ci sarà la versione accessibile/difficile
        };
        
        try {
            let leaderboard = JSON.parse(localStorage.getItem('cosmicSonarLeaderboard')) || [];
            leaderboard.push(newScore);
            
            leaderboard.sort((a, b) => b.score - a.score);
            localStorage.setItem('cosmicSonarLeaderboard', JSON.stringify(leaderboard));
            
            sessionStorage.setItem('lastPlayedId', newScore.id);
        } catch (error) {
            console.warn("Impossibile salvare il punteggio nel localStorage:", error);
        }
        
        window.location.href = 'leaderboard.php';
    }

    if (saveScoreBtn) {
        saveScoreBtn.addEventListener('click', saveScoreAndRedirect);
    }
    
    if (usernameInput) {
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveScoreAndRedirect();
            }
        });
    }

    window.startCosmicSonarGame = function() {
        if (isGameRunning) return;
        isGameRunning = true;
        
        audio.resume(); // Risveglia la scheda audio al primo click utente
        
        // Suona silenziosamente i file audio al primo click utente per sbloccare i permessi del browser (alcuni audio li bloccava all'improvviso a caso)
        [gameOverSound, loseLifeSound, wallSound].forEach(sound => {
            sound.volume = 0;
            sound.play().then(() => {
                sound.pause();
                sound.currentTime = 0;
                sound.volume = 1; // Ripristina il volume
            }).catch(() => {});
        });
        // Annuncio iniziale per orientare il giocatore
        if (gameAnnouncer) {
            gameAnnouncer.textContent = 'Partita iniziata. Sei nella corsia Centrale.';
        }
        
        scheduleNextSpawn();
        animationFrameId = requestAnimationFrame(gameLoop);
    };
});