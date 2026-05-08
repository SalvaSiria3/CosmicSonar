<?php
require_once 'src/components/template.php';

echo Template::render('src/html/index.html', [
    'HEAD' => Template::render('src/html/head.html', []),
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
    'FOOTER' => Template::render('src/html/footer.html', [])
]);