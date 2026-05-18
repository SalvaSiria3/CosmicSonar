class AudioEngine {
    constructor() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext(); // Ambiente audio (ctx sta per context)
        
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5; // Volume iniziale al 50%
        
        this.masterGain.connect(this.ctx.destination); // Collega il master gain all'uscita audio del browser

        this.alienBuffer = null;
        this.loadAlienSound();
    }

    async loadAlienSound() {
        try {
            // Scarica e decodifica il file mp3 per poterlo manipolare in 3D
            const response = await fetch('src/assets/sounds/alien.mp3');
            const arrayBuffer = await response.arrayBuffer();
            this.alienBuffer = await this.ctx.decodeAudioData(arrayBuffer);
        } catch (e) {
            console.warn("Impossibile caricare alien.mp3 per l'AudioEngine", e);
        }
    }

    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    createAlienSonar(laneIndex) { //In base alla colonna, il suono sarà più a sinistra o a destra
        if (!this.alienBuffer) return null; // Sicurezza: ignora se il file non è ancora stato scaricato

        const source = this.ctx.createBufferSource();
        source.buffer = this.alienBuffer;
        source.loop = true; // Il file mp3 si ripeterà all'infinito finché l'alieno vive

        const panner = this.ctx.createStereoPanner();
        // Mappa la corsia 0, 1, 2 nei valori di pan -1 (Sinistra), 0 (Centro), 1 (Destra)
        panner.pan.value = laneIndex - 1;

        const alienGain = this.ctx.createGain();  // Serve per il volume del singolo alieno
        alienGain.gain.setValueAtTime(0, this.ctx.currentTime); // Parte muto finché non entra nello schermo

        // Catena audio: Sorgente -> Panner -> Volume Singolo -> Volume Generale
        source.connect(panner);
        panner.connect(alienGain);
        alienGain.connect(this.masterGain);

        source.start();

        return { source, alienGain, hasEntered: false };
    }

    startAlienSound(alienSound) {
        if (!alienSound || alienSound.hasEntered) return;
        alienSound.hasEntered = true; // Segna che il suono è stato attivato (c'era il problema che suonava prima che entrasse effettivamente  nello schermo)
        
        // Volume per il file mp3. (Modifica lo 0.4 se l'originale è troppo forte o piano)
        alienSound.alienGain.gain.setTargetAtTime(0.4, this.ctx.currentTime, 0.05);
    }

    stopAlienSonar(alienSound) { // Per quando muore l'alieno
        if (!alienSound) return;
        
        // Effettua un fade-out rapido per evitare "click" fastidiosi quando si taglia l'onda di netto
        alienSound.alienGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05);
        alienSound.source.stop(this.ctx.currentTime + 0.1);
    }

    updateAlienPitch(alienSound, yPercentage) {
        if (!alienSound) return;
        
        // 1 = velocità normale. Partiamo da 0.5 (molto più grave/lento) e arriviamo a 1.2 (leggermente più acuto)
        const newRate = 0.5 + (0.7 * yPercentage); 
        alienSound.source.playbackRate.setValueAtTime(newRate, this.ctx.currentTime);
    }
}