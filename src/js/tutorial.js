class TutorialManager {
    constructor() {
        this.state = {
            phase: 0, // 0: Hints, 1: Panning, 2: Fuoco, 3: Distanza, 4: Fine
            isPlaying: false
        };
        
        this.shipLane = 1; // 0 = sinistra, 1 = centro, 2 = destra
        this.phaseProgress = 0; // Traccia quanti alieni sono stati completati nella fase
        this.availableLanes = [0, 1, 2]; // Per avere almeno una corsia per tipo per fase
        this.availableAlienTypes = [1, 2, 3, 4]; // Differenzia le immagini degli alieni
        this.alienLane = null;
        this.alienSound = null;
        this.alienElement = null;
        this.lastShootTime = 0;
        this.animationFrameId = null;

        // Forza volumi molto bassi appositamente per il tutorial
        this.sfxVolume = 0.2;
        this.musicVolume = 0.05;
        
        this.gameMusic = new Audio('src/assets/sounds/menu_sound.mp3');
        this.gameMusic.loop = true;
        this.gameMusic.volume = this.musicVolume;

        this.ui = {
            uiPanel: document.getElementById('tutorial-ui'),
            phaseTitle: document.getElementById('tutorial-phase-title'),
            announcer: document.getElementById('tutorial-announcer'),
            instructions: document.getElementById('tutorial-instructions'),
            actionBtn: document.getElementById('tutorial-action-btn'),
            gameArea: document.getElementById('game-area'),
            playerShip: document.getElementById('player-ship'),
            phaseCounter: document.getElementById('tutorial-phase-counter'),
            lanes: [
                document.getElementById('lane-left'),
                document.getElementById('lane-center'),
                document.getElementById('lane-right')
            ]
        };

        this.audioEngine = new AudioEngine();

        this.init();
    }

    init() {
        this.audioEngine.loadSFX('shoot', 'src/assets/sounds/shot.mp3');
        this.audioEngine.loadSFX('explosion', 'src/assets/sounds/death_alien.mp3');
        this.audioEngine.loadSFX('wall', 'src/assets/sounds/wall.mp3');
        this.audioEngine.loadSFX('change_col', 'src/assets/sounds/change_col.mp3');
        this.audioEngine.loadSFX('lose_life', 'src/assets/sounds/lose_life.mp3');

        this.updateBannerUI();

        this.ui.actionBtn.addEventListener('click', () => {
            // Avvia la musica al primo click
            this.gameMusic.play().catch(e => console.log("Auto-play bloccato:", e));
            
            this.audioEngine.resume(); // Avvia l'audio al primo click
            
            if (this.state.phase === 4) {
                window.location.href = 'game.php';
                return;
            }
            
            if (this.state.phase === 0) {
                this.nextPhase();
                return;
            }

            this.hideBanner();
            if (!this.state.isPlaying) {
                this.startPhaseGameplay();
            }
        });

        document.getElementById('repeat-instructions-btn').addEventListener('click', () => {
            if (this.state.phase > 0 && this.state.phase < 4) {
                this.showBanner();
            }
        });
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    showBanner() {
        this.updateBannerUI();
        this.ui.uiPanel.classList.remove('hide');
        this.ui.actionBtn.textContent = 'Riprendi';
        this.state.isPlaying = false;
        this.ui.gameArea.classList.add('paused-animation');
        this.audioEngine.suspend(); // Ferma gli effetti sonori in pausa
        
        // Annuncia le istruzioni allo screen reader
        if (this.ui.announcer) {
            const srOnly = this.ui.instructions.querySelector('.sr-only');
            this.ui.announcer.textContent = srOnly ? srOnly.textContent : this.ui.instructions.textContent;
        }
        
        setTimeout(() => this.ui.uiPanel.focus(), 100);
    }

    showRetryBanner() {
        this.ui.uiPanel.classList.remove('hide');
        this.state.isPlaying = false;
        
        this.audioEngine.suspend(); // Mette in pausa eventuali suoni residui
        this.ui.gameArea.classList.add('paused-animation'); // Ferma le animazioni
        
        this.ui.phaseTitle.textContent = 'Oh no! Riprova...';
        this.ui.instructions.innerHTML = '<span class="sr-only">Il bersaglio ti è sfuggito. Spostati sotto di lui e distruggilo prima che ti raggiunga!</span><span aria-hidden="true">Il bersaglio ti è sfuggito.<br>Spostati sotto di lui e distruggilo prima che ti raggiunga!</span>';
        this.ui.actionBtn.textContent = 'Riprova';
        
        if (this.ui.announcer) {
            const srOnly = this.ui.instructions.querySelector('.sr-only');
            this.ui.announcer.textContent = srOnly ? srOnly.textContent : this.ui.instructions.textContent;
        }
        
        setTimeout(() => this.ui.uiPanel.focus(), 100);
    }

    hideBanner() {
        this.ui.uiPanel.classList.add('hide');
        this.ui.gameArea.classList.remove('paused-animation');
        
        // Svuota l'annunciatore per evitare che lo screen reader ripeta frasi vecchie
        if (this.ui.announcer) {
            this.ui.announcer.textContent = '';
        }
        
        // Sposta il focus su un elemento vuoto (application) per zittire lo screen reader e catturare i tasti
        const gameFocus = document.getElementById('game-focus');
        if (gameFocus) {
            gameFocus.focus();
        }
    }

    updateBannerUI() {
        if (this.state.phase === 0) {
            this.ui.phaseCounter.textContent = 'Pre-partita';
        } else if (this.state.phase <= 3) {
            this.ui.phaseCounter.textContent = `Fase ${this.state.phase}/3`;
        }

        switch (this.state.phase) {
            case 0:
                this.ui.phaseTitle.textContent = 'Prima di iniziare...';
                this.ui.instructions.innerHTML = '<span class="sr-only">È fortemente consigliato l\'uso delle cuffie per sfruttare appieno l\'audio spaziale. Inoltre, ricorda che puoi premere ESC in qualsiasi momento per risentire le istruzioni e mettere in pausa.</span><span aria-hidden="true">È fortemente consigliato l\'uso delle <span class="hint-highlight">cuffie</span> per l\'audio 3D.<br>Premi <span class="hint-highlight">ESC</span> in qualsiasi momento per rivedere le istruzioni e mettere in pausa.</span>';
                this.ui.actionBtn.textContent = 'Avanti';
                break;
                
            case 1: // Fase 1 (Panning)
                this.ui.phaseTitle.textContent = 'Fase 1: Allineamento';
                this.ui.instructions.innerHTML = '<span class="sr-only">Il nemico è fermo nella parte alta dello schermo. Usa le frecce destra e sinistra per spostare la navicella sotto di lui. Il suono sarà bilanciato nelle cuffie quando sarai allineato.</span><span aria-hidden="true">Il nemico è fermo nella parte alta dello schermo.<br>Usa le <span class="hint-highlight">frecce destra e sinistra</span> per spostare la navicella sotto di lui. Il suono sarà bilanciato nelle cuffie quando sarai allineato.</span>';
                this.ui.actionBtn.textContent = 'Inizia';
                break;
            
            case 2: // Fase 2 (Fuoco)
                this.ui.phaseTitle.textContent = 'Fase 2: Fuoco';
                this.ui.instructions.innerHTML = '<span class="sr-only">Bersaglio allineato correttamente. Ora premi la barra spaziatrice per sparare un raggio laser e distruggere il bersaglio.</span><span aria-hidden="true">Bersaglio allineato correttamente.<br>Ora premi la <span class="hint-highlight">barra spaziatrice</span> per sparare un raggio laser e distruggere il bersaglio.</span>';
                this.ui.actionBtn.textContent = 'Continua';
                break;

            case 3: // Fase 3 (Distanza)
                this.ui.phaseTitle.textContent = 'Fase 3: Tempismo';
                this.ui.instructions.innerHTML = '<span class="sr-only">Perfetto! Ora un nuovo nemico sta scendendo verso di te. Ascolta il suo suono diventare sempre più acuto. Spostati sotto di lui e distruggilo!</span><span aria-hidden="true">Perfetto! Ora un nuovo nemico sta scendendo verso di te.<br>Ascolta il suo suono diventare <span class="hint-highlight">sempre più acuto</span>.<br>Spostati sotto di lui e distruggilo!</span>';
                this.ui.actionBtn.textContent = 'Continua';
                break;

            case 4: // Fine del tutorial
                this.ui.phaseTitle.textContent = 'Tutorial Completato!';
                this.ui.instructions.innerHTML = '<span class="sr-only">Hai imparato le basi di Cosmic Sonar. La vera sfida può avere inizio. Buona fortuna, comandante!</span><span aria-hidden="true">Hai imparato le basi di Cosmic Sonar.<br>La vera sfida può avere inizio.<br>Buona fortuna, comandante!</span>';
                this.ui.actionBtn.textContent = 'Vai al Gioco';
                this.ui.phaseCounter.textContent = 'Completato';
                break;
        }
    }

    nextPhase() {
        this.state.phase++;
        this.state.isPlaying = false;
        this.phaseProgress = 0; // Resetta il progresso per la nuova fase
        this.availableLanes = [0, 1, 2]; // Resetta le corsie disponibili
        this.availableAlienTypes = [1, 2, 3, 4]; // Resetta i tipi di alieni disponibili
        
        // Se c'è un alieno "avanzato" dalla fase precedente (es. da Fase 1 a Fase 2),
        // lo rimuoviamo dalle opzioni disponibili per non ripetere la sua corsia e grafica
        if (this.alienElement && this.alienLane !== null) {
            const laneIndex = this.availableLanes.indexOf(this.alienLane);
            if (laneIndex !== -1) {
                this.availableLanes.splice(laneIndex, 1);
            }
            
            const match = this.alienElement.className.match(/alien-(\d)/);
            if (match) {
                const type = parseInt(match[1]);
                const typeIndex = this.availableAlienTypes.indexOf(type);
                if (typeIndex !== -1) {
                    this.availableAlienTypes.splice(typeIndex, 1);
                }
            }
        }
        
        this.audioEngine.suspend();
        this.ui.gameArea.classList.add('paused-animation');
        this.updateBannerUI();
        this.ui.uiPanel.classList.remove('hide'); // Mostra il banner della nuova fase
        
        // Comunica la nuova fase allo screen reader
        if (this.ui.announcer) {
            const srOnly = this.ui.instructions.querySelector('.sr-only');
            const instructionsText = srOnly ? srOnly.textContent : this.ui.instructions.textContent;
            this.ui.announcer.textContent = `${this.ui.phaseTitle.textContent}. ${instructionsText}`;
        }
        
        // Sposta il focus sul container in modo che l'utente non salti per sbaglio le istruzioni
        setTimeout(() => this.ui.uiPanel.focus(), 100);
    }

    startPhaseGameplay() {
        this.state.isPlaying = true;
        this.audioEngine.resume();
        
        // Assicura che non ci siano loop duplicati in parallelo
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        // Avvia il loop di gioco
        this.gameLoop();
        
        // Spawna l'alieno SOLO se non è già presente in campo (evita cloni al click del bottone di ripresa)
        if (!this.alienElement) {
            switch (this.state.phase) {
                case 1:
                case 2:
                    this.spawnNextAlien(false);
                    break;
                case 3:
                    this.spawnNextAlien(true);
                    break;
            }
        }
    }

    handleKeyPress(e) {
        // Evita lo scrolling SEMPRE, a prescindere dal banner aperto o chiuso
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();
        }
        if (e.code === 'Space' && document.activeElement.tagName !== 'BUTTON') {
            e.preventDefault();
        }

        if (e.code === 'Escape') {
            if (this.state.phase > 0 && this.state.phase < 4) {
                this.showBanner(); // ESC funge da pausa come nel gioco principale
            }
            return;
        }

        if (!this.state.isPlaying || this.state.phase === 4 || this.state.phase === 0) return;
        if (!this.ui.uiPanel.classList.contains('hide')) return; // Blocca input se il banner è aperto

        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            if (e.repeat) return;
            this.moveShip(-1);
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            if (e.repeat) return;
            this.moveShip(1);
        } else if (e.code === 'Space') {
            if (e.repeat) return;
            this.shoot();
        }
    }

    moveShip(direction) {
        const newLane = this.shipLane + direction;
        
        if (newLane < 0 || newLane > 2) {
            this.audioEngine.playSFX('wall', 0.1 * this.sfxVolume);
            return;
        }

        this.shipLane = newLane;
        this.audioEngine.playSFX('change_col', 0.3 * this.sfxVolume);

        // Aggiorna visivamente la navicella
        this.ui.playerShip.classList.remove('lane-0', 'lane-1', 'lane-2');
        this.ui.playerShip.classList.add(`lane-${this.shipLane}`);

        // Controllo superamento fase 1
        if (this.state.phase === 1 && this.shipLane === this.alienLane) {
            this.state.isPlaying = false; // Blocca input
            this.phaseProgress++;
            
            setTimeout(() => {
                if (this.phaseProgress < 3) {
                    // Rimuove l'alieno silenziosamente
                    if (this.alienElement) {
                        this.audioEngine.stopAlienSonar(this.alienSound);
                        this.alienElement.remove();
                        this.alienElement = null;
                        this.alienLane = null;
                    }
                    this.spawnNextAlien(false);
                    this.state.isPlaying = true;
                } else {
                    this.nextPhase();
                }
            }, 400); // Piccolo ritardo per far capire di esserci riusciti
        }
    }

    shoot() {
        if (this.state.phase === 1) return; // Non può sparare nella fase 1

        const now = Date.now();
        if (now - this.lastShootTime < 200) return; 
        this.lastShootTime = now;

        this.audioEngine.playSFX('shoot', 0.2 * this.sfxVolume);

        // Crea il laser visivo
        const laser = document.createElement('div');
        laser.className = 'laser';
        this.ui.lanes[this.shipLane].appendChild(laser);

        laser.addEventListener('animationend', () => laser.remove());
    }

    spawnNextAlien(moving) {
        if (this.availableLanes.length === 0) return;
        
        let laneIndex = Math.floor(Math.random() * this.availableLanes.length);
        
        // Forza lo spostamento se l'alieno scelto per primo coincide con la navicella
        if (this.availableLanes.length > 1 && this.availableLanes[laneIndex] === this.shipLane) {
            laneIndex = (laneIndex + 1) % this.availableLanes.length;
        }
        
        const nextLane = this.availableLanes[laneIndex];
        this.availableLanes.splice(laneIndex, 1); // Rimuove la corsia dalle disponibili
        
        this.spawnAlien(nextLane, moving);
    }

    spawnAlien(lane, moving) {
        this.alienLane = lane;
        this.alienElement = document.createElement('div');
        
        const typeIndex = Math.floor(Math.random() * this.availableAlienTypes.length);
        const alienType = this.availableAlienTypes[typeIndex];
        this.availableAlienTypes.splice(typeIndex, 1); // Rimuove il tipo di alieno da quelli disponibili
        
        this.alienElement.className = `alien alien-${alienType}`;
        
        // Creiamo il suono spaziale ma NON lo avviamo immediatamente
        this.alienSound = this.audioEngine.createAlienSonar(lane);

        if (!moving) {
            this.alienElement.style.animation = 'none'; // Immobile per le prime fasi
            this.alienElement.style.top = '2cqw';
            this.audioEngine.startAlienSound(this.alienSound);
        } else {
            // Nella fase 3 si muove e aggiorniamo il pitch
            this.alienElement.style.setProperty('--fall-speed', '15s');
            this.alienElement.style.animation = 'fallDown var(--fall-speed, 15s) steps(30) forwards';
        }
        
        this.ui.lanes[lane].appendChild(this.alienElement);
    }

    destroyAlien() {
        if (!this.alienElement) return;
        
        this.audioEngine.stopAlienSonar(this.alienSound);
        this.audioEngine.playSFX('explosion', 1.0 * this.sfxVolume);

        const exactCssTop = window.getComputedStyle(this.alienElement).top;
        this.alienElement.style.setProperty('--freeze-top', exactCssTop);
        this.alienElement.classList.add('exploded');
        
        const el = this.alienElement;
        setTimeout(() => el.remove(), 300); // Rimuove dopo l'esplosione
        
        this.alienElement = null;
        this.alienLane = null;
    }

    gameLoop() {
        if (this.state.phase === 4) return; // Fine del tutorial

        if (!this.state.isPlaying) {
            // Se in pausa o tra uno spawn e l'altro, mantieni in vita il motore a vuoto
            this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
            return;
        }

        if (this.alienElement) {
            const alienRect = this.alienElement.getBoundingClientRect();
            const gameAreaRect = this.ui.gameArea.getBoundingClientRect();
            const shipRect = this.ui.playerShip.getBoundingClientRect();

            // 1. Aggiorna l'audio spaziale in base alla posizione esatta
            if (alienRect.bottom > gameAreaRect.top) {
                this.audioEngine.startAlienSound(this.alienSound);
                const yPercentage = Math.max(0, Math.min(1, (alienRect.bottom - gameAreaRect.top) / gameAreaRect.height));
                this.audioEngine.updateAlienPitch(this.alienSound, yPercentage);
            }

            // 2. Controllo reale collisione laser-alieno
            const lasers = document.querySelectorAll('#game-area .laser');
            lasers.forEach(laser => {
                if (!this.alienElement) return; // Evita di contare colpi multipli nello stesso millisecondo
                
                const laserRect = laser.getBoundingClientRect();
                if (this.isColliding(laserRect, alienRect) && alienRect.bottom > gameAreaRect.top) {
                    laser.remove();
                    this.destroyAlien();
                    this.state.isPlaying = false;
                    
                    this.phaseProgress++;
                    
                    if (this.phaseProgress < 3) {
                        setTimeout(() => {
                            this.spawnNextAlien(this.state.phase === 3);
                            this.state.isPlaying = true;
                        }, 800);
                    } else {
                        setTimeout(() => this.nextPhase(), 800);
                    }
                }
            });

            // 3. Se l'alieno sfugge nella fase 3, suona errore e dopo 1s mostra il banner "Riprova"
            if (this.alienElement && alienRect.bottom >= shipRect.top + (shipRect.height * 0.2)) {
                this.audioEngine.stopAlienSonar(this.alienSound);
                this.audioEngine.playSFX('lose_life', 0.6 * this.sfxVolume);
                
                this.alienElement.remove();
                this.alienElement = null;
                this.alienLane = null;
                
                this.state.isPlaying = false; // Ferma il gioco
                this.phaseProgress = 0; // Resetta i progressi in caso di errore
                this.availableLanes = [0, 1, 2]; // Resetta le corsie in caso di errore
                this.availableAlienTypes = [1, 2, 3, 4]; // Resetta i tipi di alieni in caso di errore
                
                setTimeout(() => {
                    this.showRetryBanner(); // Apre il banner di errore dopo aver sentito il colpo
                }, 1000); 
            }
        }

        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }

    isColliding(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                 rect1.left > rect2.right || 
                 rect1.bottom < rect2.top || 
                 rect1.top > rect2.bottom);
    }
}

// Inizializza il tutorial quando la pagina è caricata
window.addEventListener('DOMContentLoaded', () => {
    new TutorialManager();
});