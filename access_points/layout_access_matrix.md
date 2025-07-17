# Layout Access Control Matrix

## User Role Hierarchy
**Admin > User > ReadOnly**

| Editing Point | Editing Type | Type | Admin | User | ReadOnly |
|---------------|--------------|------|-------|------|----------|
| Dashboard link | Navigation Menu | Navigation Link | ✅ | ✅ | ✅ |
| All Parts link | Navigation Menu | Navigation Link | ✅ | ✅ | ✅ |
| Add New Part link | Navigation Menu | Navigation Link | ✅ | ✅ | ❌ |
| All Invoices link | Navigation Menu | Navigation Link | ✅ | ✅ | ✅ |
| Create Invoice link | Navigation Menu | Navigation Link | ✅ | ✅ | ❌ |
| All Buyers link | Navigation Menu | Navigation Link | ✅ | ✅ | ✅ |
| Add New Buyer link | Navigation Menu | Navigation Link | ✅ | ✅ | ❌ |
| Transaction History link | Navigation Menu | Navigation Link | ✅ | ✅ | ✅ |
| Log Inbound Parts link | Navigation Menu | Navigation Link | ✅ | ✅ | ❌ |
| External Lookup link | Navigation Menu | Navigation Link | ✅ | ✅ | ✅ |
| Mobile menu toggle | Header Actions | UI Control | ✅ | ✅ | ✅ |
| Quick Add dropdown | Header Actions | Dropdown Control | ✅ | ✅ | ❌ |
| Add Part shortcut | Header Actions | Quick Action | ✅ | ✅ | ❌ |
| Add Buyer shortcut | Header Actions | Quick Action | ✅ | ✅ | ❌ |
| Create Invoice shortcut | Header Actions | Quick Action | ✅ | ✅ | ❌ |
| Log Transaction shortcut | Header Actions | Quick Action | ✅ | ✅ | ❌ |
| Sign Out button | User Actions | System Action | ✅ | ✅ | ✅ |
| User profile display (clickable) | User Actions | Display Element | ✅ | ✅ | ✅ |
| Submenu toggles | Interactions | UI Behavior | ✅ | ✅ | ✅ |
| Sidebar show/hide | Interactions | UI Behavior | ✅ | ✅ | ✅ |
| Navigation state management | Interactions | System Behavior | ✅ | ✅ | ✅ |

## Access Summary

### Admin Access (21/21 points)
- **Full navigation access** including all creation shortcuts

### User Access (21/21 points)
- **Full navigation access** including all creation shortcuts

### ReadOnly Access (15/21 points)
- **View-only navigation** - can access all listing/viewing pages
- **Creation links disabled** to prevent workflow confusion

## Risk Classification

| Risk Level | Points | User Types |
|------------|--------|------------|
| **Medium Risk** | 6 | Admin, User only |
| **Low Risk** | 15 | All users |

## Implementation Notes

- **Creation shortcuts** restricted to Admin/User for workflow consistency
- **All viewing/listing** navigation preserved for ReadOnly users
- **UI controls** (mobile menu, sidebar) available to all for usability