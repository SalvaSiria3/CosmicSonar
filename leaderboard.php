<?php
require_once 'src/components/template.php';

echo Template::render('src/html/leaderboard.html', [
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
        'GAME_ARIA' => '',
        'LEADERBOARD_HREF' => '#',
        'LEADERBOARD_CLASS' => 'disabled',
        'LEADERBOARD_ARIA' => 'aria-current="page"'
    ]),
    'FOOTER' => Template::render('src/html/footer.html', [])
]);