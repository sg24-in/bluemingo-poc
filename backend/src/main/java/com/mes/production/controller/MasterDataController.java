package com.mes.production.controller;

import com.mes.production.entity.Equipment;
import com.mes.production.entity.Operator;
import com.mes.production.repository.EquipmentRepository;
import com.mes.production.repository.OperatorRepository;
import com.mes.production.service.EquipmentTypeService;
import com.mes.production.service.InventoryFormService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
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
    private final EquipmentTypeService equipmentTypeService;
    private final InventoryFormService inventoryFormService;

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

    /**
     * Get all active equipment type configurations
     */
    @GetMapping("/equipment-types")
    public ResponseEntity<List<Map<String, Object>>> getAllEquipmentTypes() {
        log.info("GET /api/master/equipment-types");
        List<Map<String, Object>> types = equipmentTypeService.getAllEquipmentTypes();
        return ResponseEntity.ok(types);
    }

    /**
     * Get configuration for a specific equipment type
     */
    @GetMapping("/equipment-types/{type}")
    public ResponseEntity<Map<String, Object>> getEquipmentTypeConfig(@PathVariable String type) {
        log.info("GET /api/master/equipment-types/{}", type);
        return equipmentTypeService.getEquipmentTypeConfig(type)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get all active inventory form configurations
     */
    @GetMapping("/inventory-forms")
    public ResponseEntity<List<Map<String, Object>>> getAllInventoryForms() {
        log.info("GET /api/master/inventory-forms");
        List<Map<String, Object>> forms = inventoryFormService.getAllForms();
        return ResponseEntity.ok(forms);
    }

    /**
     * Get configuration for a specific inventory form code
     */
    @GetMapping("/inventory-forms/{formCode}")
    public ResponseEntity<Map<String, Object>> getInventoryFormConfig(@PathVariable String formCode) {
        log.info("GET /api/master/inventory-forms/{}", formCode);
        return inventoryFormService.getFormConfig(formCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get quantity type configuration with optional filters.
     * Results are ordered by priority (most specific match first - where more fields match).
     */
    @GetMapping("/quantity-type-config")
    public ResponseEntity<List<Map<String, Object>>> getQuantityTypeConfig(
            @RequestParam(required = false) String materialCode,
            @RequestParam(required = false) String operationType,
            @RequestParam(required = false) String equipmentType) {
        log.info("GET /api/master/quantity-type-config, materialCode={}, operationType={}, equipmentType={}",
                materialCode, operationType, equipmentType);

        StringBuilder sql = new StringBuilder(
                "SELECT *, " +
                "(CASE WHEN material_code IS NOT NULL THEN 1 ELSE 0 END " +
                "+ CASE WHEN operation_type IS NOT NULL THEN 1 ELSE 0 END " +
                "+ CASE WHEN equipment_type IS NOT NULL THEN 1 ELSE 0 END) AS match_score " +
                "FROM quantity_type_config WHERE status = 'ACTIVE'");

        List<Object> queryParams = new ArrayList<>();

        if (materialCode != null && !materialCode.isEmpty()) {
            sql.append(" AND (material_code = ? OR material_code IS NULL)");
            queryParams.add(materialCode);
        }
        if (operationType != null && !operationType.isEmpty()) {
            sql.append(" AND (operation_type = ? OR operation_type IS NULL)");
            queryParams.add(operationType);
        }
        if (equipmentType != null && !equipmentType.isEmpty()) {
            sql.append(" AND (equipment_type = ? OR equipment_type IS NULL)");
            queryParams.add(equipmentType);
        }

        sql.append(" ORDER BY match_score DESC");

        List<Map<String, Object>> configs = jdbcTemplate.queryForList(sql.toString(), queryParams.toArray());
        return ResponseEntity.ok(configs);
    }
}
