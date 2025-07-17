# PartDetails Access Control Matrix

## User Role Hierarchy
**Admin > User > ReadOnly**

| Editing Point | Editing Type | Type | Admin | User | ReadOnly |
|---------------|--------------|------|-------|------|----------|
| Edit Part button | Action Buttons | Primary Action | ✅ | ✅ | ❌ |
| Delete Part button | Action Buttons | Destructive Action | ✅ | ✅ | ❌ |
| Create Transaction button (quick action) | Action Buttons | Primary Action | ✅ | ✅ | ❌ |
| Overview tab button | Tab Interactions | Navigation Control | ✅ | ✅ | ✅ |
| Transaction History tab button | Tab Interactions | Navigation Control | ✅ | ✅ | ✅ |
| Related Parts tab button | Tab Interactions | Navigation Control | ✅ | ✅ | ✅ |
| Switch between Overview/History/Related tabs | Tab Interactions | System Behavior | ✅ | ✅ | ✅ |
| View transaction details (linked) | Tab Interactions | Navigation Link | ✅ | ✅ | ✅ |
| Delete confirmation modal | Modal Interactions | Modal Display | ✅ | ❌ | ❌ |
| Confirm Delete button (in modal) | Modal Interactions | Destructive Action | ✅ | ❌ | ❌ |
| Cancel Delete button (in modal) | Modal Interactions | Secondary Action | ✅ | ❌ | ❌ |

## Access Summary

### Admin Access (11/11 points)
- **Full access** to all editing points
- Can edit, delete, and create transactions
- Complete modal and tab functionality

### User Access (8/11 points)
- **Standard operations** - edit and create transactions
- **Cannot delete** parts for data protection
- Full navigation and viewing capabilities

### ReadOnly Access (5/11 points)
- **View-only** access to tabs and details
- Can navigate between tabs and view transaction details
- Cannot perform any destructive or editing actions

## Risk Classification

| Risk Level | Points | User Types | Examples |
|------------|--------|------------|----------|
| **High Risk** | 4 | Admin only | Delete Part, Delete modal, Confirm Delete |
| **Medium Risk** | 2 | Admin, User only | Edit Part, Create Transaction |
| **Low Risk** | 5 | All users | Tab navigation, view details, tab switching |

## Implementation Notes

- **Delete operations** restricted to Admin only to prevent accidental data loss
- **Transaction creation** from part details requires User+ permissions
- **Tab navigation** available to all users for information access
- **Modal interactions** only accessible to users with delete permissions
- **Quick transaction creation** maintains inventory audit trail