# Santana Inventory Management Tool (SIMT)

A modern, React-based inventory management application designed for automotive parts businesses. Built with Microsoft 365 integration, this system provides comprehensive inventory tracking, invoice management, and external lookup capabilities while maintaining enterprise-grade security and authentication.

## Table of Contents

- [Overview](#overview)
- [Critical Implementation Notes](#critical-implementation-notes)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Authentication & Authorization](#authentication--authorization)
- [Data Architecture](#data-architecture)
- [Key Components](#key-components)
- [Build & Deployment](#build--deployment)
- [Security](#security)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Support](#support)

## Overview

The Santana Inventory Management Tool is a comprehensive solution for managing automotive parts inventory with the following core capabilities:

- **Parts Catalog Management**: Complete CRUD operations for parts with category hierarchies
- **Invoice-Driven Sales**: Create customer invoices that automatically update inventory and generate transaction records
- **Customer Management**: Comprehensive buyer database with contact information
- **Transaction Tracking**: Complete audit trail of all inventory movements
- **External Integration**: Built-in lookup functionality for RockAuto, Google, Amazon, and eBay
- **Role-Based Access Control**: Three-tier permission system (Admin/User/ReadOnly)
- **Real-Time Analytics**: Dashboard with charts and inventory summaries

## Critical Implementation Notes

### Microsoft Graph API Hybrid Solution

**IMPORTANT**: This application implements a hybrid solution to work around a confirmed Microsoft Graph API bug with custom lookup fields in SharePoint lists.

#### The Problem
- Custom lookup fields in SharePoint lists do not appear in Microsoft Graph API responses
- Fields are properly configured in SharePoint but return null/empty in API calls
- This affects core functionality like category relationships, buyer references, and transaction links

#### The Solution
The application uses a **hybrid text field approach**:

- **Lookup fields converted to text fields**: Category, Buyer, Part references stored as text
- **Application-level validation**: Maintains data integrity through programmatic validation
- **Enhanced UI features**: Cascading dropdowns, family auto-display, real-time validation
- **Performance optimization**: Aggressive caching (15-minute timeout) for reference data
- **Future-proof design**: Easy migration path when Microsoft fixes the API

#### Impact on Development
- All "lookup" relationships are handled in application code
- Enhanced error handling and validation layers
- Improved user experience with family grouping and cascading selections
- Comprehensive caching strategy for optimal performance

### Browser Support & Build Configuration

The application is optimized for modern browsers with specific targets:

**Production Support**:
- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions  
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari, Chrome Mobile

**Build Optimizations**:
- Code splitting with vendor, Azure, charts, and utilities chunks
- ES2022 target with top-level await support
- Source maps enabled for debugging
- Automatic prefixing for browser compatibility

## Features

### Core Functionality
- **Parts Management**: Add, edit, view, and organize parts by family and category
- **Invoice Creation**: Complete invoicing system with line items and automatic inventory updates
- **Customer Database**: Manage buyer information and contact details
- **Transaction History**: Comprehensive audit trail of all inventory movements
- **Dashboard Analytics**: Real-time charts and summaries using Recharts
- **External Lookup**: Integrated search across multiple automotive parts websites

### Advanced Features
- **Role-Based Security**: Three-tier access control system with field-level permissions
- **Azure AD Integration**: Single sign-on with Microsoft 365 accounts and enhanced MSAL error handling
- **SharePoint Backend**: Leverages SharePoint lists for data storage with hybrid field approach
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS and Forms plugin
- **Real-Time Updates**: Automatic inventory adjustments and notifications
- **Search & Filtering**: Advanced search capabilities across all data types
- **Enhanced Form Handling**: Tailwind Forms plugin for consistent styling
- **Toast Notification System**: Comprehensive user feedback with auto-dismissal and progress bars
- **CSV Export Engine**: Full data export capabilities for all entity types
- **Print Optimization**: Dedicated print styles for invoices and reports
- **Advanced Error Boundaries**: Retry logic and graceful degradation
- **Enterprise Transaction Safety**: Optimistic locking and compensating transactions
- **Pagination Support**: Automatic handling of large datasets via Microsoft Graph API

### Business Intelligence
- **Inventory Analytics**: Track inventory levels, values, and movement patterns
- **Sales Reporting**: Invoice summaries and revenue tracking
- **Part Lookup**: External integration with major automotive parts suppliers
- **Mobile Access**: Responsive design for warehouse and field use
- **Data Export**: Comprehensive CSV export for invoices, parts, transactions, and buyers
- **Print-Ready Reports**: Optimized print layouts for invoices and documentation

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 18+ | Modern component-based UI |
| **Build Tool** | Vite | 4+ | Fast development and optimized builds |
| **Styling** | Tailwind CSS | 3.3+ | Utility-first responsive design |
| **Forms** | @tailwindcss/forms | 0.5+ | Enhanced form styling and accessibility |
| **Charts** | Recharts | 2.8+ | Interactive data visualization |
| **Authentication** | MSAL.js | 2.38+ | Microsoft Azure AD integration |
| **Data API** | Microsoft Graph | v1.0 | Unified Microsoft 365 data access |
| **Backend** | SharePoint Online | Latest | Document management and data storage |
| **Hosting** | Azure Static Web Apps | Latest | Serverless hosting with CI/CD |
| **Icons** | Lucide React | 0.263+ | Modern icon library |
| **Routing** | React Router | 6+ | Client-side routing |
| **HTTP Client** | Axios | 1.4+ | API communication |
| **Date Handling** | date-fns | 2.30+ | Date utilities |

### UI & UX Enhancements
| Component | Purpose | Features |
|-----------|---------|----------|
| **Toast System** | User feedback | Auto-dismissal, progress bars, type-specific styling |
| **Error Boundaries** | Error handling | Retry mechanisms, debug information, graceful fallbacks |
| **Form Validation** | Data integrity | Real-time validation, role-based field access |
| **Print Styles** | Document output | Optimized layouts for invoices and reports |
| **Animations** | User experience | Fade-in, slide transitions, subtle micro-interactions |
| **Responsive Design** | Multi-device support | Mobile-first approach with Tailwind breakpoints |

## Prerequisites

Before installing this application, ensure you have:

### Development Environment
- **Node.js** 16+ and npm (see engines in package.json)
- **Git** for version control
- **Modern web browser** supporting ES2022 features and top-level await

### Advanced Development Features
- **Enhanced Error Boundaries**: Automatic retry mechanisms and graceful degradation
- **Debug Mode**: Comprehensive logging with performance timing and cache monitoring
- **Hot Module Replacement**: Instant updates during development via Vite
- **Source Maps**: Full debugging support in production builds
- **Development Helpers**: Authentication state debugging and MSAL interaction tracking

### Microsoft 365 Requirements
- **Microsoft 365** business account
- **SharePoint Online** site with appropriate permissions
- **Azure AD** tenant access
- **Azure subscription** (free tier sufficient)

### Permissions Required
- **SharePoint Site Administrator** (for initial setup)
- **Azure AD Application Administrator** (for app registration)
- **Microsoft Graph API** permissions: `Sites.ReadWrite.All`, `User.Read`

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd santana-inventory-management
```

### 2. Install Dependencies
```bash
npm install
```

The following critical dependencies will be installed:
- **Azure Libraries**: @azure/msal-browser, @azure/msal-react, @microsoft/microsoft-graph-client
- **UI Libraries**: react, react-dom, react-router-dom, lucide-react
- **Styling**: tailwindcss, @tailwindcss/forms, autoprefixer, postcss
- **Charts**: recharts
- **Utilities**: axios, date-fns

### 3. Environment Configuration
Copy the environment template and configure your settings:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your specific configuration. **All 9 variables below are ABSOLUTELY REQUIRED**:

```env
# Azure AD Authentication (CRITICAL)
VITE_CLIENT_ID=your-azure-app-client-id
VITE_TENANT_ID=your-azure-tenant-id

# SharePoint Data Access (CRITICAL)
VITE_SHAREPOINT_SITE_URL=https://yourcompany.sharepoint.com/sites/YourSite

# SharePoint List Names (CRITICAL) - Must match exactly
VITE_PARTS_LIST_NAME=simt_Parts
VITE_CATEGORIES_LIST_NAME=simt_Categories
VITE_BUYERS_LIST_NAME=simt_Buyers
VITE_INVOICES_LIST_NAME=simt_Invoices
VITE_TRANSACTIONS_LIST_NAME=simt_Transactions
VITE_AUTHORIZED_USERS_LIST_NAME=simt_AuthorizedUsers

# Optional Development Settings
VITE_DEBUG_MODE=true
VITE_ENABLE_LOGGING=true
```

### 4. SharePoint Lists Setup

**CRITICAL**: Create SharePoint lists with the **hybrid solution** in mind. All reference fields must be **Single line of text** fields, not lookup fields.

#### simt_Categories
| Column | Type | Required | Notes |
|--------|------|----------|-------|
| Title | Single line of text | Yes | Category name (Primary Key) |
| Family | Choice | No | Belt Drive, Body & Lamp Assembly, Brake & Wheel Hub, Cooling System, Drivetrain, Electrical, Electrical-Switch & Relay, Engine, Exhaust & Emission, Fuel & Air, Heat & Air Conditioning, Ignition, Interior, Steering, Suspension, Transmission-Automatic, Transmission-Manual |

#### simt_Parts
| Column | Type | Required | Notes |
|--------|------|----------|-------|
| Title | Single line of text | Yes | Part ID/SKU (Primary Key) |
| Description | Single line of text | No | Part description |
| Category | **Single line of text** | No | **HYBRID**: Text field validated against simt_Categories |
| InventoryOnHand | Number | No | Current stock level |
| UnitCost | Currency | No | Cost per unit |
| UnitPrice | Currency | No | Selling price per unit |
| Status | Choice | No | Active, Obsolete, Disposed |

#### simt_Buyers
| Column | Type | Required | Notes |
|--------|------|----------|-------|
| Title | Single line of text | Yes | Buyer name (Primary Key) |
| ContactEmail | Single line of text | No | Email address |
| Phone | Single line of text | No | Phone number |

#### simt_Invoices
| Column | Type | Required | Notes |
|--------|------|----------|-------|
| Title | Single line of text | Yes | Invoice number (Primary Key) |
| Buyer | **Single line of text** | No | **HYBRID**: Buyer name validated against simt_Buyers |
| InvoiceDate | Date and Time | No | Invoice date |
| TotalAmount | Currency | No | Total invoice amount |
| Status | Choice | No | Finalized, Paid, Void |
| Notes | Multiple lines of text | No | Additional notes |

#### simt_Transactions
| Column | Type | Required | Notes |
|--------|------|----------|-------|
| Title | Single line of text | No | SharePoint default (not used by app) |
| Part | **Single line of text** | No | **HYBRID**: Part ID validated against simt_Parts |
| MovementType | Choice | No | In (Received), Out (Sold), Adjustment, Void adjustment |
| Quantity | Number | No | Movement quantity |
| UnitCost | Currency | No | Cost per unit |
| UnitPrice | Currency | No | Price per unit |
| Invoice | **Single line of text** | No | **HYBRID**: Invoice number for "Out" movements |
| Buyer | **Single line of text** | No | **HYBRID**: Buyer name for "Out" movements |
| Supplier | Single line of text | No | Supplier name for "In" movements |
| Notes | Multiple lines of text | No | Optional notes |

#### simt_AuthorizedUsers
| Column | Type | Required | Notes |
|--------|------|----------|-------|
| Title | Single line of text | Yes | User email (Primary Key) |
| DisplayName | Single line of text | No | User display name |
| Role | Choice | No | Admin, User, ReadOnly |
| IsActive | Yes/No | No | Active status |

### 5. Azure AD App Registration

1. Navigate to Azure Portal > Azure Active Directory > App registrations
2. Create a new registration with these settings:
   - **Name**: Santana Inventory Management
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: 
     - Type: Single-page application (SPA)
     - URI: `https://yourdomain.azurestaticapps.net` (your actual deployment URL)

3. Configure API permissions:
   - Microsoft Graph: `User.Read` (Delegated) - **REQUIRED**
   - Microsoft Graph: `Sites.ReadWrite.All` (Delegated) - **REQUIRED**
   - Grant admin consent for these permissions

4. Note the **Application (client) ID** and **Directory (tenant) ID** for your environment variables

## Configuration

### Environment Variables Reference

| Variable | Status | Description | Example |
|----------|--------|-------------|---------|
| `VITE_CLIENT_ID` | **REQUIRED** | Azure AD application client ID | `12345678-1234-1234-1234-123456789012` |
| `VITE_TENANT_ID` | **REQUIRED** | Azure AD tenant ID | `87654321-4321-4321-4321-210987654321` |
| `VITE_SHAREPOINT_SITE_URL` | **REQUIRED** | SharePoint site URL | `https://company.sharepoint.com/sites/inventory` |
| `VITE_PARTS_LIST_NAME` | **REQUIRED** | Parts list name | `simt_Parts` |
| `VITE_CATEGORIES_LIST_NAME` | **REQUIRED** | Categories list name | `simt_Categories` |
| `VITE_BUYERS_LIST_NAME` | **REQUIRED** | Buyers list name | `simt_Buyers` |
| `VITE_INVOICES_LIST_NAME` | **REQUIRED** | Invoices list name | `simt_Invoices` |
| `VITE_TRANSACTIONS_LIST_NAME` | **REQUIRED** | Transactions list name | `simt_Transactions` |
| `VITE_AUTHORIZED_USERS_LIST_NAME` | **REQUIRED** | Authorized users list name | `simt_AuthorizedUsers` |
| `VITE_DEBUG_MODE` | Optional | Enable debug logging | `true` or `false` |

### Authentication Configuration

The application uses MSAL.js for Azure AD authentication with the following flow:

1. **User Authentication**: Azure AD login with organizational credentials
2. **Authorization Check**: Validation against SharePoint authorized users list
3. **Role Assignment**: Role-based access control (Admin/User/ReadOnly)
4. **Token Management**: Automatic token refresh and session management

## Project Structure

```
src/
├── components/           # React components
│   ├── auth/            # Authentication components with enhanced error handling
│   ├── buyers/          # Buyer management with role-based access
│   ├── dashboard/       # Dashboard and analytics with Recharts integration
│   ├── external/        # External lookup integration (RockAuto, Google, Amazon, eBay)
│   ├── invoices/        # Invoice management with automatic transaction creation
│   ├── parts/           # Parts management with family/category hierarchies
│   ├── shared/          # Reusable UI components (error boundaries, loading states)
│   └── transactions/    # Transaction management with enterprise safety features
├── context/             # React context providers
│   ├── AuthContext.jsx  # Enhanced authentication with retry logic
│   └── ToastContext.jsx # Comprehensive notification system
├── hooks/               # Custom React hooks
│   ├── useSharePoint.js # Enhanced SharePoint operations with caching
│   └── useRoleAccess.js # Field-level role-based access control
├── services/            # API and SharePoint services
│   ├── sharepoint.js    # Enterprise-grade SharePoint service with hybrid solution
│   └── external.js      # Multi-provider external search integration
├── config/              # Configuration files
│   ├── sharepoint.js    # Hybrid solution field mappings and validation rules
│   └── msal.js          # Enhanced MSAL configuration with interaction handling
├── utils/               # Utility functions
│   ├── csvExport.js     # Comprehensive data export functionality
│   └── rolePermissions.js # Field-level access control matrix
└── styles/
    └── globals.css      # Enhanced Tailwind with animations and print styles

public/                  # Static assets
├── staticwebapp.config.json  # Azure Static Web Apps with security headers
└── index.html           # HTML template with Inter font and CSP headers

docs/                   # Documentation
├── sharepoint_lists_report.md  # Detailed hybrid solution documentation
└── README.md           # This comprehensive documentation

Build Configuration:
├── package.json         # Dependencies with enterprise-grade libraries
├── vite.config.js      # Advanced Vite build with chunking strategy
├── tailwind.config.js  # Tailwind with Forms plugin and custom utilities
├── postcss.config.js   # PostCSS with autoprefixer
└── .env.example        # Complete environment template
```

## Authentication & Authorization

### Authentication Flow
1. **Azure AD Login**: Users sign in with Microsoft 365 credentials
2. **Token Acquisition**: MSAL.js acquires access tokens for Microsoft Graph
3. **Authorization Check**: Application validates user against SharePoint whitelist
4. **Role Assignment**: Users assigned roles based on SharePoint configuration

### Role-Based Access Control

| Role | Permissions | Use Cases |
|------|------------|-----------|
| **Admin** | Full application access | System administrators, managers |
| **User** | Create, edit, delete data | Regular staff, data entry |
| **ReadOnly** | View-only access | Auditors, observers, trainees |

### Security Features
- **Azure AD Integration**: Enterprise-grade authentication
- **Token-Based Security**: Secure API communication
- **Role-Based Access**: Granular permission control
- **Session Management**: Automatic token refresh
- **Audit Trail**: Complete user activity logging
- **Two-Layer Security**: Azure AD + SharePoint authorization

## Data Architecture

### SharePoint List Integration with Hybrid Solution

The application uses SharePoint Online lists as the backend data store with a **hybrid approach** to overcome Microsoft Graph API limitations:

**Core Lists**:
- **simt_Categories**: Product family and category definitions
- **simt_Parts**: Master parts catalog with inventory levels  
- **simt_Buyers**: Customer database
- **simt_Invoices**: Sales invoice records
- **simt_Transactions**: Complete audit trail of inventory movements
- **simt_AuthorizedUsers**: User access control list

**Hybrid Implementation**:
- **Text Field Storage**: Reference relationships stored as text fields
- **Application Validation**: Data integrity maintained through code
- **Caching Strategy**: 15-minute cache timeout for reference data
- **Enhanced UI**: Cascading dropdowns and family auto-display
- **Performance Optimization**: Batch operations and filtered queries

### Microsoft Graph API Implementation

Data access is handled through Microsoft Graph API v1.0 with hybrid field handling:

- **Unified Endpoint**: Single API for all Microsoft 365 data
- **Consistent Syntax**: Standardized query and update operations  
- **Real-Time Updates**: Immediate data synchronization
- **Error Handling**: Comprehensive error management and retry logic
- **Field Transformation**: Automatic conversion between text and object references

## Key Components

### Loading & UI Components

**LoadingSpinner** (`src/components/shared/LoadingSpinner.jsx`):
- **Multiple Variants**: `spinner`, `dots`, `bars`, `pulse` with size options (`sm`, `md`, `lg`, `xl`)
- **Color Themes**: `blue`, `gray`, `white` for different contexts
- **Specialized Components**: 
  - `PageLoader`: Full-page loading with minimum height
  - `ButtonLoader`: Inline button spinner with color matching
  - `TableLoader`: Data table loading with skeleton rows
  - `CardLoader`: Content card loading state
  - `OverlayLoader`: Full-screen modal loading
  - `InlineLoader`: Text-inline loading indicator
- **Overlay Mode**: Full-screen backdrop with backdrop blur
- **Configurable Messages**: Custom loading text with role-appropriate styling

### Authentication Components

**UnauthorizedPage** (`src/components/auth/UnauthorizedPage.jsx`):
- **Enhanced User Feedback**: Shows user email and tenant information
- **Retry Mechanisms**: Manual authorization retry with loading states
- **Debug Information**: Environment details in debug mode (client ID, tenant, timestamp)
- **Secure Logout**: Proper session cleanup with logout hints
- **Company Branding**: Consistent footer and styling

**AuthButton** (`src/components/auth/AuthButton.jsx`):
- **State Management**: Handles interaction in progress and loading states
- **Error Classification**: Specific handling for `interaction_in_progress` errors
- **User Guidance**: Context-aware help text for authentication issues
- **Visual Feedback**: Loading spinners with color-matched themes

**RoleProtected** (`src/components/auth/RoleProtected.jsx`):
- **Multiple Export Patterns**: 
  - `RoleProtected`: Full-featured protection with custom fallbacks
  - `RoleGate`: Simple show/hide based on role
  - `AdminOnly`, `UserAndUp`: Shorthand role checkers
  - `withRoleProtection`: Higher-order component wrapper
  - `useRoleCheck`: Custom hook for conditional rendering
- **Flexible Fallbacks**: Custom unauthorized content or hide completely
- **Loading States**: Configurable loading indicators during authorization
- **Developer Experience**: Clear component naming and easy integration

### Component Architecture Patterns

**Configuration-Driven Components**:
```javascript
// Example: LoadingSpinner with comprehensive configuration
const sizeClasses = {
  sm: { spinner: 'w-4 h-4', dots: 'w-1 h-1', text: 'text-xs' },
  md: { spinner: 'w-6 h-6', dots: 'w-1.5 h-1.5', text: 'text-sm' },
  // ... more configurations
}

const colorClasses = {
  blue: { spinner: 'text-blue-600', dots: 'bg-blue-600' },
  // ... theme variations
}
```

**Multiple Export Patterns** for flexible component usage:
```javascript
// Multiple ways to use role protection
import RoleProtected, { 
  RoleGate, 
  AdminOnly, 
  UserAndUp, 
  withRoleProtection, 
  useRoleCheck 
} from './RoleProtected'

// HOC Pattern
const ProtectedComponent = withRoleProtection(MyComponent, 'Admin')

// Hook Pattern  
const canEdit = useRoleCheck('User')

// Wrapper Pattern
<AdminOnly fallback={<AccessDenied />}>
  <AdminPanel />
</AdminOnly>
```

**Specialized Component Variants**:
- **Context-Specific**: Components tailored for specific use cases (PageLoader vs ButtonLoader)
- **Progressive Enhancement**: Base component with specialized exports
- **Composition over Inheritance**: Building complex UIs from simple, reusable pieces

### Advanced Component Features

**Smart Default Behaviors**:
- **Loading States**: Automatic timeout and fallback handling
- **Error Boundaries**: Graceful degradation with recovery options
- **Responsive Design**: Mobile-first approach with breakpoint-aware components
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support

**State Management Patterns**:
- **Local State**: Component-specific state with useState/useReducer
- **Context Integration**: Seamless integration with AuthContext and ToastContext
- **Prop Drilling Prevention**: Context providers for deeply nested component trees
- **Performance Optimization**: Memoization and callback optimization where needed

**Layout** (`src/components/shared/Layout.jsx`):
- **Role-Based Navigation**: Dynamic menu filtering based on user permissions
- **Navigation Configuration**: Centralized nav items with role requirements
- **Mobile Responsiveness**: Collapsible sidebar with overlay
- **Quick Actions**: Role-filtered shortcuts for common operations
- **Submenu Management**: Collapsible navigation with state persistence
- **User Context Display**: User info, role badges, and access level indicators
- **Page Title Management**: Dynamic titles based on current route
- **Loading State Management**: Page-level loading indicators

### Parts Management (`/parts`)
- **Parts Catalog**: Complete listing with search and filtering
- **Add/Edit Parts**: Enhanced form with category/family cascading selection
- **Category Management**: Hierarchical organization with family grouping
- **Stock Tracking**: Real-time inventory levels

### Invoice System (`/invoices`)
- **Invoice Creation**: Multi-line invoice generation with buyer validation
- **Automatic Updates**: Inventory adjustment on finalization
- **Transaction Integration**: Seamless transaction record creation
- **Status Tracking**: Finalized, Paid, Void states (no Draft editing)

### Customer Management (`/buyers`)
- **Customer Database**: Contact information management
- **Purchase History**: Transaction history per customer
- **Quick Add**: Streamlined customer creation

### Transaction History (`/transactions`)
- **Movement Tracking**: Complete audit trail with enhanced movement types
- **Filtering Options**: Search by date, part, type
- **Void Operations**: Support for invoice voiding with void adjustments
- **Reporting**: Generate movement reports

### External Lookup (`/external-lookup`)
- **Multi-Provider Search**: RockAuto, Google, Amazon, eBay integration
- **Smart Search Suggestions**: Auto-generated search terms based on part data
- **Quick Reference**: Fast part number lookups with configurable providers
- **Search History**: Recent searches tracking and suggestions
- **Comparison Shopping**: Multiple source comparison with direct links
- **Vehicle-Specific Search**: Enhanced search with year/make/model context

## Build & Deployment

### Development Server

```bash
# Start development server (port 3000)
npm run dev

# Lint code
npm run lint
npm run lint:fix

# Format code
npm run format

# Build for production
npm run build

# Preview production build
npm run preview
```

### Build Configuration Details

The Vite configuration includes:

**Optimizations**:
- **Code Splitting**: Vendor, Azure, charts, and utilities chunks
- **ES2022 Target**: Modern JavaScript features including top-level await
- **Source Maps**: Enabled for production debugging
- **Path Aliases**: `@` points to `src/` directory

**Chunks Strategy**:
- `vendor`: React, React DOM, React Router
- `azure`: MSAL libraries and Microsoft Graph client
- `charts`: Recharts library
- `utils`: Axios, date-fns, Lucide React

### Azure Static Web Apps Deployment

#### Automatic Deployment via GitHub Actions

The repository includes a pre-configured GitHub Actions workflow:

```yaml
# Located: .github/workflows/azure-static-web-apps-salmon-hill-091ac800f.yml
# Triggers: Push to main, Pull requests
# Build: Vite production build
# Deploy: Azure Static Web Apps
```

**Required Secrets in GitHub**:
- `AZURE_STATIC_WEB_APPS_API_TOKEN_*`: Deployment token
- All 9 environment variables from the configuration section

#### Manual Azure Setup

1. **Create Static Web App**:
   ```bash
   az staticwebapp create \
     --name santana-inventory \
     --resource-group your-resource-group \
     --source https://github.com/yourusername/repository \
     --location centralus \
     --branch main \
     --app-location "/" \
     --output-location "dist"
   ```

2. **Configure Environment Variables**:
   - Navigate to Azure Portal > Static Web Apps > Configuration
   - Add all 9 required environment variables
   - Restart the application after adding variables

3. **Verify Deployment**:
   - Check build logs in GitHub Actions
   - Verify environment variables in Azure portal
   - Test authentication and data access

### Static Web App Configuration

The `public/staticwebapp.config.json` includes:

**Security Headers**:
- **Content Security Policy**: Restricts resource loading for security
- **HTTPS Enforcement**: Strict Transport Security headers
- **Frame Protection**: X-Frame-Options and frame-ancestors
- **Content Type**: X-Content-Type-Options nosniff

**Routing**:
- **SPA Support**: 404 redirects to index.html for client-side routing
- **Anonymous Access**: Public access (authentication handled by app)

## Security

### Comprehensive Security Implementation

**Authentication & Authorization**:
- **Azure AD Integration**: Enterprise-grade identity management
- **MSAL.js Implementation**: Secure token management with automatic refresh
- **Role-Based Access**: Three-tier permission system
- **Whitelist Authorization**: SharePoint-based user validation

**Data Security**:
- **HTTPS Only**: Automatic SSL via Azure Static Web Apps
- **Token Security**: Secure token storage and refresh
- **Data Encryption**: SharePoint Online encryption at rest
- **Audit Logging**: Complete user activity tracking

**Application Security**:
- **Content Security Policy**: Comprehensive CSP headers
- **XSS Protection**: Content type and frame protection
- **CORS Configuration**: Restricted cross-origin requests
- **Input Validation**: Client and server-side validation

### Security Headers Configuration

```json
{
  "Content-Security-Policy": "default-src 'self'; script-src 'self' https://login.microsoftonline.com https://graph.microsoft.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://login.microsoftonline.com https://graph.microsoft.com https://*.sharepoint.com; frame-src https://login.microsoftonline.com; object-src 'none'; base-uri 'self'; frame-ancestors 'self';",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN"
}
```

### Security Checklist

- **Azure AD Configuration**: MFA and conditional access policies
- **SharePoint Permissions**: Minimum required permissions granted
- **Environment Variables**: Secure storage in Azure configuration
- **API Permissions**: Limited to User.Read and Sites.ReadWrite.All
- **Network Security**: HTTPS only, CSP headers configured
- **Code Security**: ESLint rules, no hardcoded secrets

## Usage

### Getting Started

1. **Access the Application**: Navigate to your deployed application URL
2. **Sign In**: Use your Microsoft 365 organizational account
3. **Authorization**: Wait for access validation (automatic via simt_AuthorizedUsers)
4. **Dashboard**: Start with the dashboard overview

### Common Workflows

#### Adding New Parts
1. Navigate to Parts > Add New Part
2. Fill in part details (ID, description)
3. Select category from dropdown (family auto-populates)
4. Set initial inventory levels and pricing
5. Save to create the part record

#### Creating an Invoice
1. Navigate to Invoices > Create Invoice
2. Select customer from validated buyers list
3. Add line items with parts and quantities
4. Review totals and finalize (inventory updates automatically)
5. System creates corresponding transaction records

#### Logging Inventory Receipts
1. Navigate to Transactions > Log Inbound Parts
2. Select parts received (validated against parts list)
3. Enter quantities and supplier information
4. Save to update inventory levels automatically

### Advanced Features

**Category Management**:
- Family-based organization with 17 predefined families
- Cascading dropdowns for enhanced user experience
- Real-time validation against category list

**Transaction Types**:
- **In (Received)**: Inventory receipts from suppliers
- **Out (Sold)**: Sales through invoice system
- **Adjustment**: Manual inventory corrections
- **Void adjustment**: Automatic adjustments when invoices are voided

**Enhanced Search**:
- Part number, description, category filtering
- Family-based grouping and filtering
- Real-time search with caching

## API Reference

### Microsoft Graph Endpoints Used

```javascript
// SharePoint Site and Lists
GET /sites/{site-id}
GET /sites/{site-id}/lists
GET /sites/{site-id}/lists/{list-id}/items
POST /sites/{site-id}/lists/{list-id}/items
PATCH /sites/{site-id}/lists/{list-id}/items/{item-id}
DELETE /sites/{site-id}/lists/{list-id}/items/{item-id}

// User Information
GET /me
GET /me/profile
```

### Custom API Wrappers

**SharePointService** (`src/services/sharepoint.js`):
- Enhanced CRUD operations with hybrid field handling
- Data transformation between text fields and object references
- Caching strategy for reference data
- Error handling and retry logic

**AuthService** (`src/context/AuthContext.jsx`):
- MSAL.js integration and token management
- Role-based access control
- User authorization against SharePoint whitelist

### Hybrid Solution API Patterns

```javascript
// Example: Creating a part with category validation
const createPart = async (partData) => {
  // Validate category against cached categories list
  const isValidCategory = await validateCategory(partData.category);
  
  if (!isValidCategory) {
    throw new Error('Invalid category selected');
  }
  
  // Store as text field (hybrid solution)
  const result = await graphClient
    .api(`/sites/${siteId}/lists/${partsListId}/items`)
    .post({
      fields: {
        Title: partData.partId,
        Description: partData.description,
        Category: partData.category, // Text field, not lookup
        InventoryOnHand: partData.inventory,
        UnitCost: partData.cost,
        UnitPrice: partData.price,
        Status: partData.status
      }
    });
    
  return result;
};
```

## Troubleshooting

### Common Issues and Solutions

#### Authentication Problems

**Issue**: "AADSTS65001: The user or administrator has not consented to use the application"
**Solution**: 
1. Verify API permissions in Azure AD app registration
2. Grant admin consent for Microsoft Graph permissions
3. Ensure redirect URI matches deployment URL exactly

**Issue**: User logs in but gets "Access Denied"
**Solution**:
1. Check if user exists in simt_AuthorizedUsers list
2. Verify IsActive is set to true
3. Confirm user email matches exactly (case-sensitive)

#### Data Access Issues

**Issue**: Categories/Buyers not loading in dropdowns
**Solution**:
1. Verify SharePoint list names match environment variables exactly
2. Check user permissions on SharePoint site
3. Clear browser cache to reset cached category data
4. Enable debug mode to see API responses

**Issue**: "Field not found" errors in Microsoft Graph API
**Solution**:
1. Verify all fields exist in SharePoint lists
2. Check field types match hybrid solution requirements (text fields, not lookups)
3. Ensure field internal names match configuration

#### Deployment Issues

**Issue**: Build fails with "Environment variable not defined"
**Solution**:
1. Verify all 9 required environment variables are set in Azure
2. Check for typos in variable names
3. Restart Azure Static Web App after adding variables

**Issue**: Application loads but shows "Configuration Error"
**Solution**:
1. Verify SharePoint site URL is accessible
2. Check Azure AD app registration settings
3. Confirm tenant ID and client ID are correct

#### Performance Issues

**Issue**: Slow category loading or dropdown delays
**Solution**:
1. Category data is cached for 15 minutes by default
2. Check network connectivity to SharePoint
3. Enable debug logging to identify bottlenecks
4. Consider increasing cache timeout in production

**Issue**: Toast notifications not appearing or disappearing too quickly
**Solution**:
1. Check browser console for JavaScript errors
2. Verify toast context is properly wrapped around app
3. Adjust toast duration in ToastContext configuration
4. Clear browser cache to reset toast state

**Issue**: CSV exports failing or incomplete data
**Solution**:
1. Verify user has export permissions (ReadOnly or higher)
2. Check for JavaScript errors in browser console
3. Ensure data is fully loaded before export attempt
4. Try exporting smaller datasets to test functionality

**Issue**: Navigation items not appearing or incorrectly filtered
**Solution**:
1. Verify user role in browser dev tools (`useRoleAccess` hook)
2. Check navigation configuration in Layout.jsx for required roles
3. Ensure user exists in simt_AuthorizedUsers list with correct role
4. Clear browser cache to reset role-based access control

**Issue**: Loading spinners not appearing or stuck in loading state
**Solution**:
1. Check loading state management in component hierarchy
2. Verify LoadingSpinner variant and size props are valid
3. Ensure loading states are properly cleared after operations
4. Check for JavaScript errors preventing state updates

**Issue**: Role protection components not working correctly  
**Solution**:
1. Verify RoleProtected components have correct requiredRole props
2. Check that useAuth context is properly wrapped around app
3. Ensure user authorization is complete before accessing protected content
4. Use browser dev tools to inspect role-based access control state

**Issue**: Mobile navigation not working properly
**Solution**:
1. Check sidebar state management (sidebarOpen useState)
2. Verify touch event handlers are not conflicting
3. Ensure transform classes are applying correctly
4. Test on actual mobile device vs browser dev tools

**Issue**: Invoice overselling validation not working correctly
**Solution**:
1. Check that parts data is fully loaded before creating invoices
2. Verify part quantity aggregation logic in validateInventoryLevels function
3. Ensure line items have valid partId references
4. Check browser console for Map iteration errors

**Issue**: External search not opening new tabs or missing providers
**Solution**:
1. Verify environment variables for search URLs (VITE_ROCKAUTO_SEARCH_URL, VITE_GOOGLE_SEARCH_URL)
2. Check popup blocker settings in browser
3. Ensure searchProviders array configuration is complete
4. Test with different browsers for cross-browser compatibility

**Issue**: Part family relationships not displaying correctly
**Solution**:
1. Verify Categories list has Family field populated in SharePoint
2. Check getFamilyByCategory function implementation in useCategories hook
3. Ensure category validation is working with text field approach
4. Clear cache and refresh to reload category mappings

**Issue**: Transaction type calculations showing incorrect values
**Solution**:
1. Verify isInventoryIncrease helper function logic
2. Check that unitCost vs unitPrice is used correctly based on movement type
3. Ensure transaction data structure matches expected fields (unitCost for In, unitPrice for Out)
4. Review getTransactionTotal calculation logic

**Issue**: Role-based access showing/hiding wrong elements
**Solution**:
1. Check canAccessField function implementation for each component
2. Verify role requirements in component configurations
3. Ensure useRoleAccess hook is returning correct permissions
4. Test with different user roles to verify access matrix implementation

**Issue**: Part ID duplicate validation not working in forms
**Solution**:
1. Verify allParts data is loaded before form initialization
2. Check getAlternativePartIds function for suggestion generation
3. Ensure handleBlur event is properly bound to Part ID field
4. Test with different Part ID formats and lengths

**Issue**: Search functionality not filtering results correctly
**Solution**:
1. Check handlePartSearch function in TransactionForm for proper filtering logic
2. Verify search debouncing implementation doesn't conflict with dropdown display
3. Ensure filteredParts state management is working correctly
4. Test search with different part ID and description combinations

### Debug Mode

Enable comprehensive logging by setting:
```env
VITE_DEBUG_MODE=true
VITE_ENABLE_LOGGING=true
```

This provides:
- Detailed API request/response logging
- Authentication flow debugging with interaction state tracking
- Cache hit/miss information with performance metrics
- Performance timing data for all operations
- SharePoint operation success/failure tracking
- Toast notification lifecycle monitoring
- Role-based access control debugging
- Transaction safety validation logging

### Development Debug Helpers

**Authentication Debugging**:
```javascript
// Available in browser console when debug mode enabled
window.debugAuth()        // Show current MSAL authentication state
window.msalInstance      // Direct access to MSAL instance
```

**Performance Monitoring**:
- App initialization timing
- SharePoint operation performance tracking
- Cache effectiveness monitoring
- Authentication flow timing
- Component render performance

**State Inspection Tools**:
- React Context debugging for auth and toast states
- SharePoint service cache inspection
- Role permission matrix validation
- Real-time toast notification tracking

### Browser Developer Tools

**Network Tab**:
- Monitor Microsoft Graph API calls
- Check for failed requests or timeouts
- Verify authentication tokens

**Console Tab**:
- Review application logs and errors
- Check for JavaScript errors
- Monitor cache operations

**Application Tab**:
- Inspect stored authentication tokens
- Check session storage for user data
- Monitor local storage usage

## Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Install dependencies: `npm install`
4. Set up environment variables from `.env.example`
5. Start development server: `npm run dev`

### Coding Standards

**React Patterns**:
- Use functional components with hooks
- Implement proper error boundaries
- Follow React best practices for state management

**Styling Guidelines**:
- Use Tailwind CSS utility classes with enhanced component utilities
- Leverage @tailwindcss/forms for consistent form styling
- Follow mobile-first responsive design
- Utilize custom animations (fadeIn, slideIn, pulse-subtle)
- Implement print-optimized styles for business documents

**File Organization**:
- Group by feature, not by type
- Use clear, descriptive file names
- Maintain consistent folder structure

**Error Handling**:
- Comprehensive error boundaries and validation
- Graceful fallbacks for API failures
- User-friendly error messages

### Code Quality

**Linting**:
```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
npm run format      # Format with Prettier
```

**Testing Guidelines**:
- Test all CRUD operations with hybrid solution
- Verify role-based access control at component and navigation levels
- Validate external integrations and loading states
- Check responsive design on multiple devices and screen sizes
- Test error boundaries and retry mechanisms
- Validate loading spinner variants and accessibility features

**Component-Specific Testing**:
- **LoadingSpinner**: Test all variants (spinner, dots, bars, pulse) and sizes
- **RoleProtected**: Verify all export patterns (RoleGate, AdminOnly, withRoleProtection)
- **Layout Navigation**: Test role-based filtering and mobile responsiveness
- **AuthButton**: Test error states and interaction management
- **UnauthorizedPage**: Verify debug information and retry functionality

**Performance Considerations**:
- Monitor bundle size with build analyzer and component-specific chunking
- Optimize images and assets, especially loading spinner animations
- Implement proper caching strategies for navigation and role data
- Test with slow network conditions and verify loading states
- Ensure role-based access control doesn't cause unnecessary re-renders

**Performance Considerations**:
- Monitor bundle size with build analyzer
- Optimize images and assets
- Implement proper caching strategies
- Test with slow network conditions

### Pull Request Process

1. **Code Review**: Ensure code follows standards
2. **Testing**: Verify all functionality works
3. **Documentation**: Update README if needed
4. **Build**: Confirm production build succeeds
5. **Deployment**: Test in staging environment

## Support

### Documentation Resources

- **SharePoint Lists Report**: Comprehensive hybrid solution documentation
- **Implementation Plan**: Detailed project phases and timelines  
- **Authorization Guide**: Security implementation details
- **Access Control Matrix**: Role-based permission mapping

### Getting Help

**Immediate Issues**:
1. Check this troubleshooting section first
2. Enable debug mode for detailed logging
3. Review browser developer tools
4. Check Azure Static Web Apps logs

**Environment Issues**:
1. Verify all 9 required environment variables
2. Confirm Azure AD app registration settings
3. Check SharePoint list configuration
4. Validate user permissions

**Development Support**:
1. Review project documentation thoroughly
2. Check GitHub issues for similar problems
3. Enable verbose logging for debugging
4. Contact development team with specific error details

### Version Information

- **Application Version**: 2.0.0
- **Node.js Required**: 16.0.0+
- **Browser Support**: Modern browsers with ES2022 support
- **Last Updated**: July 18, 2025
- **License**: Proprietary - Santana Auto Parts

### Contact Information

For technical support or questions:
- **Primary Contact**: Development Team
- **Documentation**: Comprehensive project docs available
- **Deployment Support**: Azure Static Web Apps documentation
- **Security Questions**: IT Administrator

---

**Critical Success Factors**:
1. **Hybrid Solution Understanding**: Key to troubleshooting data issues
2. **Environment Configuration**: All 9 variables must be correctly set
3. **SharePoint Permissions**: Proper user access to lists
4. **Azure AD Setup**: Correct app registration and permissions

This application represents a sophisticated solution to inventory management challenges, leveraging modern web technologies while working around platform limitations through innovative hybrid approaches.