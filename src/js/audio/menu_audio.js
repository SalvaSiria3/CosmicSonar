document.addEventListener('DOMContentLoaded', () => {
    const startBanner = document.getElementById('startBanner');
    const audioBanner = document.getElementById('audioBanner');
    
    // La musica non c'è nelle altre pagine
    if (startBanner) return;

    const menuSound = new Audio('src/assets/sounds/menu_sound.mp3');
    menuSound.loop = true;
    menuSound.preload = 'auto';

    const startMusic = () => {
        const savedTime = sessionStorage.getItem('menuMusicTime');
        if (savedTime) {
            menuSound.currentTime = parseFloat(savedTime);
        }

        // Tenta di avviare l'audio appena la pagina è caricata
        const playPromise = menuSound.play();

        // I browser nuovi bloccano l'autoplay audio se non c'è stata interazione
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Se bloccato, mostra il banner per chiedere il click
                if (audioBanner) audioBanner.classList.remove('hidden');

                const startAudioOnInteract = () => {
                    menuSound.currentTime = 0; 
                    menuSound.play();
                    if (audioBanner) audioBanner.classList.add('hidden');
                    
                    document.removeEventListener('keydown', startAudioOnInteract);
                    document.removeEventListener('click', startAudioOnInteract);
                };
                
                document.addEventListener('keydown', startAudioOnInteract);
                document.addEventListener('click', startAudioOnInteract);
            });
        }
    };

    // Attende che il file sia pronto prima di manipolare il tempo ed avviarlo
    if (menuSound.readyState >= 1) { // 1 = HAVE_METADATA
        startMusic();
    } else {
        menuSound.addEventListener('loadedmetadata', startMusic);
    }

    // Salva il tempo della canzone quando l'utente cambia pagina per farla continuare
    window.addEventListener('beforeunload', () => {
        sessionStorage.setItem('menuMusicTime', menuSound.currentTime);
    });
});