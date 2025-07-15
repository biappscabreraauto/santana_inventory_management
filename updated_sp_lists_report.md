# **SharePoint Lists Configuration Report**

Project: Santana Inventory Management Tool  
Date: July 15, 2025  
Status: All lists designed and ready for population with hybrid solution implementation.

### **Overview**

This report provides a detailed specification for each of the five SharePoint lists that form the data foundation for the inventory management application. All lists are prefixed with simt_ to ensure clear organization within the designated SharePoint site: https://cabreraautopr.sharepoint.com/sites/DataCollectionSystem.

**Important Note:** Due to a confirmed Microsoft Graph API bug with custom lookup fields, the Category field in simt_Parts has been converted to a text field using a hybrid solution approach. This maintains full functionality while working around the API limitation.

### **1. simt_Categories**

**Purpose:** This list acts as a centralized master table for all product families and their corresponding categories. It ensures data integrity and enables cascading dropdowns in the user interface.

| Display Name | System Name | Type | Configuration / Notes |
| :---- | :---- | :---- | :---- |
| **Category** | Title | Single line of text | **Primary Key**. The unique name for the category (e.g., "Air Filter"). |
| **Family** | Family | Choice | The parent family. Choices include: Belt Drive, Body & Lamp Assembly, Brake & Wheel Hub, Cooling System, Drivetrain, Electrical, Engine, etc. |

**Data Sample:**
- Category: "Air Filter", Family: "Fuel & Air"
- Category: "Brake Hose", Family: "Brake & Wheel Hub"
- Category: "Oil Filter", Family: "Engine"

### **2. simt_Parts (Modified for Hybrid Solution)**

**Purpose:** This is the master catalog for every unique part in the inventory. It holds descriptive information and tracks the real-time quantity on hand.

| Display Name | Type | Configuration / Notes |
| :---- | :---- | :---- |
| **Part ID** | Single line of text | **Primary Key**. The unique part number or SKU. Renamed from the default "Title" column. |
| **Description** | Multiple lines of text | A detailed description of the part. |
| **Category** | **Single line of text** | **HYBRID SOLUTION**: Changed from Lookup to text field due to Graph API bug. Application validates against simt_Categories list. |
| **InventoryOnHand** | Number | Stores the current real-time stock level for the part. |
| **UnitCost** | Currency | The cost paid for the part. |
| **UnitPrice** | Currency | The default selling price for the part. |
| **Status** | Choice | The current status of the part. Choices: Active, Obsolete, Disposed. |

**Important Changes:**
- **Category field converted from Lookup to Single line of text**
- **Family information calculated dynamically from simt_Categories**
- **Application-level validation ensures data integrity**
- **Enhanced UI provides dropdown functionality and family auto-display**

### **3. simt_Buyers**

**Purpose:** A simple Customer Relationship Management (CRM) list to store information about the people or companies who purchase parts.

| Display Name | System Name | Type | Configuration / Notes |
| :---- | :---- | :---- | :---- |
| **Buyer Name** | Title | Single line of text | **Primary Key**. The full name of the person or company. |
| **Contact Email** | ContactEmail | Single line of text | The buyer's email address. |
| **Phone** | Phone | Single line of text | The buyer's phone number. |

### **4. simt_Invoices**

**Purpose:** This list is the core of the sales process. Each item represents a single sales transaction and groups all the parts sold to a specific buyer at a specific time.

| Display Name | System Name | Type | Configuration / Notes |
| :---- | :---- | :---- | :---- |
| **Invoice #** | Title | Single line of text | **Primary Key**. The unique identifier for the invoice. |
| **Buyer** | Buyer | Lookup | Looks up to the simt_Buyers list. <br> • **Source List:** simt_Buyers <br> • **Source Column:** Buyer Name |
| **InvoiceDate** | InvoiceDate | Date and Time | The date the invoice was created. |
| **TotalAmount** | TotalAmount | Currency | The calculated total value of the invoice. |
| **Status** | Status | Choice | The current status of the invoice. Choices: Draft, Finalized, Paid, Void. |

### **5. simt_Transactions**

**Purpose:** This is the detailed, immutable ledger of all inventory movements. Every time a part enters or leaves the inventory, a record is created here. "Out" movements are always linked to an invoice.

| Display Name | Type | Configuration / Notes |
| :---- | :---- | :---- |
| **Title** | **Not in use** | **Ignore: application will not read from it or write to it** |
| **Part** | Lookup | Looks up to the simt_Parts list. <br> • **Source List:** simt_Parts <br> • **Source Column:** Part ID |
| **MovementType** | Choice | The direction of the movement. Choices: In (Received), Out (Sold). |
| **Quantity** | Number | The number of units moved. Always a positive number. |
| **Invoice** | Lookup | **Required for "Out" movements.** Looks up to the simt_Invoices list. <br> • **Source List:** simt_Invoices <br> • **Source Column:** Invoice # |
| **Buyer** | Lookup | **Required for "Out" movements.** Looks up to the simt_Buyers list. <br> • **Source List:** simt_Buyers <br> • **Source Column:** Buyer Name (Title) |
| **UnitCost** | Currency | The cost per unit for "In" movements. |
| **UnitPrice** | Currency | The price per unit for "Out" movements. |
| **Notes** | Multiple lines of text | Optional notes about the transaction (e.g., condition, reason for adjustment). |

---

## **Hybrid Solution Implementation**

### **Problem Statement**
Microsoft Graph API has a confirmed bug where custom lookup fields are not returned in API responses, despite being properly configured in SharePoint. This affected the Category field in simt_Parts, preventing proper functionality.

### **Solution Approach**
**Hybrid Text Field + Categories List Validation:**
- Convert Category field from Lookup to Single line of text
- Maintain simt_Categories list for data management
- Implement application-level validation and dropdown functionality
- Calculate Family information dynamically from Categories list

### **Benefits of Hybrid Solution**
- ✅ **Immediate functionality** - bypasses Graph API bug
- ✅ **Full dropdown support** - enhanced UI with category/family selection
- ✅ **Data integrity** - application validates against Categories list
- ✅ **Performance** - categories cached for fast lookups
- ✅ **Flexibility** - can add search, filtering, and cascading dropdowns
- ✅ **Future-proof** - can migrate to proper lookup when API is fixed

### **Trade-offs**
- ❌ **SharePoint UI** - manual text entry (users won't use this)
- ❌ **Referential integrity** - no database-level constraints
- ❌ **Native SharePoint features** - grouping, Power Platform integration

---

## **Files That Need Modifications**

### **🔧 Core Service Layer (2 files)**
```
src/services/sharepoint.js
src/hooks/useSharePoint.js
```

### **🎨 Components - Parts Management (3 files)**
```
src/components/parts/PartForm.jsx
src/components/parts/PartsTable.jsx
src/components/parts/PartDetails.jsx
```

### **📊 Components - Dashboard (1 file)**
```
src/components/dashboard/Dashboard.jsx
```

### **⚙️ Configuration (1 file)**
```
src/config/sharepoint.js
```

---

## **🔄 Modification Details by File**

### **1. src/services/sharepoint.js**
**Changes needed:**
- Remove `getCategoryIdByName()` function
- Update `transformSharePointItem()` for parts (remove lookup handling)
- Update `transformToSharePoint()` for parts (use direct text value)
- Update `createPart()` and `updatePart()` methods

### **2. src/hooks/useSharePoint.js**
**Changes needed:**
- Enhance `useCategories()` hook with:
  - `categoryMap` state for fast family lookups
  - `getFamilyByCategory()` function
  - Performance optimizations with caching

### **3. src/components/parts/PartForm.jsx**
**Changes needed:**
- Remove category ID resolution logic
- Add family auto-display when category selected
- Update validation to use category names instead of IDs
- Enhance UI with family information display
- Add cascading family/category dropdowns

### **4. src/components/parts/PartsTable.jsx**
**Changes needed:**
- Add Family column to the table
- Update filtering to support family-based filters
- Add cascading family/category filter dropdowns
- Update search to include family search
- Display family information alongside category

### **5. src/components/parts/PartDetails.jsx**
**Changes needed:**
- Add family display in part information section
- Update category display to show both category and family
- Enhance part overview with family context
- Update transaction history to show family information

### **6. src/components/dashboard/Dashboard.jsx**
**Changes needed:**
- Update any category-related queries or displays
- Add family-based analytics if needed
- Update summary cards to include family grouping

### **7. src/config/sharepoint.js**
**Changes needed:**
- Update `PARTS_SCHEMA` to reflect text field instead of lookup
- Remove category lookup references
- Update validation rules for text-based categories
- Add family-related configuration

---

## **🚀 Implementation Order**

### **Phase 1: Core Infrastructure (Foundation)**
1. **src/config/sharepoint.js** - Update schema definitions
2. **src/services/sharepoint.js** - Update service methods
3. **src/hooks/useSharePoint.js** - Enhance category hook

### **Phase 2: Components (User Interface)**
4. **src/components/parts/PartForm.jsx** - Add/edit functionality
5. **src/components/parts/PartsTable.jsx** - List view with family
6. **src/components/parts/PartDetails.jsx** - Detail view with family

### **Phase 3: Polish (Optional)**
7. **src/components/dashboard/Dashboard.jsx** - Dashboard updates

---

## **⚠️ SharePoint Manual Step Required**

**Before code changes**, you must:
1. Go to SharePoint site → simt_Parts list
2. Click Category column → Column Settings → Edit
3. Change from "Lookup" to "Single line of text"
4. Save changes

---

## **Enhanced Features with Hybrid Solution**

### **Family Auto-Display**
When user selects a category, the family is automatically displayed:
- Category: "Brake Hose" → Family: "Brake & Wheel Hub" (auto-populated)
- Category: "Air Filter" → Family: "Fuel & Air" (auto-populated)

### **Cascading Dropdowns**
- Select Family → Filter Categories → Auto-populate Family
- Enhanced user experience with logical hierarchy

### **Enhanced Filtering**
- Filter by Family OR Category
- Search across both category and family
- Combined family/category views

### **Data Validation**
- Real-time validation against Categories list
- Prevents invalid category entries
- Maintains data integrity through application logic

---

## **Future Considerations**

### **Migration Options**
1. **Short-term:** Keep hybrid solution with enhanced validation
2. **Medium-term:** Migrate to SharePoint REST API if needed
3. **Long-term:** Return to Graph API lookup when Microsoft fixes the bug

### **Monitoring**
- Track Microsoft Graph API updates for lookup field fixes
- Monitor application performance with hybrid solution
- Collect user feedback on enhanced UI features

---

## **Conclusion**

The hybrid solution successfully works around the Microsoft Graph API limitation while providing enhanced functionality. The implementation maintains all core business requirements while offering improved user experience through dynamic family display and cascading dropdowns.

**Status:** Ready for implementation
**Estimated Time:** 4-6 hours for complete implementation
**Risk Level:** Low (well-documented workaround for known issue)