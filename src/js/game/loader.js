document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');
    const topBarGame = document.getElementById('topbargame');
    const progressBar = document.getElementById('progress-bar');
    const loadingPercentage = document.getElementById('loading-percentage');
    const loadingText = document.getElementById('loading-text');

    if (!loadingScreen) return;

    const gameAssets = [
        //inserire i veri file
        'sound1.mp3', 'sound2.wav', 'sound3.ogg', 'sound4.mp3', 'sound5.wav',
        'image1.png', 'image2.svg', 'image3.webp', 'image4.png', 'image5.png',
        'font1.woff2', 'config.json', 'level1.json', 'level2.json', 'sprite_sheet.png',
        'sound6.mp3', 'sound7.wav', 'image6.png', 'image7.png', 'image8.png'
    ];

    let assetsLoaded = 0;
    const totalAssets = gameAssets.length;

    function updateProgress() {
        assetsLoaded++;
        const percentage = Math.round((assetsLoaded / totalAssets) * 100);

        progressBar.style.width = percentage + '%';
        
        // aggiorna il testo della percentuale per gli screen reader
        loadingPercentage.textContent = percentage + '%';

        // comunica il valore allo screen reader
        progressBar.setAttribute('aria-valuenow', percentage);

        // controlla se il caricamento è terminato
        if (assetsLoaded === totalAssets) {
            setTimeout(loadingComplete, 300); // piccola pausa per mostrare il 100% prima di passare alla schermata successiva
        }
    }

    function simulateAssetLoading() {
        if (totalAssets === 0) {
            loadingComplete();
            return;
        }
        // simulazione caricamento di un asset ogni X millisecondi (finchè non ho i veri file)
        gameAssets.forEach((asset, index) => {
            setTimeout(updateProgress, (index + 1) * 75); // Aumenta il ritardo per ogni asset
        });
    }

    function loadingComplete() {
        loadingText.textContent = 'Caricamento completato!';
        
        // Nasconde la barra e la percentuale (e altre info del gioco)
        progressBar.parentElement.style.display = 'none';
        loadingPercentage.style.display = 'none';

        // Crea e mostra il pulsante "Gioca"
        const playButton = document.createElement('button');
        playButton.textContent = 'Gioca';
        playButton.className = 'play-button';
        loadingScreen.appendChild(playButton);
        
        playButton.focus(); // comodo per la tastiera

        playButton.addEventListener('click', () => {
            // Nascondi la schermata di caricamento e mostra l'interfaccia di gioco
            loadingScreen.style.display = 'none';
            if (topBarGame) topBarGame.style.display = 'flex';
            // Qui inizierà la vera logica del gioco (es. initGame())
        });
    }

    // Avvia la simulazione del caricamento
    simulateAssetLoading();
});