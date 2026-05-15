class AudioEngine {
    constructor() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext(); // Ambiente audio (ctx sta per context)
        
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5; // Volume iniziale al 50%
        
        this.masterGain.connect(this.ctx.destination); // Collega il master gain all'uscita audio del browser
    }

    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    createAlienSonar(laneIndex) { //In base alla colonna, il suono sarà più a sinistra o a destra
        const osc = this.ctx.createOscillator(); // Crea un oscillatore per generare il suono del sonar
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime); // Frequenza di base (suono abbastanza basso)

        const panner = this.ctx.createStereoPanner();
        // Mappa la corsia 0, 1, 2 nei valori di pan -1 (Sinistra), 0 (Centro), 1 (Destra)
        panner.pan.value = laneIndex - 1;

        const alienGain = this.ctx.createGain();  // Serve per il volume del singolo alieno
        alienGain.gain.setValueAtTime(0, this.ctx.currentTime); // Parte muto finché non entra nello schermo

        // Catena audio: Oscillatore -> Panner -> Volume Singolo -> Volume Generale
        osc.connect(panner);
        panner.connect(alienGain);
        alienGain.connect(this.masterGain);

        osc.start();

        return { osc, alienGain, hasEntered: false };
    }

    startAlienSound(alienSound) {
        if (!alienSound || alienSound.hasEntered) return;
        alienSound.hasEntered = true; // Segna che il suono è stato attivato (c'era il problema che suonava prima che entrasse effettivamente nello schermo)
        
        // Alza dolcemente il volume da 0 a 0.05 in 5 centesimi di secondo
        alienSound.alienGain.gain.setTargetAtTime(0.05, this.ctx.currentTime, 0.05);  // Volume molto basso per ogni singolo alieno (se ce ne sono tanti diventa troppo forte)
    }

    stopAlienSonar(alienSound) { // Per quando muore l'alieno
        if (!alienSound) return;
        
        // Effettua un fade-out rapido per evitare "click" fastidiosi quando si taglia l'onda di netto
        alienSound.alienGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05);
        alienSound.osc.stop(this.ctx.currentTime + 0.1);
    }

    updateAlienPitch(alienSound, yPercentage) {
        if (!alienSound) return;
        const newFreq = 150 + (450 * yPercentage); // Da 150Hz a 600Hz
        alienSound.osc.frequency.setValueAtTime(newFreq, this.ctx.currentTime);
    }
}