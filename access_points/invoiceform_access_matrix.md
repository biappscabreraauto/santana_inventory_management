# InvoiceForm Access Control Matrix

## User Role Hierarchy
**Admin > User > ReadOnly**

| Editing Point | Editing Type | Type | Admin | User | ReadOnly |
|---------------|--------------|------|-------|------|----------|
| Invoice Number input (auto-generated) | Form Inputs | Display Field | ✅ | ✅ | ✅ |
| Buyer dropdown selection | Form Inputs | Dropdown Selection | ✅ | ✅ | ❌ |
| Invoice Date input | Form Inputs | Date Input | ✅ | ✅ | ❌ |
| Notes textarea | Form Inputs | Text Area | ✅ | ✅ | ❌ |
| Add Line Item button | Line Items Management | Primary Action | ✅ | ✅ | ❌ |
| Part selection dropdown (per line) | Line Items Management | Dropdown Selection | ✅ | ✅ | ❌ |
| Quantity input (per line) | Line Items Management | Numeric Input | ✅ | ✅ | ❌ |
| Unit Price input (per line) | Line Items Management | Numeric Input | ✅ | ✅ | ❌ |
| Remove Line Item button (per line) | Line Items Management | Destructive Action | ✅ | ✅ | ❌ |
| Finalize Invoice button (creates invoice + transactions) | Action Buttons | Financial Action | ✅ | ✅ | ❌ |
| Cancel button | Action Buttons | Secondary Action | ✅ | ✅ | ✅ |
| Dynamic line item addition/removal | Behaviors | System Behavior | ✅ | ✅ | ✅ |
| Automatic total calculation | Behaviors | System Behavior | ✅ | ✅ | ✅ |
| Inventory validation | Behaviors | Validation Behavior | ✅ | ✅ | ✅ |
| Buyer validation | Behaviors | Validation Behavior | ✅ | ✅ | ✅ |

## Access Summary

### Admin Access (15/15 points)
- **Full access** to all editing points
- Can create invoices and process sales transactions
- All validation and calculation behaviors active

### User Access (15/15 points)
- **Full access** to all editing points
- Can create invoices and process sales transactions
- Standard business operations enabled

### ReadOnly Access (6/15 points)
- **View-only** access to invoice data
- Cannot create invoices or process sales
- System behaviors remain active for consistency
- Cancel navigation available

## Risk Classification

| Risk Level | Points | User Types | Examples |
|------------|--------|------------|----------|
| **High Risk** | 1 | Admin, User only | Finalize Invoice (creates financial transactions) |
| **Medium Risk** | 8 | Admin, User only | Form inputs, line item management |
| **Low Risk** | 6 | All users | Display fields, behaviors, cancel |

## Implementation Notes

- **Financial transactions** restricted to Admin/User only for audit control
- **Inventory impact** through invoice finalization requires User+ permissions
- **Line item management** disabled for ReadOnly to prevent accidental changes
- **Validation behaviors** preserved for all users for data consistency
- **Auto-generated fields** remain visible to all users for transparency