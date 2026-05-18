document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');
    const topBarGame = document.getElementById('topbargame');
    const progressBar = document.getElementById('progress-bar');
    const loadingPercentage = document.getElementById('loading-percentage');
    const loadingText = document.getElementById('loading-text');

    if (!loadingScreen) return;

    const gameAssets = [
        // Assets
        'src/assets/images/cabinato.svg',
        'src/assets/images/background.png',
        'src/assets/images/background_screen.png',
        'src/assets/images/favicon.ico',
        'src/assets/images/logo_senza_sfondo.png',
        'src/assets/images/star.webp',
        'src/assets/images/tutorial_icon.png',
        'src/assets/images/game_icon.png',
        'src/assets/images/leaderboard_icon.png',
        'src/assets/images/settings_icon.png',
        'src/assets/images/navicella.png',
        'src/assets/images/heart_full.png',
        'src/assets/images/heart_empty.png',
        'src/assets/images/aliens1.webp',
        'src/assets/images/aliens2.webp',
        'src/assets/images/aliens3.webp',
        'src/assets/images/aliens4.webp',
        // Audio
        'src/assets/sounds/coin.mp3',
        'src/assets/sounds/menu_sound.mp3',
        'src/assets/sounds/game_over.mp3',
        'src/assets/sounds/shot.mp3',
        'src/assets/sounds/death_alien.mp3',
        'src/assets/sounds/lose_life.mp3',
        'src/assets/sounds/wall.mp3',
        'src/assets/sounds/alien.mp3'
    ];

    // Serve per far vedere il caricamento (sennò va troppo veloce)
    let assetsLoaded = 0;
    const totalAssets = gameAssets.length;
    const startTime = Date.now(); 
    function updateProgress() {
        assetsLoaded++;
        const percentage = Math.round((assetsLoaded / totalAssets) * 100);

        progressBar.style.width = percentage + '%';
        
        // aggiorna il testo della percentuale per gli screen reader (ha senso?)
        loadingPercentage.textContent = percentage + '%';

        // comunica il valore allo screen reader (ha senso?)
        progressBar.setAttribute('aria-valuenow', percentage);

        if (assetsLoaded === totalAssets) {
            const elapsedTime = Date.now() - startTime;
            const minimumLoadingTime = 1000;
            const delay = Math.max(300, minimumLoadingTime - elapsedTime);
            
            setTimeout(loadingComplete, delay);
        }
    }

    function preloadAssets() {
        if (totalAssets === 0) {
            setTimeout(loadingComplete, 2000);
            return;
        }
        
        gameAssets.forEach((asset) => {
            if (asset.endsWith('.png') || asset.endsWith('.svg') || asset.endsWith('.webp') || asset.endsWith('.ico')) {
                const img = new Image();
                img.onload = updateProgress;
                img.onerror = updateProgress;
                img.src = asset;
            } else if (asset.endsWith('.mp3') || asset.endsWith('.wav')) {
                const audio = new Audio();
                audio.oncanplaythrough = updateProgress;
                audio.onerror = updateProgress;
                audio.src = asset;
            }
        });
    }

    function loadingComplete() {
        loadingText.textContent = 'Caricamento completato!';
        
        progressBar.parentElement.classList.add('hide');
        loadingPercentage.classList.add('hide');

        const playButton = document.createElement('button');
        playButton.textContent = 'Gioca';
        playButton.className = 'arcade-btn play-button';
        loadingScreen.appendChild(playButton);
        
        playButton.focus(); // comodo per la tastiera (appena finito il caricamento il bottone ha già il focus)

        playButton.addEventListener('click', () => {

            loadingScreen.classList.add('hide');
            if (topBarGame) topBarGame.classList.add('active');
            
            const gameArea = document.getElementById('game-area');
            if (gameArea) gameArea.classList.add('active');
            
            if (typeof window.startCosmicSonarGame === 'function') {
                window.startCosmicSonarGame();
            }
        });
    }

    // Avvia il caricamento degli asset
    preloadAssets();
});