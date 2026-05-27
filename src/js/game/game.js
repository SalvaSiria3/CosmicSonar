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
    
    // Variabili per tracciamento statistiche Database
    let aliensDestroyed = 0;
    let shotsFired = 0;
    let wallsHit = 0;
    let gameStartTime = 0;
    
    let spawnRate = 3500; // Parte più veloce (3.5s invece di 5s)
    let enemySpeed = 12.0; // Velocità di discesa iniziale (12s invece di 15s)
    let spawnTimeoutId;
    let animationFrameId; // Motore di gioco continuo
    let lastShootTime = 0; // Previene il sovraccarico di proiettili
    
    const audio = new AudioEngine();
    
    // Pre-carica tutti gli effetti sonori direttamente nel Web Audio API (Zero lag, no limiti browser)
    audio.loadSFX('shoot', 'src/assets/sounds/shot.mp3');
    audio.loadSFX('explosion', 'src/assets/sounds/death_alien.mp3');
    audio.loadSFX('wall', 'src/assets/sounds/wall.mp3');
    audio.loadSFX('change_col', 'src/assets/sounds/change_col.mp3');
    audio.loadSFX('lose_life', 'src/assets/sounds/lose_life.mp3');
    audio.loadSFX('game_over', 'src/assets/sounds/game_over.mp3');

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
            audio.playSFX('shoot', 0.2 * sfxVolume);
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
            settingsBtn.focus(); // Riporta il focus all'icona delle impostazioni
        } else {
            isPaused = true;
            clearTimeout(spawnTimeoutId); 
            gameArea.classList.add('paused-animation'); 
            audio.suspend(); 
            settingsModal.classList.remove('hide');
            if (sfxSlider) sfxSlider.focus(); // Sposta il focus dentro la modale
        }
    }

    settingsBtn.addEventListener('click', () => { if (!isPaused) togglePause(); });
    resumeBtn.addEventListener('click', () => { if (isPaused) togglePause(); });

    function updateShipPosition() {
        playerShip.classList.remove('lane-0', 'lane-1', 'lane-2');
        playerShip.classList.add(`lane-${currentLane}`);
    }

    function playWallSound() {
        wallsHit++; // Traccia il muro colpito per il database
        audio.playSFX('wall', 0.1 * sfxVolume);
    }

    function playChangeColSound() {
        audio.playSFX('change_col', 0.3 * sfxVolume);
    }

    document.addEventListener('keydown', (e) => {
        // Permette di mettere in pausa e toglierla con il tasto ESC
        if (e.code === 'Escape' && isGameRunning) {
            togglePause();
            return;
        }

        if (!isGameRunning || isPaused) return;

        // Evita lo scrolling della pagina se si premono per sbaglio le frecce su/giù o durante il movimento
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();
        }

        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            if (e.repeat) return; // Blocca il movimento continuo se si tiene premuto il tasto
            
            if (currentLane > 0) {
                currentLane--;
                updateShipPosition();
                playChangeColSound();
            } else {
                playWallSound(); // Ha colpito il muro a sinistra
            }
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            if (e.repeat) return; // Blocca il movimento continuo se si tiene premuto il tasto
            
            if (currentLane < 2) {
                currentLane++;
                updateShipPosition();
                playChangeColSound();
            } else {
                playWallSound(); // Ha colpito il muro a destra
            }
        } else if (e.code === 'Space') {
            e.preventDefault(); // Evita scroll schermo
            if (!e.repeat) { // Blocca il "fuoco continuo" automatico del sistema operativo
                shoot();
            }
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
        
        spawnRate = Math.max(600, spawnRate * 0.98); 
        const currentMinSpeed = score > 2580 ? 1.7 : 2.5; // Sblocca un nuovo livello di difficoltà oltre i 2580 pt
        enemySpeed = Math.max(currentMinSpeed, enemySpeed * 0.985); 
        
        spawnTimeoutId = setTimeout(scheduleNextSpawn, spawnRate);
    }

    function shoot() {
        if (!isGameRunning) return;

        const now = Date.now();
        // Limite di 150ms (circa 7 colpi al sec) sennò il browser va in crash
        if (now - lastShootTime < 200) return; 
        lastShootTime = now;

        shotsFired++; // Traccia il colpo sparato
        const laser = document.createElement('div');
        laser.className = 'laser';
        lanes[currentLane].appendChild(laser);
        
        // Esecuzione immediata tramite Web Audio API
        audio.playSFX('shoot', 0.2 * sfxVolume);
        
        laser.addEventListener('animationend', () => laser.remove());
    }

    function gameLoop() {
        if (!isGameRunning) return;
        
        if (isPaused) {
            animationFrameId = requestAnimationFrame(gameLoop); // Mantieni vivo il loop, ma ignora la logica
            return; 
        }
        
        const alienNodes = document.querySelectorAll('.alien:not(.exploded)');
        const laserNodes = document.querySelectorAll('.laser');
        
        // --- 1. FASE DI LETTURA (DOM READ) ---
        const shipRect = playerShip.getBoundingClientRect(); 
        const gameAreaRect = gameArea.getBoundingClientRect(); 
        
        const lasers = Array.from(laserNodes).map(el => ({ el, rect: el.getBoundingClientRect() }));
        const aliens = Array.from(alienNodes).map(el => ({ el, rect: el.getBoundingClientRect() }));
        
        const aliensToExplode = new Map();
        const elementsToRemove = new Set();
        let newScore = null;
        let livesToLose = 0;
        
        // --- 2. FASE DI LOGICA ---
        lasers.forEach(laser => {
            if (elementsToRemove.has(laser.el)) return;

            aliens.forEach(alien => {
                if (aliensToExplode.has(alien.el) || elementsToRemove.has(alien.el)) return;

                if (isColliding(laser.rect, alien.rect) && alien.rect.bottom > gameAreaRect.top) {
                    elementsToRemove.add(laser.el);
                    
                    const exactCssTop = window.getComputedStyle(alien.el).top;
                    aliensToExplode.set(alien.el, exactCssTop);

                    aliensDestroyed++;
                    audio.stopAlienSonar(alien.el.audioNode);

                    // Esecuzione immediata tramite Web Audio API
                    audio.playSFX('explosion', 1.0 * sfxVolume);
                    
                    score += 10;
                    newScore = score;
                }
            });
        });
        
        aliens.forEach(alien => {
            if (aliensToExplode.has(alien.el) || elementsToRemove.has(alien.el)) return;
            
            if (alien.rect.bottom > gameAreaRect.top) {
                audio.startAlienSound(alien.el.audioNode);
            }
            
            if (alien.rect.bottom >= shipRect.top + (shipRect.height * 0.2)) {
                elementsToRemove.add(alien.el);
                audio.stopAlienSonar(alien.el.audioNode);
                livesToLose++;
            } else {
                const yPercentage = Math.max(0, Math.min(1, (alien.rect.bottom - gameAreaRect.top) / gameAreaRect.height));
                audio.updateAlienPitch(alien.el.audioNode, yPercentage);
            }
        });

        // --- 3. FASE DI SCRITTURA (DOM WRITE) ---
        elementsToRemove.forEach(el => el.remove());
        
        aliensToExplode.forEach((exactCssTop, alienEl) => {
            alienEl.style.setProperty('--freeze-top', exactCssTop);
            alienEl.classList.add('exploded');
        });
        
        if (newScore !== null) {
            if (scoreElement) scoreElement.textContent = newScore.toString().padStart(4, '0');
            if (scoreContainer) scoreContainer.setAttribute('aria-label', `Punteggio: ${newScore}`);
            
            if (newScore === 10 || newScore === 100 || (newScore >= 500 && newScore % 500 === 0)) {
                if (gameAnnouncer) gameAnnouncer.textContent = `Punteggio raggiunto: ${newScore}`;
            }
        }
        
        for (let i = 0; i < livesToLose; i++) loseLife();
        
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
            audio.playSFX('lose_life', 0.6 * sfxVolume);
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
        
        audio.playSFX('game_over', 1.0 * sfxVolume);
        
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
        
        const durationSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
        
        const payload = { 
            name: username.substring(0, 10), 
            score: score,
            mode: gameMode,
            duration: durationSeconds,
            aliensDestroyed: aliensDestroyed,
            shotsFired: shotsFired,
            wallsHit: wallsHit,
            tutorialPhase: null // Lo useremo più avanti
        };
        
        // Invia i dati al database tramite PHP
        fetch('salva_punteggio.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) sessionStorage.setItem('lastPlayedId', data.id); // Salva l'ID vero del DB
        })
        .catch(err => console.error("Errore salvataggio DB:", err))
        .finally(() => {
            window.location.href = 'leaderboard.php';
        });
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
        
        // Reset variabili statistiche
        aliensDestroyed = 0;
        shotsFired = 0;
        wallsHit = 0;
        gameStartTime = Date.now();
        spawnRate = 3500; // Resetta la difficoltà all'inizio di ogni nuova partita
        enemySpeed = 12.0;
        lastShootTime = 0;
        
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