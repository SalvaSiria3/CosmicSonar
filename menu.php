<?php
require_once 'src/components/template.php';


$page_scripts = ''; // Nessuno script specifico per questa pagina

echo Template::render('src/html/menu.html', [
    'HEAD' => Template::render('src/html/head.html', ['PAGE_SCRIPTS' => $page_scripts]),
    'HEADER' => Template::render('src/html/header.html', [
        'HOME_HREF' => 'index.php',
        'HOME_CLASS' => '',
        'HOME_ARIA' => '',
        'MENU_HREF' => '#',
        'MENU_CLASS' => 'disabled',
        'MENU_ARIA' => 'aria-current="page"',
        'TUTORIAL_HREF' => 'tutorial.php',
        'TUTORIAL_CLASS' => '',
        'TUTORIAL_ARIA' => '',
        'GAME_HREF' => 'game.php',
        'GAME_CLASS' => '',
        'GAME_ARIA' => '',
        'LEADERBOARD_HREF' => 'leaderboard.php',
        'LEADERBOARD_CLASS' => '',
        'LEADERBOARD_ARIA' => ''
    ]),
    'FOOTER' => Template::render('src/html/footer.html', []),
    'WARNING' => Template::render('src/html/warning.html', [])
]);