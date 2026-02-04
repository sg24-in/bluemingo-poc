package com.mes.production.controller;

import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.dto.ProductDTO;
import com.mes.production.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Slf4j
public class ProductController {

    private final ProductService productService;

    /**
     * Get all products (non-paginated - use sparingly)
     */
    @GetMapping
    public ResponseEntity<List<ProductDTO>> getAllProducts() {
        log.info("GET /api/products");
        List<ProductDTO> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }

    /**
     * Get all active products (for dropdowns in order creation)
     */
    @GetMapping("/active")
    public ResponseEntity<List<ProductDTO>> getActiveProducts() {
        log.info("GET /api/products/active");
        List<ProductDTO> products = productService.getActiveProducts();
        return ResponseEntity.ok(products);
    }

    /**
     * Get active products by category
     */
    @GetMapping("/active/category/{category}")
    public ResponseEntity<List<ProductDTO>> getActiveProductsByCategory(@PathVariable String category) {
        log.info("GET /api/products/active/category/{}", category);
        List<ProductDTO> products = productService.getActiveProductsByCategory(category);
        return ResponseEntity.ok(products);
    }

    /**
     * Get products with server-side pagination
     */
    @GetMapping("/paged")
    public ResponseEntity<PagedResponseDTO<ProductDTO>> getProductsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category) {

        log.info("GET /api/products/paged - page={}, size={}, search={}, status={}, category={}",
                page, size, search, status, category);

        PageRequestDTO request = PageRequestDTO.builder()
                .page(page)
                .size(size)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .search(search)
                .status(status)
                .type(category)
                .build();

        PagedResponseDTO<ProductDTO> result = productService.getProductsPaged(request);
        return ResponseEntity.ok(result);
    }

    /**
     * Get product by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable Long id) {
        log.info("GET /api/products/{}", id);
        ProductDTO product = productService.getProductById(id);
        return ResponseEntity.ok(product);
    }

    /**
     * Get product by SKU
     */
    @GetMapping("/sku/{sku}")
    public ResponseEntity<ProductDTO> getProductBySku(@PathVariable String sku) {
        log.info("GET /api/products/sku/{}", sku);
        ProductDTO product = productService.getProductBySku(sku);
        return ResponseEntity.ok(product);
    }

    /**
     * Create a new product
     */
    @PostMapping
    public ResponseEntity<ProductDTO> createProduct(@Valid @RequestBody ProductDTO dto) {
        log.info("POST /api/products - creating product: {}", dto.getSku());
        ProductDTO created = productService.createProduct(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Update an existing product
     */
    @PutMapping("/{id}")
    public ResponseEntity<ProductDTO> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductDTO dto) {
        log.info("PUT /api/products/{} - updating product", id);
        ProductDTO updated = productService.updateProduct(id, dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete a product (soft delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteProduct(@PathVariable Long id) {
        log.info("DELETE /api/products/{}", id);
        productService.deleteProduct(id);
        return ResponseEntity.ok(Map.of("message", "Product deleted successfully"));
    }
}
