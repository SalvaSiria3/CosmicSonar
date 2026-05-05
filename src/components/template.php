<?php

class Template {
    public static function render($file, $vars = []) {
        // costruiamo il percorso partendo dalla posizione di questo file
        $filePath = __DIR__ . "/../../" . $file;
        
        if (!file_exists($filePath)) {
            return "Errore: Template $file non trovato.";
        }

        $template = file_get_contents($filePath);

        foreach ($vars as $key => $value) {
            $template = str_replace("[!$key!]", $value, $template);
        }

        return $template;
    }
}