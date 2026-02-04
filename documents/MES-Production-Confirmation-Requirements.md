# MES Production Confirmation - UI Requirements & Mockups

**Document Version:** 1.0
**Last Updated:** 2026-02-04
**Project:** Bluemingo MES POC

---

## 1. Overview

This document defines the UI requirements and screen layouts for the Production Confirmation module of the MES POC.

---

## 2. Production Confirmation Form

### 2.1 Screen Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Production Confirmation                                      [×]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Order Selection                                              │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ Order:        [▼ Select Order                            ]   │   │
│  │ Product:      Steel Rod Grade A                              │   │
│  │ Customer:     ABC Steel Corporation                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Operation Selection                                          │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ Operation:    [▼ Select Operation                        ]   │   │
│  │ Process:      Rolling Mill                                   │   │
│  │ Status:       [READY]                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Input Materials                                              │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ ┌─────────────────────────────────────────────────────────┐ │   │
│  │ │ Suggested Consumption (from BOM)          [Apply All]   │ │   │
│  │ ├─────────────────────────────────────────────────────────┤ │   │
│  │ │ Steel Billet    500 KG required    [✓ Sufficient]       │ │   │
│  │ │   └─ BATCH-IM-001 (600 KG available)                    │ │   │
│  │ └─────────────────────────────────────────────────────────┘ │   │
│  │                                                              │   │
│  │ Selected Materials:                                          │   │
│  │ ┌──────────────┬────────────┬──────────┬─────────────────┐  │   │
│  │ │ Batch        │ Material   │ Available│ Qty to Consume  │  │   │
│  │ ├──────────────┼────────────┼──────────┼─────────────────┤  │   │
│  │ │ BATCH-IM-001 │ Steel Billet│ 600 KG  │ [500        ] KG│  │   │
│  │ └──────────────┴────────────┴──────────┴─────────────────┘  │   │
│  │                                    [+ Add Material]          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Process Parameters                                           │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ Temperature:  [1150    ] °C    (Range: 1100-1200)           │   │
│  │ Pressure:     [2.5     ] bar   (Range: 2.0-3.0)             │   │
│  │ Speed:        [15      ] m/min (Range: 10-20)               │   │
│  │                                                              │   │
│  │ ⚠ Temperature is within 10% of upper limit                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Production Time                                              │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ Start Time:   [2026-02-04] [08:00]                          │   │
│  │ End Time:     [2026-02-04] [16:00]                          │   │
│  │ Duration:     8 hours                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Output Quantities                                            │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ Good Quantity:   [450     ] KG                              │   │
│  │ Scrap Quantity:  [50      ] KG                              │   │
│  │ Total:           500 KG (Yield: 90%)                        │   │
│  │                                                              │   │
│  │ Output Batch:    ROLL-20260204-001 (auto-generated)         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Equipment & Operators                                        │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ Equipment:    [✓] Rolling Mill 1  [✓] Rolling Mill 2        │   │
│  │               [ ] Rolling Mill 3                             │   │
│  │                                                              │   │
│  │ Operators:    [✓] John Smith     [✓] Jane Doe               │   │
│  │               [ ] Bob Johnson                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Notes                                                        │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ [                                                         ]  │   │
│  │ [                                                         ]  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│                              [Cancel]  [Submit Confirmation]        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Field Specifications

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Order | Dropdown | Yes | Must be IN_PROGRESS status |
| Operation | Dropdown | Yes | Must be READY status |
| Input Materials | Multi-select | Yes | At least one material |
| Consumption Qty | Number | Yes | > 0, <= available |
| Temperature | Number | Conditional | Within configured range |
| Pressure | Number | Conditional | Within configured range |
| Start Time | DateTime | Yes | Valid datetime |
| End Time | DateTime | Yes | > Start Time |
| Good Quantity | Number | Yes | > 0 |
| Scrap Quantity | Number | No | >= 0 |
| Equipment | Multi-select | No | From available list |
| Operators | Multi-select | No | From available list |
| Notes | Text | No | Max 500 chars |

---

## 3. Order Selection Dropdown

### 3.1 Dropdown Content

```
┌─────────────────────────────────────────────────────────────┐
│ ▼ Select Order                                              │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ORD-000001 - ABC Steel Corp                             │ │
│ │ Steel Rod Grade A | 1000 KG | Due: 2026-02-10          │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ORD-000002 - XYZ Manufacturing                          │ │
│ │ Steel Plate | 500 KG | Due: 2026-02-15                 │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ORD-000003 - DEF Industries                             │ │
│ │ Steel Beam | 2000 KG | Due: 2026-02-20                 │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Operation Selection Dropdown

### 4.1 Dropdown Content (After Order Selected)

```
┌─────────────────────────────────────────────────────────────┐
│ ▼ Select Operation                                          │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Rolling - Final Roll [READY]                            │ │
│ │ Process: Rolling Mill | Expected: 1000 KG              │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Casting - Pour Steel [CONFIRMED] ✓                      │ │
│ │ Process: Continuous Caster | Completed: 2026-02-03     │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Melting - Heat 1 [CONFIRMED] ✓                          │ │
│ │ Process: Electric Arc Furnace | Completed: 2026-02-02  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Material Selection Modal

### 5.1 Modal Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Select Input Materials                              [×]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Material Type: Steel Billet                                │
│  Required: 500 KG (from BOM)                               │
│                                                             │
│  Available Batches:                                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [ ] BATCH-IM-001                                        ││
│  │     Quantity: 600 KG | Status: AVAILABLE                ││
│  │     Created: 2026-02-01 | Location: Warehouse A         ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ [ ] BATCH-IM-002                                        ││
│  │     Quantity: 400 KG | Status: AVAILABLE                ││
│  │     Created: 2026-02-02 | Location: Warehouse A         ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ [X] BATCH-IM-003                                        ││
│  │     Quantity: 200 KG | Status: BLOCKED                  ││
│  │     Created: 2026-02-03 | ⚠ Quality Hold               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Selected: 0 KG / 500 KG required                          │
│                                                             │
│                              [Cancel]  [Confirm Selection]  │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Confirmation Success Modal

### 6.1 Success Dialog

```
┌─────────────────────────────────────────────────────────────┐
│  ✓ Production Confirmed Successfully                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Confirmation ID: CONF-20260204-001                        │
│                                                             │
│  Summary:                                                   │
│  ─────────────────────────────────────────────────────────  │
│  Order:           ORD-000001                                │
│  Operation:       Rolling - Final Roll                      │
│  Output Batch:    ROLL-20260204-001                        │
│  Good Quantity:   450 KG                                   │
│  Scrap Quantity:  50 KG                                    │
│  Yield:           90%                                       │
│                                                             │
│  Materials Consumed:                                        │
│  • BATCH-IM-001: 500 KG                                    │
│                                                             │
│  Equipment Used:                                            │
│  • Rolling Mill 1, Rolling Mill 2                          │
│                                                             │
│  Operators:                                                 │
│  • John Smith, Jane Doe                                    │
│                                                             │
│         [View Batch Details]  [New Confirmation]  [Close]   │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Validation Error States

### 7.1 Inline Validation

```
Process Parameters:
┌─────────────────────────────────────────────────────────────┐
│ Temperature:  [1250    ] °C    (Range: 1100-1200)          │
│               ❌ Temperature exceeds maximum of 1200°C      │
│                                                             │
│ Pressure:     [        ] bar   (Range: 2.0-3.0)            │
│               ❌ Pressure is required                       │
│                                                             │
│ Speed:        [8       ] m/min (Range: 10-20)              │
│               ❌ Speed below minimum of 10 m/min            │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Warning States

```
Process Parameters:
┌─────────────────────────────────────────────────────────────┐
│ Temperature:  [1190    ] °C    (Range: 1100-1200)          │
│               ⚠ Warning: Within 10% of upper limit         │
│                                                             │
│ Pressure:     [2.1     ] bar   (Range: 2.0-3.0)            │
│               ⚠ Warning: Within 10% of lower limit         │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Responsive Considerations

### 8.1 Desktop (1200px+)
- Full two-column layout where appropriate
- All sections visible
- Side-by-side equipment/operator selection

### 8.2 Tablet (768px - 1199px)
- Single column layout
- Collapsible sections
- Full-width inputs

### 8.3 Mobile (< 768px)
- Not primary target for POC
- Basic responsive scaling
- Stacked form elements

---

## 9. Color Coding

| Element | Color | Usage |
|---------|-------|-------|
| READY status | Blue (#3498db) | Operations ready for confirmation |
| CONFIRMED | Green (#27ae60) | Completed operations |
| IN_PROGRESS | Orange (#f39c12) | Active work |
| ERROR | Red (#e74c3c) | Validation errors |
| WARNING | Yellow (#f1c40f) | Warnings (near limits) |
| BLOCKED | Gray (#7f8c8d) | Unavailable items |

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2026-02-04 | Claude Code | Initial document creation |
