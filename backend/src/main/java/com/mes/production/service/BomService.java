package com.mes.production.service;

import com.mes.production.dto.BomDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.entity.BillOfMaterial;
import com.mes.production.repository.BomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for BOM (Bill of Materials) CRUD operations and tree management.
 * Provides hierarchical tree structure support for BOM data.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BomService {

    private final BomRepository bomRepository;
    private final AuditService auditService;

    // =====================================================
    // READ Operations
    // =====================================================

    /**
     * Get full BOM tree for a product (hierarchical structure)
     */
    @Transactional(readOnly = true)
    public BomDTO.BomTreeFullResponse getBomTree(String productSku) {
        log.info("Getting BOM tree for product: {}", productSku);

        List<BillOfMaterial> allBoms = bomRepository.findActiveByProductSkuOrderByLevel(productSku);
        if (allBoms.isEmpty()) {
            return BomDTO.BomTreeFullResponse.builder()
                    .productSku(productSku)
                    .bomVersion("V1")
                    .tree(List.of())
                    .totalNodes(0)
                    .maxDepth(0)
                    .build();
        }

        // Get BOM version from first entry
        String bomVersion = allBoms.get(0).getBomVersion();

        // Build tree structure
        List<BomDTO.BomTreeNode> tree = buildTree(allBoms);
        int maxDepth = calculateMaxDepth(tree, 1);

        return BomDTO.BomTreeFullResponse.builder()
                .productSku(productSku)
                .bomVersion(bomVersion)
                .tree(tree)
                .totalNodes(allBoms.size())
                .maxDepth(maxDepth)
                .build();
    }

    /**
     * Get BOM tree for a specific version
     */
    @Transactional(readOnly = true)
    public BomDTO.BomTreeFullResponse getBomTreeByVersion(String productSku, String version) {
        log.info("Getting BOM tree for product: {}, version: {}", productSku, version);

        List<BillOfMaterial> allBoms = bomRepository.findActiveByProductSkuAndBomVersion(productSku, version);
        if (allBoms.isEmpty()) {
            return BomDTO.BomTreeFullResponse.builder()
                    .productSku(productSku)
                    .bomVersion(version)
                    .tree(List.of())
                    .totalNodes(0)
                    .maxDepth(0)
                    .build();
        }

        List<BomDTO.BomTreeNode> tree = buildTree(allBoms);
        int maxDepth = calculateMaxDepth(tree, 1);

        return BomDTO.BomTreeFullResponse.builder()
                .productSku(productSku)
                .bomVersion(version)
                .tree(tree)
                .totalNodes(allBoms.size())
                .maxDepth(maxDepth)
                .build();
    }

    /**
     * Get a single BOM node by ID
     */
    @Transactional(readOnly = true)
    public BomDTO.BomTreeNode getBomNode(Long bomId) {
        log.info("Getting BOM node: {}", bomId);

        BillOfMaterial bom = bomRepository.findById(bomId)
                .orElseThrow(() -> new RuntimeException("BOM not found: " + bomId));

        // Get children for this node
        List<BillOfMaterial> children = bomRepository.findByParentBomId(bomId);

        return convertToTreeNode(bom, children);
    }

    /**
     * Get all products that have BOMs defined
     */
    @Transactional(readOnly = true)
    public List<BomDTO.BomProductSummary> getAllProducts() {
        log.info("Getting all products with BOMs");

        List<String> productSkus = bomRepository.findDistinctProductSkus();

        return productSkus.stream()
                .map(this::getProductSummary)
                .collect(Collectors.toList());
    }

    /**
     * TASK-P3: Get paginated products with BOMs.
     * Supports search by productSku.
     */
    @Transactional(readOnly = true)
    public PagedResponseDTO<BomDTO.BomProductSummary> getBomProductsPaged(PageRequestDTO pageRequest) {
        log.info("Getting paginated BOM products - page={}, size={}, search={}",
                pageRequest.getPage(), pageRequest.getSize(), pageRequest.getSearch());

        Pageable pageable = pageRequest.toPageable("productSku");
        String searchPattern = pageRequest.getSearchPattern();

        // Get paginated product SKUs
        Page<String> productSkuPage = bomRepository.findDistinctProductSkusPaged(searchPattern, pageable);

        // Convert to summaries
        List<BomDTO.BomProductSummary> summaries = productSkuPage.getContent().stream()
                .map(this::getProductSummary)
                .collect(Collectors.toList());

        // Create page of summaries
        Page<BomDTO.BomProductSummary> summaryPage = new PageImpl<>(
                summaries,
                pageable,
                productSkuPage.getTotalElements()
        );

        return PagedResponseDTO.fromPage(summaryPage, pageRequest.getSortBy(), pageRequest.getSortDirection(), pageRequest.getSearch());
    }

    /**
     * Get versions available for a product
     */
    @Transactional(readOnly = true)
    public List<String> getVersionsForProduct(String productSku) {
        return bomRepository.findDistinctVersionsByProductSku(productSku);
    }

    /**
     * Get flat list of BOM nodes (for table view)
     */
    @Transactional(readOnly = true)
    public List<BomDTO.BomListResponse> getBomList(String productSku) {
        log.info("Getting BOM list for product: {}", productSku);

        List<BillOfMaterial> allBoms = bomRepository.findActiveByProductSkuOrderByLevel(productSku);

        return allBoms.stream()
                .map(bom -> {
                    int childCount = bomRepository.countChildrenByParentBomId(bom.getBomId());
                    return BomDTO.BomListResponse.builder()
                            .bomId(bom.getBomId())
                            .productSku(bom.getProductSku())
                            .bomVersion(bom.getBomVersion())
                            .materialId(bom.getMaterialId())
                            .materialName(bom.getMaterialName())
                            .quantityRequired(bom.getQuantityRequired())
                            .unit(bom.getUnit())
                            .sequenceLevel(bom.getSequenceLevel())
                            .parentBomId(bom.getParentBomId())
                            .status(bom.getStatus())
                            .childCount(childCount)
                            .build();
                })
                .collect(Collectors.toList());
    }

    // =====================================================
    // CREATE Operations
    // =====================================================

    /**
     * Create a single BOM node
     */
    @Transactional
    public BomDTO.BomTreeNode createBomNode(BomDTO.CreateBomNodeRequest request) {
        log.info("Creating BOM node for product: {}, material: {}", request.getProductSku(), request.getMaterialId());

        // Validate parent exists if specified
        if (request.getParentBomId() != null) {
            bomRepository.findById(request.getParentBomId())
                    .orElseThrow(() -> new RuntimeException("Parent BOM not found: " + request.getParentBomId()));
        }

        String username = getCurrentUsername();

        BillOfMaterial bom = BillOfMaterial.builder()
                .productSku(request.getProductSku())
                .bomVersion(request.getBomVersion() != null ? request.getBomVersion() : "V1")
                .materialId(request.getMaterialId())
                .materialName(request.getMaterialName())
                .quantityRequired(request.getQuantityRequired())
                .unit(request.getUnit())
                .yieldLossRatio(request.getYieldLossRatio())
                .sequenceLevel(request.getSequenceLevel() != null ? request.getSequenceLevel() : 1)
                .parentBomId(request.getParentBomId())
                .status("ACTIVE")
                .createdBy(username)
                .build();

        BillOfMaterial saved = bomRepository.save(bom);

        auditService.logCreate(
                "BOM",
                saved.getBomId(),
                "Created BOM node for product " + saved.getProductSku() + ", material: " + saved.getMaterialId()
        );

        return convertToTreeNode(saved, List.of());
    }

    /**
     * Create a full BOM tree (multiple nodes at once)
     */
    @Transactional
    public BomDTO.BomTreeFullResponse createBomTree(BomDTO.CreateBomTreeRequest request) {
        log.info("Creating BOM tree for product: {}, version: {}", request.getProductSku(), request.getBomVersion());

        String username = getCurrentUsername();

        // Map to track temporary IDs to actual IDs for parent references
        Map<Integer, Long> tempIdToActualId = new HashMap<>();
        List<BillOfMaterial> createdBoms = new ArrayList<>();

        // Sort nodes by sequence level to ensure parents are created before children
        List<BomDTO.CreateBomNodeRequest> sortedNodes = request.getNodes().stream()
                .sorted(Comparator.comparingInt(n -> n.getSequenceLevel() != null ? n.getSequenceLevel() : 1))
                .collect(Collectors.toList());

        for (int i = 0; i < sortedNodes.size(); i++) {
            BomDTO.CreateBomNodeRequest nodeRequest = sortedNodes.get(i);

            // Resolve parent ID if it's a reference to a previously created node
            Long resolvedParentId = nodeRequest.getParentBomId();

            BillOfMaterial bom = BillOfMaterial.builder()
                    .productSku(request.getProductSku())
                    .bomVersion(request.getBomVersion() != null ? request.getBomVersion() : "V1")
                    .materialId(nodeRequest.getMaterialId())
                    .materialName(nodeRequest.getMaterialName())
                    .quantityRequired(nodeRequest.getQuantityRequired())
                    .unit(nodeRequest.getUnit())
                    .yieldLossRatio(nodeRequest.getYieldLossRatio())
                    .sequenceLevel(nodeRequest.getSequenceLevel() != null ? nodeRequest.getSequenceLevel() : 1)
                    .parentBomId(resolvedParentId)
                    .status("ACTIVE")
                    .createdBy(username)
                    .build();

            BillOfMaterial saved = bomRepository.save(bom);
            createdBoms.add(saved);
            tempIdToActualId.put(i, saved.getBomId());
        }

        auditService.createAuditEntry(
                "BOM",
                null,
                null,
                null,
                "Created BOM tree for product " + request.getProductSku() + " with " + createdBoms.size() + " nodes",
                "CREATE_TREE"
        );

        // Return the tree structure
        return getBomTree(request.getProductSku());
    }

    // =====================================================
    // UPDATE Operations
    // =====================================================

    /**
     * Update a BOM node
     */
    @Transactional
    public BomDTO.BomTreeNode updateBomNode(Long bomId, BomDTO.UpdateBomNodeRequest request) {
        log.info("Updating BOM node: {}", bomId);

        BillOfMaterial bom = bomRepository.findById(bomId)
                .orElseThrow(() -> new RuntimeException("BOM not found: " + bomId));

        String username = getCurrentUsername();

        // Update fields if provided
        if (request.getMaterialId() != null) {
            bom.setMaterialId(request.getMaterialId());
        }
        if (request.getMaterialName() != null) {
            bom.setMaterialName(request.getMaterialName());
        }
        if (request.getQuantityRequired() != null) {
            bom.setQuantityRequired(request.getQuantityRequired());
        }
        if (request.getUnit() != null) {
            bom.setUnit(request.getUnit());
        }
        if (request.getYieldLossRatio() != null) {
            bom.setYieldLossRatio(request.getYieldLossRatio());
        }
        if (request.getSequenceLevel() != null) {
            bom.setSequenceLevel(request.getSequenceLevel());
        }
        if (request.getParentBomId() != null) {
            // Validate new parent exists and isn't creating a cycle
            if (!request.getParentBomId().equals(0L)) {
                bomRepository.findById(request.getParentBomId())
                        .orElseThrow(() -> new RuntimeException("Parent BOM not found: " + request.getParentBomId()));
                validateNoCycle(bomId, request.getParentBomId());
            }
            bom.setParentBomId(request.getParentBomId().equals(0L) ? null : request.getParentBomId());
        }
        if (request.getStatus() != null) {
            bom.setStatus(request.getStatus());
        }

        bom.setUpdatedBy(username);
        BillOfMaterial saved = bomRepository.save(bom);

        auditService.createAuditEntry(
                "BOM",
                bomId,
                null,
                null,
                "Updated BOM node for product " + saved.getProductSku(),
                "UPDATE"
        );

        List<BillOfMaterial> children = bomRepository.findByParentBomId(bomId);
        return convertToTreeNode(saved, children);
    }

    /**
     * Move a BOM node to a new parent
     */
    @Transactional
    public BomDTO.BomTreeNode moveBomNode(Long bomId, BomDTO.MoveBomNodeRequest request) {
        log.info("Moving BOM node: {} to parent: {}", bomId, request.getNewParentBomId());

        BillOfMaterial bom = bomRepository.findById(bomId)
                .orElseThrow(() -> new RuntimeException("BOM not found: " + bomId));

        String username = getCurrentUsername();

        // Validate new parent exists and isn't creating a cycle
        if (request.getNewParentBomId() != null) {
            bomRepository.findById(request.getNewParentBomId())
                    .orElseThrow(() -> new RuntimeException("Parent BOM not found: " + request.getNewParentBomId()));
            validateNoCycle(bomId, request.getNewParentBomId());
        }

        Long oldParentId = bom.getParentBomId();
        bom.setParentBomId(request.getNewParentBomId());

        if (request.getNewSequenceLevel() != null) {
            bom.setSequenceLevel(request.getNewSequenceLevel());
        }

        bom.setUpdatedBy(username);
        BillOfMaterial saved = bomRepository.save(bom);

        auditService.createAuditEntry(
                "BOM",
                bomId,
                "parentBomId",
                oldParentId != null ? oldParentId.toString() : null,
                request.getNewParentBomId() != null ? request.getNewParentBomId().toString() : null,
                "MOVE"
        );

        List<BillOfMaterial> children = bomRepository.findByParentBomId(bomId);
        return convertToTreeNode(saved, children);
    }

    /**
     * Update top-level BOM settings (product, version, status) for all nodes of a product
     */
    @Transactional
    public BomDTO.UpdateBomSettingsResponse updateBomSettings(String productSku, BomDTO.UpdateBomSettingsRequest request) {
        log.info("Updating BOM settings for product: {}", productSku);

        List<BillOfMaterial> allBoms = bomRepository.findByProductSku(productSku);
        if (allBoms.isEmpty()) {
            throw new RuntimeException("No BOM found for product: " + productSku);
        }

        String username = getCurrentUsername();
        String oldProductSku = productSku;
        String oldVersion = allBoms.get(0).getBomVersion();
        String oldStatus = allBoms.get(0).getStatus();

        for (BillOfMaterial bom : allBoms) {
            if (request.getNewProductSku() != null && !request.getNewProductSku().isEmpty()) {
                bom.setProductSku(request.getNewProductSku());
            }
            if (request.getBomVersion() != null) {
                bom.setBomVersion(request.getBomVersion());
            }
            if (request.getStatus() != null) {
                bom.setStatus(request.getStatus());
            }
            bom.setUpdatedBy(username);
        }

        bomRepository.saveAll(allBoms);

        // Audit log
        StringBuilder changes = new StringBuilder("Updated BOM settings: ");
        if (request.getNewProductSku() != null && !request.getNewProductSku().isEmpty() && !request.getNewProductSku().equals(oldProductSku)) {
            changes.append("product ").append(oldProductSku).append(" -> ").append(request.getNewProductSku()).append("; ");
        }
        if (request.getBomVersion() != null && !request.getBomVersion().equals(oldVersion)) {
            changes.append("version ").append(oldVersion).append(" -> ").append(request.getBomVersion()).append("; ");
        }
        if (request.getStatus() != null && !request.getStatus().equals(oldStatus)) {
            changes.append("status ").append(oldStatus).append(" -> ").append(request.getStatus());
        }

        String finalProductSku = request.getNewProductSku() != null && !request.getNewProductSku().isEmpty()
                ? request.getNewProductSku() : oldProductSku;

        auditService.createAuditEntry(
                "BOM",
                null,
                null,
                null,
                changes.toString() + " for product " + finalProductSku + " (" + allBoms.size() + " nodes)",
                "UPDATE_SETTINGS"
        );

        return BomDTO.UpdateBomSettingsResponse.builder()
                .productSku(finalProductSku)
                .bomVersion(request.getBomVersion() != null ? request.getBomVersion() : oldVersion)
                .status(request.getStatus() != null ? request.getStatus() : oldStatus)
                .nodesUpdated(allBoms.size())
                .build();
    }

    // =====================================================
    // DELETE Operations
    // =====================================================

    /**
     * Delete a BOM node (soft delete - sets status to INACTIVE)
     */
    @Transactional
    public void deleteBomNode(Long bomId) {
        log.info("Deleting BOM node: {}", bomId);

        BillOfMaterial bom = bomRepository.findById(bomId)
                .orElseThrow(() -> new RuntimeException("BOM not found: " + bomId));

        String username = getCurrentUsername();

        // Check for children
        int childCount = bomRepository.countChildrenByParentBomId(bomId);
        if (childCount > 0) {
            throw new RuntimeException("Cannot delete BOM node with children. Delete children first or use cascade delete.");
        }

        bom.setStatus("INACTIVE");
        bom.setUpdatedBy(username);
        bomRepository.save(bom);

        auditService.logStatusChange(
                "BOM",
                bomId,
                "ACTIVE",
                "INACTIVE"
        );
    }

    /**
     * Delete a BOM node and all its children (cascade delete)
     */
    @Transactional
    public int deleteBomNodeCascade(Long bomId) {
        log.info("Cascade deleting BOM node: {}", bomId);

        BillOfMaterial bom = bomRepository.findById(bomId)
                .orElseThrow(() -> new RuntimeException("BOM not found: " + bomId));

        String username = getCurrentUsername();
        int deletedCount = deleteNodeAndChildren(bomId, username);

        auditService.createAuditEntry(
                "BOM",
                bomId,
                null,
                null,
                "Cascade deleted BOM node and " + (deletedCount - 1) + " children for product " + bom.getProductSku(),
                "DELETE_CASCADE"
        );

        return deletedCount;
    }

    /**
     * Delete entire BOM tree for a product
     */
    @Transactional
    public int deleteBomTree(String productSku) {
        log.info("Deleting entire BOM tree for product: {}", productSku);

        String username = getCurrentUsername();
        List<BillOfMaterial> allBoms = bomRepository.findByProductSku(productSku);

        for (BillOfMaterial bom : allBoms) {
            bom.setStatus("INACTIVE");
            bom.setUpdatedBy(username);
        }

        bomRepository.saveAll(allBoms);

        auditService.createAuditEntry(
                "BOM",
                null,
                null,
                null,
                "Deleted entire BOM tree for product " + productSku + " (" + allBoms.size() + " nodes)",
                "DELETE_TREE"
        );

        return allBoms.size();
    }

    // =====================================================
    // Helper Methods
    // =====================================================

    /**
     * Build tree structure from flat list of BOMs
     */
    private List<BomDTO.BomTreeNode> buildTree(List<BillOfMaterial> allBoms) {
        // Group by parent ID
        Map<Long, List<BillOfMaterial>> childrenByParent = allBoms.stream()
                .filter(b -> b.getParentBomId() != null)
                .collect(Collectors.groupingBy(BillOfMaterial::getParentBomId));

        // Get root nodes (no parent)
        List<BillOfMaterial> rootNodes = allBoms.stream()
                .filter(b -> b.getParentBomId() == null)
                .collect(Collectors.toList());

        // Build tree recursively
        return rootNodes.stream()
                .map(root -> buildTreeNode(root, childrenByParent))
                .collect(Collectors.toList());
    }

    private BomDTO.BomTreeNode buildTreeNode(BillOfMaterial bom, Map<Long, List<BillOfMaterial>> childrenByParent) {
        List<BomDTO.BomTreeNode> children = new ArrayList<>();

        List<BillOfMaterial> childBoms = childrenByParent.get(bom.getBomId());
        if (childBoms != null) {
            children = childBoms.stream()
                    .map(child -> buildTreeNode(child, childrenByParent))
                    .collect(Collectors.toList());
        }

        return BomDTO.BomTreeNode.builder()
                .bomId(bom.getBomId())
                .productSku(bom.getProductSku())
                .bomVersion(bom.getBomVersion())
                .materialId(bom.getMaterialId())
                .materialName(bom.getMaterialName())
                .quantityRequired(bom.getQuantityRequired())
                .unit(bom.getUnit())
                .yieldLossRatio(bom.getYieldLossRatio())
                .sequenceLevel(bom.getSequenceLevel())
                .parentBomId(bom.getParentBomId())
                .status(bom.getStatus())
                .children(children)
                .build();
    }

    private BomDTO.BomTreeNode convertToTreeNode(BillOfMaterial bom, List<BillOfMaterial> children) {
        List<BomDTO.BomTreeNode> childNodes = children.stream()
                .map(child -> convertToTreeNode(child, bomRepository.findByParentBomId(child.getBomId())))
                .collect(Collectors.toList());

        return BomDTO.BomTreeNode.builder()
                .bomId(bom.getBomId())
                .productSku(bom.getProductSku())
                .bomVersion(bom.getBomVersion())
                .materialId(bom.getMaterialId())
                .materialName(bom.getMaterialName())
                .quantityRequired(bom.getQuantityRequired())
                .unit(bom.getUnit())
                .yieldLossRatio(bom.getYieldLossRatio())
                .sequenceLevel(bom.getSequenceLevel())
                .parentBomId(bom.getParentBomId())
                .status(bom.getStatus())
                .children(childNodes)
                .build();
    }

    private int calculateMaxDepth(List<BomDTO.BomTreeNode> nodes, int currentDepth) {
        if (nodes == null || nodes.isEmpty()) {
            return currentDepth - 1;
        }

        int maxDepth = currentDepth;
        for (BomDTO.BomTreeNode node : nodes) {
            int childDepth = calculateMaxDepth(node.getChildren(), currentDepth + 1);
            maxDepth = Math.max(maxDepth, childDepth);
        }
        return maxDepth;
    }

    private BomDTO.BomProductSummary getProductSummary(String productSku) {
        List<BillOfMaterial> boms = bomRepository.findActiveByProductSkuOrderByLevel(productSku);
        if (boms.isEmpty()) {
            return BomDTO.BomProductSummary.builder()
                    .productSku(productSku)
                    .bomVersion("V1")
                    .totalNodes(0)
                    .maxLevel(0)
                    .status("EMPTY")
                    .build();
        }

        Integer maxLevel = bomRepository.findMaxSequenceLevelByProductSku(productSku);

        return BomDTO.BomProductSummary.builder()
                .productSku(productSku)
                .bomVersion(boms.get(0).getBomVersion())
                .totalNodes(boms.size())
                .maxLevel(maxLevel != null ? maxLevel : 1)
                .status("ACTIVE")
                .build();
    }

    private void validateNoCycle(Long nodeId, Long newParentId) {
        // Walk up the parent chain from newParentId
        Long currentId = newParentId;
        Set<Long> visited = new HashSet<>();

        while (currentId != null) {
            if (currentId.equals(nodeId)) {
                throw new RuntimeException("Cannot set parent: would create a cycle in the BOM hierarchy");
            }
            if (visited.contains(currentId)) {
                break; // Already has a cycle in the data (shouldn't happen)
            }
            visited.add(currentId);

            BillOfMaterial current = bomRepository.findById(currentId).orElse(null);
            currentId = current != null ? current.getParentBomId() : null;
        }
    }

    private int deleteNodeAndChildren(Long bomId, String username) {
        int count = 1;

        // Get children
        List<BillOfMaterial> children = bomRepository.findByParentBomIdOrderBySequenceLevelAsc(bomId);
        for (BillOfMaterial child : children) {
            count += deleteNodeAndChildren(child.getBomId(), username);
        }

        // Delete this node
        BillOfMaterial bom = bomRepository.findById(bomId).orElse(null);
        if (bom != null) {
            bom.setStatus("INACTIVE");
            bom.setUpdatedBy(username);
            bomRepository.save(bom);
        }

        return count;
    }

    private String getCurrentUsername() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "system";
        }
    }
}
