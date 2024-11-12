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
      // Validate required fields
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

  // Lease Agreement Management
  createLeaseAgreement: update(
    [LeaseAgreementPayload],
    Result(LeaseAgreement, Error),
    (payload) => {
      if (!payload.property_id || !payload.tenant || !payload.rent) {
        return Err({
          InvalidPayload:
            "Property ID, tenant, and rent amount are required for creating a lease agreement",
        });
      }

      const id = uuidv4();
      const now = new Date().toISOString();

      const leaseAgreement = {
        id,
        created_at: now,
        ...payload,
      };

      leaseAgreementsStorage.insert(id, leaseAgreement);

      return Ok(leaseAgreement);
    }
  ),
});
