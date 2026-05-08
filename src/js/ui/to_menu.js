document.addEventListener('DOMContentLoaded', () => {
    let menuLoaded = false;
    const startBanner = document.getElementById('startBanner');
    const arcadeContainer = document.querySelector('.arcade-container');
    const insertCoinText = document.querySelector('.insert-coin');
    const statusMessage = document.getElementById('status-message');
    const nav = document.querySelector('nav');
    
    const coinSound = new Audio('src/assets/sounds/coin.mp3');
    coinSound.preload = 'auto'; // Forza il browser a caricare il suono in anticipo

    // Se siamo nella Home, resettiamo l'eventuale timer salvato per la musica del menu
    if (startBanner) {
        sessionStorage.removeItem('menuMusicTime');
    }

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !menuLoaded && startBanner) {
            e.preventDefault();
            toMenu();
        }
    });

    function toMenu() {
        if (menuLoaded) return;
        menuLoaded = true;

        // Riproduce suono moneta
        coinSound.currentTime = 0;
        coinSound.play().catch(e => console.log("Audio moneta non trovato:", e));

        if (startBanner) startBanner.classList.add('hidden');

        if (insertCoinText) {
            insertCoinText.style.animation = 'none';
            insertCoinText.style.transition = 'opacity 0.3s ease';
            insertCoinText.style.opacity = '0';
        }
        
        // Aggiorna lo screen reader
        if (statusMessage) {
            statusMessage.textContent = 'Moneta inserita. Caricamento del menu principale...';
        }

        // Esegue l'animazione di zoom sul cabinato
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

            // Rimuove lo zoom (a quanto pare il css fa da solo il ritorno dello zoom)
            if (arcadeContainer) arcadeContainer.classList.remove('zoomed');
            
            // Ripristina banner e scritte
            if (startBanner) startBanner.classList.remove('hidden');
            if (insertCoinText) {
                insertCoinText.style.animation = '';
                insertCoinText.style.transition = '';
                insertCoinText.style.opacity = '';
            }
            if (statusMessage) {
                statusMessage.textContent = 'Premi la barra spaziatrice per iniziare il gioco';
            }
        }
    });
});