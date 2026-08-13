FROM php:8.2-apache

# Install CA certificates and dependencies
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Enable Apache Mod Rewrite for CORS and API routing
RUN a2enmod rewrite

# Install PDO MySQL PHP extension
RUN docker-php-ext-install pdo pdo_mysql

# Set working directory
WORKDIR /var/www/html

# Copy PHP backend API files
COPY backend/api/ /var/www/html/

# Ensure permissions
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80

CMD ["apache2-foreground"]
