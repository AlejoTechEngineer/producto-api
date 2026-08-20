package com.eafit.productoapi.exception;

import com.eafit.productoapi.controller.ProductoController;
import com.eafit.productoapi.service.ProductoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProductoController.class)
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductoService productoService;

    @Test
    void ocultaElDetalleInternoEnError500() throws Exception {
        when(productoService.listarTodos())
                .thenThrow(new RuntimeException("Detalle interno sensible: NPE en columna X"));

        mockMvc.perform(get("/api/productos"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("Ha ocurrido un error interno. Intenta mas tarde."))
                .andExpect(jsonPath("$.message").value(not(containsString("Detalle interno sensible"))));
    }
}
