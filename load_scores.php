<?php
require_once 'connection.php';

// Diciamo al browser che risponderemo in formato JSON
header('Content-Type: application/json');

try {
    // Selezioniamo le informazioni pubbliche per la classifica, già ordinate dal più alto al più basso
    $stmt = $pdo->query("SELECT id_partita as id, username as name, punteggio_finale as score, modalita as mode FROM partite ORDER BY punteggio_finale DESC");
    $leaderboard = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'data' => $leaderboard]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}