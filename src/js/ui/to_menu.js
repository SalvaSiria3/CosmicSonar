document.addEventListener('DOMContentLoaded', () => {
    let menuLoaded = false;
    const startBanner = document.getElementById('startBanner');
    const arcadeContainer = document.querySelector('.arcade-container');
    const insertCoinText = document.querySelector('.insert-coin');
    const statusMessage = document.getElementById('status-message');
    const nav = document.querySelector('nav');
    const arcadeCoinBtn = document.getElementById('arcade-coin-btn');
    
    const coinSound = new Audio('src/assets/sounds/coin.mp3');
    coinSound.preload = 'auto'; // Forza il browser a caricare il suono in anticipo

    if (startBanner) {
        sessionStorage.removeItem('menuMusicTime');
    }

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !menuLoaded && startBanner) {
            e.preventDefault();
            toMenu();
        }
    });

    if (arcadeCoinBtn) {
        arcadeCoinBtn.addEventListener('click', () => {
            if (insertCoinText) {
                // Se c'è la scritta "inserisci moneta" allora siamo nella home: avvia la transizione
                toMenu();
            } else {
                // Se non c'è, siamo in un'altra pagina: riproduci solo il suono
                const savedSfx = localStorage.getItem('cosmicSfxVol');
                const sfxVolume = savedSfx !== null ? parseFloat(savedSfx) : 0.9;
                coinSound.volume = 1.0 * sfxVolume;
                coinSound.currentTime = 0;
                coinSound.play().catch(e => console.log("Audio moneta non trovato:", e));
            }
        });
    }

    function toMenu() {
        if (menuLoaded) return;
        menuLoaded = true;

        // Recupera il volume SFX salvato (o usa 0.9 di default)
        const savedSfx = localStorage.getItem('cosmicSfxVol');
        const sfxVolume = savedSfx !== null ? parseFloat(savedSfx) : 0.9;
        coinSound.volume = 1.0 * sfxVolume;

        coinSound.currentTime = 0;
        coinSound.play().catch(e => console.log("Audio moneta non trovato:", e));

        if (startBanner) startBanner.classList.add('hidden');

        if (insertCoinText) {
            insertCoinText.classList.add('insert-coin-hidden');
        }
        
        if (statusMessage) {
            statusMessage.textContent = 'Moneta inserita. Caricamento del menu principale...';
        }

        if (arcadeContainer) {
            arcadeContainer.classList.add('zoomed');
        }

        // Dopo 1.5 secondi (fine zoom CSS), reindirizza alla pagina del menu
        setTimeout(() => {
            window.location.href = 'menu.php';
        }, 1500);
    }


    // Gestisce il ritorno indietro tramite la cronologia del browser
    window.addEventListener('pageshow', (event) => {
        if (event.persisted && startBanner) {
            menuLoaded = false;

            if (arcadeContainer) arcadeContainer.classList.remove('zoomed');
            
            if (startBanner) startBanner.classList.remove('hidden');
            if (insertCoinText) {
                insertCoinText.classList.remove('insert-coin-hidden');
            }
            if (statusMessage) {
                statusMessage.textContent = 'Premi la barra spaziatrice per iniziare il gioco';
            }
        }
    });
});