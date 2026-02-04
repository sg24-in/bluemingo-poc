package com.mes.production.controller;

import com.mes.production.dto.HoldDTO;
import com.mes.production.service.HoldService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/holds")
@RequiredArgsConstructor
@Slf4j
public class HoldController {

    private final HoldService holdService;

    /**
     * Apply hold to an entity
     */
    @PostMapping
    public ResponseEntity<HoldDTO.HoldResponse> applyHold(
            @Valid @RequestBody HoldDTO.ApplyHoldRequest request,
            Authentication authentication) {
        log.info("POST /api/holds - Applying hold to {} with ID {}",
                request.getEntityType(), request.getEntityId());

        String appliedBy = authentication != null ? authentication.getName() : "system";
        HoldDTO.HoldResponse response = holdService.applyHold(request, appliedBy);
        return ResponseEntity.ok(response);
    }

    /**
     * Release a hold
     */
    @PutMapping("/{holdId}/release")
    public ResponseEntity<HoldDTO.HoldResponse> releaseHold(
            @PathVariable Long holdId,
            @RequestBody(required = false) HoldDTO.ReleaseHoldRequest request,
            Authentication authentication) {
        log.info("PUT /api/holds/{}/release", holdId);

        String releasedBy = authentication != null ? authentication.getName() : "system";
        HoldDTO.HoldResponse response = holdService.releaseHold(holdId, request, releasedBy);
        return ResponseEntity.ok(response);
    }

    /**
     * Get all active holds
     */
    @GetMapping("/active")
    public ResponseEntity<List<HoldDTO.HoldResponse>> getActiveHolds() {
        log.info("GET /api/holds/active");
        return ResponseEntity.ok(holdService.getActiveHolds());
    }

    /**
     * Get active hold count for dashboard
     */
    @GetMapping("/count")
    public ResponseEntity<HoldDTO.HoldCountResponse> getActiveHoldCount() {
        log.info("GET /api/holds/count");
        Long count = holdService.getActiveHoldCount();
        return ResponseEntity.ok(HoldDTO.HoldCountResponse.builder()
                .activeHolds(count)
                .build());
    }

    /**
     * Get holds for a specific entity
     */
    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<List<HoldDTO.HoldResponse>> getHoldsByEntity(
            @PathVariable String entityType,
            @PathVariable Long entityId) {
        log.info("GET /api/holds/entity/{}/{}", entityType, entityId);
        return ResponseEntity.ok(holdService.getHoldsByEntity(entityType, entityId));
    }

    /**
     * Check if entity is on hold
     */
    @GetMapping("/check/{entityType}/{entityId}")
    public ResponseEntity<java.util.Map<String, Boolean>> checkEntityOnHold(
            @PathVariable String entityType,
            @PathVariable Long entityId) {
        log.info("GET /api/holds/check/{}/{}", entityType, entityId);
        boolean isOnHold = holdService.isEntityOnHold(entityType, entityId);
        return ResponseEntity.ok(java.util.Map.of("onHold", isOnHold));
    }
}
