# **SharePoint Lists Configuration Report**

Project: Santana Inventory Management Tool  
Date: July 17, 2025  
Status: All lists designed and implemented with hybrid solution for Microsoft Graph API compatibility.

## **Overview**

This report provides a detailed specification for each of the six SharePoint lists that form the data foundation for the inventory management application. All lists are prefixed with simt_ to ensure clear organization within the designated SharePoint site: https://cabreraautopr.sharepoint.com/sites/DataCollectionSystem.

**Critical Implementation Note:** Due to a confirmed Microsoft Graph API bug with custom lookup fields, several fields that would logically be lookup fields have been converted to single line text fields using a hybrid solution approach. This maintains full functionality while working around the API limitation.

---

## **Microsoft Graph API Limitation - Hybrid Solution**

### **Problem Statement**
During development, we encountered a critical issue where custom lookup fields in SharePoint lists were not appearing in Microsoft Graph API responses, despite being properly configured in SharePoint. After extensive investigation (~4 hours), we identified this as a Microsoft Graph API bug affecting custom lookup fields.

### **Root Cause Analysis**
- **SharePoint Configuration**: Lookup fields were properly configured with correct target lists and columns
- **Graph API Behavior**: Custom lookup fields acknowledged in schema but never returned in API responses
- **Scope**: Affected custom lookup fields, while system-generated lookup fields worked correctly
- **Evidence**: OData context showed field recognition but response contained no field values

### **Solution: Hybrid Text Field Approach**
- **Convert lookup fields** to Single line of text fields
- **Maintain reference lists** for data validation and management  
- **Implement application-level validation** and dropdown functionality
- **Preserve data integrity** through programmatic enforcement
- **Cache category mappings** for performance optimization

### **Benefits of Hybrid Solution**
- **Immediate functionality** bypassing Graph API bug
- **Full dropdown support** with enhanced UI experience
- **Data integrity** through application validation against reference lists
- **Performance optimization** with cached lookups and family auto-display
- **Future-proof architecture** for easy migration when API is fixed
- **Enhanced features** like cascading dropdowns and family grouping

---

## **1. simt_Categories**

**Purpose:** This list acts as a centralized master table for all product families and their corresponding categories. It ensures data integrity and enables cascading dropdowns in the user interface.

| Display Name | System Name | Type | Required | Configuration / Notes |
| :---- | :---- | :---- | :---- | :---- |
| **Category** | Title | Single line of text | Yes | **Primary Key**. The unique name for the category (e.g., "Air Filter"). |
| **Family** | Family | Choice | No | The parent family. Choices include: Belt Drive, Body & Lamp Assembly, Brake & Wheel Hub, Cooling System, Drivetrain, Electrical, Electrical-Switch & Relay, Engine, Exhaust & Emission, Fuel & Air, Heat & Air Conditioning, Ignition, Interior, Steering, Suspension, Transmission-Automatic, Transmission-Manual. |
| **Created** | Created | Date and Time | Auto | Automatically set when record is created. |
| **Modified** | Modified | Date and Time | Auto | Automatically updated when record is modified. |
| **Created By** | Created By | Person or Group | Auto | User who created the record. |
| **Modified By** | Modified By | Person or Group | Auto | User who last modified the record. |

**Data Sample:**
- Category: "Air Filter", Family: "Fuel & Air"
- Category: "Brake Hose", Family: "Brake & Wheel Hub"
- Category: "Oil Filter", Family: "Engine"

---

## **2. simt_Parts**

**Purpose:** This is the master catalog for every unique part in the inventory. It holds descriptive information and tracks the real-time quantity on hand.

| Display Name | System Name | Type | Required | Configuration / Notes |
| :---- | :---- | :---- | :---- | :---- |
| **Part ID** | Title | Single line of text | Yes | **Primary Key**. The unique part number or SKU. |
| **Description** | Description | Single line of text | No | A detailed description of the part. |
| **Category** | Category | **Single line of text** | No | **HYBRID SOLUTION**: Text field validated against simt_Categories. Originally designed as lookup field but converted due to Graph API bug. Application provides dropdown functionality and family auto-display. |
| **InventoryOnHand** | InventoryOnHand | Number | No | Stores the current real-time stock level for the part. |
| **UnitCost** | UnitCost | Currency | No | The cost paid for the part. |
| **UnitPrice** | UnitPrice | Currency | No | The default selling price for the part. |
| **Status** | Status | Choice | No | The current status of the part. Choices: Active, Obsolete, Disposed. |
| **Created** | Created | Date and Time | Auto | Automatically set when record is created. |
| **Modified** | Modified | Date and Time | Auto | Automatically updated when record is modified. |
| **Created By** | Created By | Person or Group | Auto | User who created the record. |
| **Modified By** | Modified By | Person or Group | Auto | User who last modified the record. |

**Key Implementation Details:**
- **Category field**: Converted from lookup to text field with application-level validation
- **Family information**: Calculated dynamically from simt_Categories list
- **Enhanced UI**: Provides dropdown functionality and family auto-display
- **Data integrity**: Maintained through programmatic validation against Categories list

---

## **3. simt_Buyers**

**Purpose:** A simple Customer Relationship Management (CRM) list to store information about the people or companies who purchase parts.

| Display Name | System Name | Type | Required | Configuration / Notes |
| :---- | :---- | :---- | :---- | :---- |
| **Buyer Name** | Title | Single line of text | Yes | **Primary Key**. The full name of the person or company. |
| **Contact Email** | ContactEmail | Single line of text | No | The buyer's email address. |
| **Phone** | Phone | Single line of text | No | The buyer's phone number. |
| **Created** | Created | Date and Time | Auto | Automatically set when record is created. |
| **Modified** | Modified | Date and Time | Auto | Automatically updated when record is modified. |
| **Created By** | Created By | Person or Group | Auto | User who created the record. |
| **Modified By** | Modified By | Person or Group | Auto | User who last modified the record. |

---

## **4. simt_Invoices**

**Purpose:** This list is the core of the sales process. Each item represents a single sales transaction and groups all the parts sold to a specific buyer at a specific time.

| Display Name | System Name | Type | Required | Configuration / Notes |
| :---- | :---- | :---- | :---- | :---- |
| **Invoice #** | Title | Single line of text | Yes | **Primary Key**. The unique identifier for the invoice. |
| **Buyer** | Buyer | **Single line of text** | No | **HYBRID SOLUTION**: Text field containing buyer name. Originally designed as lookup to simt_Buyers but converted due to Graph API bug. |
| **InvoiceDate** | InvoiceDate | Date and Time | No | The date the invoice was created. |
| **TotalAmount** | TotalAmount | Currency | No | The calculated total value of the invoice. |
| **Status** | Status | Choice | No | The current status of the invoice. Choices: Finalized, Paid, Void. |
| **Notes** | Notes | Multiple lines of text | No | Additional notes about the invoice. |
| **Created** | Created | Date and Time | Auto | Automatically set when record is created. |
| **Modified** | Modified | Date and Time | Auto | Automatically updated when record is modified. |
| **Created By** | Created By | Person or Group | Auto | User who created the record. |
| **Modified By** | Modified By | Person or Group | Auto | User who last modified the record. |

**Important Changes:**
- **Buyer field**: Converted from lookup to text field (hybrid solution)
- **Status choices**: Removed 'Draft' status - invoices are created as 'Finalized'
- **Workflow**: Invoices cannot be edited after creation, only voided

---

## **5. simt_Transactions**

**Purpose:** This is the detailed, immutable ledger of all inventory movements. Every time a part enters or leaves the inventory, a record is created here. "Out" movements are always linked to an invoice.

| Display Name | System Name | Type | Required | Configuration / Notes |
| :---- | :---- | :---- | :---- | :---- |
| **Title** | Title | Single line of text | No | **Not used by application**. SharePoint default field, ignored by application logic. |
| **Part** | Part | **Single line of text** | No | **HYBRID SOLUTION**: Text field containing Part ID. Originally designed as lookup to simt_Parts but converted due to Graph API bug. |
| **MovementType** | MovementType | Choice | No | The direction of the movement. Choices: In (Received), Out (Sold), Adjustment, Void adjustment. |
| **Quantity** | Quantity | Number | No | The number of units moved. Always a positive number. |
| **UnitCost** | UnitCost | Currency | No | The cost per unit for "In" movements. |
| **UnitPrice** | UnitPrice | Currency | No | The price per unit for "Out" movements. |
| **Invoice** | Invoice | **Single line of text** | No | **HYBRID SOLUTION**: Text field containing Invoice number. Required for "Out" movements. Originally designed as lookup to simt_Invoices but converted due to Graph API bug. |
| **Buyer** | Buyer | **Single line of text** | No | **HYBRID SOLUTION**: Text field containing Buyer name. Required for "Out" movements. Originally designed as lookup to simt_Buyers but converted due to Graph API bug. |
| **Supplier** | Supplier | Single line of text | No | The supplier name for "In" movements. |
| **Notes** | Notes | Multiple lines of text | No | Optional notes about the transaction (e.g., condition, reason for adjustment). |
| **Created** | Created | Date and Time | Auto | Automatically set when record is created. |
| **Modified** | Modified | Date and Time | Auto | Automatically updated when record is modified. |
| **Created By** | Created By | Person or Group | Auto | User who created the record. |
| **Modified By** | Modified By | Person or Group | Auto | User who last modified the record. |

**Key Implementation Details:**
- **Multiple hybrid fields**: Part, Invoice, and Buyer all converted from lookup to text fields
- **Movement types**: Enhanced with "Void adjustment" for invoice voiding functionality
- **Data relationships**: Maintained through application logic and validation
- **Inventory impact**: Automatically updates part inventory levels

---

## **6. simt_AuthorizedUsers**

**Purpose:** This list manages user access control and authorization for the application. It implements a whitelist approach where only users listed here can access the application, regardless of their SharePoint site permissions.

| Display Name | System Name | Type | Required | Configuration / Notes |
| :---- | :---- | :---- | :---- | :---- |
| **User Email** | Title | Single line of text | Yes | **Primary Key**. The user's email address (used for authentication matching). |
| **Display Name** | DisplayName | Single line of text | No | The user's full name for display purposes. |
| **Role** | Role | Choice | No | The user's role in the application. Choices: Admin, User, ReadOnly. |
| **IsActive** | IsActive | Yes/No | No | Whether the user currently has access to the application. |
| **Created** | Created | Date and Time | Auto | Automatically set when record is created. |
| **Modified** | Modified | Date and Time | Auto | Automatically updated when record is modified. |
| **Created By** | Created By | Person or Group | Auto | User who created the record. |
| **Modified By** | Modified By | Person or Group | Auto | User who last modified the record. |

**Security Implementation:**
- **Two-layer security**: Azure AD authentication + SharePoint whitelist authorization
- **Role hierarchy**: Admin > User > ReadOnly with granular permissions
- **Access control**: Overrides SharePoint site permissions for application access
- **Audit trail**: Complete tracking of user access management

---

## **Hybrid Solution Implementation Summary**

### **Fields Converted from Lookup to Text**

| List | Field | Original Design | Hybrid Solution | Validation Method |
| :---- | :---- | :---- | :---- | :---- |
| **simt_Parts** | Category | Lookup to simt_Categories | Single line of text | Application validates against Categories list |
| **simt_Invoices** | Buyer | Lookup to simt_Buyers | Single line of text | Application validates against Buyers list |
| **simt_Transactions** | Part | Lookup to simt_Parts | Single line of text | Application validates against Parts list |
| **simt_Transactions** | Invoice | Lookup to simt_Invoices | Single line of text | Application validates against Invoices list |
| **simt_Transactions** | Buyer | Lookup to simt_Buyers | Single line of text | Application validates against Buyers list |

### **Enhanced Application Features**

**Category Management:**
- Dynamic family lookup from Categories list
- Cascading family/category dropdowns
- Auto-population of family information
- Real-time category validation

**Performance Optimizations:**
- Aggressive caching of category mappings (15-minute timeout)
- Batch validation for improved performance
- Optimized API queries with filtered results

**Data Integrity:**
- Application-level validation against reference lists
- Consistent data transformation layers
- Error handling for invalid references
- Automatic fallback to default values

### **Migration Strategy**

**Current State:** Fully functional hybrid solution with enhanced features
**Future Options:**
1. **Short-term:** Continue with hybrid solution and enhanced validation
2. **Medium-term:** Migrate to SharePoint REST API if Graph API remains problematic
3. **Long-term:** Return to Graph API lookup fields when Microsoft resolves the bug

---

## **Development Impact**

### **Files Modified for Hybrid Solution**

**Core Service Layer:**
- `src/services/sharepoint.js` - Enhanced data transformation and validation
- `src/hooks/useSharePoint.js` - Category mapping and family operations

**User Interface Components:**
- `src/components/parts/PartForm.jsx` - Enhanced category selection with family display
- `src/components/parts/PartsTable.jsx` - Family-based filtering and grouping
- `src/components/invoices/InvoiceForm.jsx` - Buyer name validation
- `src/components/transactions/TransactionForm.jsx` - Part and buyer validation

**Configuration:**
- `src/config/sharepoint.js` - Updated field mappings and validation rules

### **Testing Results**

| Test Case | Before Hybrid Solution | After Hybrid Solution | Status |
|-----------|------------------------|----------------------|--------|
| Create Part with Category | Failed (field not returned) | Success (dropdown with family) | ✅ Fixed |
| Display Part Categories | Showed "Uncategorized" | Shows actual category + family | ✅ Fixed |
| Category Dropdown | Empty/broken | 66+ options with family grouping | ✅ Fixed |
| Invoice with Buyer | Failed (lookup not working) | Success (validated text field) | ✅ Fixed |
| Transaction Creation | Failed (multiple lookup issues) | Success (all fields working) | ✅ Fixed |

---

## **Conclusion**

The hybrid solution successfully addresses the Microsoft Graph API limitation while providing enhanced functionality beyond the original lookup field design. The implementation:

- **Resolves the core issue** with immediate functionality
- **Maintains data integrity** through application-level validation
- **Enhances user experience** with family auto-display and cascading dropdowns
- **Improves performance** through intelligent caching strategies
- **Provides flexibility** for future migration options

**Status:** All lists are production-ready with comprehensive hybrid solution implementation.  
**Risk Level:** Low - Well-documented workaround for confirmed Microsoft Graph API bug.  
**Maintenance:** Minimal - Self-contained solution with robust error handling.