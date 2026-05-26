-- Tabella Partite (Classifica)
CREATE TABLE IF NOT EXISTS partite (
    id_partita INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(10) NOT NULL,
    punteggio_finale INT NOT NULL DEFAULT 0,
    modalita ENUM('classic', 'hard', 'tutorial') NOT NULL DEFAULT 'classic',
    data_partita TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; -- quest'ultimo per le emoji --

-- Tabella Statistiche Partita (Ricerca e Dati Analitici)
CREATE TABLE IF NOT EXISTS statistiche_partita (
    id_partita INT PRIMARY KEY,
    durata_secondi INT DEFAULT 0,
    alieni_distrutti INT DEFAULT 0,
    colpi_sparati INT DEFAULT 0,
    muri_colpiti INT DEFAULT 0,
    fase_tutorial INT DEFAULT NULL, -- NULL nelle partite normali, 1-3 nel tutorial
    FOREIGN KEY (id_partita) REFERENCES partite(id_partita) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


/* Comandi sql per creare il db

CREATE DATABASE IF NOT EXISTS cosmicsonar_db;
CREATE USER 'cosmicsonar_user'@'localhost' IDENTIFIED BY 'cosmicsonar_password';
GRANT ALL PRIVILEGES ON cosmicsonar_db.* TO 'cosmicsonar_user'@'localhost';
FLUSH PRIVILEGES;

*/