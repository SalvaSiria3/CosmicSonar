<?php
require_once 'src/components/template.php';


$page_scripts = '<script src="src/js/game/loader.js" defer></script>' . "\n" .
                '    <script src="src/js/game/game.js" defer></script>';

echo Template::render('src/html/game.html', [
    'HEAD' => Template::render('src/html/head.html', ['PAGE_SCRIPTS' => $page_scripts]),
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
        'GAME_HREF' => '#',
        'GAME_CLASS' => 'disabled',
        'GAME_ARIA' => 'aria-current="page"',
        'LEADERBOARD_HREF' => 'leaderboard.php',
        'LEADERBOARD_CLASS' => '',
        'LEADERBOARD_ARIA' => ''
    ]),
    'FOOTER' => Template::render('src/html/footer.html', []),
    'WARNING' => Template::render('src/html/warning.html', [])
]);