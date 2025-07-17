# InvoiceList Access Control Matrix

## User Role Hierarchy
**Admin > User > ReadOnly**

| Editing Point | Editing Type | Type | Admin | User | ReadOnly |
|---------------|--------------|------|-------|------|----------|
| Create Invoice button | Header Actions | Primary Action | ✅ | ✅ | ❌ |
| Search input | Header Actions | Search Input | ✅ | ✅ | ✅ |
| Status filter dropdown | Header Actions | Filter Dropdown | ✅ | ✅ | ✅ |
| Buyer filter dropdown | Header Actions | Filter Dropdown | ✅ | ✅ | ✅ |
| Export button | Header Actions | Data Export | ✅ | ✅ | ✅ |
| Refresh button | Header Actions | Secondary Action | ✅ | ✅ | ✅ |
| View Invoice link (Invoice Number clickable) | Row Actions | Navigation Link | ✅ | ✅ | ✅ |
| Void Invoice button (per row) | Row Actions | Financial Action | ✅ | ❌ | ❌ |
| Void confirmation modal | Modal Interactions | Modal Display | ✅ | ❌ | ❌ |
| Confirm Void button (in modal) | Modal Interactions | Financial Action | ✅ | ❌ | ❌ |
| Cancel Void button (in modal) | Modal Interactions | Secondary Action | ✅ | ❌ | ❌ |
| Column sorting (clickable headers) | Interactions | Sort Control | ✅ | ✅ | ✅ |
| Real-time filtering | Interactions | System Behavior | ✅ | ✅ | ✅ |

## Access Summary

### Admin Access (13/13 points)
- **Full access** including void operations
- Can reverse financial transactions
- Complete invoice management

### User Access (9/13 points)
- **Cannot void invoices** - financial protection
- Full viewing, searching, and creation access
- Standard business operations

### ReadOnly Access (9/13 points)
- **View and search only**
- Cannot create or void invoices
- Data access for reporting/reference

## Risk Classification

| Risk Level | Points | User Types | Examples |
|------------|--------|------------|----------|
| **High Risk** | 4 | Admin only | Void operations, void modal |
| **Medium Risk** | 1 | Admin, User only | Create Invoice |
| **Low Risk** | 8 | All users | Search, filters, sorting, navigation |

## Implementation Notes

- **Void operations** restricted to Admin only - reverses inventory transactions
- **Invoice creation** requires User+ permissions for business control
- **Search/filter/export** available to all for data transparency
- **Financial actions** have highest security restrictions