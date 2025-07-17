# TransactionForm Access Control Matrix

## User Role Hierarchy
**Admin > User > ReadOnly**

| Editing Point | Editing Type | Type | Admin | User | ReadOnly |
|---------------|--------------|------|-------|------|----------|
| Transaction Type dropdown (In/Out/Adjustment) | Form Inputs | Dropdown Selection | ✅ | ✅ | ❌ |
| Part selection dropdown | Form Inputs | Dropdown Selection | ✅ | ✅ | ❌ |
| Quantity input | Form Inputs | Numeric Input | ✅ | ✅ | ❌ |
| Receipt Date input | Form Inputs | Date Input | ✅ | ✅ | ❌ |
| Supplier input (In transactions) | Form Inputs | Text Input | ✅ | ✅ | ❌ |
| Notes textarea | Form Inputs | Text Area | ✅ | ✅ | ❌ |
| Log Transaction button | Action Buttons | Inventory Action | ✅ | ✅ | ❌ |
| Cancel button | Action Buttons | Secondary Action | ✅ | ✅ | ✅ |
| Transaction type switching | Behaviors | System Behavior | ✅ | ✅ | ✅ |
| Inventory impact validation | Behaviors | Validation Behavior | ✅ | ✅ | ✅ |
| Unit cost/price handling | Behaviors | System Behavior | ✅ | ✅ | ✅ |
| Required field validation | Behaviors | Validation Behavior | ✅ | ✅ | ✅ |

## Access Summary

### Admin Access (12/12 points)
- **Full access** to all transaction types
- Can create inventory adjustments
- Complete transaction management

### User Access (12/12 points)
- **Full access** to all transaction types
- Standard inventory operations
- Business workflow enabled

### ReadOnly Access (5/12 points)
- **View-only** access to form
- Cannot create transactions
- System behaviors active for consistency

## Risk Classification

| Risk Level | Points | User Types | Examples |
|------------|--------|------------|----------|
| **Medium Risk** | 7 | Admin, User only | Form inputs, Log Transaction |
| **Low Risk** | 5 | All users | Cancel, validation behaviors |

## Implementation Notes

- **Transaction creation** requires User+ permissions for inventory control
- **All transaction types** available to Admin/User for operational flexibility
- **Validation behaviors** preserved for data consistency
- **Form disabled** for ReadOnly to prevent inventory impacts