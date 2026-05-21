document.addEventListener('DOMContentLoaded', () => {
    const startBanner = document.getElementById('startBanner');
    const audioBanner = document.getElementById('audioBanner');
    const gameArea = document.getElementById('game-area');
    
    // Evita di riprodurre la musica del menù nella Home o durante il Gioco
    if (startBanner || gameArea) return;

    const menuSound = new Audio('src/assets/sounds/menu_sound.mp3');
    menuSound.loop = true;
    menuSound.preload = 'auto';

    // Recupera e imposta subito il volume salvato per la musica del menu
    const savedMusic = localStorage.getItem('cosmicMusicVol');
    menuSound.volume = savedMusic !== null ? parseFloat(savedMusic) : 0.1;

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

    if (menuSound.readyState >= 1) { // 1 = HAVE_METADATA
        startMusic();
    } else {
        menuSound.addEventListener('loadedmetadata', startMusic);
    }
    
    // --- GESTIONE IMPOSTAZIONI NEL MENU ---
    const openSettingsBtn = document.getElementById('open-settings-btn');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const sfxSlider = document.getElementById('sfx-volume');
    const musicSlider = document.getElementById('music-volume');
    
    const testSfx = new Audio('src/assets/sounds/shot.mp3'); // Feedback sonoro per gli slider SFX

    if (openSettingsBtn && settingsModal && closeSettingsBtn) {
        openSettingsBtn.addEventListener('click', () => {
            // Allinea gli slider con i volumi attualmente salvati (o quelli di default)
            const currSfx = localStorage.getItem('cosmicSfxVol');
            const currMusic = localStorage.getItem('cosmicMusicVol');
            
            if (sfxSlider) sfxSlider.value = Math.round((currSfx !== null ? parseFloat(currSfx) : 0.9) * 10);
            if (musicSlider) musicSlider.value = Math.round((currMusic !== null ? parseFloat(currMusic) : 0.1) * 10);
            
            settingsModal.classList.remove('hide');
        });

        closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hide'));
    }

    if (sfxSlider) {
        sfxSlider.addEventListener('input', (e) => {
            const vol = e.target.value / 10;
            localStorage.setItem('cosmicSfxVol', vol);
            sfxSlider.setAttribute('aria-valuenow', e.target.value);
            
            const currentTestSfx = testSfx.cloneNode(); // Previene i glitch trascinando velocemente lo slider
            currentTestSfx.volume = 0.2 * vol; 
            currentTestSfx.play().catch(() => {});
        });
    }

    if (musicSlider) {
        musicSlider.addEventListener('input', (e) => {
            const vol = e.target.value / 10;
            localStorage.setItem('cosmicMusicVol', vol);
            musicSlider.setAttribute('aria-valuenow', e.target.value); // WCAG Best Practice
            menuSound.volume = vol; // Modifica il volume della musica in sottofondo in tempo reale!
        });
    }

    window.addEventListener('beforeunload', () => {
        sessionStorage.setItem('menuMusicTime', menuSound.currentTime);
    });
});