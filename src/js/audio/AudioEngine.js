class AudioEngine {
    constructor() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext(); // Ambiente audio (ctx sta per context)
        
        this.masterGain = this.ctx.createGain();
        
        // Carica il volume salvato o usa 0.9 (90%) di base. Il volume base dell'engine è 0.5.
        const savedSfxVolume = parseFloat(localStorage.getItem('cosmicSfxVol')) ?? 0.9;
        this.masterGain.gain.value = 0.5 * (isNaN(savedSfxVolume) ? 0.9 : savedSfxVolume); 
        
        this.masterGain.connect(this.ctx.destination); // Collega il master gain all'uscita audio del browser

        this.buffers = {}; // Memoria per i file audio decodificati
    }

    // Carica l'audio grezzo direttamente in memoria (evita limitazioni del browser)
    async loadSFX(name, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            this.ctx.decodeAudioData(arrayBuffer, (audioBuffer) => {
                this.buffers[name] = audioBuffer;
            });
        } catch (e) {
            console.error("Errore caricamento SFX:", name, e);
        }
    }

    // Crea una sorgente usa-e-getta senza lag che permette suoni sovrapposti illimitati
    playSFX(name, volume = 1.0) {
        if (!this.buffers[name]) return;
        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers[name];
        const gainNode = this.ctx.createGain();
        gainNode.gain.value = volume;
        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        source.start(0);
    }

    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    suspend() {
        if (this.ctx.state === 'running') {
            this.ctx.suspend(); // Si ferma il tempo del motore audio
        }
    }

    // Regola il volume globale degli alieni (SFX o effetti sonori)
    setVolume(volume) {
        this.masterGain.gain.setValueAtTime(0.5 * volume, this.ctx.currentTime);
    }

    createAlienSonar(laneIndex) { //In base alla colonna, il suono sarà più a sinistra o a destra
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(120, this.ctx.currentTime); // Frequenza di partenza udibile

        // Aggiungiamo un filtro per ovattare leggermente i suoni "zanzara"
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        // Taglia solo le frequenze altissime e fastidiose (suono troppo metallico), lasciando passare il corpo del suono
        filter.frequency.setValueAtTime(800, this.ctx.currentTime); 

        const panner = this.ctx.createStereoPanner();
        // Mappa la corsia 0, 1, 2 nei valori di pan -1 (Sinistra), 0 (Centro), 1 (Destra)
        panner.pan.value = laneIndex - 1;

        const alienGain = this.ctx.createGain();  // Serve per il volume del singolo alieno
        alienGain.gain.setValueAtTime(0, this.ctx.currentTime); // Parte muto finché non entra nello schermo

        // Catena audio: Oscillatore -> Filtro -> Panner -> Volume Singolo -> Volume Generale
        osc.connect(filter);
        filter.connect(panner);
        panner.connect(alienGain);
        alienGain.connect(this.masterGain);

        osc.start();

        return { osc, filter, alienGain, hasEntered: false };
    }

    startAlienSound(alienSound) {
        if (!alienSound || alienSound.hasEntered) return;
        alienSound.hasEntered = true; // Segna che il suono è stato attivato (c'era il problema che suonava prima che entrasse effettivamente nello schermo)
        
        alienSound.alienGain.gain.setTargetAtTime(0.08, this.ctx.currentTime, 0.05);  
    }

    stopAlienSonar(alienSound) { // Per quando muore l'alieno
        if (!alienSound || alienSound.isStopped) return;
        alienSound.isStopped = true; // Previene errori se chiamato più volte in un frame
        
        // Effettua un fade-out rapido per evitare "click" fastidiosi quando si taglia l'onda di netto
        alienSound.alienGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05);
        
        try {
            alienSound.osc.stop(this.ctx.currentTime + 0.1);
        } catch(e) {} // Ignora l'errore se per via del lag l'oscillatore è già morto
        
        //Disconnette i nodi audio per liberare memoria ed evitare rallentamenti
        setTimeout(() => {
            alienSound.osc.disconnect();
            alienSound.filter.disconnect();
            alienSound.alienGain.disconnect();
        }, 150);
    }

    updateAlienPitch(alienSound, yPercentage) {
        if (!alienSound || alienSound.isStopped) return;
        
        const baseFreq = 120 + (380 * yPercentage); // Da 120Hz a 400Hz
        alienSound.osc.frequency.value = baseFreq; // Assegnazione diretta per evitare crash della memoria audio a 60 FPS
        
        // Il filtro man mano che l'alieno scende, rende il suono più brillante e aggressivo
        alienSound.filter.frequency.value = 800 + (3000 * yPercentage);
    }
}