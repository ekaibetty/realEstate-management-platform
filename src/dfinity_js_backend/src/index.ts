import {
  query,
  update,
  text,
  Record,
  StableBTreeMap,
  Variant,
  Vec,
  Ok,
  Err,
  ic,
  Principal,
  bool,
  float64,
  Result,
  nat64,
  Canister,
  Null,
} from "azle";
import { v4 as uuidv4 } from "uuid";

// Record Types
const Property = Record({
  id: text,
  address: text,
  owner: text,
  valuation: float64,
  status: text,
  created_at: text,
  square_footage: float64,
  bedrooms: nat64,
  bathrooms: float64,
  amenities: Vec(text),
  images: Vec(text),
  property_type: text,
  last_inspection_date: text,
  insurance_info: text,
  tax_details: Record({
    annual_amount: float64,
    last_paid_date: text,
    next_due_date: text,
  }),
});

const Tenant = Record({
  id: text,
  name: text,
  email: text,
  phone: text,
  emergency_contact: text,
  background_check_status: text,
  credit_score: nat64,
  rental_history: Vec(
    Record({
      previous_address: text,
      landlord_contact: text,
      duration: text,
    })
  ),
  payment_preferences: text,
});

const LeaseAgreement = Record({
  id: text,
  property_id: text,
  tenant: text,
  rent: float64,
  start_date: text,
  end_date: text,
  created_at: text,
  digital_signature: text,
  security_deposit: float64,
  utility_responsibilities: Vec(text),
  rent_payment_history: Vec(
    Record({
      payment_date: text,
      amount: float64,
      status: text,
    })
  ),
  lease_violations: Vec(
    Record({
      date: text,
      description: text,
      resolved: bool,
    })
  ),
  renewal_status: text,
});

const FinancialTransaction = Record({
  id: text,
  property_id: text,
  date: text,
  amount: float64,
  transaction_type: text,
  description: text,
  category: text,
  payment_method: text,
  recorded_by: text,
});

const MaintenanceRequest = Record({
  id: text,
  property_id: text,
  description: text,
  status: text,
  created_at: text,
  priority: text,
  assigned_to: text,
  estimated_cost: float64,
  actual_cost: float64,
  completion_date: text,
  tenant_feedback: text,
  images: Vec(text),
  work_orders: Vec(
    Record({
      order_date: text,
      contractor: text,
      status: text,
      notes: text,
    })
  ),
});

const Document = Record({
  id: text,
  property_id: text,
  document_type: text,
  content: text,
});

// Payload Types
const PropertyPayload = Record({
  address: text,
  valuation: float64,
  status: text,
  square_footage: float64,
  bedrooms: nat64,
  bathrooms: float64,
  amenities: Vec(text),
  images: Vec(text),
  property_type: text,
  insurance_info: text,
  tax_details: Record({
    annual_amount: float64,
    last_paid_date: text,
    next_due_date: text,
  }),
});

const TenantPayload = Record({
  name: text,
  email: text,
  phone: text,
  emergency_contact: text,
  background_check_status: text,
  credit_score: nat64,
  rental_history: Vec(
    Record({
      previous_address: text,
      landlord_contact: text,
      duration: text,
    })
  ),
  payment_preferences: text,
});

const LeaseAgreementPayload = Record({
  property_id: text,
  tenant: text,
  rent: float64,
  start_date: text,
  end_date: text,
  digital_signature: text,
  security_deposit: float64,
  utility_responsibilities: Vec(text),
  renewal_status: text,
});

// recordRentPayment Payload
const RentPaymentPayload = Record({
  lease_id: text,
  amount: float64,
});

const FinancialTransactionPayload = Record({
  property_id: text,
  amount: float64,
  transaction_type: text,
  description: text,
  category: text,
  payment_method: text,
});

const MaintenanceRequestPayload = Record({
  property_id: text,
  description: text,
  priority: text,
  images: Vec(text),
});

// Document Payload
const DocumentPayload = Record({
  property_id: text,
  document_type: text,
  content: text,
  metadata: Record({
    title: text,
    tags: Vec(text),
  }),
});

// Error Struct
const Error = Variant({
  Success: text,
  Error: text,
  NotFound: text,
  InvalidPayload: text,
  InvalidDate: text,
  PaymentFailed: text,
  PaymentCompleted: text,
});

// Storage
const propertiesStorage = StableBTreeMap(0, text, Property);
const tenantsStorage = StableBTreeMap(1, text, Tenant);
const leaseAgreementsStorage = StableBTreeMap(2, text, LeaseAgreement);
const financialTransactionsStorage = StableBTreeMap(
  3,
  text,
  FinancialTransaction
);
const maintenanceRequestsStorage = StableBTreeMap(4, text, MaintenanceRequest);
const documentsStorage = StableBTreeMap(5, text, Document);

export default Canister({
  // Property Management
  createProperty: update(
    [PropertyPayload],
    Result(Property, Error),
    (payload) => {
      // Ensure all required fields are provided
      if (
        !payload.address ||
        !payload.valuation ||
        !payload.status ||
        !payload.square_footage ||
        !payload.bedrooms ||
        !payload.bathrooms
      ) {
        return Result.Err({
          InvalidPayload:
            "Address, valuation, status, square footage, bedrooms, and bathrooms are required",
        });
      }

      // Ensure property type is valid
      if (
        payload.property_type !== "residential" &&
        payload.property_type !== "commercial"
      ) {
        return Result.Err({
          InvalidPayload:
            "Property type must be either 'residential' or 'commercial'",
        });
      }

      // Ensure tax details are provided
      if (
        !payload.tax_details.annual_amount ||
        !payload.tax_details.last_paid_date ||
        !payload.tax_details.next_due_date
      ) {
        return Result.Err({
          InvalidPayload:
            "Annual amount, last paid date, and next due date are required for tax details",
        });
      }

      const id = uuidv4();
      const now = new Date().toISOString();

      const property = {
        id,
        owner: ic.caller().toString(),
        created_at: now,
        last_inspection_date: now,
        ...payload,
      };

      propertiesStorage.insert(id, property);

      return Ok(property);
    }
  ),

  // Function to get all properties
  getAllProperties: query([], Result(Vec(Property), Error), () => {
    const properties = propertiesStorage.values();
    if (properties.length === 0) {
      return Err({ NotFound: "No properties found" });
    }
    return Ok(properties);
  }),

  // Function to get a single property by ID
  getPropertyById: query([text], Result(Property, Error), (id) => {
    const property = propertiesStorage.get(id);
    if ("None" in property) {
      return Err({ NotFound: `Property with ID ${id} not found` });
    }
    return Ok(property.Some);
  }),

  // Fetch properties by property type
  getPropertiesByType: query(
    [text],
    Result(Vec(Property), Error),
    (propertyType) => {
      const properties = propertiesStorage.values();
      const filteredProperties = properties.filter(
        (property) => property.property_type === propertyType
      );

      if (filteredProperties.length === 0) {
        return Err({ NotFound: `No ${propertyType} properties found` });
      }

      return Ok(filteredProperties);
    }
  ),

  // Function to update a property by ID
  updateProperty: update(
    [text, PropertyPayload],
    Result(Property, Error),
    (id, payload) => {
      const property = propertiesStorage.get(id);
      if ("None" in property) {
        return Err({ NotFound: `Property with ID ${id} not found` });
      }

      const updatedProperty = {
        ...property.Some,
        ...payload,
      };

      propertiesStorage.insert(id, updatedProperty);

      return Ok(updatedProperty);
    }
  ),

  // Function to delete a property by ID
  deleteProperty: update([text], Result(Null, Error), (id) => {
    const property = propertiesStorage.get(id);
    if ("None" in property) {
      return Err({ NotFound: `Property with ID ${id} not found` });
    }

    propertiesStorage.remove(id);

    return Ok(null);
  }),

  // Tenant Management
  createTenant: update([TenantPayload], Result(Tenant, Error), (payload) => {
    // Ensure all required fields are provided
    if (
      !payload.name ||
      !payload.email ||
      !payload.phone ||
      !payload.background_check_status ||
      !payload.credit_score
    ) {
      return Result.Err({
        InvalidPayload:
          "Name, email, phone, background check status, and credit score are required",
      });
    }

    const id = uuidv4();
    const tenant = {
      id,
      ...payload,
    };

    tenantsStorage.insert(id, tenant);

    return Ok(tenant);
  }),

  // Function to get all tenants
  getAllTenants: query([], Result(Vec(Tenant), Error), () => {
    const tenants = tenantsStorage.values();
    if (tenants.length === 0) {
      return Err({ NotFound: "No tenants found" });
    }
    return Ok(tenants);
  }),

  // Function to get tenant by ID
  getTenantById: query([text], Result(Tenant, Error), (id) => {
    const tenant = tenantsStorage.get(id);
    if ("None" in tenant) {
      return Err({ NotFound: `Tenant with ID ${id} not found` });
    }
    return Ok(tenant.Some);
  }),

  // Lease Agreement Management
  createLeaseAgreement: update(
    [LeaseAgreementPayload],
    Result(LeaseAgreement, Error),
    (payload) => {
      // Ensure all required fields are provided
      if (
        !payload.property_id ||
        !payload.tenant ||
        !payload.rent ||
        !payload.start_date ||
        !payload.end_date ||
        !payload.digital_signature ||
        !payload.security_deposit
      ) {
        return Result.Err({
          InvalidPayload:
            "Property ID, tenant, rent, start date, end date, digital signature, and security deposit are required",
        });
      }

      // Ensure tenant exists
      const tenantExists = tenantsStorage.get(payload.tenant);

      if ("None" in tenantExists) {
        return Result.Err({ NotFound: "Tenant not found" });
      }

      // Ensure property exists
      const propertyExists = propertiesStorage.get(payload.property_id);
      if ("None" in propertyExists) {
        return Result.Err({ NotFound: "Property not found" });
      }

      // Ensure start date is before end date
      if (payload.start_date >= payload.end_date) {
        return Result.Err({
          InvalidDate: "Start date must be before end date",
        });
      }

      const id = uuidv4();
      const lease = {
        id,
        ...payload,
        created_at: new Date().toISOString(),
        rent_payment_history: [],
        lease_violations: [],
      };

      leaseAgreementsStorage.insert(id, lease);
      return Ok(lease);
    }
  ),

  // Function to get all lease agreements
  getAllLeaseAgreements: query([], Result(Vec(LeaseAgreement), Error), () => {
    const leaseAgreements = leaseAgreementsStorage.values();
    if (leaseAgreements.length === 0) {
      return Err({ NotFound: "No lease agreements found" });
    }
    return Ok(leaseAgreements);
  }),

  // Function to get lease agreement by ID
  getLeaseAgreementById: query([text], Result(LeaseAgreement, Error), (id) => {
    const lease = leaseAgreementsStorage.get(id);
    if ("None" in lease) {
      return Err({ NotFound: `Lease agreement with ID ${id} not found` });
    }
    return Ok(lease.Some);
  }),

  // Function to update lease agreement by ID
  updateLeaseAgreement: update(
    [text, LeaseAgreementPayload],
    Result(LeaseAgreement, Error),
    (id, payload) => {
      const lease = leaseAgreementsStorage.get(id);
      if ("None" in lease) {
        return Err({ NotFound: `Lease agreement with ID ${id} not found` });
      }

      const updatedLease = {
        ...lease.Some,
        ...payload,
      };

      leaseAgreementsStorage.insert(id, updatedLease);

      return Ok(updatedLease);
    }
  ),

  // Function to delete lease agreement by ID
  deleteLeaseAgreement: update([text], Result(Null, Error), (id) => {
    const lease = leaseAgreementsStorage.get(id);
    if ("None" in lease) {
      return Err({ NotFound: `Lease agreement with ID ${id} not found` });
    }

    leaseAgreementsStorage.remove(id);

    return Ok(null);
  }),
  // Function to record rent payment
  recordRentPayment: update(
    [RentPaymentPayload],
    Result(LeaseAgreement, Error),
    (payload) => {
      const lease = leaseAgreementsStorage.get(payload.lease_id);
      if ("None" in lease) {
        return Err({
          NotFound: `Lease agreement with ID ${payload.lease_id} not found`,
        });
      }

      const leaseAgreement = lease.Some;

      // Check if lease agreement is already completed
      if (leaseAgreement.renewal_status === "completed") {
        return Err({
          PaymentCompleted: "Lease agreement has already been completed",
        });
      }

      // Validate that the payment amount matches the rent
      if (payload.amount !== leaseAgreement.rent) {
        return Err({
          PaymentFailed: `Payment amount does not match the required rent of ${leaseAgreement.rent}`,
        });
      }

      const paymentDate = new Date().toISOString();
      const payment = {
        payment_date: paymentDate,
        amount: payload.amount,
        status: "completed", // Update status to 'completed' upon successful payment
      };

      // Record the payment in the lease's payment history
      leaseAgreement.rent_payment_history.push(payment);

      // Save updated lease agreement to storage
      leaseAgreementsStorage.insert(payload.lease_id, leaseAgreement);

      return Ok(leaseAgreement);
    }
  ),

  // Financial Transaction Management
  createFinancialTransaction: update(
    [FinancialTransactionPayload],
    Result(FinancialTransaction, Error),
    (payload) => {
      // Ensure all required fields are provided
      if (
        !payload.property_id ||
        !payload.amount ||
        !payload.transaction_type ||
        !payload.description ||
        !payload.category ||
        !payload.payment_method
      ) {
        return Result.Err({
          InvalidPayload:
            "Property ID, amount, transaction_type, description, category, and payment method are required",
        });
      }

      // Ensure property exists
      const propertyExists = propertiesStorage.get(payload.property_id);
      if ("None" in propertyExists) {
        return Result.Err({ NotFound: "Property not found" });
      }

      const id = uuidv4();
      const transaction = {
        id,
        recorded_by: ic.caller().toString(),
        date: new Date().toISOString(),
        ...payload,
      };

      financialTransactionsStorage.insert(id, transaction);

      return Ok(transaction);
    }
  ),

  getAllFinancialTransactions: query(
    [],
    Result(Vec(FinancialTransaction), Error),
    () => {
      const transactions = financialTransactionsStorage.values();
      if (transactions.length === 0) {
        return Err({ NotFound: "No financial transactions found" });
      }
      return Ok(transactions);
    }
  ),

  getFinancialTransactionById: query(
    [text],
    Result(FinancialTransaction, Error),
    (id) => {
      const transaction = financialTransactionsStorage.get(id);
      if ("None" in transaction) {
        return Err({
          NotFound: `Financial transaction with ID ${id} not found`,
        });
      }
      return Ok(transaction.Some);
    }
  ),

  getTransactionsByPropertyId: query(
    [text],
    Result(Vec(FinancialTransaction), Error),
    (property_id) => {
      const transactions = financialTransactionsStorage.values();
      const propertyTransactions = transactions.filter(
        (t) => t.property_id === property_id
      );

      if (propertyTransactions.length === 0) {
        return Err({
          NotFound: `No transactions found for property ${property_id}`,
        });
      }

      return Ok(propertyTransactions);
    }
  ),

  // Maintenance Management
  createMaintenanceRequest: update(
    [MaintenanceRequestPayload],
    Result(MaintenanceRequest, Error),
    (payload) => {
      // Ensure all required fields are provided
      if (!payload.property_id || !payload.description || !payload.priority) {
        return Err({
          InvalidPayload: "Property ID, description, and priority are required",
        });
      }

      const propertyExists = propertiesStorage.get(payload.property_id);
      if ("None" in propertyExists) {
        return Err({ NotFound: "Property not found" });
      }

      const id = uuidv4();
      const request = {
        id,
        created_at: new Date().toISOString(),
        status: "pending",
        assigned_to: "",
        estimated_cost: 0.0,
        actual_cost: 0.0,
        completion_date: "",
        tenant_feedback: "",
        work_orders: [],
        ...payload,
      };

      maintenanceRequestsStorage.insert(id, request);
      return Ok(request);
    }
  ),

  getAllMaintenanceRequests: query(
    [],
    Result(Vec(MaintenanceRequest), Error),
    () => {
      const requests = maintenanceRequestsStorage.values();
      if (requests.length === 0) {
        return Err({ NotFound: "No maintenance requests found" });
      }
      return Ok(requests);
    }
  ),

  // Function to get maintenance request by ID
  getMaintenanceRequestById: query(
    [text],
    Result(MaintenanceRequest, Error),
    (id) => {
      const request = maintenanceRequestsStorage.get(id);
      if ("None" in request) {
        return Err({ NotFound: "Maintenance request not found" });
      }
      return Ok(request.Some);
    }
  ),

  // Function to get maintenance request by ID
  updateMaintenanceRequest: update(
    [text, MaintenanceRequestPayload],
    Result(MaintenanceRequest, Error),
    (id, payload) => {
      const request = maintenanceRequestsStorage.get(id);
      if ("None" in request) {
        return Err({ NotFound: "Maintenance request not found" });
      }

      const updatedRequest = {
        ...request.Some,
        ...payload,
      };

      maintenanceRequestsStorage.insert(id, updatedRequest);

      return Ok(updatedRequest);
    }
  ),

  // Document Management

  // Function to create a new document
  createDocument: update(
    [DocumentPayload],
    Result(Document, Error),
    (payload) => {
      // Validate required fields
      if (
        !payload.document_type ||
        !payload.content ||
        !payload.metadata.title
      ) {
        return Err({
          InvalidPayload:
            "Document type, content, and metadata title are required",
        });
      }

      // Verify that the property exists
      const propertyExists = propertiesStorage.get(payload.property_id);
      if ("None" in propertyExists) {
        return Err({ NotFound: "Property not found" });
      }

      const id = uuidv4();
      const now = new Date().toISOString();

      const document = {
        id,
        ...payload,
      };

      documentsStorage.insert(id, document);
      return Ok(document);
    }
  ),

  // Function to get all documents
  getAllDocuments: query([], Result(Vec(Document), Error), () => {
    const documents = documentsStorage.values();
    if (documents.length === 0) {
      return Err({ NotFound: "No documents found" });
    }
    return Ok(documents);
  }),

  // Function to get document by ID
  getDocumentById: query([text], Result(Document, Error), (id) => {
    const document = documentsStorage.get(id);
    if ("None" in document) {
      return Err({ NotFound: "Document not found" });
    }
    return Ok(document.Some);
  }),

  // Function to update document by ID
  updateDocument: update(
    [text, DocumentPayload],
    Result(Document, Error),
    (id, payload) => {
      const document = documentsStorage.get(id);
      if ("None" in document) {
        return Err({ NotFound: "Document not found" });
      }

      const updatedDocument = {
        ...document.Some,
        ...payload,
      };

      documentsStorage.insert(id, updatedDocument);

      return Ok(updatedDocument);
    }
  ),

  // Function to delete document by ID
  deleteDocument: update([text], Result(Null, Error), (id) => {
    const document = documentsStorage.get(id);
    if ("None" in document) {
      return Err({ NotFound: "Document not found" });
    }

    documentsStorage.remove(id);

    return Ok(null);
  }),
});
