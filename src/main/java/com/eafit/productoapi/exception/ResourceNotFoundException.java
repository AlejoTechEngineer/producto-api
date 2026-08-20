package com.eafit.productoapi.exception;

/**
 * Se lanza cuando se solicita un recurso (por ejemplo, un Producto)
 * que no existe en la base de datos.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
