package com.eafit.productoapi.service;

import com.eafit.productoapi.dto.ProductoRequestDTO;
import com.eafit.productoapi.dto.ProductoResponseDTO;

import java.util.List;

/**
 * Contrato de la logica de negocio para Producto.
 * El controlador depende de esta interfaz y no de la implementacion,
 * lo que facilita pruebas y mantenimiento (principio de inversion de dependencias).
 */
public interface ProductoService {

    List<ProductoResponseDTO> listarTodos();

    ProductoResponseDTO buscarPorId(Long id);

    ProductoResponseDTO crear(ProductoRequestDTO dto);

    ProductoResponseDTO actualizar(Long id, ProductoRequestDTO dto);

    void eliminar(Long id);
}
