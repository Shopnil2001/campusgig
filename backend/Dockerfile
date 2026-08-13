FROM php:8.2-apache

# Enable Apache Mod Rewrite for CORS and API routing
RUN a2enmod rewrite

# Install PDO MySQL PHP extension
RUN docker-php-ext-install pdo pdo_mysql

# Set working directory
WORKDIR /var/www/html

# Copy PHP backend API files to Apache root
COPY api/ /var/www/html/

# Ensure permissions
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80

CMD ["apache2-foreground"]
