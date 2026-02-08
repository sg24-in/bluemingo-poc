/**
 * Big Demo E2E Test - Realistic Steel Manufacturing MES Data
 *
 * Creates comprehensive, realistic production demo data through API:
 * - 15 Real steel industry customers
 * - 40 Materials (RM, IM, FG) with proper specs
 * - 25 Products with ASTM specifications
 * - 18 Equipment items
 * - 15 Operators across departments
 * - 15 Processes with detailed routings
 * - 30 Customer orders
 * - 60+ Raw material receipts
 *
 * See: documents/BIG-DEMO-DATA-PLAN.md for full specification
 *
 * Run with: node e2e/tests/31-big-demo-setup.test.js
 */

const BASE_URL = 'http://localhost:8080';
const API_URL = `${BASE_URL}/api`;

let authToken = null;

// ============================================================
// API Helper Functions
// ============================================================

async function login() {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@mes.com', password: 'admin123' })
    });
    const data = await response.json();
    authToken = data.accessToken;
    console.log('✅ Logged in successfully');
    return authToken;
}

async function apiCall(method, endpoint, body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const text = await response.text();
    try {
        return { status: response.status, data: JSON.parse(text) };
    } catch {
        return { status: response.status, data: text };
    }
}

async function get(endpoint) { return apiCall('GET', endpoint); }
async function post(endpoint, body) { return apiCall('POST', endpoint, body); }
async function put(endpoint, body) { return apiCall('PUT', endpoint, body); }
async function del(endpoint) { return apiCall('DELETE', endpoint); }

// ============================================================
// Task 1: CUSTOMERS - 15 Real Steel Industry Companies
// ============================================================

const CUSTOMERS = [
    // Automotive OEMs
    { customerCode: 'CUST-GM', customerName: 'General Motors', email: 'steel.procurement@gm.com', phone: '+1-313-556-5000', address: '300 Renaissance Center', city: 'Detroit', state: 'MI', postalCode: '48265', country: 'USA', status: 'ACTIVE' },
    { customerCode: 'CUST-FORD', customerName: 'Ford Motor Company', email: 'steel.supply@ford.com', phone: '+1-313-322-3000', address: '1 American Road', city: 'Dearborn', state: 'MI', postalCode: '48126', country: 'USA', status: 'ACTIVE' },
    { customerCode: 'CUST-TOYOTA', customerName: 'Toyota Motor North America', email: 'procurement@toyota.com', phone: '+1-469-292-4000', address: '6565 Headquarters Drive', city: 'Plano', state: 'TX', postalCode: '75024', country: 'USA', status: 'ACTIVE' },

    // Heavy Equipment Manufacturers
    { customerCode: 'CUST-CAT', customerName: 'Caterpillar Inc', email: 'steel.sourcing@cat.com', phone: '+1-309-675-1000', address: '510 Lake Cook Road', city: 'Deerfield', state: 'IL', postalCode: '60015', country: 'USA', status: 'ACTIVE' },
    { customerCode: 'CUST-DEERE', customerName: 'Deere & Company', email: 'steel.purchasing@deere.com', phone: '+1-309-765-8000', address: 'One John Deere Place', city: 'Moline', state: 'IL', postalCode: '61265', country: 'USA', status: 'ACTIVE' },

    // Construction Companies
    { customerCode: 'CUST-TURNER', customerName: 'Turner Construction Company', email: 'materials@turnerconstruction.com', phone: '+1-212-229-6000', address: '375 Hudson Street', city: 'New York', state: 'NY', postalCode: '10014', country: 'USA', status: 'ACTIVE' },
    { customerCode: 'CUST-BECHTEL', customerName: 'Bechtel Corporation', email: 'steel.procurement@bechtel.com', phone: '+1-571-350-3000', address: '12011 Sunset Hills Road', city: 'Reston', state: 'VA', postalCode: '20190', country: 'USA', status: 'ACTIVE' },

    // Steel Building Systems
    { customerCode: 'CUST-NUCOR-BS', customerName: 'Nucor Building Systems', email: 'purchasing@nucorbuildings.com', phone: '+1-979-846-3501', address: '4001 State Highway 36', city: 'Waterloo', state: 'IN', postalCode: '46793', country: 'USA', status: 'ACTIVE' },

    // Oil & Gas - Tubular
    { customerCode: 'CUST-TENARIS', customerName: 'Tenaris', email: 'steel.orders@tenaris.com', phone: '+1-713-767-4400', address: '2200 West Loop South', city: 'Houston', state: 'TX', postalCode: '77027', country: 'USA', status: 'ACTIVE' },

    // Steel Distributors & Service Centers
    { customerCode: 'CUST-OLYMPIC', customerName: 'Olympic Steel Inc', email: 'orders@olysteel.com', phone: '+1-216-672-3600', address: '22901 Millcreek Blvd', city: 'Highland Hills', state: 'OH', postalCode: '44122', country: 'USA', status: 'ACTIVE' },
    { customerCode: 'CUST-RELIANCE', customerName: 'Reliance Steel & Aluminum Co', email: 'purchasing@rsac.com', phone: '+1-213-687-7700', address: '350 South Grand Avenue', city: 'Los Angeles', state: 'CA', postalCode: '90071', country: 'USA', status: 'ACTIVE' },
    { customerCode: 'CUST-RYERSON', customerName: 'Ryerson Inc', email: 'orders@ryerson.com', phone: '+1-312-292-5000', address: '227 W Monroe Street', city: 'Chicago', state: 'IL', postalCode: '60606', country: 'USA', status: 'ACTIVE' },
    { customerCode: 'CUST-MSC', customerName: 'Metal Supermarkets', email: 'orders@metalsupermarkets.com', phone: '+1-905-319-9950', address: '1100 Burloak Drive', city: 'Burlington', state: 'ON', postalCode: 'L7L 6B2', country: 'Canada', status: 'ACTIVE' },

    // International Trading
    { customerCode: 'CUST-TKM', customerName: 'ThyssenKrupp Materials NA', email: 'steel.sales@thyssenkrupp.com', phone: '+1-248-593-4000', address: '22355 West Eleven Mile Road', city: 'Southfield', state: 'MI', postalCode: '48033', country: 'USA', status: 'ACTIVE' },
    { customerCode: 'CUST-SSAB', customerName: 'SSAB Americas', email: 'orders@ssab.com', phone: '+1-319-293-3831', address: '1755 W Outer Highway 61', city: 'Muscatine', state: 'IA', postalCode: '52761', country: 'USA', status: 'ACTIVE' },
];

// ============================================================
// Task 2: MATERIALS - 40 Items (18 RM, 12 IM, 10 FG)
// ============================================================

const MATERIALS = [
    // ==================== RAW MATERIALS (18) ====================
    // Steel Scrap
    { materialCode: 'RM-HMS1A', materialName: 'Heavy Melting Steel #1 Grade A', materialType: 'RM', baseUnit: 'T', description: 'HMS1 Premium - min 3/16" thick, max 5x2 ft', status: 'ACTIVE' },
    { materialCode: 'RM-HMS1B', materialName: 'Heavy Melting Steel #1 Grade B', materialType: 'RM', baseUnit: 'T', description: 'HMS1 Standard - min 1/4" thick, max 5x2 ft', status: 'ACTIVE' },
    { materialCode: 'RM-HMS2', materialName: 'Heavy Melting Steel #2', materialType: 'RM', baseUnit: 'T', description: 'HMS2 - min 1/8" thick, may include lighter material', status: 'ACTIVE' },
    { materialCode: 'RM-SHRED', materialName: 'Shredded Steel Scrap', materialType: 'RM', baseUnit: 'T', description: 'Auto body shredded, fist-sized pieces', status: 'ACTIVE' },
    { materialCode: 'RM-BUSHEL', materialName: 'Busheling', materialType: 'RM', baseUnit: 'T', description: 'Factory new sheet clippings, clean', status: 'ACTIVE' },

    // Iron Units
    { materialCode: 'RM-PIG-IRON', materialName: 'Pig Iron', materialType: 'RM', baseUnit: 'T', description: 'Blast furnace pig iron, 4.0-4.5% C', status: 'ACTIVE' },
    { materialCode: 'RM-HBI', materialName: 'Hot Briquetted Iron', materialType: 'RM', baseUnit: 'T', description: 'DRI briquettes, 90%+ Fe metallized', status: 'ACTIVE' },

    // Ferroalloys
    { materialCode: 'RM-FESI-75', materialName: 'Ferro Silicon 75%', materialType: 'RM', baseUnit: 'KG', description: 'FeSi 75%, 10-50mm lumps, deoxidizer', status: 'ACTIVE' },
    { materialCode: 'RM-SIMN-65', materialName: 'Silico Manganese 65/17', materialType: 'RM', baseUnit: 'KG', description: 'SiMn 65% Mn, 17% Si, 10-60mm', status: 'ACTIVE' },
    { materialCode: 'RM-FEMN-HC', materialName: 'Ferro Manganese High Carbon', materialType: 'RM', baseUnit: 'KG', description: 'FeMn 75% Mn, 7% C, 10-100mm lumps', status: 'ACTIVE' },
    { materialCode: 'RM-FEMN-MC', materialName: 'Ferro Manganese Medium Carbon', materialType: 'RM', baseUnit: 'KG', description: 'FeMn 80% Mn, 1.5% C max', status: 'ACTIVE' },
    { materialCode: 'RM-FECR-LC', materialName: 'Ferro Chrome Low Carbon', materialType: 'RM', baseUnit: 'KG', description: 'FeCr 65% Cr, 0.1% C max, for stainless', status: 'ACTIVE' },

    // Fluxes
    { materialCode: 'RM-LIME', materialName: 'Calcined Lime', materialType: 'RM', baseUnit: 'T', description: 'CaO 90%+ min, -10mm fines', status: 'ACTIVE' },
    { materialCode: 'RM-DOLIME', materialName: 'Dolomite Lime', materialType: 'RM', baseUnit: 'T', description: 'MgO-CaO for slag, 10-50mm', status: 'ACTIVE' },
    { materialCode: 'RM-FLUOR', materialName: 'Fluorspar', materialType: 'RM', baseUnit: 'KG', description: 'CaF2 85%+ min, slag fluidizer', status: 'ACTIVE' },

    // Carbon & Deoxidizers
    { materialCode: 'RM-MET-COKE', materialName: 'Metallurgical Coke', materialType: 'RM', baseUnit: 'T', description: 'Petroleum coke, 99% C, carburizer', status: 'ACTIVE' },
    { materialCode: 'RM-AL-WIRE', materialName: 'Aluminum Deox Wire', materialType: 'RM', baseUnit: 'KG', description: '9.5mm Al wire for deoxidation', status: 'ACTIVE' },
    { materialCode: 'RM-CASI-WIRE', materialName: 'CaSi Cored Wire', materialType: 'RM', baseUnit: 'KG', description: 'CaSi 30/60 inclusion modification', status: 'ACTIVE' },

    // ==================== INTERMEDIATE MATERIALS (12) ====================
    // Cast Products
    { materialCode: 'IM-SLAB-200', materialName: 'CC Slab 200x1200mm', materialType: 'IM', baseUnit: 'T', description: 'Continuously cast slab for HSM', status: 'ACTIVE' },
    { materialCode: 'IM-SLAB-250', materialName: 'CC Slab 250x1500mm', materialType: 'IM', baseUnit: 'T', description: 'Wide slab for plate/wide strip', status: 'ACTIVE' },
    { materialCode: 'IM-BILLET-130', materialName: 'CC Billet 130mm sq', materialType: 'IM', baseUnit: 'T', description: 'Square billet for bar/rod mill', status: 'ACTIVE' },
    { materialCode: 'IM-BILLET-150', materialName: 'CC Billet 150mm sq', materialType: 'IM', baseUnit: 'T', description: 'Large billet for rebar', status: 'ACTIVE' },
    { materialCode: 'IM-BLOOM-280', materialName: 'CC Bloom 280mm sq', materialType: 'IM', baseUnit: 'T', description: 'Bloom for beams/rails', status: 'ACTIVE' },

    // Hot Rolled Intermediates
    { materialCode: 'IM-HRC-6.0', materialName: 'HR Coil 6.0mm (Hot Band)', materialType: 'IM', baseUnit: 'T', description: 'Substrate for cold rolling', status: 'ACTIVE' },
    { materialCode: 'IM-HRC-4.0', materialName: 'HR Coil 4.0mm (Hot Band)', materialType: 'IM', baseUnit: 'T', description: 'Thinner hot band for CR', status: 'ACTIVE' },
    { materialCode: 'IM-WIREROD-55', materialName: 'Wire Rod 5.5mm', materialType: 'IM', baseUnit: 'T', description: 'LC wire rod for drawing', status: 'ACTIVE' },
    { materialCode: 'IM-WIREROD-85', materialName: 'Wire Rod 8.5mm', materialType: 'IM', baseUnit: 'T', description: 'HC wire rod for PC strand', status: 'ACTIVE' },

    // Processed Intermediates
    { materialCode: 'IM-PCKL-COIL', materialName: 'Pickled Coil', materialType: 'IM', baseUnit: 'T', description: 'Acid cleaned HR coil for CR', status: 'ACTIVE' },
    { materialCode: 'IM-FULLHARD', materialName: 'Full Hard CR Coil', materialType: 'IM', baseUnit: 'T', description: 'As-cold-rolled, needs anneal', status: 'ACTIVE' },
    { materialCode: 'IM-ANNEAL-CR', materialName: 'Annealed CR Coil', materialType: 'IM', baseUnit: 'T', description: 'BA or CAL processed', status: 'ACTIVE' },

    // ==================== FINISHED GOODS (10) ====================
    // Hot Rolled Products
    { materialCode: 'FG-HRC-2.0', materialName: 'HR Coil 2.0mm ASTM A1011 CS-B', materialType: 'FG', baseUnit: 'T', description: 'Commercial quality HR', status: 'ACTIVE' },
    { materialCode: 'FG-HRC-3.0', materialName: 'HR Coil 3.0mm ASTM A1011 CS-B', materialType: 'FG', baseUnit: 'T', description: 'Commercial quality HR', status: 'ACTIVE' },
    { materialCode: 'FG-HRC-4.0', materialName: 'HR Coil 4.0mm ASTM A1011 CS-B', materialType: 'FG', baseUnit: 'T', description: 'Commercial quality HR', status: 'ACTIVE' },

    // Cold Rolled Products
    { materialCode: 'FG-CRC-0.8', materialName: 'CR Coil 0.8mm ASTM A1008 CS-B', materialType: 'FG', baseUnit: 'T', description: 'Commercial quality CR', status: 'ACTIVE' },
    { materialCode: 'FG-CRC-1.0', materialName: 'CR Coil 1.0mm ASTM A1008 CS-B', materialType: 'FG', baseUnit: 'T', description: 'Commercial quality CR', status: 'ACTIVE' },

    // Coated Products
    { materialCode: 'FG-HDG-0.5', materialName: 'HDG Coil 0.5mm ASTM A653 CS-B', materialType: 'FG', baseUnit: 'T', description: 'Hot dip galvanized G90', status: 'ACTIVE' },

    // Long Products
    { materialCode: 'FG-REBAR-10', materialName: 'Rebar 10mm ASTM A615 Gr60', materialType: 'FG', baseUnit: 'T', description: 'Deformed bar Grade 60', status: 'ACTIVE' },
    { materialCode: 'FG-REBAR-16', materialName: 'Rebar 16mm ASTM A615 Gr60', materialType: 'FG', baseUnit: 'T', description: 'Deformed bar Grade 60', status: 'ACTIVE' },

    // Plate Products
    { materialCode: 'FG-PLATE-12', materialName: 'Plate 12mm ASTM A36', materialType: 'FG', baseUnit: 'T', description: 'Structural plate A36', status: 'ACTIVE' },
    { materialCode: 'FG-PLATE-25', materialName: 'Plate 25mm ASTM A572-50', materialType: 'FG', baseUnit: 'T', description: 'HSLA plate Grade 50', status: 'ACTIVE' },
];

// ============================================================
// Task 3: PRODUCTS - 25 SKUs with ASTM Specifications
// ============================================================

const PRODUCTS = [
    // Hot Rolled Coils (6)
    { sku: 'PROD-HRC-2.0x1200', productName: 'HR Coil 2.0mm x 1200mm', productCategory: 'Flat - Hot Rolled', baseUnit: 'T', specification: 'ASTM A1011 CS Type B', status: 'ACTIVE' },
    { sku: 'PROD-HRC-2.5x1200', productName: 'HR Coil 2.5mm x 1200mm', productCategory: 'Flat - Hot Rolled', baseUnit: 'T', specification: 'ASTM A1011 CS Type B', status: 'ACTIVE' },
    { sku: 'PROD-HRC-3.0x1500', productName: 'HR Coil 3.0mm x 1500mm', productCategory: 'Flat - Hot Rolled', baseUnit: 'T', specification: 'ASTM A1011 CS Type B', status: 'ACTIVE' },
    { sku: 'PROD-HRC-4.0x1500', productName: 'HR Coil 4.0mm x 1500mm', productCategory: 'Flat - Hot Rolled', baseUnit: 'T', specification: 'ASTM A1011 CS Type B', status: 'ACTIVE' },
    { sku: 'PROD-HRC-5.0x1500', productName: 'HR Coil 5.0mm x 1500mm', productCategory: 'Flat - Hot Rolled', baseUnit: 'T', specification: 'ASTM A1011 SS Grade 36', status: 'ACTIVE' },
    { sku: 'PROD-HRC-6.0x1500', productName: 'HR Coil 6.0mm x 1500mm', productCategory: 'Flat - Hot Rolled', baseUnit: 'T', specification: 'ASTM A1011 SS Grade 36', status: 'ACTIVE' },

    // Cold Rolled Coils (5)
    { sku: 'PROD-CRC-0.6x1000', productName: 'CR Coil 0.6mm x 1000mm', productCategory: 'Flat - Cold Rolled', baseUnit: 'T', specification: 'ASTM A1008 CS Type B', status: 'ACTIVE' },
    { sku: 'PROD-CRC-0.8x1200', productName: 'CR Coil 0.8mm x 1200mm', productCategory: 'Flat - Cold Rolled', baseUnit: 'T', specification: 'ASTM A1008 CS Type B', status: 'ACTIVE' },
    { sku: 'PROD-CRC-1.0x1200', productName: 'CR Coil 1.0mm x 1200mm', productCategory: 'Flat - Cold Rolled', baseUnit: 'T', specification: 'ASTM A1008 CS Type B', status: 'ACTIVE' },
    { sku: 'PROD-CRC-1.2x1200', productName: 'CR Coil 1.2mm x 1200mm', productCategory: 'Flat - Cold Rolled', baseUnit: 'T', specification: 'ASTM A1008 CS Type B', status: 'ACTIVE' },
    { sku: 'PROD-CRC-1.5x1200', productName: 'CR Coil 1.5mm x 1200mm', productCategory: 'Flat - Cold Rolled', baseUnit: 'T', specification: 'ASTM A1008 DS Type B', status: 'ACTIVE' },

    // Galvanized Coils (3)
    { sku: 'PROD-HDG-0.5x1000', productName: 'HDG Coil 0.5mm x 1000mm G90', productCategory: 'Flat - Coated', baseUnit: 'T', specification: 'ASTM A653 CS Type B G90', status: 'ACTIVE' },
    { sku: 'PROD-HDG-0.7x1200', productName: 'HDG Coil 0.7mm x 1200mm G90', productCategory: 'Flat - Coated', baseUnit: 'T', specification: 'ASTM A653 CS Type B G90', status: 'ACTIVE' },
    { sku: 'PROD-HDG-1.0x1200', productName: 'HDG Coil 1.0mm x 1200mm G60', productCategory: 'Flat - Coated', baseUnit: 'T', specification: 'ASTM A653 CS Type B G60', status: 'ACTIVE' },

    // Rebar (5)
    { sku: 'PROD-REBAR-10x12M', productName: 'Rebar 10mm x 12m Grade 60', productCategory: 'Long - Rebar', baseUnit: 'T', specification: 'ASTM A615 Grade 60', status: 'ACTIVE' },
    { sku: 'PROD-REBAR-12x12M', productName: 'Rebar 12mm x 12m Grade 60', productCategory: 'Long - Rebar', baseUnit: 'T', specification: 'ASTM A615 Grade 60', status: 'ACTIVE' },
    { sku: 'PROD-REBAR-16x12M', productName: 'Rebar 16mm x 12m Grade 60', productCategory: 'Long - Rebar', baseUnit: 'T', specification: 'ASTM A615 Grade 60', status: 'ACTIVE' },
    { sku: 'PROD-REBAR-20x12M', productName: 'Rebar 20mm x 12m Grade 60', productCategory: 'Long - Rebar', baseUnit: 'T', specification: 'ASTM A615 Grade 60', status: 'ACTIVE' },
    { sku: 'PROD-REBAR-25x12M', productName: 'Rebar 25mm x 12m Grade 60', productCategory: 'Long - Rebar', baseUnit: 'T', specification: 'ASTM A615 Grade 60', status: 'ACTIVE' },

    // Plates (4)
    { sku: 'PROD-PLATE-10x2000', productName: 'Plate 10mm x 2000mm A36', productCategory: 'Heavy Plate', baseUnit: 'T', specification: 'ASTM A36', status: 'ACTIVE' },
    { sku: 'PROD-PLATE-12x2000', productName: 'Plate 12mm x 2000mm A36', productCategory: 'Heavy Plate', baseUnit: 'T', specification: 'ASTM A36', status: 'ACTIVE' },
    { sku: 'PROD-PLATE-16x2400', productName: 'Plate 16mm x 2400mm A572-50', productCategory: 'Heavy Plate', baseUnit: 'T', specification: 'ASTM A572 Grade 50', status: 'ACTIVE' },
    { sku: 'PROD-PLATE-25x2400', productName: 'Plate 25mm x 2400mm A572-50', productCategory: 'Heavy Plate', baseUnit: 'T', specification: 'ASTM A572 Grade 50', status: 'ACTIVE' },

    // Semis (2)
    { sku: 'PROD-BILLET-130', productName: 'Steel Billet 130mm sq', productCategory: 'Semis', baseUnit: 'T', specification: 'SAE 1018 Equivalent', status: 'ACTIVE' },
    { sku: 'PROD-SLAB-200', productName: 'Steel Slab 200x1200mm', productCategory: 'Semis', baseUnit: 'T', specification: 'Low Carbon Steel', status: 'ACTIVE' },
];

// ============================================================
// Task 4: EQUIPMENT - 18 Units
// ============================================================

const EQUIPMENT = [
    // Melt Shop (5)
    { equipmentCode: 'EAF-101', name: 'Electric Arc Furnace #1', equipmentType: 'BATCH', capacity: 150, capacityUnit: 'T/heat', location: 'Melt Shop Bay 1', status: 'AVAILABLE' },
    { equipmentCode: 'EAF-102', name: 'Electric Arc Furnace #2', equipmentType: 'BATCH', capacity: 150, capacityUnit: 'T/heat', location: 'Melt Shop Bay 2', status: 'AVAILABLE' },
    { equipmentCode: 'LF-101', name: 'Ladle Furnace #1', equipmentType: 'BATCH', capacity: 150, capacityUnit: 'T/heat', location: 'Melt Shop LF Area', status: 'AVAILABLE' },
    { equipmentCode: 'LF-102', name: 'Ladle Furnace #2', equipmentType: 'BATCH', capacity: 150, capacityUnit: 'T/heat', location: 'Melt Shop LF Area', status: 'AVAILABLE' },
    { equipmentCode: 'VD-101', name: 'Vacuum Degasser', equipmentType: 'BATCH', capacity: 150, capacityUnit: 'T/heat', location: 'Melt Shop VD Area', status: 'AVAILABLE' },

    // Casting (2)
    { equipmentCode: 'CCM-101', name: 'Slab Caster #1 (2-Strand)', equipmentType: 'CONTINUOUS', capacity: 2400000, capacityUnit: 'T/Y', location: 'Caster Bay', status: 'AVAILABLE' },
    { equipmentCode: 'CCM-102', name: 'Billet Caster (6-Strand)', equipmentType: 'CONTINUOUS', capacity: 1200000, capacityUnit: 'T/Y', location: 'Caster Bay', status: 'AVAILABLE' },

    // Hot Rolling (3)
    { equipmentCode: 'RHF-101', name: 'Slab Reheat Furnace', equipmentType: 'CONTINUOUS', capacity: 300, capacityUnit: 'T/hr', location: 'HSM Entry', status: 'AVAILABLE' },
    { equipmentCode: 'HSM-101', name: 'Hot Strip Mill', equipmentType: 'CONTINUOUS', capacity: 4000000, capacityUnit: 'T/Y', location: 'Hot Mill', status: 'AVAILABLE' },
    { equipmentCode: 'PM-101', name: 'Plate Mill', equipmentType: 'CONTINUOUS', capacity: 1000000, capacityUnit: 'T/Y', location: 'Plate Mill', status: 'AVAILABLE' },

    // Cold Rolling (4)
    { equipmentCode: 'PCKL-101', name: 'Pickling Line #1', equipmentType: 'CONTINUOUS', capacity: 1500000, capacityUnit: 'T/Y', location: 'Cold Mill Entry', status: 'AVAILABLE' },
    { equipmentCode: 'CRM-101', name: 'Cold Rolling Mill #1 (5-Stand Tandem)', equipmentType: 'CONTINUOUS', capacity: 1000000, capacityUnit: 'T/Y', location: 'Cold Mill', status: 'AVAILABLE' },
    { equipmentCode: 'CAL-101', name: 'Continuous Annealing Line', equipmentType: 'CONTINUOUS', capacity: 600000, capacityUnit: 'T/Y', location: 'Cold Mill', status: 'AVAILABLE' },
    { equipmentCode: 'CGL-101', name: 'Continuous Galvanizing Line', equipmentType: 'CONTINUOUS', capacity: 500000, capacityUnit: 'T/Y', location: 'Coating Line', status: 'AVAILABLE' },

    // Long Products (2)
    { equipmentCode: 'BRM-101', name: 'Bar Rolling Mill', equipmentType: 'CONTINUOUS', capacity: 1000000, capacityUnit: 'T/Y', location: 'Bar Mill', status: 'AVAILABLE' },
    { equipmentCode: 'WRM-101', name: 'Wire Rod Mill', equipmentType: 'CONTINUOUS', capacity: 500000, capacityUnit: 'T/Y', location: 'Wire Rod Mill', status: 'AVAILABLE' },

    // Finishing (2)
    { equipmentCode: 'CTL-101', name: 'Cut-to-Length Line #1', equipmentType: 'CONTINUOUS', capacity: 300000, capacityUnit: 'T/Y', location: 'Finishing Bay', status: 'AVAILABLE' },
    { equipmentCode: 'SLT-101', name: 'Slitting Line #1', equipmentType: 'CONTINUOUS', capacity: 200000, capacityUnit: 'T/Y', location: 'Finishing Bay', status: 'AVAILABLE' },
];

// ============================================================
// Task 5: OPERATORS - 15 People
// ============================================================

const OPERATORS = [
    // Melt Shop (4)
    { operatorCode: 'OP-MS-001', name: 'Michael Chen', department: 'Melt Shop', shift: 'DAY', status: 'ACTIVE' },
    { operatorCode: 'OP-MS-002', name: 'James Rodriguez', department: 'Melt Shop', shift: 'DAY', status: 'ACTIVE' },
    { operatorCode: 'OP-MS-003', name: 'Robert Williams', department: 'Melt Shop', shift: 'NIGHT', status: 'ACTIVE' },
    { operatorCode: 'OP-MS-004', name: 'David Martinez', department: 'Melt Shop', shift: 'NIGHT', status: 'ACTIVE' },

    // Caster (2)
    { operatorCode: 'OP-CC-001', name: 'William Johnson', department: 'Caster', shift: 'DAY', status: 'ACTIVE' },
    { operatorCode: 'OP-CC-002', name: 'Thomas Anderson', department: 'Caster', shift: 'NIGHT', status: 'ACTIVE' },

    // Hot Rolling (2)
    { operatorCode: 'OP-HR-001', name: 'Christopher Lee', department: 'Hot Rolling', shift: 'DAY', status: 'ACTIVE' },
    { operatorCode: 'OP-HR-002', name: 'Daniel Garcia', department: 'Hot Rolling', shift: 'NIGHT', status: 'ACTIVE' },

    // Cold Rolling (2)
    { operatorCode: 'OP-CR-001', name: 'Matthew Taylor', department: 'Cold Rolling', shift: 'DAY', status: 'ACTIVE' },
    { operatorCode: 'OP-CR-002', name: 'Anthony Brown', department: 'Cold Rolling', shift: 'NIGHT', status: 'ACTIVE' },

    // Bar Mill (2)
    { operatorCode: 'OP-BM-001', name: 'Joseph Wilson', department: 'Bar Mill', shift: 'DAY', status: 'ACTIVE' },
    { operatorCode: 'OP-BM-002', name: 'Kevin Thompson', department: 'Bar Mill', shift: 'NIGHT', status: 'ACTIVE' },

    // Finishing (1)
    { operatorCode: 'OP-FN-001', name: 'Brian Davis', department: 'Finishing', shift: 'DAY', status: 'ACTIVE' },

    // Quality Control (2)
    { operatorCode: 'OP-QC-001', name: 'Steven Clark', department: 'Quality Control', shift: 'DAY', status: 'ACTIVE' },
    { operatorCode: 'OP-QC-002', name: 'Paul Robinson', department: 'Quality Control', shift: 'NIGHT', status: 'ACTIVE' },
];

// ============================================================
// Task 6: PROCESSES AND ROUTINGS - 15 Processes
// ============================================================

const PROCESSES = [
    // Steelmaking (2)
    {
        processCode: 'PROC-EAF-STD',
        processName: 'EAF Melting - Standard',
        description: 'Electric Arc Furnace melting for carbon steel',
        operationType: 'MELTING',
        yieldRatio: 0.95,
        steps: [
            { sequence: 1, stepName: 'Charge Preparation', operationType: 'CHARGING', duration: 30, description: 'Load scrap and DRI' },
            { sequence: 2, stepName: 'Melting', operationType: 'MELTING', duration: 50, description: 'Arc melting to 1580C' },
            { sequence: 3, stepName: 'Refining', operationType: 'REFINING', duration: 20, description: 'O2 blow and decarb' },
            { sequence: 4, stepName: 'Tapping', operationType: 'TAPPING', duration: 8, description: 'Tap to ladle' }
        ]
    },
    {
        processCode: 'PROC-LRF-STD',
        processName: 'Ladle Refining - Standard',
        description: 'Ladle Furnace treatment for chemistry trim',
        operationType: 'REFINING',
        yieldRatio: 0.99,
        steps: [
            { sequence: 1, stepName: 'Arc Heating', operationType: 'HEATING', duration: 15, description: 'Superheat for casting' },
            { sequence: 2, stepName: 'Alloying', operationType: 'ALLOYING', duration: 10, description: 'Add ferroalloys' },
            { sequence: 3, stepName: 'Desulfurization', operationType: 'DESULFURIZATION', duration: 15, description: 'CaSi injection' },
            { sequence: 4, stepName: 'Final Chemistry', operationType: 'CHEMISTRY', duration: 10, description: 'Sample and trim' }
        ]
    },

    // Casting (2)
    {
        processCode: 'PROC-SLAB-CAST',
        processName: 'Slab Continuous Casting',
        description: 'Continuous casting of 200mm thick slabs',
        operationType: 'CASTING',
        yieldRatio: 0.97,
        steps: [
            { sequence: 1, stepName: 'Ladle Turret', operationType: 'SETUP', duration: 5, description: 'Position ladle' },
            { sequence: 2, stepName: 'Sequence Casting', operationType: 'CASTING', duration: 75, description: '2-strand slab casting' },
            { sequence: 3, stepName: 'Torch Cutting', operationType: 'CUTTING', duration: 2, description: 'Cut to length' }
        ]
    },
    {
        processCode: 'PROC-BILLET-CAST',
        processName: 'Billet Continuous Casting',
        description: 'Continuous casting of 130mm square billets',
        operationType: 'CASTING',
        yieldRatio: 0.96,
        steps: [
            { sequence: 1, stepName: 'Ladle Turret', operationType: 'SETUP', duration: 5, description: 'Position ladle' },
            { sequence: 2, stepName: 'Multi-Strand Cast', operationType: 'CASTING', duration: 60, description: '6-strand billet casting' },
            { sequence: 3, stepName: 'Flying Shear', operationType: 'CUTTING', duration: 1, description: 'Cut billets' }
        ]
    },

    // Hot Rolling (3)
    {
        processCode: 'PROC-HR-COIL',
        processName: 'HR Coil Rolling',
        description: 'Hot rolling of coils from slabs',
        operationType: 'ROLLING',
        yieldRatio: 0.97,
        steps: [
            { sequence: 1, stepName: 'Slab Reheat', operationType: 'REHEATING', duration: 120, description: 'Reheat to 1250C' },
            { sequence: 2, stepName: 'Roughing Mill', operationType: 'ROUGHING', duration: 3, description: 'R1-R2 reversing' },
            { sequence: 3, stepName: 'Finishing Mill', operationType: 'FINISHING', duration: 2, description: 'F1-F6 tandem' },
            { sequence: 4, stepName: 'Run-out Cooling', operationType: 'COOLING', duration: 8, description: 'Laminar cooling' },
            { sequence: 5, stepName: 'Coiling', operationType: 'COILING', duration: 2, description: 'Down coiler' }
        ]
    },
    {
        processCode: 'PROC-PLATE-ROLL',
        processName: 'Plate Rolling',
        description: 'Heavy plate rolling from slabs',
        operationType: 'ROLLING',
        yieldRatio: 0.95,
        steps: [
            { sequence: 1, stepName: 'Slab Reheat', operationType: 'REHEATING', duration: 180, description: 'Reheat thick slab' },
            { sequence: 2, stepName: 'Broadside/Length', operationType: 'ROUGHING', duration: 10, description: 'Width and length passes' },
            { sequence: 3, stepName: 'Finish Rolling', operationType: 'FINISHING', duration: 5, description: 'Final thickness' },
            { sequence: 4, stepName: 'Hot Leveling', operationType: 'LEVELING', duration: 3, description: 'Flatness control' },
            { sequence: 5, stepName: 'Cooling Bed', operationType: 'COOLING', duration: 45, description: 'Air cooling' }
        ]
    },
    {
        processCode: 'PROC-REBAR-ROLL',
        processName: 'Rebar Rolling',
        description: 'Rebar rolling from billets',
        operationType: 'ROLLING',
        yieldRatio: 0.97,
        steps: [
            { sequence: 1, stepName: 'Billet Reheat', operationType: 'REHEATING', duration: 90, description: 'Walking beam furnace' },
            { sequence: 2, stepName: 'Roughing Stands', operationType: 'ROUGHING', duration: 2, description: 'Stands 1-6' },
            { sequence: 3, stepName: 'Intermediate', operationType: 'INTERMEDIATE', duration: 2, description: 'Stands 7-12' },
            { sequence: 4, stepName: 'Finishing Block', operationType: 'FINISHING', duration: 1, description: '2-roll finishing' },
            { sequence: 5, stepName: 'Quench/Temper', operationType: 'COOLING', duration: 3, description: 'Thermex treatment' },
            { sequence: 6, stepName: 'Cooling Bed', operationType: 'COOLING', duration: 20, description: 'Air cooling' },
            { sequence: 7, stepName: 'Bundling', operationType: 'BUNDLING', duration: 5, description: 'Cold shear & bundle' }
        ]
    },

    // Cold Rolling (3)
    {
        processCode: 'PROC-PICKLE',
        processName: 'Pickling',
        description: 'Acid cleaning of HR coils',
        operationType: 'PICKLING',
        yieldRatio: 0.99,
        steps: [
            { sequence: 1, stepName: 'Uncoil', operationType: 'UNCOILING', duration: 3, description: 'Entry uncoiler' },
            { sequence: 2, stepName: 'Scale Breaker', operationType: 'DESCALING', duration: 1, description: 'Tension leveling' },
            { sequence: 3, stepName: 'Acid Tanks', operationType: 'PICKLING', duration: 15, description: 'HCl pickle tanks' },
            { sequence: 4, stepName: 'Rinse/Dry', operationType: 'RINSING', duration: 5, description: 'Hot water rinse' },
            { sequence: 5, stepName: 'Recoil', operationType: 'COILING', duration: 3, description: 'Exit coiler' }
        ]
    },
    {
        processCode: 'PROC-COLD-ROLL',
        processName: 'Cold Rolling',
        description: 'Tandem cold reduction rolling',
        operationType: 'COLD_ROLLING',
        yieldRatio: 0.96,
        steps: [
            { sequence: 1, stepName: 'Entry Section', operationType: 'UNCOILING', duration: 3, description: 'Uncoil P&O' },
            { sequence: 2, stepName: 'Tandem Mill', operationType: 'COLD_ROLLING', duration: 20, description: '5-stand reduction' },
            { sequence: 3, stepName: 'Exit Section', operationType: 'COILING', duration: 3, description: 'Full hard coil' }
        ]
    },
    {
        processCode: 'PROC-ANNEAL',
        processName: 'Continuous Annealing',
        description: 'CAL processing of cold rolled coils',
        operationType: 'ANNEALING',
        yieldRatio: 0.99,
        steps: [
            { sequence: 1, stepName: 'Entry', operationType: 'UNCOILING', duration: 2, description: 'Uncoil and weld' },
            { sequence: 2, stepName: 'Heating', operationType: 'HEATING', duration: 3, description: 'Heat to 800C' },
            { sequence: 3, stepName: 'Soaking', operationType: 'SOAKING', duration: 2, description: 'Hold at temp' },
            { sequence: 4, stepName: 'Cooling', operationType: 'COOLING', duration: 3, description: 'Jet cooling' },
            { sequence: 5, stepName: 'Temper Mill', operationType: 'TEMPER_ROLLING', duration: 2, description: 'Skin pass' },
            { sequence: 6, stepName: 'Exit', operationType: 'COILING', duration: 2, description: 'Shear and coil' }
        ]
    },

    // Coating (1)
    {
        processCode: 'PROC-GALVANIZE',
        processName: 'Hot Dip Galvanizing',
        description: 'CGL zinc coating of cold rolled coils',
        operationType: 'COATING',
        yieldRatio: 0.98,
        steps: [
            { sequence: 1, stepName: 'Entry', operationType: 'UNCOILING', duration: 2, description: 'Uncoil and weld' },
            { sequence: 2, stepName: 'Cleaning', operationType: 'CLEANING', duration: 3, description: 'Alkaline clean' },
            { sequence: 3, stepName: 'Anneal', operationType: 'ANNEALING', duration: 4, description: 'In-line anneal' },
            { sequence: 4, stepName: 'Zinc Pot', operationType: 'COATING', duration: 1, description: '460C zinc dip' },
            { sequence: 5, stepName: 'Air Knife', operationType: 'COATING', duration: 1, description: 'Coat weight' },
            { sequence: 6, stepName: 'Cooling', operationType: 'COOLING', duration: 2, description: 'Air cooling' },
            { sequence: 7, stepName: 'Temper/Exit', operationType: 'COILING', duration: 2, description: 'SPM and coil' }
        ]
    },

    // Integrated Routes (3)
    {
        processCode: 'PROC-HR-COMPLETE',
        processName: 'HR Coil - Complete Route',
        description: 'Full route from scrap to HR coil',
        operationType: 'INTEGRATED',
        yieldRatio: 0.89,
        steps: [
            { sequence: 1, stepName: 'EAF Melting', operationType: 'MELTING', duration: 55, description: 'Melt to liquid steel' },
            { sequence: 2, stepName: 'Ladle Treatment', operationType: 'REFINING', duration: 35, description: 'LRF + degassing' },
            { sequence: 3, stepName: 'Slab Casting', operationType: 'CASTING', duration: 75, description: 'CC slab' },
            { sequence: 4, stepName: 'Hot Rolling', operationType: 'ROLLING', duration: 135, description: 'Reheat+HSM' }
        ]
    },
    {
        processCode: 'PROC-CR-COMPLETE',
        processName: 'CR Sheet - Complete Route',
        description: 'Full route from scrap to CR sheet',
        operationType: 'INTEGRATED',
        yieldRatio: 0.82,
        steps: [
            { sequence: 1, stepName: 'EAF Melting', operationType: 'MELTING', duration: 55, description: 'Melt' },
            { sequence: 2, stepName: 'Ladle Treatment', operationType: 'REFINING', duration: 35, description: 'LRF' },
            { sequence: 3, stepName: 'Slab Casting', operationType: 'CASTING', duration: 75, description: 'CC' },
            { sequence: 4, stepName: 'Hot Rolling', operationType: 'ROLLING', duration: 135, description: 'HSM' },
            { sequence: 5, stepName: 'Pickling', operationType: 'PICKLING', duration: 30, description: 'P&O line' },
            { sequence: 6, stepName: 'Cold Rolling', operationType: 'COLD_ROLLING', duration: 30, description: 'Tandem' },
            { sequence: 7, stepName: 'Annealing', operationType: 'ANNEALING', duration: 20, description: 'CAL' }
        ]
    },
    {
        processCode: 'PROC-REBAR-COMPLETE',
        processName: 'Rebar - Complete Route',
        description: 'Full route from scrap to bundled rebar',
        operationType: 'INTEGRATED',
        yieldRatio: 0.88,
        steps: [
            { sequence: 1, stepName: 'EAF Melting', operationType: 'MELTING', duration: 55, description: 'Melt' },
            { sequence: 2, stepName: 'Ladle Treatment', operationType: 'REFINING', duration: 25, description: 'LRF lite' },
            { sequence: 3, stepName: 'Billet Casting', operationType: 'CASTING', duration: 60, description: 'CC billet' },
            { sequence: 4, stepName: 'Bar Rolling', operationType: 'ROLLING', duration: 120, description: 'Bar mill' }
        ]
    },
];

// Product to Process Mapping
const PRODUCT_PROCESS_MAP = {
    // HR Coils -> HR Complete
    'PROD-HRC-2.0x1200': 'PROC-HR-COMPLETE',
    'PROD-HRC-2.5x1200': 'PROC-HR-COMPLETE',
    'PROD-HRC-3.0x1500': 'PROC-HR-COMPLETE',
    'PROD-HRC-4.0x1500': 'PROC-HR-COMPLETE',
    'PROD-HRC-5.0x1500': 'PROC-HR-COMPLETE',
    'PROD-HRC-6.0x1500': 'PROC-HR-COMPLETE',

    // CR Coils -> CR Complete
    'PROD-CRC-0.6x1000': 'PROC-CR-COMPLETE',
    'PROD-CRC-0.8x1200': 'PROC-CR-COMPLETE',
    'PROD-CRC-1.0x1200': 'PROC-CR-COMPLETE',
    'PROD-CRC-1.2x1200': 'PROC-CR-COMPLETE',
    'PROD-CRC-1.5x1200': 'PROC-CR-COMPLETE',

    // HDG -> Galvanize (needs CR first)
    'PROD-HDG-0.5x1000': 'PROC-GALVANIZE',
    'PROD-HDG-0.7x1200': 'PROC-GALVANIZE',
    'PROD-HDG-1.0x1200': 'PROC-GALVANIZE',

    // Rebar -> Rebar Complete
    'PROD-REBAR-10x12M': 'PROC-REBAR-COMPLETE',
    'PROD-REBAR-12x12M': 'PROC-REBAR-COMPLETE',
    'PROD-REBAR-16x12M': 'PROC-REBAR-COMPLETE',
    'PROD-REBAR-20x12M': 'PROC-REBAR-COMPLETE',
    'PROD-REBAR-25x12M': 'PROC-REBAR-COMPLETE',

    // Plates -> Plate Roll
    'PROD-PLATE-10x2000': 'PROC-PLATE-ROLL',
    'PROD-PLATE-12x2000': 'PROC-PLATE-ROLL',
    'PROD-PLATE-16x2400': 'PROC-PLATE-ROLL',
    'PROD-PLATE-25x2400': 'PROC-PLATE-ROLL',

    // Semis -> Casting
    'PROD-BILLET-130': 'PROC-BILLET-CAST',
    'PROD-SLAB-200': 'PROC-SLAB-CAST',
};

// ============================================================
// Task 7: ORDERS - 30 Customer Orders
// ============================================================

const ORDERS = [
    // General Motors - Cold Rolled & Galvanized for auto bodies
    { customerCode: 'CUST-GM', items: [
        { sku: 'PROD-CRC-0.8x1200', qty: 800 },
        { sku: 'PROD-CRC-1.0x1200', qty: 600 },
        { sku: 'PROD-HDG-0.7x1200', qty: 500 }
    ]},
    { customerCode: 'CUST-GM', items: [
        { sku: 'PROD-HDG-0.5x1000', qty: 400 },
        { sku: 'PROD-CRC-0.6x1000', qty: 300 }
    ]},

    // Ford - Similar to GM
    { customerCode: 'CUST-FORD', items: [
        { sku: 'PROD-CRC-0.8x1200', qty: 900 },
        { sku: 'PROD-HDG-0.7x1200', qty: 700 }
    ]},
    { customerCode: 'CUST-FORD', items: [
        { sku: 'PROD-HRC-2.0x1200', qty: 500 },
        { sku: 'PROD-CRC-1.2x1200', qty: 400 }
    ]},

    // Toyota - Cold rolled focus
    { customerCode: 'CUST-TOYOTA', items: [
        { sku: 'PROD-CRC-0.8x1200', qty: 600 },
        { sku: 'PROD-CRC-1.0x1200', qty: 500 },
        { sku: 'PROD-HDG-1.0x1200', qty: 400 }
    ]},

    // Caterpillar - Heavy plates
    { customerCode: 'CUST-CAT', items: [
        { sku: 'PROD-PLATE-16x2400', qty: 300 },
        { sku: 'PROD-PLATE-25x2400', qty: 250 }
    ]},
    { customerCode: 'CUST-CAT', items: [
        { sku: 'PROD-PLATE-12x2000', qty: 400 },
        { sku: 'PROD-HRC-5.0x1500', qty: 200 }
    ]},

    // John Deere - Plates and HR
    { customerCode: 'CUST-DEERE', items: [
        { sku: 'PROD-PLATE-10x2000', qty: 250 },
        { sku: 'PROD-PLATE-12x2000', qty: 200 },
        { sku: 'PROD-HRC-4.0x1500', qty: 300 }
    ]},

    // Turner Construction - Rebar heavy
    { customerCode: 'CUST-TURNER', items: [
        { sku: 'PROD-REBAR-10x12M', qty: 1500 },
        { sku: 'PROD-REBAR-12x12M', qty: 1200 },
        { sku: 'PROD-REBAR-16x12M', qty: 800 }
    ]},
    { customerCode: 'CUST-TURNER', items: [
        { sku: 'PROD-REBAR-20x12M', qty: 600 },
        { sku: 'PROD-REBAR-25x12M', qty: 400 }
    ]},

    // Bechtel - Infrastructure plates
    { customerCode: 'CUST-BECHTEL', items: [
        { sku: 'PROD-PLATE-16x2400', qty: 500 },
        { sku: 'PROD-PLATE-25x2400', qty: 400 }
    ]},
    { customerCode: 'CUST-BECHTEL', items: [
        { sku: 'PROD-REBAR-16x12M', qty: 1000 },
        { sku: 'PROD-REBAR-20x12M', qty: 800 }
    ]},

    // Nucor Building Systems - HR Coils
    { customerCode: 'CUST-NUCOR-BS', items: [
        { sku: 'PROD-HRC-2.0x1200', qty: 600 },
        { sku: 'PROD-HRC-2.5x1200', qty: 500 },
        { sku: 'PROD-HRC-3.0x1500', qty: 400 }
    ]},

    // Tenaris - Billets for pipe
    { customerCode: 'CUST-TENARIS', items: [
        { sku: 'PROD-BILLET-130', qty: 2000 }
    ]},
    { customerCode: 'CUST-TENARIS', items: [
        { sku: 'PROD-PLATE-16x2400', qty: 600 }
    ]},

    // Olympic Steel - Distribution mix
    { customerCode: 'CUST-OLYMPIC', items: [
        { sku: 'PROD-HRC-3.0x1500', qty: 300 },
        { sku: 'PROD-HRC-4.0x1500', qty: 250 },
        { sku: 'PROD-PLATE-10x2000', qty: 200 }
    ]},
    { customerCode: 'CUST-OLYMPIC', items: [
        { sku: 'PROD-CRC-1.0x1200', qty: 350 },
        { sku: 'PROD-CRC-1.2x1200', qty: 300 }
    ]},

    // Reliance Steel - Wide variety
    { customerCode: 'CUST-RELIANCE', items: [
        { sku: 'PROD-HRC-2.0x1200', qty: 400 },
        { sku: 'PROD-CRC-0.8x1200', qty: 300 },
        { sku: 'PROD-PLATE-12x2000', qty: 250 }
    ]},
    { customerCode: 'CUST-RELIANCE', items: [
        { sku: 'PROD-HDG-0.7x1200', qty: 350 },
        { sku: 'PROD-REBAR-12x12M', qty: 500 }
    ]},

    // Ryerson - Processing
    { customerCode: 'CUST-RYERSON', items: [
        { sku: 'PROD-HRC-4.0x1500', qty: 300 },
        { sku: 'PROD-HRC-5.0x1500', qty: 250 },
        { sku: 'PROD-CRC-1.5x1200', qty: 200 }
    ]},

    // Metal Supermarkets - Small lots
    { customerCode: 'CUST-MSC', items: [
        { sku: 'PROD-PLATE-10x2000', qty: 50 },
        { sku: 'PROD-PLATE-12x2000', qty: 50 },
        { sku: 'PROD-HRC-3.0x1500', qty: 30 }
    ]},

    // ThyssenKrupp - Export
    { customerCode: 'CUST-TKM', items: [
        { sku: 'PROD-CRC-0.8x1200', qty: 500 },
        { sku: 'PROD-CRC-1.0x1200', qty: 400 },
        { sku: 'PROD-HDG-0.7x1200', qty: 350 }
    ]},
    { customerCode: 'CUST-TKM', items: [
        { sku: 'PROD-SLAB-200', qty: 1500 }
    ]},

    // SSAB Americas - Specialty
    { customerCode: 'CUST-SSAB', items: [
        { sku: 'PROD-PLATE-25x2400', qty: 300 }
    ]},
    { customerCode: 'CUST-SSAB', items: [
        { sku: 'PROD-HRC-6.0x1500', qty: 400 },
        { sku: 'PROD-HRC-5.0x1500', qty: 350 }
    ]},

    // Additional orders to reach 30
    { customerCode: 'CUST-GM', items: [
        { sku: 'PROD-CRC-1.0x1200', qty: 550 }
    ]},
    { customerCode: 'CUST-FORD', items: [
        { sku: 'PROD-HDG-0.5x1000', qty: 450 }
    ]},
    { customerCode: 'CUST-TURNER', items: [
        { sku: 'PROD-REBAR-16x12M', qty: 700 }
    ]},
];

// ============================================================
// Task 8: RAW MATERIAL RECEIPTS - 60+ Batches
// ============================================================

const RAW_MATERIAL_RECEIPTS = [
    // HMS1 Scrap - Premium (10 batches)
    { materialCode: 'RM-HMS1A', qty: 520, unit: 'T', supplierId: 'SUP-OmniSource', notes: 'Premium HMS1 Grade A - Week 1' },
    { materialCode: 'RM-HMS1A', qty: 480, unit: 'T', supplierId: 'SUP-OmniSource', notes: 'Premium HMS1 Grade A - Week 2' },
    { materialCode: 'RM-HMS1A', qty: 550, unit: 'T', supplierId: 'SUP-Sims', notes: 'Premium HMS1 - Shipment 1' },
    { materialCode: 'RM-HMS1A', qty: 510, unit: 'T', supplierId: 'SUP-Sims', notes: 'Premium HMS1 - Shipment 2' },
    { materialCode: 'RM-HMS1B', qty: 600, unit: 'T', supplierId: 'SUP-OmniSource', notes: 'HMS1 Standard - Week 1' },
    { materialCode: 'RM-HMS1B', qty: 580, unit: 'T', supplierId: 'SUP-OmniSource', notes: 'HMS1 Standard - Week 2' },
    { materialCode: 'RM-HMS1B', qty: 620, unit: 'T', supplierId: 'SUP-CMC', notes: 'HMS1 Standard - CMC' },
    { materialCode: 'RM-HMS1B', qty: 590, unit: 'T', supplierId: 'SUP-CMC', notes: 'HMS1 Standard - CMC 2' },
    { materialCode: 'RM-HMS1A', qty: 500, unit: 'T', supplierId: 'SUP-Nucor', notes: 'Premium from Nucor' },
    { materialCode: 'RM-HMS1B', qty: 560, unit: 'T', supplierId: 'SUP-Nucor', notes: 'Standard from Nucor' },

    // HMS2 Scrap (8 batches)
    { materialCode: 'RM-HMS2', qty: 700, unit: 'T', supplierId: 'SUP-OmniSource', notes: 'HMS2 - Week 1' },
    { materialCode: 'RM-HMS2', qty: 680, unit: 'T', supplierId: 'SUP-OmniSource', notes: 'HMS2 - Week 2' },
    { materialCode: 'RM-HMS2', qty: 720, unit: 'T', supplierId: 'SUP-Sims', notes: 'HMS2 from Sims' },
    { materialCode: 'RM-HMS2', qty: 650, unit: 'T', supplierId: 'SUP-Sims', notes: 'HMS2 from Sims 2' },
    { materialCode: 'RM-HMS2', qty: 690, unit: 'T', supplierId: 'SUP-CMC', notes: 'HMS2 CMC shipment' },
    { materialCode: 'RM-HMS2', qty: 670, unit: 'T', supplierId: 'SUP-CMC', notes: 'HMS2 CMC shipment 2' },
    { materialCode: 'RM-HMS2', qty: 710, unit: 'T', supplierId: 'SUP-Nucor', notes: 'HMS2 Nucor' },
    { materialCode: 'RM-HMS2', qty: 640, unit: 'T', supplierId: 'SUP-Nucor', notes: 'HMS2 Nucor 2' },

    // Shredded & Busheling (6 batches)
    { materialCode: 'RM-SHRED', qty: 450, unit: 'T', supplierId: 'SUP-Auto-Shred', notes: 'Auto body shred - Batch 1' },
    { materialCode: 'RM-SHRED', qty: 480, unit: 'T', supplierId: 'SUP-Auto-Shred', notes: 'Auto body shred - Batch 2' },
    { materialCode: 'RM-SHRED', qty: 420, unit: 'T', supplierId: 'SUP-Sims', notes: 'Shredded from Sims' },
    { materialCode: 'RM-BUSHEL', qty: 300, unit: 'T', supplierId: 'SUP-Auto-Stamp', notes: 'Busheling - stamping plant' },
    { materialCode: 'RM-BUSHEL', qty: 280, unit: 'T', supplierId: 'SUP-Auto-Stamp', notes: 'Busheling - stamping 2' },
    { materialCode: 'RM-BUSHEL', qty: 320, unit: 'T', supplierId: 'SUP-Auto-Stamp', notes: 'Busheling - stamping 3' },

    // Iron Units (6 batches)
    { materialCode: 'RM-PIG-IRON', qty: 200, unit: 'T', supplierId: 'SUP-Cleveland-Cliffs', notes: 'Pig iron - CCI' },
    { materialCode: 'RM-PIG-IRON', qty: 180, unit: 'T', supplierId: 'SUP-Cleveland-Cliffs', notes: 'Pig iron - CCI 2' },
    { materialCode: 'RM-PIG-IRON', qty: 220, unit: 'T', supplierId: 'SUP-Nucor-DRI', notes: 'Pig from Nucor' },
    { materialCode: 'RM-HBI', qty: 350, unit: 'T', supplierId: 'SUP-Nucor-DRI', notes: 'HBI - Nucor DRI' },
    { materialCode: 'RM-HBI', qty: 320, unit: 'T', supplierId: 'SUP-Nucor-DRI', notes: 'HBI - Nucor DRI 2' },
    { materialCode: 'RM-HBI', qty: 380, unit: 'T', supplierId: 'SUP-Voestalpine', notes: 'HBI - Voest Texas' },

    // Ferroalloys (14 batches)
    { materialCode: 'RM-FESI-75', qty: 5000, unit: 'KG', supplierId: 'SUP-Eramet', notes: 'FeSi 75% - Bulk 1' },
    { materialCode: 'RM-FESI-75', qty: 4800, unit: 'KG', supplierId: 'SUP-Eramet', notes: 'FeSi 75% - Bulk 2' },
    { materialCode: 'RM-FESI-75', qty: 5200, unit: 'KG', supplierId: 'SUP-Globe', notes: 'FeSi 75% - Globe' },
    { materialCode: 'RM-SIMN-65', qty: 6000, unit: 'KG', supplierId: 'SUP-Eramet', notes: 'SiMn 65/17 - Bulk' },
    { materialCode: 'RM-SIMN-65', qty: 5500, unit: 'KG', supplierId: 'SUP-Eramet', notes: 'SiMn 65/17 - Bulk 2' },
    { materialCode: 'RM-FEMN-HC', qty: 8000, unit: 'KG', supplierId: 'SUP-Eramet', notes: 'FeMn HC - Bulk' },
    { materialCode: 'RM-FEMN-HC', qty: 7500, unit: 'KG', supplierId: 'SUP-Eramet', notes: 'FeMn HC - Bulk 2' },
    { materialCode: 'RM-FEMN-MC', qty: 4000, unit: 'KG', supplierId: 'SUP-Globe', notes: 'FeMn MC drums' },
    { materialCode: 'RM-FEMN-MC', qty: 3500, unit: 'KG', supplierId: 'SUP-Globe', notes: 'FeMn MC drums 2' },
    { materialCode: 'RM-FECR-LC', qty: 3000, unit: 'KG', supplierId: 'SUP-Samancor', notes: 'FeCr LC bags' },
    { materialCode: 'RM-FECR-LC', qty: 2800, unit: 'KG', supplierId: 'SUP-Samancor', notes: 'FeCr LC bags 2' },
    { materialCode: 'RM-AL-WIRE', qty: 2500, unit: 'KG', supplierId: 'SUP-Affival', notes: 'Al wire coils' },
    { materialCode: 'RM-AL-WIRE', qty: 2200, unit: 'KG', supplierId: 'SUP-Affival', notes: 'Al wire coils 2' },
    { materialCode: 'RM-CASI-WIRE', qty: 1800, unit: 'KG', supplierId: 'SUP-Affival', notes: 'CaSi cored wire' },

    // Flux Materials (10 batches)
    { materialCode: 'RM-LIME', qty: 120, unit: 'T', supplierId: 'SUP-Lhoist', notes: 'Calcined lime truck 1' },
    { materialCode: 'RM-LIME', qty: 100, unit: 'T', supplierId: 'SUP-Lhoist', notes: 'Calcined lime truck 2' },
    { materialCode: 'RM-LIME', qty: 110, unit: 'T', supplierId: 'SUP-Lhoist', notes: 'Calcined lime truck 3' },
    { materialCode: 'RM-LIME', qty: 115, unit: 'T', supplierId: 'SUP-Graymont', notes: 'Lime from Graymont' },
    { materialCode: 'RM-LIME', qty: 105, unit: 'T', supplierId: 'SUP-Graymont', notes: 'Lime from Graymont 2' },
    { materialCode: 'RM-DOLIME', qty: 80, unit: 'T', supplierId: 'SUP-Lhoist', notes: 'Dolomite truck 1' },
    { materialCode: 'RM-DOLIME', qty: 75, unit: 'T', supplierId: 'SUP-Lhoist', notes: 'Dolomite truck 2' },
    { materialCode: 'RM-DOLIME', qty: 85, unit: 'T', supplierId: 'SUP-Graymont', notes: 'Dolomite Graymont' },
    { materialCode: 'RM-FLUOR', qty: 3000, unit: 'KG', supplierId: 'SUP-Mexichem', notes: 'Fluorspar bags' },
    { materialCode: 'RM-FLUOR', qty: 2500, unit: 'KG', supplierId: 'SUP-Mexichem', notes: 'Fluorspar bags 2' },

    // Carbon (4 batches)
    { materialCode: 'RM-MET-COKE', qty: 60, unit: 'T', supplierId: 'SUP-Oxbow', notes: 'Pet coke truck 1' },
    { materialCode: 'RM-MET-COKE', qty: 55, unit: 'T', supplierId: 'SUP-Oxbow', notes: 'Pet coke truck 2' },
    { materialCode: 'RM-MET-COKE', qty: 65, unit: 'T', supplierId: 'SUP-Oxbow', notes: 'Pet coke truck 3' },
    { materialCode: 'RM-MET-COKE', qty: 50, unit: 'T', supplierId: 'SUP-Rain', notes: 'Pet coke Rain CII' },
];

// ============================================================
// Setup Functions
// ============================================================

async function resetDatabase() {
    console.log('\n📦 Resetting transactional data...');
    try {
        const result = await post('/database/reset/transactional', { resetBy: 'E2E-BIG-DEMO' });
        if (result.status === 200) {
            console.log(`   ✅ Reset complete: ${result.data.rowsDeleted || 0} rows deleted`);
        } else {
            console.log(`   ⚠️  Reset returned status ${result.status}: ${JSON.stringify(result.data).substring(0, 100)}`);
        }
    } catch (e) {
        console.log(`   ⚠️  Reset error: ${e.message}`);
    }
}

async function createCustomers() {
    console.log('\n👥 Creating 15 customers...');
    let created = 0;
    for (const customer of CUSTOMERS) {
        const result = await post('/customers', customer);
        if (result.status === 200 || result.status === 201) {
            created++;
        }
    }
    console.log(`   ✅ Created ${created} customers`);
    return created;
}

async function createMaterials() {
    console.log('\n🧱 Creating 40 materials...');
    let created = 0;
    for (const material of MATERIALS) {
        const result = await post('/materials', material);
        if (result.status === 200 || result.status === 201) {
            created++;
        }
    }
    console.log(`   ✅ Created ${created} materials`);
    return created;
}

async function createProducts() {
    console.log('\n📦 Creating 25 products...');
    let created = 0;
    for (const product of PRODUCTS) {
        const result = await post('/products', product);
        if (result.status === 200 || result.status === 201) {
            created++;
        }
    }
    console.log(`   ✅ Created ${created} products`);
    return created;
}

async function createEquipment() {
    console.log('\n🏭 Creating 18 equipment items...');
    let created = 0;
    for (const equip of EQUIPMENT) {
        const result = await post('/equipment', equip);
        if (result.status === 200 || result.status === 201) {
            created++;
        }
    }
    console.log(`   ✅ Created ${created} equipment`);
    return created;
}

async function createOperators() {
    console.log('\n👷 Creating 15 operators...');
    let created = 0;
    for (const operator of OPERATORS) {
        const result = await post('/operators', operator);
        if (result.status === 200 || result.status === 201) {
            created++;
        }
    }
    console.log(`   ✅ Created ${created} operators`);
    return created;
}

async function createProcessesAndRoutings() {
    console.log('\n⚙️  Creating 15 processes with routings...');
    const processMap = {};

    for (const process of PROCESSES) {
        // Create process
        const processResult = await post('/processes', {
            processCode: process.processCode,
            processName: process.processName,
            description: process.description,
            operationType: process.operationType,
            yieldRatio: process.yieldRatio,
            status: 'ACTIVE'
        });

        if (processResult.status === 200 || processResult.status === 201) {
            const processId = processResult.data.processId;
            processMap[process.processCode] = processId;
            console.log(`   ✅ Process: ${process.processName}`);

            // Create routing
            const routingResult = await post('/routing', {
                processId: processId,
                routingName: process.processName + ' Route',
                routingCode: process.processCode.replace('PROC-', 'RT-'),
                version: '1.0',
                status: 'ACTIVE'
            });

            if (routingResult.status === 200 || routingResult.status === 201) {
                const routingId = routingResult.data.routingId;

                // Create routing steps
                for (const step of process.steps) {
                    await post('/routing-steps', {
                        routingId: routingId,
                        stepSequence: step.sequence,
                        stepName: step.stepName,
                        operationType: step.operationType,
                        standardDuration: step.duration,
                        description: step.description
                    });
                }
                console.log(`      ✅ ${process.steps.length} routing steps`);
            }
        }
    }

    return processMap;
}

async function updateProductProcessMapping(processMap) {
    console.log('\n🔗 Updating product-process mapping...');
    let updated = 0;

    const productsResult = await get('/products');
    if (productsResult.status !== 200) {
        console.log('   ⚠️  Could not fetch products');
        return;
    }

    for (const product of productsResult.data) {
        const processCode = PRODUCT_PROCESS_MAP[product.sku];
        if (processCode && processMap[processCode]) {
            const result = await put(`/products/${product.productId}`, {
                ...product,
                defaultProcessId: processMap[processCode]
            });
            if (result.status === 200) {
                updated++;
            }
        }
    }

    console.log(`   ✅ Updated ${updated} product mappings`);
}

async function createOrders(customerMap, productMap) {
    console.log('\n📋 Creating 30 orders...');
    let created = 0;

    for (const order of ORDERS) {
        const customer = customerMap[order.customerCode];
        if (!customer) continue;

        const orderResult = await post('/orders', {
            customerId: String(customer.customerId),
            customerName: customer.customerName,
            orderDate: new Date().toISOString().split('T')[0],
            lineItems: order.items.map(item => ({
                productSku: item.sku,
                productName: productMap[item.sku]?.productName || item.sku,
                quantity: item.qty,
                unit: 'T'
            }))
        });

        if (orderResult.status === 200 || orderResult.status === 201) {
            created++;
        }
    }

    console.log(`   ✅ Created ${created} orders`);
    return created;
}

async function generateOperations() {
    console.log('\n⚡ Generating operations from routings...');
    try {
        const result = await post('/database/reset/seed', { seedBy: 'E2E-BIG-DEMO' });
        if (result.status === 200) {
            console.log(`   ✅ Generated ${result.data.operationsGenerated || 0} operations`);
            return result.data.operationsGenerated || 0;
        }
    } catch (e) {
        console.log(`   ⚠️  Generation error: ${e.message}`);
    }
    return 0;
}

async function receiveRawMaterials(materialMap) {
    console.log('\n📥 Receiving 60+ raw material batches...');
    let received = 0;
    let errors = 0;

    for (const receipt of RAW_MATERIAL_RECEIPTS) {
        const material = materialMap[receipt.materialCode];
        if (!material) {
            continue;
        }

        const result = await post('/inventory/receive-material', {
            materialId: receipt.materialCode,
            materialName: material.materialName,
            quantity: receipt.qty,
            unit: receipt.unit,
            supplierId: receipt.supplierId,
            supplierBatchNumber: `${receipt.supplierId}-${Date.now().toString(36)}`,
            location: 'Raw Material Yard',
            notes: receipt.notes
        });

        if (result.status === 200 || result.status === 201) {
            received++;
        } else {
            errors++;
            if (errors <= 3) {
                console.log(`   ⚠️  Receipt failed: ${JSON.stringify(result.data).substring(0, 80)}`);
            }
        }
    }

    console.log(`   ✅ Received ${received} raw material batches${errors > 0 ? ` (${errors} errors)` : ''}`);
    return received;
}

async function verifySetup() {
    console.log('\n📊 Verifying final setup...');
    const result = await get('/database/reset/verify');
    if (result.status === 200) {
        const d = result.data;
        console.log('   ┌────────────────────────────────┐');
        console.log('   │  Entity          Count         │');
        console.log('   ├────────────────────────────────┤');
        console.log(`   │  Customers       ${String(d.customers).padStart(5)}         │`);
        console.log(`   │  Materials       ${String(d.materials).padStart(5)}         │`);
        console.log(`   │  Products        ${String(d.products).padStart(5)}         │`);
        console.log(`   │  Equipment       ${String(d.equipment).padStart(5)}         │`);
        console.log(`   │  Operators       ${String(d.operators).padStart(5)}         │`);
        console.log(`   │  Processes       ${String(d.processes).padStart(5)}         │`);
        console.log(`   │  Routings        ${String(d.routings).padStart(5)}         │`);
        console.log(`   │  Routing Steps   ${String(d.routingSteps).padStart(5)}         │`);
        console.log(`   │  Orders          ${String(d.orders).padStart(5)}         │`);
        console.log(`   │  Order Lines     ${String(d.orderLineItems).padStart(5)}         │`);
        console.log(`   │  Operations      ${String(d.operations).padStart(5)}         │`);
        console.log(`   │  Batches         ${String(d.batches).padStart(5)}         │`);
        console.log(`   │  Inventory       ${String(d.inventory).padStart(5)}         │`);
        console.log('   └────────────────────────────────┘');
        return d;
    }
    return null;
}

// ============================================================
// Main Execution
// ============================================================

async function main() {
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('   MES Big Demo Setup - Realistic Steel Manufacturing Data');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`   Started: ${new Date().toISOString()}`);
    console.log('   See: documents/BIG-DEMO-DATA-PLAN.md for specifications\n');

    try {
        await login();

        // Reset
        await resetDatabase();

        // Master Data
        await createCustomers();
        await createMaterials();
        await createProducts();
        await createEquipment();
        await createOperators();

        // Processes & Routings
        const processMap = await createProcessesAndRoutings();
        await updateProductProcessMapping(processMap);

        // Build lookup maps
        const customersResult = await get('/customers');
        const customerMap = {};
        if (customersResult.status === 200) {
            for (const c of customersResult.data) {
                customerMap[c.customerCode] = c;
            }
        }

        const productsResult = await get('/products');
        const productMap = {};
        if (productsResult.status === 200) {
            for (const p of productsResult.data) {
                productMap[p.sku] = p;
            }
        }

        const materialsResult = await get('/materials');
        const materialMap = {};
        if (materialsResult.status === 200) {
            for (const m of materialsResult.data) {
                materialMap[m.materialCode] = m;
            }
        }

        // Transactional Data
        await createOrders(customerMap, productMap);
        await generateOperations();
        await receiveRawMaterials(materialMap);

        // Verify
        await verifySetup();

        console.log('\n═══════════════════════════════════════════════════════════════════');
        console.log('   ✅ BIG DEMO SETUP COMPLETE');
        console.log('═══════════════════════════════════════════════════════════════════');
        console.log(`   Finished: ${new Date().toISOString()}`);

    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        process.exit(1);
    }
}

main().catch(console.error);
