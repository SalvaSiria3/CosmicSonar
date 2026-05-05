FROM php:8.0-apache

RUN docker-php-ext-install mysqli pdo pdo_mysql

RUN a2enmod rewrite

WORKDIR /var/www/html

# Opzionale: assicura che Apache sia il proprietario dei file per evitare problemi di permessi
RUN chown -R www-data:www-data /var/www/html