# PartForm Access Control Matrix

## User Role Hierarchy
**Admin > User > ReadOnly**

| Editing Point | Editing Type | Type | Admin | User | ReadOnly |
|---------------|--------------|------|-------|------|----------|
| Part ID input (create) | Form Inputs | Text Input | ✅ | ✅ | ❌ |
| Part ID input (edit - disabled) | Form Inputs | Display Field | ✅ | ✅ | ✅ |
| Description input | Form Inputs | Text Input | ✅ | ✅ | ❌ |
| Category dropdown | Form Inputs | Dropdown Selection | ✅ | ✅ | ❌ |
| Unit Cost input | Form Inputs | Numeric Input | ✅ | ✅ | ❌ |
| Unit Price input | Form Inputs | Numeric Input | ✅ | ✅ | ❌ |
| Inventory On Hand input (create only) | Form Inputs | Numeric Input | ✅ | ✅ | ❌ |
| Status dropdown | Form Inputs | Dropdown Selection | ✅ | ❌ | ❌ |
| Supplier input | Form Inputs | Text Input | ✅ | ✅ | ❌ |
| Notes textarea | Form Inputs | Text Area | ✅ | ✅ | ❌ |
| Create Part button | Action Buttons | Primary Action | ✅ | ✅ | ❌ |
| Update Part button | Action Buttons | Primary Action | ✅ | ✅ | ❌ |
| Cancel button | Action Buttons | Secondary Action | ✅ | ✅ | ✅ |
| View Details link (edit mode) | Action Buttons | Navigation Link | ✅ | ✅ | ✅ |
| Real-time validation | Behaviors | System Behavior | ✅ | ✅ | ✅ |
| Category-to-family mapping | Behaviors | System Behavior | ✅ | ✅ | ✅ |
| Duplicate Part ID checking | Behaviors | System Behavior | ✅ | ✅ | ✅ |
| Automatic transaction creation | Behaviors | System Behavior | ✅ | ✅ | ❌ |

## Access Summary

### Admin Access (18/18 points)
- **Full access** to all editing points
- Can create and modify parts
- All system behaviors active

### User Access (18/18 points) 
- **Full access** to all editing points
- Can create and modify parts
- All system behaviors active

### ReadOnly Access (7/18 points)
- **View-only** access to form data
- Cannot create or modify parts
- Read-only system behaviors only
- Navigation and informational elements accessible

## Risk Classification

| Risk Level | Points | User Types |
|------------|--------|------------|
| **High Risk** | 2 | Admin, User only |
| **Medium Risk** | 14 | Admin, User only |
| **Low Risk** | 2 | All users |

## Implementation Notes

- **ReadOnly users** should see forms in disabled/view-only mode
- **Transaction creation** restricted to Admin/User to maintain inventory integrity  
- **System behaviors** like validation remain active for all users for data consistency
- **Navigation elements** remain accessible for all users for basic application flow