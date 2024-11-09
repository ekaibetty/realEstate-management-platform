# Property Management System Canister

A comprehensive Internet Computer canister for managing real estate properties, tenants, lease agreements, maintenance requests, and related documentation.

## Features

- Property Management
- Tenant Management 
- Lease Agreement Management
- Financial Transaction Tracking
- Maintenance Request Handling
- Document Management

## Installation

1. Clone the repository
```bash
git https://github.com/ekaibetty/realEstate-management-platform.git

cd realEstate-management-platform

```

2. Install dependencies
```bash
npm install
```

3. Start the local replica
```bash
dfx stop && dfx start --background --clean
```

4. Deploy the canister
```json
dfx deploy
```

## API Reference

### Property Management

#### Create Property
```typescript
createProperty(payload: PropertyPayload)
```

Sample payload:
```json
{
  "address": "123 Main St",
  "valuation": 500000.00,
  "status": "available",
  "square_footage": 2000.0,
  "bedrooms": 3n,
  "bathrooms": 2.5,
  "amenities": ["garage", "pool"],
  "images": ["image1.jpg", "image2.jpg"],
  "property_type": "residential",
  "insurance_info": "Policy #12345",
  "tax_details": {
    "annual_amount": 5000.00,
    "last_paid_date": "2024-01-15",
    "next_due_date": "2024-12-31"
  }
}
```

#### Other Property Endpoints
- `getAllProperties()`
- `getPropertyById(id: text)`
- `getPropertiesByType(propertyType: text)`
- `updateProperty(id: text, payload: PropertyPayload)`
- `deleteProperty(id: text)`

### Tenant Management

#### Create Tenant
```typescript
createTenant(payload: TenantPayload)
```

Sample payload:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-0123",
  "emergency_contact": "555-4567",
  "background_check_status": "passed",
  "credit_score": 750n,
  "rental_history": [{
    "previous_address": "456 Oak Ave",
    "landlord_contact": "555-8901",
    "duration": "2 years"
  }],
  "payment_preferences": "auto-pay"
}
```

#### Other Tenant Endpoints
- `getAllTenants()`
- `getTenantById(id: text)`

### Lease Agreement Management

#### Create Lease Agreement
```typescript
createLeaseAgreement(payload: LeaseAgreementPayload)
```

Sample payload:
```json
{
  "property_id": "property123",
  "tenant": "tenant456",
  "rent": 2000.00,
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "digital_signature": "signature789",
  "security_deposit": 3000.00,
  "utility_responsibilities": ["electricity", "water", "internet"],
  "renewal_status": "pending"
}
```

#### Record Rent Payment
```typescript
recordRentPayment(payload: RentPaymentPayload)
```

Sample payload:
```json
{
  "lease_id": "lease123",
  "amount": 2000.00
}
```

#### Other Lease Endpoints
- `getAllLeaseAgreements()`
- `getLeaseAgreementById(id: text)`
- `updateLeaseAgreement(id: text, payload: LeaseAgreementPayload)`
- `deleteLeaseAgreement(id: text)`

### Financial Transaction Management

#### Create Financial Transaction
```typescript
createFinancialTransaction(payload: FinancialTransactionPayload)
```

Sample payload:
```json
{
  "property_id": "property123",
  "amount": 2000.00,
  "transaction_type": "income",
  "description": "Monthly rent payment",
  "category": "rent",
  "payment_method": "bank_transfer"
}
```

#### Other Financial Endpoints
- `getAllFinancialTransactions()`
- `getFinancialTransactionById(id: text)`
- `getTransactionsByPropertyId(property_id: text)`

### Maintenance Management

#### Create Maintenance Request
```typescript
createMaintenanceRequest(payload: MaintenanceRequestPayload)
```

Sample payload:
```json
{
  "property_id": "property123",
  "description": "Leaking faucet in master bathroom",
  "priority": "medium",
  "images": ["leak1.jpg", "leak2.jpg"]
}
```

#### Other Maintenance Endpoints
- `getAllMaintenanceRequests()`
- `getMaintenanceRequestById(id: text)`
- `updateMaintenanceRequest(id: text, payload: MaintenanceRequestPayload)`

### Document Management

#### Create Document
```typescript
createDocument(payload: DocumentPayload)
```

Sample payload:
```json
{
  "property_id": "property123",
  "document_type": "contract",
  "content": "Contract content here...",
  "metadata": {
    "title": "Rental Agreement",
    "tags": ["legal", "active"]
  }
}
```

#### Other Document Endpoints
- `getAllDocuments()`
- `getDocumentById(id: text)`
- `updateDocument(id: text, payload: DocumentPayload)`
- `deleteDocument(id: text)`

## Error Handling

The system uses a Result type that returns either a success value or an Error variant. Possible errors include:
- `NotFound`: Resource not found
- `InvalidPayload`: Invalid or missing required fields
- `InvalidDate`: Invalid date values
- `PaymentFailed`: Payment processing failed
- `PaymentCompleted`: Payment already completed

## Data Storage

The system uses `StableBTreeMap` for persistent storage of:
- Properties
- Tenants
- Lease Agreements
- Financial Transactions
- Maintenance Requests
- Documents

## Security Considerations

- All mutations require caller authentication
- Property ownership is tracked using the caller's Principal
- Digital signatures are required for lease agreements
- Background checks are required for tenants

