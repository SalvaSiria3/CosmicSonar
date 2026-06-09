<?php
require_once 'src/components/template.php';

$page_scripts = '';

echo Template::render('src/html/index.html', [
    'HEAD' => Template::render('src/html/head.html', ['PAGE_SCRIPTS' => $page_scripts]),
    'HEADER' => Template::render('src/html/header.html', [
        'HOME_HREF' => '#',
        'HOME_CLASS' => 'disabled',
        'HOME_ARIA' => 'aria-current="page"',
        'MENU_HREF' => 'menu.php',
        'MENU_CLASS' => '',
        'MENU_ARIA' => '',
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
    'WARNING' => Template::render('src/html/warning.html', []),
    'SETTINGS' => Template::render('src/html/settings.html', [])
]);