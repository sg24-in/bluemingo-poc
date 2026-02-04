package com.mes.production.entity;

/**
 * Enum for standard Units of Measure used across the MES system.
 */
public enum UnitOfMeasure {
    // Weight
    KG("Kilogram"),
    MT("Metric Ton"),
    LB("Pound"),
    G("Gram"),

    // Count
    PCS("Pieces"),
    EA("Each"),

    // Volume
    L("Liter"),
    ML("Milliliter"),
    GAL("Gallon"),

    // Length
    M("Meter"),
    CM("Centimeter"),
    MM("Millimeter"),
    FT("Feet"),
    IN("Inch"),

    // Area & Volume
    M2("Square Meter"),
    M3("Cubic Meter"),

    // Packaging
    BOX("Box"),
    BAG("Bag"),
    ROLL("Roll"),
    SET("Set");

    private final String label;

    UnitOfMeasure(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public String getCode() {
        return this.name();
    }

    /**
     * Get display string in format "Label (CODE)"
     */
    public String getDisplayName() {
        return label + " (" + name() + ")";
    }

    /**
     * Parse a string to UnitOfMeasure, returns null if not found.
     */
    public static UnitOfMeasure fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return UnitOfMeasure.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /**
     * Check if a string is a valid unit of measure.
     */
    public static boolean isValid(String value) {
        return fromString(value) != null;
    }
}
