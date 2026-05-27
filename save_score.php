<?php
require_once 'connection.php';

// Diciamo al browser che risponderemo in formato JSON
header('Content-Type: application/json');

// Recupera il JSON inviato da Javascript (fetch)
$rawData = file_get_contents('php://input');
$data = json_decode($rawData, true);

if (!$data) {
    echo json_encode(['success' => false, 'error' => 'Nessun dato ricevuto']);
    exit;
}

// Estrapola e pulisce i dati ricevuti
$username = substr(trim($data['name'] ?? 'ANONIMUS'), 0, 10);
if (empty($username)) $username = 'ANONIMUS';

$score = (int)($data['score'] ?? 0);
$mode = $data['mode'] ?? 'classic';
$duration = (int)($data['duration'] ?? 0);
$aliens = (int)($data['aliensDestroyed'] ?? 0);
$shots = (int)($data['shotsFired'] ?? 0);
$walls = (int)($data['wallsHit'] ?? 0);
$tutorialPhase = isset($data['tutorialPhase']) ? (int)$data['tutorialPhase'] : null;

try {
    // Inizia la transazione: o salva in entrambe le tabelle, o non salva nulla.
    $pdo->beginTransaction();

    // 1. Salva la Partita
    $stmtPartita = $pdo->prepare("INSERT INTO partite (username, punteggio_finale, modalita) VALUES (:username, :score, :mode)");
    $stmtPartita->execute([':username' => $username, ':score' => $score, ':mode' => $mode]);
    $idPartita = $pdo->lastInsertId(); // Recupera l'ID univoco appena generato

    // 2. Salva le Statistiche collegate
    $stmtStats = $pdo->prepare("INSERT INTO statistiche_partita (id_partita, durata_secondi, alieni_distrutti, colpi_sparati, muri_colpiti, fase_tutorial) VALUES (:id, :duration, :aliens, :shots, :walls, :tutorial)");
    $stmtStats->execute([':id' => $idPartita, ':duration' => $duration, ':aliens' => $aliens, ':shots' => $shots, ':walls' => $walls, ':tutorial' => $tutorialPhase]);

    $pdo->commit();
    echo json_encode(['success' => true, 'id' => $idPartita]);
} catch (PDOException $e) {
    $pdo->rollBack(); // Se c'è un errore, annulla tutto
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}