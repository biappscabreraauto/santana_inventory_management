# TransactionHistory Access Control Matrix

## User Role Hierarchy
**Admin > User > ReadOnly**

| Editing Point | Editing Type | Type | Admin | User | ReadOnly |
|---------------|--------------|------|-------|------|----------|
| Log Inbound Parts button | Header Actions | Primary Action | ✅ | ✅ | ❌ |
| Search input | Header Actions | Search Input | ✅ | ✅ | ✅ |
| Movement Type filter dropdown | Header Actions | Filter Dropdown | ✅ | ✅ | ✅ |
| Date range filter | Header Actions | Filter Dropdown | ✅ | ✅ | ✅ |
| Export button | Header Actions | Data Export | ✅ | ✅ | ✅ |
| Refresh button | Header Actions | Secondary Action | ✅ | ✅ | ✅ |
| Part ID link (to parts search) | Row Interactions | Navigation Link | ✅ | ✅ | ✅ |
| Invoice link (if applicable) | Row Interactions | Navigation Link | ✅ | ✅ | ✅ |
| View transaction details | Row Interactions | Display Action | ✅ | ✅ | ✅ |
| Column sorting (clickable headers) | Behaviors | Sort Control | ✅ | ✅ | ✅ |
| Real-time filtering | Behaviors | System Behavior | ✅ | ✅ | ✅ |
| Data export functionality | Behaviors | System Behavior | ✅ | ✅ | ✅ |

## Access Summary

### Admin Access (12/12 points)
- **Full access** including transaction creation
- Complete transaction history management

### User Access (12/12 points)
- **Full access** including transaction creation
- Standard transaction operations

### ReadOnly Access (11/12 points)
- **Cannot create transactions** but retains full viewing/analysis capabilities
- Complete data access for reporting and auditing

## Risk Classification

| Risk Level | Points | User Types |
|------------|--------|------------|
| **Medium Risk** | 1 | Admin, User only |
| **Low Risk** | 11 | All users |

## Implementation Notes

- **Transaction creation** restricted to Admin/User for inventory control
- **All viewing/filtering** available to ReadOnly for transparency
- **Export functionality** preserved for all users for reporting needs