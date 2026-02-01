# MES Production Confirmation POC

A Manufacturing Execution System (MES) proof of concept for production confirmation workflows, material consumption tracking, and batch traceability.

## Technology Stack

### Backend
- **Framework**: Spring Boot 3.2
- **Language**: Java 17
- **Database**: PostgreSQL
- **Security**: JWT Token Authentication
- **ORM**: Spring Data JPA / Hibernate

### Frontend
- **Framework**: Angular 17 (Module-based components)
- **Styling**: Custom CSS
- **HTTP Client**: Angular HttpClient

## Project Structure

```
bluemingo-poc/
├── backend/
│   ├── src/main/java/com/mes/production/
│   │   ├── config/           # Security, Exception handling
│   │   ├── controller/       # REST API endpoints
│   │   ├── dto/              # Data Transfer Objects
│   │   ├── entity/           # JPA Entities
│   │   ├── repository/       # Spring Data repositories
│   │   ├── security/         # JWT authentication
│   │   └── service/          # Business logic
│   └── src/main/resources/
│       ├── patches/          # SQL patches (001_xxx.sql, 002_xxx.sql)
│       └── application.yml   # Configuration
├── frontend/
│   └── src/app/
│       ├── core/             # Services, Guards, Interceptors
│       ├── shared/           # Shared components
│       └── features/         # Feature modules
│           ├── auth/         # Login
│           ├── dashboard/    # Dashboard
│           ├── orders/       # Order management
│           ├── production/   # Production confirmation
│           ├── inventory/    # Inventory view
│           └── batches/      # Batch traceability
└── documents/                # Requirements & specifications
```

## Prerequisites

- Java 17+
- Node.js 18+
- PostgreSQL 14+
- Maven 3.8+

## Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE mes_production;
```

2. Update `backend/src/main/resources/application.yml` with your database credentials.

## Running the Application

### Backend

```bash
cd backend
mvn spring-boot:run
```

The backend will:
- Start on `http://localhost:8080`
- Automatically apply SQL patches from `resources/patches/` folder
- Seed initial data including admin user

### Frontend

```bash
cd frontend
npm install
npm start
```

The frontend will start on `http://localhost:4200`

## Default Credentials

- **Email**: admin@mes.com
- **Password**: admin123

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login

### Orders
- `GET /api/orders` - List all orders
- `GET /api/orders/available` - List available orders
- `GET /api/orders/{id}` - Get order details

### Production
- `GET /api/production/operations/{id}` - Get operation details
- `POST /api/production/confirm` - Confirm production

### Inventory
- `GET /api/inventory` - List all inventory
- `GET /api/inventory/available` - List available inventory
- `GET /api/inventory/state/{state}` - Filter by state
- `GET /api/inventory/type/{type}` - Filter by type

### Batches
- `GET /api/batches` - List all batches
- `GET /api/batches/{id}` - Get batch details
- `GET /api/batches/{id}/genealogy` - Get batch traceability

### Master Data
- `GET /api/master/equipment` - List equipment
- `GET /api/master/operators` - List operators
- `GET /api/master/delay-reasons` - List delay reasons
- `GET /api/master/hold-reasons` - List hold reasons
- `GET /api/master/process-parameters` - List process parameters

## Database Patching Mechanism

SQL patches are automatically applied on application startup:
1. Patches are stored in `backend/src/main/resources/patches/`
2. Naming convention: `001_description.sql`, `002_description.sql`, etc.
3. Applied patches are tracked in `database_patches` table
4. Patches are applied in sequential order (001 → 002 → ...)

## Features

### Production Confirmation
- Select operation from order
- Record quantity produced/scrapped
- Consume materials from inventory
- Auto-generate output batch
- Record equipment and operator
- Capture process parameters

### Batch Traceability
- Forward traceability: Source materials → Final product
- Backward traceability: Final product → Source materials
- Batch genealogy visualization

### Inventory Management
- View inventory by state (Available, Consumed, On Hold)
- Filter by type (RM, IM, FG, WIP)
- Search by batch number or material ID

## Future Scope

- User management and roles
- Authorization (RBAC)
- Reporting and analytics
- Quality management integration
- Equipment maintenance tracking
