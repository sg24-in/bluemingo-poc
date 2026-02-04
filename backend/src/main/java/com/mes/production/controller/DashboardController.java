package com.mes.production.controller;

import com.mes.production.dto.DashboardDTO;
import com.mes.production.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Slf4j
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * Get dashboard summary with all key metrics
     */
    @GetMapping("/summary")
    public ResponseEntity<DashboardDTO.Summary> getDashboardSummary() {
        log.info("GET /api/dashboard/summary");
        return ResponseEntity.ok(dashboardService.getDashboardSummary());
    }

    /**
     * Get recent production activity
     */
    @GetMapping("/recent-activity")
    public ResponseEntity<List<DashboardDTO.RecentActivity>> getRecentActivity(
            @RequestParam(defaultValue = "5") int limit) {
        log.info("GET /api/dashboard/recent-activity?limit={}", limit);
        return ResponseEntity.ok(dashboardService.getRecentActivity(limit));
    }
}
