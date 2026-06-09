// /Users/siria/Desktop/Universita/SWE/CosmicSonar/src/js/ui/global_ui.js
document.addEventListener('DOMContentLoaded', () => {
    const headerBtn = document.getElementById('header-settings-btn');
    const menuSettingsBtn = document.getElementById('open-settings-btn'); // Il bottone grande del Menu
    const settingsModal = document.getElementById('settings-modal');
    const closeBtn = document.getElementById('close-settings-btn');
    const sfxSlider = document.getElementById('sfx-volume');
    const musicSlider = document.getElementById('music-volume');
    const testSfx = new Audio('src/assets/sounds/shot.mp3');

    // Identifica se siamo in una pagina di gioco (Game, Pacman, Tutorial)
    const isGamePage = document.getElementById('game-area') !== null;

    // --- LOGICA MODALE PER PAGINE NON-GIOCO (Menu, Home, Leaderboard) ---
    if (!isGamePage && settingsModal && closeBtn) {
        const openModal = () => {
            const currSfx = localStorage.getItem('cosmicSfxVol');
            const currMusic = localStorage.getItem('cosmicMusicVol');
            
            if (sfxSlider) sfxSlider.value = Math.round((currSfx !== null ? parseFloat(currSfx) : 0.9) * 10);
            if (musicSlider) musicSlider.value = Math.round((currMusic !== null ? parseFloat(currMusic) : 0.1) * 10);

            settingsModal.classList.remove('hide');
            if (sfxSlider) sfxSlider.focus();
        };

        const closeModal = () => {
            settingsModal.classList.add('hide');
            if (headerBtn) headerBtn.focus();
        };

        if (headerBtn) headerBtn.addEventListener('click', openModal);
        if (menuSettingsBtn) menuSettingsBtn.addEventListener('click', openModal);
        closeBtn.addEventListener('click', closeModal);

        settingsModal.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') closeModal();
        });

        // Gestione slider (Solo nelle pagine senza gioco, perché il gioco ha le sue regole per la modalità hard)
        if (sfxSlider) {
            sfxSlider.addEventListener('input', (e) => {
                const vol = e.target.value / 10;
                localStorage.setItem('cosmicSfxVol', vol);
                document.dispatchEvent(new CustomEvent('sfxVolumeChange', { detail: { volume: vol } }));
                
                testSfx.currentTime = 0; 
                testSfx.volume = 0.2 * vol; 
                testSfx.play().catch(() => {});
            });
        }

        if (musicSlider) {
            musicSlider.addEventListener('input', (e) => {
                const vol = e.target.value / 10;
                localStorage.setItem('cosmicMusicVol', vol);
                document.dispatchEvent(new CustomEvent('musicVolumeChange', { detail: { volume: vol } }));
            });
        }
    }
});
