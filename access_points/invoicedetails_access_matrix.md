# InvoiceDetails Access Control Matrix

## User Role Hierarchy
**Admin > User > ReadOnly**

| Editing Point | Editing Type | Type | Admin | User | ReadOnly |
|---------------|--------------|------|-------|------|----------|
| Void Invoice button | Action Buttons | Financial Action | ✅ | ❌ | ❌ |
| Print Invoice button | Action Buttons | Print Action | ✅ | ✅ | ✅ |
| Status update functionality (Finalized) | Action Buttons | Status Action | ✅ | ✅ | ❌ |
| Void confirmation modal | Modal Interactions | Modal Display | ✅ | ❌ | ❌ |
| Confirm Void button (in modal) | Modal Interactions | Financial Action | ✅ | ❌ | ❌ |
| Cancel Void button (in modal) | Modal Interactions | Secondary Action | ✅ | ❌ | ❌ |
| Dynamic line items display | Behaviors | System Behavior | ✅ | ✅ | ✅ |
| Automatic total calculations | Behaviors | System Behavior | ✅ | ✅ | ✅ |
| Void adjustment tracking | Behaviors | System Behavior | ✅ | ✅ | ✅ |

## Access Summary

### Admin Access (9/9 points)
- **Full access** including void operations
- Can reverse financial transactions and update status
- Complete invoice management

### User Access (5/9 points)
- **Limited financial access** - can mark as paid but cannot void
- Can print and view invoice details
- Standard business operations

### ReadOnly Access (5/9 points)
- **View and print only**
- Cannot modify invoice status or void
- All display behaviors active

## Risk Classification

| Risk Level | Points | User Types | Examples |
|------------|--------|------------|----------|
| **High Risk** | 4 | Admin only | Void operations, void modal |
| **Medium Risk** | 1 | Admin, User only | Status updates |
| **Low Risk** | 4 | All users | Print, display behaviors |

## Implementation Notes

- **Void operations** restricted to Admin only - reverses inventory and creates adjustment transactions
- **Status updates** require User+ permissions for business workflow control
- **Print functionality** available to all users for record keeping
- **Display behaviors** preserved for transparency across all roles