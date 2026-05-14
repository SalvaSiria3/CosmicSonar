document.addEventListener('DOMContentLoaded', () => {
    const playerShip = document.getElementById('player-ship');
    const gameArea = document.getElementById('game-area');
    const scoreElement = document.getElementById('score');
    const lanes = [
        document.getElementById('lane-left'),
        document.getElementById('lane-center'),
        document.getElementById('lane-right')
    ];
    
    if (!playerShip || !gameArea) return;

    let currentLane = 1;
    let isGameRunning = false;
    let score = 0;
    let lives = 3;
    
    let spawnRate = 5000;
    let enemySpeed = 15.0; // Secondi di discesa dei nemici (più basso = più veloce)
    let spawnTimeoutId;
    let animationFrameId; // Motore di gioco continuo

    function updateShipPosition() {
        playerShip.classList.remove('lane-0', 'lane-1', 'lane-2');
        playerShip.classList.add(`lane-${currentLane}`);
    }

    document.addEventListener('keydown', (e) => {
        if (!isGameRunning) return;

        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            if (currentLane > 0) {
                currentLane--;
                updateShipPosition();
            }
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            if (currentLane < 2) {
                currentLane++;
                updateShipPosition();
            }
        } else if (e.code === 'Space') {
            e.preventDefault(); // Evita scroll schermo
            shoot();
        }
    });

    function spawnEnemy() {
        const laneIndex = Math.floor(Math.random() * 3);
        const alien = document.createElement('div');
        alien.className = 'alien';
        
        const alienType = Math.floor(Math.random() * 4) + 1;
        alien.classList.add(`alien-${alienType}`);
        alien.style.setProperty('--fall-speed', `${enemySpeed}s`);
        
        alien.addEventListener('animationend', () => {
            alien.remove();
        });

        lanes[laneIndex].appendChild(alien);
    }

    function scheduleNextSpawn() {
        if (!isGameRunning) return;
        
        spawnEnemy();
        
        // Aumenta la frequenza di comparsa (-2% di tempo tra uno spawn e l'altro)
        spawnRate = Math.max(400, spawnRate * 0.98); 
        
        // Aumenta la velocità fisica del nemico (-1% di durata dell'animazione)
        enemySpeed = Math.max(1.2, enemySpeed * 0.99); 
        
        spawnTimeoutId = setTimeout(scheduleNextSpawn, spawnRate);
    }

    // Spara il proiettile dalla posizione attuale del giocatore
    function shoot() {
        if (!isGameRunning) return;
        const laser = document.createElement('div');
        laser.className = 'laser';
        lanes[currentLane].appendChild(laser);
        
        laser.addEventListener('animationend', () => laser.remove());
    }

    function gameLoop() {
        if (!isGameRunning) return;
        
        const aliens = document.querySelectorAll('.alien:not(.exploded)');
        const lasers = document.querySelectorAll('.laser');
        const shipRect = playerShip.getBoundingClientRect(); // Coordinate della navicella sullo schermo
        const gameAreaRect = gameArea.getBoundingClientRect(); // Coordinate dell'area di gioco
        
        // 1. Controlla collisioni tra proiettili e alieni
        lasers.forEach(laser => {
            const laserRect = laser.getBoundingClientRect();
            aliens.forEach(alien => {
                const alienRect = alien.getBoundingClientRect();
                if (isColliding(laserRect, alienRect) && alienRect.bottom > gameAreaRect.top) {
                    laser.remove();

                    const currentTop = window.getComputedStyle(alien).top;
                    alien.style.setProperty('--freeze-top', currentTop);
                    
                    alien.classList.add('exploded');

                    
                    score += 10;    // Bastano 10?
                    if (scoreElement) scoreElement.textContent = score.toString().padStart(4, '0');
                }
            });
        });
        
        // 2. Controlla se un alieno è arrivato all'altezza della navicella senza essere stato colpito
        aliens.forEach(alien => {
            const alienRect = alien.getBoundingClientRect();
            if (alienRect.bottom >= shipRect.top + (shipRect.height * 0.2)) {
                alien.remove();
                loseLife();
            }
        });
        
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function isColliding(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                 rect1.left > rect2.right || 
                 rect1.bottom < rect2.top || 
                 rect1.top > rect2.bottom);
    }
    
    function loseLife() {
        if (lives <= 0) return;
        const lifeIcon = document.getElementById(`life-${lives}`);
        if (lifeIcon) {
            lifeIcon.src = 'src/assets/images/heart_empty.png';
        }
        lives--;
        
        if (lives <= 0) {
            gameOver();
        }
    }

    // Temporanea per testare il game over (da sistemare)
    function gameOver() {
        isGameRunning = false;
        clearTimeout(spawnTimeoutId);
        cancelAnimationFrame(animationFrameId);
        
        document.querySelectorAll('.alien, .laser').forEach(el => el.remove());
        
        setTimeout(() => {
            alert(`GAME OVER!\nLa Terra è stata invasa...\nPunteggio Finale: ${score}`);
            window.location.href = 'menu.php'; // Torna al menu principale (?)  
        }, 100);
    }

    window.startCosmicSonarGame = function() {
        if (isGameRunning) return;
        isGameRunning = true;
        
        scheduleNextSpawn();
        animationFrameId = requestAnimationFrame(gameLoop);
    };
});