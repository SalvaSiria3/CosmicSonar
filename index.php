<?php
require_once 'src/components/template.php';

// 3. Renderizziamo il layout finale (un ipotetico file layout.html)
echo Template::render('src/html/index.html', [
    'HEAD' => Template::render('src/html/head.html', []),
    'HEADER' => Template::render('src/html/header.html', []),
    'FOOTER' => Template::render('src/html/footer.html', [])
]);