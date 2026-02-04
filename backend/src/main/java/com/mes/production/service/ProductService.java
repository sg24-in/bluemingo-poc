package com.mes.production.service;

import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.dto.ProductDTO;
import com.mes.production.entity.AuditTrail;
import com.mes.production.entity.Product;
import com.mes.production.repository.AuditTrailRepository;
import com.mes.production.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final AuditTrailRepository auditTrailRepository;

    /**
     * Get all products (non-paginated - use sparingly)
     */
    public List<ProductDTO> getAllProducts() {
        return productRepository.findAll().stream()
                .map(ProductDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get all active products (for dropdowns)
     */
    public List<ProductDTO> getActiveProducts() {
        return productRepository.findAllActiveProducts().stream()
                .map(ProductDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get active products by category
     */
    public List<ProductDTO> getActiveProductsByCategory(String category) {
        return productRepository.findActiveProductsByCategory(category).stream()
                .map(ProductDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get products with server-side pagination
     */
    public PagedResponseDTO<ProductDTO> getProductsPaged(PageRequestDTO request) {
        String sortBy = request.getSortBy() != null ? request.getSortBy() : "productName";
        Sort.Direction direction = "DESC".equalsIgnoreCase(request.getSortDirection())
                ? Sort.Direction.DESC : Sort.Direction.ASC;

        Pageable pageable = PageRequest.of(
                request.getPage(),
                Math.min(request.getSize(), 100),
                Sort.by(direction, sortBy)
        );

        Page<Product> page = productRepository.findByFilters(
                request.getSearch(),
                request.getStatus(),
                request.getType(), // used as category filter
                pageable
        );

        List<ProductDTO> content = page.getContent().stream()
                .map(ProductDTO::fromEntity)
                .collect(Collectors.toList());

        return PagedResponseDTO.<ProductDTO>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    /**
     * Get product by ID
     */
    public ProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + id));
        return ProductDTO.fromEntity(product);
    }

    /**
     * Get product by SKU
     */
    public ProductDTO getProductBySku(String sku) {
        Product product = productRepository.findBySku(sku)
                .orElseThrow(() -> new RuntimeException("Product not found with SKU: " + sku));
        return ProductDTO.fromEntity(product);
    }

    /**
     * Create a new product
     */
    @Transactional
    public ProductDTO createProduct(ProductDTO dto) {
        if (productRepository.existsBySku(dto.getSku())) {
            throw new RuntimeException("Product SKU already exists: " + dto.getSku());
        }

        String currentUser = getCurrentUsername();

        Product product = dto.toEntity();
        product.setCreatedBy(currentUser);
        product.setStatus(Product.STATUS_ACTIVE);

        Product saved = productRepository.save(product);

        auditProductAction(saved.getProductId(), AuditTrail.ACTION_CREATE, null, saved.getSku(), currentUser);

        log.info("Created product: {} by {}", saved.getSku(), currentUser);
        return ProductDTO.fromEntity(saved);
    }

    /**
     * Update an existing product
     */
    @Transactional
    public ProductDTO updateProduct(Long id, ProductDTO dto) {
        Product existing = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + id));

        String currentUser = getCurrentUsername();

        if (!existing.getSku().equals(dto.getSku()) &&
                productRepository.existsBySku(dto.getSku())) {
            throw new RuntimeException("Product SKU already exists: " + dto.getSku());
        }

        String oldValues = String.format("sku=%s, name=%s", existing.getSku(), existing.getProductName());

        // Update fields
        existing.setSku(dto.getSku());
        existing.setProductName(dto.getProductName());
        existing.setDescription(dto.getDescription());
        existing.setProductCategory(dto.getProductCategory());
        existing.setProductGroup(dto.getProductGroup());
        existing.setBaseUnit(dto.getBaseUnit());
        existing.setWeightPerUnit(dto.getWeightPerUnit());
        existing.setWeightUnit(dto.getWeightUnit());
        existing.setStandardPrice(dto.getStandardPrice());
        existing.setPriceCurrency(dto.getPriceCurrency());
        existing.setMinOrderQty(dto.getMinOrderQty());
        existing.setLeadTimeDays(dto.getLeadTimeDays());
        existing.setMaterialId(dto.getMaterialId());
        if (dto.getStatus() != null) {
            existing.setStatus(dto.getStatus());
        }
        existing.setUpdatedBy(currentUser);

        Product saved = productRepository.save(existing);

        String newValues = String.format("sku=%s, name=%s", saved.getSku(), saved.getProductName());
        auditProductAction(saved.getProductId(), AuditTrail.ACTION_UPDATE, oldValues, newValues, currentUser);

        log.info("Updated product: {} by {}", saved.getSku(), currentUser);
        return ProductDTO.fromEntity(saved);
    }

    /**
     * Delete a product (soft delete)
     */
    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + id));

        String currentUser = getCurrentUsername();

        product.setStatus(Product.STATUS_INACTIVE);
        product.setUpdatedBy(currentUser);
        productRepository.save(product);

        auditProductAction(product.getProductId(), AuditTrail.ACTION_DELETE, Product.STATUS_ACTIVE, Product.STATUS_INACTIVE, currentUser);

        log.info("Deleted (deactivated) product: {} by {}", product.getSku(), currentUser);
    }

    private void auditProductAction(Long productId, String action, String oldValue, String newValue, String user) {
        AuditTrail audit = AuditTrail.builder()
                .entityType("PRODUCT")
                .entityId(productId)
                .action(action)
                .oldValue(oldValue)
                .newValue(newValue)
                .changedBy(user)
                .timestamp(LocalDateTime.now())
                .build();
        auditTrailRepository.save(audit);
    }

    private String getCurrentUsername() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "system";
        }
    }
}
