<?php
require_once 'src/components/template.php';

echo Template::render('src/html/menu.html', [
    'HEAD' => Template::render('src/html/head.html', []),
    'HEADER' => Template::render('src/html/header.html', []),
    'FOOTER' => Template::render('src/html/footer.html', [])
]);