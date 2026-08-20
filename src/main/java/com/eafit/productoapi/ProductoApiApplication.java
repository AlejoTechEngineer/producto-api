package com.eafit.productoapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Punto de entrada de la aplicacion.
 * Arquitectura de Aplicaciones Web - Unidad 2
 * Backend con servicios RESTful CRUD sobre base de datos usando Spring Boot.
 */
@SpringBootApplication
public class ProductoApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProductoApiApplication.class, args);
    }

}
