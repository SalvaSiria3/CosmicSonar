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
    
    const settingsBtn = document.querySelector('.settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const resumeBtn = document.getElementById('resume-btn');
    
    if (!playerShip || !gameArea) return;

    let currentLane = 1;
    let isGameRunning = false;
    let isPaused = false;
    let gameMode = 'classic'; // Di base è classica
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

    // --- MUSICA DI GIOCO ---
    const gameMusic = new Audio('src/assets/sounds/menu_sound.mp3');
    gameMusic.loop = true;
    gameMusic.preload = 'auto';

    // --- GESTIONE VOLUMI ---
    let sfxVolume = 0.9; // Volume effetti sonori di default al 90%
    let musicVolume = 0.1; // Parte di default esattamente al 10%
    
    const savedSfx = localStorage.getItem('cosmicSfxVol');
    const savedMusic = localStorage.getItem('cosmicMusicVol');
    if (savedSfx !== null) sfxVolume = parseFloat(savedSfx);
    if (savedMusic !== null) musicVolume = parseFloat(savedMusic);

    gameMusic.volume = musicVolume; // Applica subito il volume alla musica

    const sfxSlider = document.getElementById('sfx-volume');
    const musicSlider = document.getElementById('music-volume');
    
    // Posiziona il cursore sul blocco corretto (da 0 a 10)
    if (sfxSlider) sfxSlider.value = Math.round(sfxVolume * 10);
    if (musicSlider) musicSlider.value = Math.round(musicVolume * 10);

    if (sfxSlider) {
        sfxSlider.addEventListener('input', (e) => {
            let val = parseInt(e.target.value);
            // Se siamo in modalità difficile, blocca il volume SFX a minimo 1
            if (gameMode === 'hard' && val < 1) {
                val = 1;
                sfxSlider.value = 1;
            }
            sfxVolume = val / 10; 
            localStorage.setItem('cosmicSfxVol', sfxVolume);
            sfxSlider.setAttribute('aria-valuenow', e.target.value); // Meglio far sapere allo screen reader il valore attuale dello slider
            audio.setVolume(sfxVolume); // Aggiorna il volume degli alieni in tempo reale
            
            // Suono di feedback per far capire il livello del volume
            const testSound = shootSound.cloneNode();
            testSound.volume = 0.2 * sfxVolume;
            testSound.play().catch(err => console.log("Impossibile riprodurre suono di test", err));
        });
    }

    if (musicSlider) {
        musicSlider.addEventListener('input', (e) => {
            let val = gameMode === 'hard' ? 0 : parseInt(e.target.value); // Blocca a 0 se difficile
            musicVolume = val / 10;
            localStorage.setItem('cosmicMusicVol', musicVolume);
            musicSlider.setAttribute('aria-valuenow', e.target.value); // Meglio far sapere allo screen reader il valore attuale dello slider
            gameMusic.volume = musicVolume; // Aggiorna in tempo reale
        });
    }

    // --- GESTIONE PAUSA ---
    function togglePause() {
        if (!isGameRunning) return;
        
        if (isPaused) {
            isPaused = false;
            settingsModal.classList.add('hide');
            gameArea.classList.remove('paused-animation'); 
            audio.resume(); 
            spawnTimeoutId = setTimeout(scheduleNextSpawn, spawnRate); 
            settingsBtn.focus(); // Accessibilità: riporta il focus all'ingranaggio
        } else {
            isPaused = true;
            clearTimeout(spawnTimeoutId); 
            gameArea.classList.add('paused-animation'); 
            audio.suspend(); 
            settingsModal.classList.remove('hide');
            if (sfxSlider) sfxSlider.focus(); // Accessibilità: sposta il focus dentro la modale
        }
    }

    settingsBtn.addEventListener('click', () => { if (!isPaused) togglePause(); });
    resumeBtn.addEventListener('click', () => { if (isPaused) togglePause(); });

    function updateShipPosition() {
        playerShip.classList.remove('lane-0', 'lane-1', 'lane-2');
        playerShip.classList.add(`lane-${currentLane}`);
    }

    function playWallSound() {
        const currentWallSound = wallSound.cloneNode();
        currentWallSound.volume = 0.5 * sfxVolume; 
        currentWallSound.play().catch(e => console.log("Impossibile riprodurre wall.mp3", e));
    }

    document.addEventListener('keydown', (e) => {
        // Permette di mettere in pausa e toglierla con il tasto ESC (Accessibilità da tastiera)
        if (e.code === 'Escape' && isGameRunning) {
            togglePause();
            return;
        }

        if (!isGameRunning || isPaused) return;

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
        currentShootSound.volume = 0.2 * sfxVolume; // Applica il volume SFX globale
        currentShootSound.play().catch(e => console.log("Impossibile riprodurre il suono del laser:", e));
        
        laser.addEventListener('animationend', () => laser.remove());
    }

    function gameLoop() {
        if (!isGameRunning) return;
        
        if (isPaused) {
            animationFrameId = requestAnimationFrame(gameLoop); // Mantieni vivo il loop, ma ignora la logica
            return; 
        }
        
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
                    currentExplosionSound.volume = 0.5 * sfxVolume; 
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
            currentLoseLifeSound.volume = 0.6 * sfxVolume; // Applica il volume SFX globale (effetti sonori)
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
        
        gameMusic.pause(); // Ferma la musica quando il giocatore perde

        document.querySelectorAll('.alien, .laser').forEach(el => {
            // Spegne il suono dell'alieno prima di rimuoverlo dallo schermo (rimaneva anche se eliminato)
            if (el.classList.contains('alien') && el.audioNode) {
                audio.stopAlienSonar(el.audioNode);
            }
            el.remove();
        });
        
        gameOverSound.currentTime = 0;
        gameOverSound.volume = 1.0 * sfxVolume;
        gameOverSound.play().catch(e => console.log("Impossibile riprodurre game_over.mp3", e));
        
        // Nasconde l'interfaccia di gioco
        if (gameArea) gameArea.classList.remove('active');
        if (topBarGame) topBarGame.classList.remove('active');
        
        const glitchLayer = document.querySelector('.hard-mode-glitch');
        if (glitchLayer) glitchLayer.classList.remove('active');
        
        // Annuncia il game over
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
            mode: gameMode // Salva il punteggio con la modalità corretta
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

    window.startCosmicSonarGame = function(selectedMode) {
        if (isGameRunning) return;
        isGameRunning = true;
        gameMode = selectedMode || 'classic';
        
        // Applica i modificatori per la modalità difficile
        if (gameMode === 'hard') {
            gameArea.classList.add('hard-mode');
            topBarGame.classList.add('hard-mode');
            
            const glitchLayer = document.querySelector('.hard-mode-glitch');
            if (glitchLayer) glitchLayer.classList.add('active');
            
            // Spegne la musica e blocca lo slider
            gameMusic.volume = 0;
            if (musicSlider) {
                musicSlider.value = 0;
                musicSlider.disabled = true; // Impedisce all'utente di cambiare il volume
            }
            
            // Forza gli SFX a minimo 10%
            if (sfxVolume < 0.1) {
                sfxVolume = 0.1;
                audio.setVolume(sfxVolume);
                if (sfxSlider) {
                    sfxSlider.value = 1;
                    localStorage.setItem('cosmicSfxVol', 0.1);
                }
            }
        }
        
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
                
        if (gameMode !== 'hard') {
            gameMusic.play().catch(e => console.log("Impossibile avviare musica", e));
        }

        // Annuncio iniziale per orientare il giocatore
        if (gameAnnouncer) {
            gameAnnouncer.textContent = 'Partita iniziata. Sei nella corsia Centrale.';
        }
        
        scheduleNextSpawn();
        animationFrameId = requestAnimationFrame(gameLoop);
    };

    // --- COMANDO PROVVISORIO: Premi 'T' per la trasparenza del cabinato ---
    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyT') {
            const cabinato = document.querySelector('.arcade-image');
            if (cabinato) {
                cabinato.style.transition = 'opacity 0.3s ease';
                cabinato.style.opacity = cabinato.style.opacity === '0' ? '1' : '0';
            }
        }
    });
});