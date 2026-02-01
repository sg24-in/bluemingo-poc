package com.mes.production.controller;

import com.mes.production.entity.Equipment;
import com.mes.production.entity.Operator;
import com.mes.production.repository.EquipmentRepository;
import com.mes.production.repository.OperatorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/master")
@RequiredArgsConstructor
@Slf4j
public class MasterDataController {

    private final EquipmentRepository equipmentRepository;
    private final OperatorRepository operatorRepository;
    private final JdbcTemplate jdbcTemplate;

    /**
     * Get all equipment
     */
    @GetMapping("/equipment")
    public ResponseEntity<List<Equipment>> getAllEquipment() {
        log.info("GET /api/master/equipment");
        List<Equipment> equipment = equipmentRepository.findAll();
        return ResponseEntity.ok(equipment);
    }

    /**
     * Get available equipment
     */
    @GetMapping("/equipment/available")
    public ResponseEntity<List<Equipment>> getAvailableEquipment() {
        log.info("GET /api/master/equipment/available");
        List<Equipment> equipment = equipmentRepository.findByStatus("AVAILABLE");
        return ResponseEntity.ok(equipment);
    }

    /**
     * Get all operators
     */
    @GetMapping("/operators")
    public ResponseEntity<List<Operator>> getAllOperators() {
        log.info("GET /api/master/operators");
        List<Operator> operators = operatorRepository.findAll();
        return ResponseEntity.ok(operators);
    }

    /**
     * Get active operators
     */
    @GetMapping("/operators/active")
    public ResponseEntity<List<Operator>> getActiveOperators() {
        log.info("GET /api/master/operators/active");
        List<Operator> operators = operatorRepository.findByStatus("ACTIVE");
        return ResponseEntity.ok(operators);
    }

    /**
     * Get delay reasons
     */
    @GetMapping("/delay-reasons")
    public ResponseEntity<List<Map<String, Object>>> getDelayReasons() {
        log.info("GET /api/master/delay-reasons");
        String sql = "SELECT reason_code, reason_description FROM delay_reasons WHERE status = 'ACTIVE'";
        List<Map<String, Object>> reasons = jdbcTemplate.queryForList(sql);
        return ResponseEntity.ok(reasons);
    }

    /**
     * Get hold reasons
     */
    @GetMapping("/hold-reasons")
    public ResponseEntity<List<Map<String, Object>>> getHoldReasons() {
        log.info("GET /api/master/hold-reasons");
        String sql = "SELECT reason_code, reason_description, applicable_to FROM hold_reasons WHERE status = 'ACTIVE'";
        List<Map<String, Object>> reasons = jdbcTemplate.queryForList(sql);
        return ResponseEntity.ok(reasons);
    }

    /**
     * Get process parameters configuration
     */
    @GetMapping("/process-parameters")
    public ResponseEntity<List<Map<String, Object>>> getProcessParameters(
            @RequestParam(required = false) String operationType,
            @RequestParam(required = false) String productSku) {
        log.info("GET /api/master/process-parameters, operationType={}, productSku={}", operationType, productSku);

        StringBuilder sql = new StringBuilder(
                "SELECT config_id, operation_type, product_sku, parameter_name, parameter_type, " +
                "unit, min_value, max_value, default_value, is_required, display_order " +
                "FROM process_parameters_config WHERE status = 'ACTIVE'");

        java.util.List<Object> queryParams = new java.util.ArrayList<>();

        if (operationType != null && !operationType.isEmpty()) {
            sql.append(" AND operation_type = ?");
            queryParams.add(operationType);
        }
        if (productSku != null && !productSku.isEmpty()) {
            sql.append(" AND (product_sku = ? OR product_sku IS NULL)");
            queryParams.add(productSku);
        }
        sql.append(" ORDER BY display_order");

        List<Map<String, Object>> params = jdbcTemplate.queryForList(sql.toString(), queryParams.toArray());
        return ResponseEntity.ok(params);
    }
}
