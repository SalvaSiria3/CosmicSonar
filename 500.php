<?php
require_once 'src/components/template.php';

// Imposta l'intestazione HTTP di errore del server
http_response_code(500);

echo Template::render('src/html/500.html', [
    'HEAD' => Template::render('src/html/head.html', []),
    'HEADER' => Template::render('src/html/header.html', [
        'HOME_HREF' => 'index.php',
        'HOME_CLASS' => '',
        'HOME_ARIA' => '',
        'MENU_HREF' => 'menu.php',
        'MENU_CLASS' => '',
        'MENU_ARIA' => '',
        'TUTORIAL_HREF' => 'tutorial.php',
        'TUTORIAL_CLASS' => '',
        'TUTORIAL_ARIA' => '',
        'GAME_HREF' => 'game.php',
        'GAME_CLASS' => '',
        'GAME_ARIA' => ''
    ]),
    'FOOTER' => Template::render('src/html/footer.html', []),
    'WARNING' => Template::render('src/html/warning.html', [])
]);