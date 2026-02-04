package com.mes.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Generic paged response DTO for all paginated API responses.
 * Provides consistent pagination interface across all list endpoints.
 *
 * @param <T> The type of content in the page
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagedResponseDTO<T> {

    /**
     * The content items for the current page
     */
    private List<T> content;

    /**
     * Current page number (0-indexed)
     */
    private int page;

    /**
     * Page size (number of items per page)
     */
    private int size;

    /**
     * Total number of elements across all pages
     */
    private long totalElements;

    /**
     * Total number of pages
     */
    private int totalPages;

    /**
     * Whether this is the first page
     */
    private boolean first;

    /**
     * Whether this is the last page
     */
    private boolean last;

    /**
     * Whether there is a next page
     */
    private boolean hasNext;

    /**
     * Whether there is a previous page
     */
    private boolean hasPrevious;

    /**
     * Current sort field (if any)
     */
    private String sortBy;

    /**
     * Current sort direction (ASC/DESC)
     */
    private String sortDirection;

    /**
     * Active filter/search term (if any)
     */
    private String filterValue;

    /**
     * Create a PagedResponse from a Spring Data Page object.
     */
    public static <T> PagedResponseDTO<T> fromPage(org.springframework.data.domain.Page<T> page) {
        return PagedResponseDTO.<T>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build();
    }

    /**
     * Create a PagedResponse with sort info.
     */
    public static <T> PagedResponseDTO<T> fromPage(org.springframework.data.domain.Page<T> page,
                                                     String sortBy, String sortDirection) {
        PagedResponseDTO<T> response = fromPage(page);
        response.setSortBy(sortBy);
        response.setSortDirection(sortDirection);
        return response;
    }

    /**
     * Create a PagedResponse with sort and filter info.
     */
    public static <T> PagedResponseDTO<T> fromPage(org.springframework.data.domain.Page<T> page,
                                                     String sortBy, String sortDirection,
                                                     String filterValue) {
        PagedResponseDTO<T> response = fromPage(page, sortBy, sortDirection);
        response.setFilterValue(filterValue);
        return response;
    }

    /**
     * Create a non-paged response (all items, single page).
     */
    public static <T> PagedResponseDTO<T> ofAll(List<T> content) {
        return PagedResponseDTO.<T>builder()
                .content(content)
                .page(0)
                .size(content.size())
                .totalElements(content.size())
                .totalPages(1)
                .first(true)
                .last(true)
                .hasNext(false)
                .hasPrevious(false)
                .build();
    }
}
