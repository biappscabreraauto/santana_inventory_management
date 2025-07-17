# PartsTable Access Control Matrix

## User Role Hierarchy
**Admin > User > ReadOnly**

| Editing Point | Editing Type | Type | Admin | User | ReadOnly |
|---------------|--------------|------|-------|------|----------|
| Add New Part button | Header Actions | Primary Action | ✅ | ✅ | ❌ |
| Search input | Header Actions | Search Input | ✅ | ✅ | ✅ |
| Family filter dropdown | Header Actions | Filter Dropdown | ✅ | ✅ | ✅ |
| Category filter dropdown | Header Actions | Filter Dropdown | ✅ | ✅ | ✅ |
| Status filter dropdown | Header Actions | Filter Dropdown | ✅ | ✅ | ✅ |
| Inventory level filter dropdown | Header Actions | Filter Dropdown | ✅ | ✅ | ✅ |
| Clear filters button | Header Actions | Secondary Action | ✅ | ✅ | ✅ |
| Select All checkbox | Bulk Operations | Selection Control | ✅ | ✅ | ❌ |
| Individual row checkboxes | Bulk Operations | Selection Control | ✅ | ✅ | ❌ |
| Bulk Delete button | Bulk Operations | Destructive Action | ✅ | ❌ | ❌ |
| Export selected button | Bulk Operations | Data Export | ✅ | ✅ | ✅ |
| View part link (Part ID clickable) | Row Actions | Navigation Link | ✅ | ✅ | ✅ |
| Edit button (per row) | Row Actions | Primary Action | ✅ | ✅ | ❌ |
| Individual delete (via bulk selection) | Row Actions | Destructive Action | ✅ | ❌ | ❌ |
| Column sorting (clickable headers) | Interactions | Sort Control | ✅ | ✅ | ✅ |
| Real-time search filtering | Interactions | System Behavior | ✅ | ✅ | ✅ |
| Responsive table controls | Interactions | System Behavior | ✅ | ✅ | ✅ |

## Access Summary

### Admin Access (17/17 points)
- **Full access** to all editing points
- Can perform bulk delete operations
- Can manage all parts inventory

### User Access (14/17 points)
- **Limited destructive access** - cannot bulk delete or individual delete
- Can create, edit, search, filter, and export
- Standard user operations enabled

### ReadOnly Access (11/17 points)
- **View and search only** 
- Can filter, sort, search, and export data
- Cannot create, edit, or delete parts
- Navigation and data export retained

## Risk Classification

| Risk Level | Points | User Types | Examples |
|------------|--------|------------|----------|
| **High Risk** | 2 | Admin only | Bulk Delete, Individual Delete |
| **Medium Risk** | 4 | Admin, User only | Add New Part, Edit buttons, Selection controls |
| **Low Risk** | 11 | All users | Search, filters, sorting, navigation, export |

## Implementation Notes

- **Bulk delete** restricted to Admin only for data protection
- **Individual delete** restricted to Admin only (accessed via bulk selection)
- **Selection controls** disabled for ReadOnly to prevent confusion
- **Export functionality** available to all users for reporting needs
- **Navigation and filtering** preserved for all users for basic functionality