<?php
require_once 'src/components/template.php';

echo Template::render('src/html/game.html', [
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
        'GAME_HREF' => '#',
        'GAME_CLASS' => 'disabled',
        'GAME_ARIA' => 'aria-current="page"',
        'LEADERBOARD_HREF' => 'leaderboard.php',
        'LEADERBOARD_CLASS' => '',
        'LEADERBOARD_ARIA' => ''
    ]),
    'FOOTER' => Template::render('src/html/footer.html', [])
]);