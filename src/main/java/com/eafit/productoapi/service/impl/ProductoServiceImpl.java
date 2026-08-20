package com.eafit.productoapi.service.impl;

import com.eafit.productoapi.dto.ProductoRequestDTO;
import com.eafit.productoapi.dto.ProductoResponseDTO;
import com.eafit.productoapi.exception.ResourceNotFoundException;
import com.eafit.productoapi.model.Producto;
import com.eafit.productoapi.repository.ProductoRepository;
import com.eafit.productoapi.service.ProductoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implementacion de la logica de negocio para Producto.
 * Se encarga de traducir entre DTOs (capa web) y la entidad Producto (capa de persistencia),
 * y de lanzar las excepciones de negocio correspondientes.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ProductoServiceImpl implements ProductoService {

    private final ProductoRepository productoRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ProductoResponseDTO> listarTodos() {
        return productoRepository.findAll()
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProductoResponseDTO buscarPorId(Long id) {
        Producto producto = obtenerProductoOrFail(id);
        return toResponseDTO(producto);
    }

    @Override
    public ProductoResponseDTO crear(ProductoRequestDTO dto) {
        Producto producto = new Producto();
        producto.setNombre(dto.getNombre());
        producto.setDescripcion(dto.getDescripcion());
        producto.setPrecio(dto.getPrecio());

        Producto guardado = productoRepository.save(producto);
        return toResponseDTO(guardado);
    }

    @Override
    public ProductoResponseDTO actualizar(Long id, ProductoRequestDTO dto) {
        Producto producto = obtenerProductoOrFail(id);

        producto.setNombre(dto.getNombre());
        producto.setDescripcion(dto.getDescripcion());
        producto.setPrecio(dto.getPrecio());

        Producto actualizado = productoRepository.save(producto);
        return toResponseDTO(actualizado);
    }

    @Override
    public void eliminar(Long id) {
        Producto producto = obtenerProductoOrFail(id);
        productoRepository.delete(producto);
    }

    // --- Metodos de apoyo internos ---

    private Producto obtenerProductoOrFail(Long id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontro el producto con id: " + id));
    }

    private ProductoResponseDTO toResponseDTO(Producto producto) {
        return new ProductoResponseDTO(
                producto.getId(),
                producto.getNombre(),
                producto.getDescripcion(),
                producto.getPrecio());
    }
}
