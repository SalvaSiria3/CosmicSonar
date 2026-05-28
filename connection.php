<?php
// Parametri di connessione al database
$host = 'localhost';
$dbname = 'cosmicsonar_db';
$user = 'cosmicsonar_user';
$password = 'cosmicsonar_password';

// Definizione del DSN (Data Source Name)
$dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";

try {
    // Creazione dell'istanza PDO
    $pdo = new PDO($dsn, $user, $password);
    
    // Configura PDO per lanciare eccezioni in caso di errori SQL
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Configura PDO per restituire i risultati come array associativi di default
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
} catch (PDOException $e) {
    // Blocca l'esecuzione e mostra un messaggio se la connessione fallisce
    // die("Errore di connessione al database: " . $e->getMessage());

    // In un ambiente di produzione, non mostrare mai l'errore esatto ma reindirizza a una pagina di errore generica.
    header("Location: 500.php");
    exit;
}
?>