<?php
// Parametri di connessione al database
$host = 'localhost';
$dbname = 'cosmicsonar_db';
$user = 'cosmicsonar_user';
$password = 'cosmicsonar_password';

// Definizione del DSN (Data Source Name)
$dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $user, $password);
    
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
} catch (PDOException $e) {
    // Blocca l'esecuzione e mostra un messaggio se la connessione fallisce
    // die("Errore di connessione al database: " . $e->getMessage());

    header("Location: 500.php");
    exit;
}
?>