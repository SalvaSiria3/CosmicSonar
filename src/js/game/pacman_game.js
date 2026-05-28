document.addEventListener('DOMContentLoaded', () => {
    // Sblocca permanentemente il tab della classifica di Pac-Man per questo utente
    localStorage.setItem('pacmanUnlocked', 'true');

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
    const gameMode = 'pacman'; // Modalità fissa
    let score = 0;
    let lives = 3;
    
    // Variabili per tracciamento statistiche Database
    let aliensDestroyed = 0;
    let wallsHit = 0;
    let gameStartTime = 0;
    
    let spawnRate = 3500;
    let enemySpeed = 12.0;
    let spawnTimeoutId;
    let animationFrameId;
    
    const audio = new AudioEngine();
    
    // Pre-carica tutti gli effetti sonori
    audio.loadSFX('explosion', 'src/assets/sounds/death_alien.mp3');
    audio.loadSFX('wall', 'src/assets/sounds/wall.mp3');
    audio.loadSFX('change_col', 'src/assets/sounds/change_col.mp3');
    audio.loadSFX('lose_life', 'src/assets/sounds/lose_life.mp3');
    audio.loadSFX('game_over', 'src/assets/sounds/game_over.mp3');
    
    // Audio separato per testare il volume
    const testSfx = new Audio('src/assets/sounds/shot.mp3');

    // --- MUSICA DI GIOCO ---
    const gameMusic = new Audio('src/assets/sounds/menu_sound.mp3');
    gameMusic.loop = true;
    gameMusic.preload = 'auto';

    // --- GESTIONE VOLUMI ---
    let sfxVolume = 0.9;
    let musicVolume = 0.1;
    
    const savedSfx = localStorage.getItem('cosmicSfxVol');
    const savedMusic = localStorage.getItem('cosmicMusicVol');
    if (savedSfx !== null) sfxVolume = parseFloat(savedSfx);
    if (savedMusic !== null) musicVolume = parseFloat(savedMusic);

    gameMusic.volume = musicVolume;

    const sfxSlider = document.getElementById('sfx-volume');
    const musicSlider = document.getElementById('music-volume');
    
    if (sfxSlider) sfxSlider.value = Math.round(sfxVolume * 10);
    if (musicSlider) musicSlider.value = Math.round(musicVolume * 10);

    if (sfxSlider) {
        sfxSlider.addEventListener('input', (e) => {
            let val = parseInt(e.target.value);
            sfxVolume = val / 10; 
            localStorage.setItem('cosmicSfxVol', sfxVolume);
            audio.setVolume(sfxVolume);
            
            testSfx.currentTime = 0;
            testSfx.volume = 0.2 * sfxVolume;
            testSfx.play().catch(() => {});
        });
    }

    if (musicSlider) {
        musicSlider.addEventListener('input', (e) => {
            let val = parseInt(e.target.value);
            musicVolume = val / 10;
            localStorage.setItem('cosmicMusicVol', musicVolume);
            gameMusic.volume = musicVolume;
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
            settingsBtn.focus();
        } else {
            isPaused = true;
            clearTimeout(spawnTimeoutId); 
            gameArea.classList.add('paused-animation'); 
            audio.suspend(); 
            settingsModal.classList.remove('hide');
            if (sfxSlider) sfxSlider.focus();
        }
    }

    settingsBtn.addEventListener('click', () => { if (!isPaused) togglePause(); });
    resumeBtn.addEventListener('click', () => { if (isPaused) togglePause(); });

    function updateShipPosition() {
        playerShip.classList.remove('lane-0', 'lane-1', 'lane-2');
        playerShip.classList.add(`lane-${currentLane}`);
    }

    function playWallSound() {
        wallsHit++;
        audio.playSFX('wall', 0.1 * sfxVolume);
    }

    function playChangeColSound() {
        audio.playSFX('change_col', 0.3 * sfxVolume);
    }

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Escape' && isGameRunning) {
            togglePause();
            return;
        }

        if (!isGameRunning || isPaused) return;

        // Blocchiamo anche lo spazio per evitare che la pagina scrolli per abitudine
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
            e.preventDefault();
        }

        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            if (e.repeat) return;
            
            if (currentLane > 0) {
                currentLane--;
                updateShipPosition();
                playChangeColSound();
            } else {
                playWallSound();
            }
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            if (e.repeat) return;
            
            if (currentLane < 2) {
                currentLane++;
                updateShipPosition();
                playChangeColSound();
            } else {
                playWallSound();
            }
        } else if (e.code === 'KeyP') {
            if (gameAnnouncer) {
                gameAnnouncer.textContent = `Punteggio: ${score}`;
            }
        } else if (e.code === 'KeyV') {
            if (gameAnnouncer) {
                gameAnnouncer.textContent = `Vite: ${lives}`;
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
        const currentMinSpeed = score > 2580 ? 1.7 : 2.5;
        enemySpeed = Math.max(currentMinSpeed, enemySpeed * 0.985); 
        
        spawnTimeoutId = setTimeout(scheduleNextSpawn, spawnRate);
    }

    function gameLoop() {
        if (!isGameRunning) return;
        
        if (isPaused) {
            animationFrameId = requestAnimationFrame(gameLoop);
            return; 
        }
        
        const alienNodes = document.querySelectorAll('.alien:not(.exploded)');
        
        const shipRect = playerShip.getBoundingClientRect(); 
        const gameAreaRect = gameArea.getBoundingClientRect(); 
        
        const aliens = Array.from(alienNodes).map(el => ({ el, rect: el.getBoundingClientRect() }));
        
        const aliensToExplode = new Map();
        const elementsToRemove = new Set();
        let newScore = null;
        let livesToLose = 0;
        
        aliens.forEach(alien => {
            if (aliensToExplode.has(alien.el) || elementsToRemove.has(alien.el)) return;
            
            if (alien.rect.bottom > gameAreaRect.top) {
                audio.startAlienSound(alien.el.audioNode);
            }
            
            // Se il fantasma ha raggiunto la linea di collisione con Pac-Man
            if (alien.rect.bottom >= shipRect.top + (shipRect.height * 0.2)) {
                // Controlla se Pac-Man è nella stessa colonna (collisione)
                if (isColliding(shipRect, alien.rect)) {
                    elementsToRemove.add(alien.el);
                    const exactCssTop = window.getComputedStyle(alien.el).top;
                    aliensToExplode.set(alien.el, exactCssTop);
                    aliensDestroyed++;
                    audio.stopAlienSonar(alien.el.audioNode);
                    audio.playSFX('explosion', 1.0 * sfxVolume);
                    synthesizeWaka(); // Suona il "waka waka" solo quando lo mangi!
                    score += 10;
                    newScore = score;
                } else {
                    // Altrimenti il fantasma sfugge e ti colpisce (perdi una vita)
                    elementsToRemove.add(alien.el);
                    audio.stopAlienSonar(alien.el.audioNode);
                    livesToLose++;
                }
            } else {
                const yPercentage = Math.max(0, Math.min(1, (alien.rect.bottom - gameAreaRect.top) / gameAreaRect.height));
                audio.updateAlienPitch(alien.el.audioNode, yPercentage);
            }
        });

        elementsToRemove.forEach(el => el.remove());
        
        aliensToExplode.forEach((exactCssTop, alienEl) => {
            alienEl.style.setProperty('--freeze-top', exactCssTop);
            alienEl.classList.add('exploded');
        });
        
        if (newScore !== null) {
            if (scoreElement) scoreElement.textContent = newScore.toString().padStart(5, '0');
            const srScore = document.getElementById('sr-score');
            if (srScore) srScore.textContent = `Punteggio: ${newScore}`;
            
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
        const srLives = document.getElementById('sr-lives');
        if (srLives) {
            srLives.textContent = `Vite: ${lives}`;
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
        
        gameMusic.pause();

        document.querySelectorAll('.alien').forEach(el => {
            if (el.classList.contains('alien') && el.audioNode) {
                audio.stopAlienSonar(el.audioNode);
            }
            el.remove();
        });
        
        audio.playSFX('game_over', 1.0 * sfxVolume);
        
        if (gameArea) gameArea.classList.remove('active');
        if (topBarGame) topBarGame.classList.remove('active');
        
        if (gameAnnouncer) {
            gameAnnouncer.textContent = `Game Over. Punteggio finale: ${score}. Inserisci il tuo nome per la classifica oppure clicca direttamente salva e rimani anonimo.`;
        }
        
        if (gameOverScreen) {
            gameOverScreen.classList.remove('hide');
            gameOverScreen.classList.add('active');
            finalScoreElement.textContent = score.toString().padStart(5, '0');
            
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
            shotsFired: 0, // In Pac-Man non si spara
            wallsHit: wallsHit,
            tutorialPhase: null
        };
        
        fetch('save_score.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) sessionStorage.setItem('lastPlayedId', data.id);
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
        usernameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveScoreAndRedirect();
            } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                if (usernameInput.value.length >= 10 && usernameInput.selectionStart === usernameInput.selectionEnd) {
                    audio.playSFX('wall', 0.3 * sfxVolume);
                }
            }
        });
    }

    function startPacmanGame() {
        if (isGameRunning) return;
        isGameRunning = true;
        
        aliensDestroyed = 0;
        wallsHit = 0;
        gameStartTime = Date.now();
        spawnRate = 3500;
        enemySpeed = 12.0;
        
        audio.resume();
        gameMusic.play().catch(e => console.log("Impossibile avviare musica", e));

        if (gameAnnouncer) {
            gameAnnouncer.textContent = 'Livello segreto Pac-Man mode iniziato. Navicella posizionata nella corsia centrale.';
        }
        
        scheduleNextSpawn();
        animationFrameId = requestAnimationFrame(gameLoop);
    };

    const btnPacman = document.getElementById('btn-pacman');
    if (btnPacman) {
        btnPacman.addEventListener('click', () => {
            const modeSelection = document.getElementById('mode-selection');
            if (modeSelection) modeSelection.classList.add('hide');
            if (topBarGame) topBarGame.classList.add('active');
            if (gameArea) gameArea.classList.add('active');
            startPacmanGame();
        });
    }

    function synthesizeWaka() {
        if (!audio.ctx) return;
        const osc = audio.ctx.createOscillator();
        const gain = audio.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, audio.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audio.ctx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(300, audio.ctx.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0, audio.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3 * sfxVolume, audio.ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, audio.ctx.currentTime + 0.2);
        
        osc.connect(gain);
        gain.connect(audio.masterGain);
        
        osc.start(audio.ctx.currentTime);
        osc.stop(audio.ctx.currentTime + 0.2);
    }
});