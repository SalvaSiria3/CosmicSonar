document.addEventListener('DOMContentLoaded', () => {
    const starsContainer = document.querySelector('.stars');
    
    // Verifichiamo che il contenitore esista per evitare errori in console
    if (starsContainer) {
        for (let i = 0; i < 150; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 3 + 's';
            star.style.animationDuration = (2 + Math.random() * 2) + 's';
            starsContainer.appendChild(star);
        }
    }
});