# Complete File-by-File Editing Points Inventory

## 1. **PartForm.jsx** (`/parts/new`, `/parts/:id/edit`)

### Form Inputs:
- ✏️ **Part ID input** (disabled in edit mode)
- ✏️ **Description input** 
- ✏️ **Category dropdown** (from Categories list)
- ✏️ **Unit Cost input**
- ✏️ **Unit Price input**  
- ✏️ **Inventory On Hand input** (create mode only)
- ✏️ **Status dropdown** (Active/Obsolete/Disposed)
- ✏️ **Location input**
- ✏️ **Notes textarea**

### Action Buttons:
- 🔵 **Create Part button** (with transaction creation)
- 🔵 **Update Part button**
- ⚪ **Cancel button**
- 🔗 **View Details link** (edit mode only)

### Behaviors:
- 📝 **Real-time validation**
- 📝 **Category-to-family mapping**
- 📝 **Duplicate Part ID checking**
- 📝 **Automatic transaction creation** (for initial inventory)

---

## 2. **PartsTable.jsx** (`/parts`)

### Header Actions:
- 🔵 **Add New Part button**
- 🔍 **Search input**
- 🔍 **Family filter dropdown**
- 🔍 **Category filter dropdown** 
- 🔍 **Status filter dropdown**
- 🔍 **Inventory level filter dropdown**
- ⚪ **Clear filters button**

### Bulk Operations:
- ☑️ **Select All checkbox**
- ☑️ **Individual row checkboxes**
- 🔴 **Bulk Delete button**
- 📋 **Export selected button**

### Row Actions:
- 🔗 **View part link** (Part ID clickable)
- 🔵 **Edit button** (per row)
- 🔴 **Individual delete** (via bulk selection)

### Interactions:
- 📊 **Column sorting** (clickable headers)
- 🔍 **Real-time search filtering**
- 📱 **Responsive table controls**

---

## 3. **PartDetails.jsx** (`/parts/:id`)

### Action Buttons:
- 🔵 **Edit Part button**
- 🔴 **Delete Part button**  
- 🔵 **Create Transaction button** (quick action)
- 📊 **Transaction History tab**

### Tab Interactions:
- 📊 **Switch between Overview/History tabs**
- 📋 **View transaction details** (linked)

---

## 4. **BuyerForm.jsx** (`/buyers/new`, `/buyers/:id/edit`)

### Form Inputs:
- ✏️ **Buyer Name input**
- ✏️ **Contact Email input**
- ✏️ **Phone input**
- ✏️ **Address textarea**
- ✏️ **Notes textarea**

### Action Buttons:
- 🔵 **Create Buyer button**
- 🔵 **Update Buyer button**
- ⚪ **Cancel button**

### Behaviors:
- 📝 **Email validation**
- 📝 **Phone formatting**
- 📝 **Required field validation**

---

## 5. **BuyersTable.jsx** (`/buyers`)

### Header Actions:
- 🔵 **Add Buyer button**
- 🔍 **Search input**
- 🔽 **Filters toggle button**

### Filter Controls:
- 🔍 **Has Email filter dropdown**
- 🔍 **Has Phone filter dropdown**
- ⚪ **Clear filters button**

### Bulk Operations:
- ☑️ **Select All checkbox**
- ☑️ **Individual row checkboxes**
- 🔴 **Delete Selected button**
- ⚪ **Clear Selection button**

### Row Actions:
- 🔵 **Edit buyer button** (per row)
- 📧 **Email link** (clickable)
- 📞 **Phone link** (clickable)

### Modal Interactions:
- ❗ **Delete confirmation modal**
- 🔴 **Confirm Delete button** (in modal)
- ⚪ **Cancel Delete button** (in modal)

---

## 6. **InvoiceForm.jsx** (`/invoices/new`)

### Form Inputs:
- ✏️ **Invoice Number input** (auto-generated)
- 🔽 **Buyer dropdown selection**
- 📅 **Invoice Date input**
- ✏️ **Notes textarea**

### Line Items Management:
- 🔵 **Add Line Item button**
- 🔽 **Part selection dropdown** (per line)
- ✏️ **Quantity input** (per line)
- ✏️ **Unit Price input** (per line)
- 🔴 **Remove Line Item button** (per line)

### Action Buttons:
- 🔵 **Finalize Invoice button** (creates invoice + transactions)
- ⚪ **Cancel button**

### Behaviors:
- 🔄 **Dynamic line item addition/removal**
- 💰 **Automatic total calculation**
- 📝 **Inventory validation**
- 📝 **Buyer validation**

---

## 7. **InvoiceList.jsx** (`/invoices`)

### Header Actions:
- 🔵 **Create Invoice button**
- 🔍 **Search input**
- 🔽 **Status filter dropdown**
- 🔽 **Buyer filter dropdown**
- 📊 **Export button**
- 🔄 **Refresh button**

### Row Actions:
- 🔗 **View Invoice link** (Invoice Number clickable)
- 🔴 **Void Invoice button** (per row)

### Interactions:
- 📊 **Column sorting**
- 🔍 **Real-time filtering**

---

## 8. **InvoiceDetails.jsx** (`/invoices/:id`)

### Action Buttons:
- 🔴 **Void Invoice button** (ADMIN ONLY)
- 🖨️ **Print Invoice button**
- 📊 **Status update functionality**

### Behaviors:
- 🔄 **Dynamic line items display**
- 💰 **Automatic total calculations**
- 📋 **Void adjustment tracking**

---

## 9. **TransactionForm.jsx** (`/transactions/new`)

### Form Inputs:
- 🔽 **Transaction Type dropdown** (In/Out/Adjustment)
- 🔽 **Part selection dropdown**
- ✏️ **Quantity input**
- 📅 **Receipt Date input**
- ✏️ **Supplier input** (In transactions)
- ✏️ **Notes textarea**

### Action Buttons:
- 🔵 **Log Transaction button**
- ⚪ **Cancel button**

### Behaviors:
- 🔄 **Transaction type switching**
- 📝 **Inventory impact validation**
- 💰 **Unit cost/price handling**
- 📝 **Required field validation**

---

## 10. **TransactionHistory.jsx** (`/transactions`)

### Header Actions:
- 🔵 **Log Inbound Parts button**
- 🔍 **Search input**
- 🔽 **Movement Type filter dropdown**
- 🔽 **Part filter dropdown**
- 📅 **Date range filter**
- 📊 **Export button**

### Row Interactions:
- 🔗 **Part ID link** (to parts search)
- 🔗 **Invoice link** (if applicable)
- 📋 **View transaction details**

### Behaviors:
- 📊 **Column sorting**
- 🔍 **Real-time filtering**
- 📊 **Data export functionality**

---

## 11. **Dashboard.jsx** (`/`)

### Interactive Elements:
- 📊 **Chart type toggle buttons** (Family/Category)
- 📊 **View mode toggle buttons** (Value/Quantity)
- 🔗 **Part detail links** (from charts/tables)
- 🔄 **Data refresh actions**

### Click Behaviors:
- 🔗 **"View details" buttons** (for transactions)
- 📋 **Chart interaction** (clickable elements)

---

## 12. **Layout.jsx** (Navigation & Global Actions)

### Navigation Menu:
- 🔗 **Dashboard link**
- 🔗 **Parts menu** (with submenu)
  - 🔗 **All Parts link**
  - 🔗 **Add New Part link**
- 🔗 **Invoices menu** (with submenu)
  - 🔗 **All Invoices link**
  - 🔗 **Create Invoice link**
- 🔗 **Buyers menu** (with submenu)
  - 🔗 **All Buyers link**
  - 🔗 **Add New Buyer link**
- 🔗 **Transactions menu** (with submenu)
  - 🔗 **Transaction History link**
  - 🔗 **Log Inbound Parts link**
- 🔗 **External Lookup link**

### Header Actions:
- 📱 **Mobile menu toggle**
- 🔽 **Quick Add dropdown**
  - 🔗 **Add Part shortcut**
  - 🔗 **Add Buyer shortcut**
  - 🔗 **Create Invoice shortcut**
  - 🔗 **Log Transaction shortcut**

### User Actions:
- 🚪 **Sign Out button**
- 👤 **User profile display** (clickable)

### Interactions:
- 🔽 **Submenu toggles**
- 📱 **Sidebar show/hide**
- 🔄 **Navigation state management**

---

## 13. **ExternalLookup.jsx** (`/external-lookup`)

### Search Interface:
- ✏️ **Search term input**
- 🔵 **Search button**
- 🔽 **Provider selection buttons** (RockAuto/Google/Amazon/eBay)
- 🔵 **Search All button**

### History Management:
- 🔗 **Recent searches buttons** (clickable)
- ⚪ **Clear history button**

### Quick Actions:
- 🔗 **Quick search suggestions** (pre-defined terms)

### Behaviors:
- 🔄 **External URL opening**
- 💾 **Search history persistence**
- 🔍 **Enhanced search term processing**

---

## 14. **TestPage.jsx** (`/parts/test-page`)

### Solution Selection:
- 🔘 **Solution option buttons** (radio-style)
- 🔵 **Implementation action buttons**
- 📋 **Expand/collapse solution details**

### Interactive Elements:
- 🔄 **Toast notifications**
- ✏️ **Test form interactions**

---

## 15. **UnauthorizedPage.jsx** (Auth Error Handling)

### Action Buttons:
- 🔄 **Retry Authorization button**
- 🚪 **Sign Out button**

### Behaviors:
- 🔄 **Manual auth retry**
- 🧹 **Cache cleanup on logout**

---

## SUMMARY BY INTERACTION TYPE

### **Text Inputs (27 total):**
- Part ID, Description, Location, Notes (PartForm)
- Unit Cost, Unit Price, Inventory (PartForm)
- Buyer Name, Email, Phone, Address, Notes (BuyerForm)
- Invoice Number, Notes (InvoiceForm)
- Quantity, Unit Price (InvoiceForm line items)
- Quantity, Supplier, Notes (TransactionForm)
- Search fields (5 different components)

### **Dropdown Selectors (15 total):**
- Category, Status (PartForm)
- Family, Category, Status, Inventory filters (PartsTable)
- Buyer, Part selections (InvoiceForm)
- Email/Phone filters (BuyersTable)
- Transaction Type, Part (TransactionForm)
- Status, Buyer, Movement Type filters (Lists)

### **Action Buttons (35+ total):**
- Primary actions: Create, Update, Save, Finalize (12)
- Secondary actions: Cancel, Clear, Refresh (8)  
- Destructive actions: Delete, Void, Remove (8)
- Navigation actions: Edit, View, Back (7+)

### **Selection Controls (12 total):**
- Individual checkboxes (PartsTable, BuyersTable)
- Select All checkboxes (2)
- Radio buttons (TestPage)
- Toggle buttons (Dashboard, Layout)

### **Modal Interactions (4 total):**
- Delete confirmation (PartsTable, BuyersTable)
- Void confirmation (InvoiceDetails)
- Quick Add dropdown (Layout)

### **Dynamic Content (8 areas):**
- Line item addition/removal (InvoiceForm)
- Filter show/hide (multiple tables)
- Submenu expansion (Layout)
- Tab switching (PartDetails)

---

## TOTAL EDITING POINTS: **89 distinct interaction points**

- **High Risk (Admin only):** 12 points
- **Medium Risk (User level):** 45 points  
- **Low Risk (ReadOnly):** 32 points