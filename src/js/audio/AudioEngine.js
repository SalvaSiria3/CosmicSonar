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
        
        // Volume leggermente più basso è più bilanciato (rispetto ad 0.1)
        alienSound.alienGain.gain.setTargetAtTime(0.08, this.ctx.currentTime, 0.05);  
    }

    stopAlienSonar(alienSound) { // Per quando muore l'alieno
        if (!alienSound) return;
        
        // Effettua un fade-out rapido per evitare "click" fastidiosi quando si taglia l'onda di netto
        alienSound.alienGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05);
        alienSound.osc.stop(this.ctx.currentTime + 0.1);
    }

    updateAlienPitch(alienSound, yPercentage) {
        if (!alienSound) return;
        
        const baseFreq = 120 + (280 * yPercentage); // Da 120Hz a 400Hz
        alienSound.osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
        
        // Il filtro man mano che l'alieno scende, rende il suono più brillante e aggressivo
        alienSound.filter.frequency.setValueAtTime(800 + (3200 * yPercentage), this.ctx.currentTime);
    }
}