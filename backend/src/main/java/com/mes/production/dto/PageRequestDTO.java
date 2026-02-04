package com.mes.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Common request parameters for paginated, sorted, and filtered API requests.
 * Used as query parameters in GET requests.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageRequestDTO {

    /**
     * Page number (0-indexed). Default: 0
     */
    @Builder.Default
    private int page = 0;

    /**
     * Number of items per page. Default: 20, Max: 100
     */
    @Builder.Default
    private int size = 20;

    /**
     * Field to sort by
     */
    private String sortBy;

    /**
     * Sort direction: ASC or DESC. Default: ASC
     */
    @Builder.Default
    private String sortDirection = "ASC";

    /**
     * General search/filter term
     */
    private String search;

    /**
     * Status filter (for status-based filtering)
     */
    private String status;

    /**
     * Type filter (for type-based filtering)
     */
    private String type;

    /**
     * Date from filter (ISO date format)
     */
    private String dateFrom;

    /**
     * Date to filter (ISO date format)
     */
    private String dateTo;

    /**
     * Validate and normalize the page request values.
     */
    public void normalize() {
        if (page < 0) page = 0;
        if (size < 1) size = 20;
        if (size > 100) size = 100;
        if (sortDirection == null || (!sortDirection.equalsIgnoreCase("ASC") && !sortDirection.equalsIgnoreCase("DESC"))) {
            sortDirection = "ASC";
        }
    }

    /**
     * Convert to Spring Data Pageable (without sort).
     */
    public Pageable toPageable() {
        normalize();
        return PageRequest.of(page, size);
    }

    /**
     * Convert to Spring Data Pageable with sort.
     *
     * @param defaultSortBy Default sort field if none specified
     */
    public Pageable toPageable(String defaultSortBy) {
        normalize();
        String sortField = sortBy != null ? sortBy : defaultSortBy;

        if (sortField == null || sortField.isEmpty()) {
            return PageRequest.of(page, size);
        }

        Sort.Direction direction = "DESC".equalsIgnoreCase(sortDirection)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        return PageRequest.of(page, size, Sort.by(direction, sortField));
    }

    /**
     * Convert to Spring Data Pageable with multiple sort fields.
     *
     * @param sortFields Multiple fields for sorting (in order)
     */
    public Pageable toPageable(String... sortFields) {
        normalize();

        if (sortFields == null || sortFields.length == 0) {
            return PageRequest.of(page, size);
        }

        Sort.Direction direction = "DESC".equalsIgnoreCase(sortDirection)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        Sort sort = Sort.by(direction, sortFields);
        return PageRequest.of(page, size, sort);
    }

    /**
     * Check if any filter is active.
     */
    public boolean hasFilters() {
        return (search != null && !search.isEmpty())
                || (status != null && !status.isEmpty())
                || (type != null && !type.isEmpty())
                || (dateFrom != null && !dateFrom.isEmpty())
                || (dateTo != null && !dateTo.isEmpty());
    }

    /**
     * Get the search term, trimmed and lowercased for case-insensitive matching.
     */
    public String getSearchTermLower() {
        return search != null ? search.trim().toLowerCase() : null;
    }

    /**
     * Get search pattern for SQL LIKE queries.
     */
    public String getSearchPattern() {
        return search != null ? "%" + search.trim().toLowerCase() + "%" : null;
    }

    /**
     * Create default page request.
     */
    public static PageRequestDTO defaults() {
        return PageRequestDTO.builder()
                .page(0)
                .size(20)
                .sortDirection("ASC")
                .build();
    }
}
