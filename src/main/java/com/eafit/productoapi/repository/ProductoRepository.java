package com.eafit.productoapi.repository;

import com.eafit.productoapi.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositorio de acceso a datos para Producto.
 * Al extender JpaRepository, Spring Data JPA (Hibernate) genera
 * automaticamente las operaciones CRUD basicas contra la base de datos.
 */
@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
}
