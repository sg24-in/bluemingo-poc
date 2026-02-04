package com.mes.production.repository;

import com.mes.production.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySku(String sku);

    boolean existsBySku(String sku);

    List<Product> findByStatus(String status);

    List<Product> findByProductCategory(String category);

    List<Product> findByProductCategoryAndStatus(String category, String status);

    @Query("SELECT p FROM Product p WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.productName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:status IS NULL OR :status = '' OR p.status = :status) " +
           "AND (:category IS NULL OR :category = '' OR p.productCategory = :category)")
    Page<Product> findByFilters(
            @Param("search") String search,
            @Param("status") String status,
            @Param("category") String category,
            Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.status = 'ACTIVE' ORDER BY p.productName")
    List<Product> findAllActiveProducts();

    @Query("SELECT p FROM Product p WHERE p.status = 'ACTIVE' AND p.productCategory = :category ORDER BY p.productName")
    List<Product> findActiveProductsByCategory(@Param("category") String category);
}
