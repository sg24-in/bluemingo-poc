package com.mes.production.service;

import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.dto.ProductDTO;
import com.mes.production.entity.Product;
import com.mes.production.repository.AuditTrailRepository;
import com.mes.production.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private AuditTrailRepository auditTrailRepository;

    @InjectMocks
    private ProductService productService;

    private Product testProduct;
    private ProductDTO testProductDTO;

    @BeforeEach
    void setUp() {
        testProduct = Product.builder()
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
                .minOrderQty(new BigDecimal("10"))
                .leadTimeDays(5)
                .status(Product.STATUS_ACTIVE)
                .build();

        testProductDTO = ProductDTO.builder()
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
                .minOrderQty(new BigDecimal("10"))
                .leadTimeDays(5)
                .build();
    }

    private void setupSecurityContext() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("admin@mes.com");
        SecurityContextHolder.setContext(securityContext);
    }

    @Nested
    @DisplayName("Get Products Tests")
    class GetProductsTests {

        @Test
        @DisplayName("Should get all products")
        void getAllProducts_ReturnsAllProducts() {
            when(productRepository.findAll()).thenReturn(List.of(testProduct));

            List<ProductDTO> result = productService.getAllProducts();

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("SKU-001", result.get(0).getSku());
            assertEquals("Steel Rod 10mm", result.get(0).getProductName());
        }

        @Test
        @DisplayName("Should get active products only")
        void getActiveProducts_ReturnsActiveOnly() {
            when(productRepository.findAllActiveProducts()).thenReturn(List.of(testProduct));

            List<ProductDTO> result = productService.getActiveProducts();

            assertNotNull(result);
            assertEquals(1, result.size());
            verify(productRepository).findAllActiveProducts();
        }

        @Test
        @DisplayName("Should get active products by category")
        void getActiveProductsByCategory_ReturnsFilteredProducts() {
            when(productRepository.findActiveProductsByCategory("STEEL"))
                    .thenReturn(List.of(testProduct));

            List<ProductDTO> result = productService.getActiveProductsByCategory("STEEL");

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("STEEL", result.get(0).getProductCategory());
        }

        @Test
        @DisplayName("Should get product by ID")
        void getProductById_ExistingId_ReturnsProduct() {
            when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));

            ProductDTO result = productService.getProductById(1L);

            assertNotNull(result);
            assertEquals("SKU-001", result.getSku());
        }

        @Test
        @DisplayName("Should throw exception when product not found by ID")
        void getProductById_NotFound_ThrowsException() {
            when(productRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> productService.getProductById(999L));

            assertTrue(exception.getMessage().contains("not found"));
        }

        @Test
        @DisplayName("Should get product by SKU")
        void getProductBySku_ExistingSku_ReturnsProduct() {
            when(productRepository.findBySku("SKU-001")).thenReturn(Optional.of(testProduct));

            ProductDTO result = productService.getProductBySku("SKU-001");

            assertNotNull(result);
            assertEquals("Steel Rod 10mm", result.getProductName());
        }

        @Test
        @DisplayName("Should throw exception when product not found by SKU")
        void getProductBySku_NotFound_ThrowsException() {
            when(productRepository.findBySku("INVALID")).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> productService.getProductBySku("INVALID"));

            assertTrue(exception.getMessage().contains("not found"));
        }
    }

    @Nested
    @DisplayName("Pagination Tests")
    class PaginationTests {

        @Test
        @DisplayName("Should get products with pagination")
        void getProductsPaged_ReturnsPagedResponse() {
            Page<Product> page = new PageImpl<>(List.of(testProduct));
            when(productRepository.findByFilters(anyString(), anyString(), anyString(), any(Pageable.class)))
                    .thenReturn(page);

            PageRequestDTO request = PageRequestDTO.builder()
                    .page(0)
                    .size(20)
                    .search("")
                    .status("ACTIVE")
                    .type("STEEL")
                    .build();

            PagedResponseDTO<ProductDTO> result = productService.getProductsPaged(request);

            assertNotNull(result);
            assertEquals(1, result.getContent().size());
            assertEquals(0, result.getPage());
        }
    }

    @Nested
    @DisplayName("Create Product Tests")
    class CreateProductTests {

        @Test
        @DisplayName("Should create product successfully")
        void createProduct_ValidData_CreatesSuccessfully() {
            setupSecurityContext();
            when(productRepository.existsBySku("SKU-001")).thenReturn(false);
            when(productRepository.save(any(Product.class))).thenAnswer(i -> {
                Product p = i.getArgument(0);
                p.setProductId(1L);
                return p;
            });

            ProductDTO result = productService.createProduct(testProductDTO);

            assertNotNull(result);
            assertEquals("SKU-001", result.getSku());
            verify(productRepository).save(any(Product.class));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception for duplicate SKU")
        void createProduct_DuplicateSku_ThrowsException() {
            setupSecurityContext();
            when(productRepository.existsBySku("SKU-001")).thenReturn(true);

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> productService.createProduct(testProductDTO));

            assertTrue(exception.getMessage().contains("already exists"));
            verify(productRepository, never()).save(any(Product.class));
        }
    }

    @Nested
    @DisplayName("Update Product Tests")
    class UpdateProductTests {

        @Test
        @DisplayName("Should update product successfully")
        void updateProduct_ValidData_UpdatesSuccessfully() {
            setupSecurityContext();
            when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
            when(productRepository.save(any(Product.class))).thenAnswer(i -> i.getArgument(0));

            testProductDTO.setProductName("Updated Steel Rod");

            ProductDTO result = productService.updateProduct(1L, testProductDTO);

            assertNotNull(result);
            assertEquals("Updated Steel Rod", result.getProductName());
            verify(productRepository).save(any(Product.class));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception when updating non-existent product")
        void updateProduct_NotFound_ThrowsException() {
            setupSecurityContext();
            when(productRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> productService.updateProduct(999L, testProductDTO));

            assertTrue(exception.getMessage().contains("not found"));
        }

        @Test
        @DisplayName("Should throw exception when changing to duplicate SKU")
        void updateProduct_DuplicateSku_ThrowsException() {
            setupSecurityContext();
            when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));

            testProductDTO.setSku("SKU-002");
            when(productRepository.existsBySku("SKU-002")).thenReturn(true);

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> productService.updateProduct(1L, testProductDTO));

            assertTrue(exception.getMessage().contains("already exists"));
        }
    }

    @Nested
    @DisplayName("Delete Product Tests")
    class DeleteProductTests {

        @Test
        @DisplayName("Should soft delete product successfully")
        void deleteProduct_ExistingProduct_SoftDeletes() {
            setupSecurityContext();
            when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
            when(productRepository.save(any(Product.class))).thenAnswer(i -> i.getArgument(0));

            productService.deleteProduct(1L);

            verify(productRepository).save(argThat(product ->
                Product.STATUS_INACTIVE.equals(product.getStatus())
            ));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception when deleting non-existent product")
        void deleteProduct_NotFound_ThrowsException() {
            setupSecurityContext();
            when(productRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> productService.deleteProduct(999L));

            assertTrue(exception.getMessage().contains("not found"));
        }
    }
}
