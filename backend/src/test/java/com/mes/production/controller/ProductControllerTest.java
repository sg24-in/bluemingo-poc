package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.dto.ProductDTO;
import com.mes.production.security.JwtService;
import com.mes.production.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.mes.production.config.TestSecurityConfig;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductService productService;

    @MockBean
    private JwtService jwtService;

    private ProductDTO testProduct;

    @BeforeEach
    void setUp() {
        testProduct = ProductDTO.builder()
                .productId(1L)
                .sku("SKU-001")
                .productName("Steel Rod 10mm")
                .description("High quality steel rod")
                .productCategory("STEEL")
                .productGroup("RODS")
                .baseUnit("MTR")
                .weightPerUnit(new BigDecimal("2.5"))
                .weightUnit("KG")
                .standardPrice(new BigDecimal("50.00"))
                .priceCurrency("USD")
                .status("ACTIVE")
                .build();
    }

    @Nested
    @DisplayName("Get Products Tests")
    class GetProductsTests {

        @Test
        @DisplayName("Should get all products")
        @WithMockUser(username = "admin@mes.com")
        void getAllProducts_ReturnsProducts() throws Exception {
            when(productService.getAllProducts()).thenReturn(List.of(testProduct));

            mockMvc.perform(get("/api/products"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].productId").value(1))
                    .andExpect(jsonPath("$[0].sku").value("SKU-001"))
                    .andExpect(jsonPath("$[0].productName").value("Steel Rod 10mm"));

            verify(productService).getAllProducts();
        }

        @Test
        @DisplayName("Should get active products")
        @WithMockUser(username = "admin@mes.com")
        void getActiveProducts_ReturnsActiveProducts() throws Exception {
            when(productService.getActiveProducts()).thenReturn(List.of(testProduct));

            mockMvc.perform(get("/api/products/active"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].status").value("ACTIVE"));

            verify(productService).getActiveProducts();
        }

        @Test
        @DisplayName("Should get product by ID")
        @WithMockUser(username = "admin@mes.com")
        void getProductById_ValidId_ReturnsProduct() throws Exception {
            when(productService.getProductById(1L)).thenReturn(testProduct);

            mockMvc.perform(get("/api/products/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.productId").value(1))
                    .andExpect(jsonPath("$.sku").value("SKU-001"));

            verify(productService).getProductById(1L);
        }

        @Test
        @DisplayName("Should return bad request for non-existent product")
        @WithMockUser(username = "admin@mes.com")
        void getProductById_NotFound_ReturnsBadRequest() throws Exception {
            when(productService.getProductById(999L))
                    .thenThrow(new RuntimeException("Product not found"));

            mockMvc.perform(get("/api/products/999"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should get products with pagination")
        @WithMockUser(username = "admin@mes.com")
        void getProductsPaged_ReturnsPagedResponse() throws Exception {
            PagedResponseDTO<ProductDTO> pagedResponse = PagedResponseDTO.<ProductDTO>builder()
                    .content(List.of(testProduct))
                    .page(0)
                    .size(20)
                    .totalElements(1)
                    .totalPages(1)
                    .first(true)
                    .last(true)
                    .hasNext(false)
                    .hasPrevious(false)
                    .build();

            when(productService.getProductsPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

            mockMvc.perform(get("/api/products/paged")
                            .param("page", "0")
                            .param("size", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].sku").value("SKU-001"))
                    .andExpect(jsonPath("$.totalElements").value(1));

            verify(productService).getProductsPaged(any(PageRequestDTO.class));
        }

        @Test
        @DisplayName("Should get products by category")
        @WithMockUser(username = "admin@mes.com")
        void getProductsByCategory_ReturnsFilteredProducts() throws Exception {
            when(productService.getActiveProductsByCategory("STEEL")).thenReturn(List.of(testProduct));

            mockMvc.perform(get("/api/products/category/STEEL"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].productCategory").value("STEEL"));

            verify(productService).getActiveProductsByCategory("STEEL");
        }

        @Test
        @DisplayName("Should get product by SKU")
        @WithMockUser(username = "admin@mes.com")
        void getProductBySku_ValidSku_ReturnsProduct() throws Exception {
            when(productService.getProductBySku("SKU-001")).thenReturn(testProduct);

            mockMvc.perform(get("/api/products/sku/SKU-001"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.sku").value("SKU-001"))
                    .andExpect(jsonPath("$.productName").value("Steel Rod 10mm"));

            verify(productService).getProductBySku("SKU-001");
        }
    }

    @Nested
    @DisplayName("Create Product Tests")
    class CreateProductTests {

        @Test
        @DisplayName("Should create product successfully")
        @WithMockUser(username = "admin@mes.com")
        void createProduct_ValidData_ReturnsCreated() throws Exception {
            ProductDTO createRequest = ProductDTO.builder()
                    .sku("SKU-002")
                    .productName("Copper Wire")
                    .baseUnit("MTR")
                    .build();

            when(productService.createProduct(any(ProductDTO.class))).thenReturn(testProduct);

            mockMvc.perform(post("/api/products")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.productId").value(1));

            verify(productService).createProduct(any(ProductDTO.class));
        }

        @Test
        @DisplayName("Should return bad request for invalid data")
        @WithMockUser(username = "admin@mes.com")
        void createProduct_InvalidData_ReturnsBadRequest() throws Exception {
            ProductDTO invalidRequest = ProductDTO.builder()
                    .sku("")  // Invalid - blank
                    .productName("")  // Invalid - blank
                    .build();

            mockMvc.perform(post("/api/products")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(invalidRequest)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return bad request for duplicate SKU")
        @WithMockUser(username = "admin@mes.com")
        void createProduct_DuplicateSku_ReturnsBadRequest() throws Exception {
            ProductDTO createRequest = ProductDTO.builder()
                    .sku("SKU-001")
                    .productName("Duplicate Product")
                    .baseUnit("MTR")
                    .build();

            when(productService.createProduct(any(ProductDTO.class)))
                    .thenThrow(new RuntimeException("Product SKU already exists"));

            mockMvc.perform(post("/api/products")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Update Product Tests")
    class UpdateProductTests {

        @Test
        @DisplayName("Should update product successfully")
        @WithMockUser(username = "admin@mes.com")
        void updateProduct_ValidData_ReturnsOk() throws Exception {
            ProductDTO updateRequest = ProductDTO.builder()
                    .sku("SKU-001")
                    .productName("Updated Steel Rod")
                    .baseUnit("MTR")
                    .build();

            ProductDTO updatedProduct = ProductDTO.builder()
                    .productId(1L)
                    .sku("SKU-001")
                    .productName("Updated Steel Rod")
                    .baseUnit("MTR")
                    .status("ACTIVE")
                    .build();

            when(productService.updateProduct(eq(1L), any(ProductDTO.class))).thenReturn(updatedProduct);

            mockMvc.perform(put("/api/products/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.productName").value("Updated Steel Rod"));

            verify(productService).updateProduct(eq(1L), any(ProductDTO.class));
        }

        @Test
        @DisplayName("Should return bad request for non-existent product")
        @WithMockUser(username = "admin@mes.com")
        void updateProduct_NotFound_ReturnsBadRequest() throws Exception {
            ProductDTO updateRequest = ProductDTO.builder()
                    .sku("SKU-001")
                    .productName("Updated Product")
                    .baseUnit("MTR")
                    .build();

            when(productService.updateProduct(eq(999L), any(ProductDTO.class)))
                    .thenThrow(new RuntimeException("Product not found"));

            mockMvc.perform(put("/api/products/999")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Delete Product Tests")
    class DeleteProductTests {

        @Test
        @DisplayName("Should delete product successfully")
        @WithMockUser(username = "admin@mes.com")
        void deleteProduct_ValidId_ReturnsNoContent() throws Exception {
            doNothing().when(productService).deleteProduct(1L);

            mockMvc.perform(delete("/api/products/1"))
                    .andExpect(status().isNoContent());

            verify(productService).deleteProduct(1L);
        }

        @Test
        @DisplayName("Should return bad request for non-existent product")
        @WithMockUser(username = "admin@mes.com")
        void deleteProduct_NotFound_ReturnsBadRequest() throws Exception {
            doThrow(new RuntimeException("Product not found"))
                    .when(productService).deleteProduct(999L);

            mockMvc.perform(delete("/api/products/999"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    @DisplayName("Should return 401 when not authenticated")
    void getProducts_NotAuthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isUnauthorized());
    }
}
