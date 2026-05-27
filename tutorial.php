<?php
require_once 'src/components/template.php';

echo Template::render('src/html/tutorial.html', [
    'HEAD' => Template::render('src/html/head.html', []),
    'HEADER' => Template::render('src/html/header.html', [
        'HOME_HREF' => 'index.php',
        'HOME_CLASS' => '',
        'HOME_ARIA' => '',
        'MENU_HREF' => 'menu.php',
        'MENU_CLASS' => '',
        'MENU_ARIA' => '',
        'TUTORIAL_HREF' => '#',
        'TUTORIAL_CLASS' => 'disabled',
        'TUTORIAL_ARIA' => 'aria-current="page"',
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