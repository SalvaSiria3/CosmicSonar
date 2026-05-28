// Previene il FOUC (Flash of Unstyled Content) nascondendo la pagina finché tutto non è pronto
window.addEventListener('load', () => {
    if (document.fonts) {
        document.fonts.ready.then(() => document.body.classList.add('loaded'));
    } else {
        document.body.classList.add('loaded'); // Fallback per browser molto vecchi
    }
});