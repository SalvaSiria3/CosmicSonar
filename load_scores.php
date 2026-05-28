<?php
// Sicurezza: Accetta solo richieste AJAX/Fetch inviate dal nostro Javascript
if (empty($_SERVER['HTTP_X_REQUESTED_WITH']) || strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) !== 'xmlhttprequest') {
    // Se un utente prova ad accedere via URL, lo rimandiamo alla pagina 404 personalizzata
    header("Location: 404.php");
    exit;
}

require_once 'connection.php';

// Diciamo al browser che risponderemo in formato JSON
header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SELECT id_partita as id, username as name, punteggio_finale as score, modalita as mode FROM partite ORDER BY punteggio_finale DESC");
    $leaderboard = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'data' => $leaderboard]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}