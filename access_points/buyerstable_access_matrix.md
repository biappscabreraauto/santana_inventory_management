# BuyersTable Access Control Matrix

## User Role Hierarchy
**Admin > User > ReadOnly**

| Editing Point | Editing Type | Type | Admin | User | ReadOnly |
|---------------|--------------|------|-------|------|----------|
| Add Buyer button | Header Actions | Primary Action | ✅ | ✅ | ❌ |
| Search input | Header Actions | Search Input | ✅ | ✅ | ✅ |
| Filters toggle button | Header Actions | Toggle Control | ✅ | ✅ | ✅ |
| Has Email filter dropdown | Filter Controls | Filter Dropdown | ✅ | ✅ | ✅ |
| Has Phone filter dropdown | Filter Controls | Filter Dropdown | ✅ | ✅ | ✅ |
| Clear filters button | Filter Controls | Secondary Action | ✅ | ✅ | ✅ |
| Select All checkbox | Bulk Operations | Selection Control | ✅ | ✅ | ❌ |
| Individual row checkboxes | Bulk Operations | Selection Control | ✅ | ✅ | ❌ |
| Delete Selected button | Bulk Operations | Destructive Action | ✅ | ❌ | ❌ |
| Clear Selection button | Bulk Operations | Secondary Action | ✅ | ✅ | ❌ |
| Edit buyer button (per row) | Row Actions | Primary Action | ✅ | ✅ | ❌ |
| Email link (clickable) | Row Actions | Communication Link | ✅ | ✅ | ✅ |
| Phone link (clickable) | Row Actions | Communication Link | ✅ | ✅ | ✅ |
| Delete confirmation modal | Modal Interactions | Modal Display | ✅ | ❌ | ❌ |
| Confirm Delete button (in modal) | Modal Interactions | Destructive Action | ✅ | ❌ | ❌ |
| Cancel Delete button (in modal) | Modal Interactions | Secondary Action | ✅ | ❌ | ❌ |

## Access Summary

### Admin Access (16/16 points)
- **Full access** to all editing points
- Can perform bulk delete operations
- Complete buyer management capabilities

### User Access (11/16 points)
- **Limited destructive access** - cannot delete buyers
- Can create, edit, search, and filter
- Selection controls disabled to prevent confusion

### ReadOnly Access (8/16 points)
- **View and search only**
- Can filter, search, and use communication links
- Cannot create, edit, or delete buyers

## Risk Classification

| Risk Level | Points | User Types | Examples |
|------------|--------|------------|----------|
| **High Risk** | 3 | Admin only | Delete Selected, Delete modal interactions |
| **Medium Risk** | 5 | Admin, User only | Add Buyer, Edit buttons, Selection controls |
| **Low Risk** | 8 | All users | Search, filters, communication links |

## Implementation Notes

- **Bulk delete** restricted to Admin only for data protection
- **Selection controls** disabled for ReadOnly to prevent confusion
- **Communication links** (email/phone) preserved for all users
- **Edit functionality** requires User+ permissions
- **Search and filtering** available to all users for data access