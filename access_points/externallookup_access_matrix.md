# ExternalLookup Access Control Matrix

## User Role Hierarchy
**Admin > User > ReadOnly**

| Editing Point | Editing Type | Type | Admin | User | ReadOnly |
|---------------|--------------|------|-------|------|----------|
| Search term input | Form Inputs | Text Input | ✅ | ✅ | ✅ |
| Search button | Action Buttons | Primary Action | ✅ | ✅ | ✅ |
| Provider selection buttons (RockAuto/Google/Amazon/eBay) | Interactive Elements | Selection Control | ✅ | ✅ | ✅ |
| Search All button | Action Buttons | Primary Action | ✅ | ✅ | ✅ |
| Recent searches buttons (clickable) | Interactive Elements | Navigation Link | ✅ | ✅ | ✅ |
| Clear history button | Action Buttons | Secondary Action | ✅ | ✅ | ❌ |
| Quick search suggestions (pre-defined terms) | Interactive Elements | Quick Action | ✅ | ✅ | ✅ |
| Search history persistence | Behaviors | System Behavior | ✅ | ✅ | ✅ |
| External URL opening | Behaviors | System Behavior | ✅ | ✅ | ✅ |
| Enhanced search term processing | Behaviors | System Behavior | ✅ | ✅ | ✅ |
| Provider information display | Display Elements | Information Display | ✅ | ✅ | ✅ |
| Provider feature lists | Display Elements | Information Display | ✅ | ✅ | ✅ |

## Access Summary

### Admin Access (12/12 points)
- **Full access** to all external lookup features
- Can perform searches and manage search history
- Complete external research capabilities

### User Access (12/12 points)
- **Full access** to all external lookup features
- Can perform searches and manage search history
- Complete external research capabilities

### ReadOnly Access (11/12 points)
- **Full search access** - can use all search functionality
- Cannot clear search history but can view and use recent searches
- Complete external research capabilities for reference and lookup

## Risk Classification

| Risk Level | Points | User Types | Examples |
|------------|--------|------------|----------|
| **Medium Risk** | 1 | Admin, User only | Clear history |
| **Low Risk** | 11 | All users | Search, providers, suggestions, history viewing |

## Implementation Notes

- **External search functionality** available to all users for research and reference
- **Search history clearing** restricted to User+ for data management
- **All search providers** accessible to all users for comprehensive lookup
- **No data modification** occurs through external lookups - purely informational
- **Provider selection** and **search enhancement** available to all for best results