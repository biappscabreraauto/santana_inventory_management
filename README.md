# Santana Inventory Management Tool (SIMT)

A modern, React-based inventory management application designed for automotive parts businesses. Built with Microsoft 365 integration, this system provides comprehensive inventory tracking, invoice management, and external lookup capabilities while maintaining enterprise-grade security and authentication.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Authentication & Authorization](#authentication--authorization)
- [Data Architecture](#data-architecture)
- [Key Components](#key-components)
- [Deployment](#deployment)
- [Security](#security)
- [Usage](#usage)
- [API Reference](#api-reference)
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

## Features

### Core Functionality
- ✅ **Parts Management**: Add, edit, view, and organize parts by family and category
- ✅ **Invoice Creation**: Complete invoicing system with line items and automatic inventory updates
- ✅ **Customer Database**: Manage buyer information and contact details
- ✅ **Transaction History**: Comprehensive audit trail of all inventory movements
- ✅ **Dashboard Analytics**: Real-time charts and summaries using Recharts
- ✅ **External Lookup**: Integrated search across multiple automotive parts websites

### Advanced Features
- ✅ **Role-Based Security**: Three-tier access control system
- ✅ **Azure AD Integration**: Single sign-on with Microsoft 365 accounts
- ✅ **SharePoint Backend**: Leverages SharePoint lists for data storage
- ✅ **Responsive Design**: Mobile-friendly interface built with Tailwind CSS
- ✅ **Real-Time Updates**: Automatic inventory adjustments and notifications
- ✅ **Search & Filtering**: Advanced search capabilities across all data types

### Business Intelligence
- 📊 **Inventory Analytics**: Track inventory levels, values, and movement patterns
- 📈 **Sales Reporting**: Invoice summaries and revenue tracking
- 🔍 **Part Lookup**: External integration with major automotive parts suppliers
- 📱 **Mobile Access**: Responsive design for warehouse and field use

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 18+ | Modern component-based UI |
| **Build Tool** | Vite | Latest | Fast development and optimized builds |
| **Styling** | Tailwind CSS | 3+ | Utility-first responsive design |
| **Charts** | Recharts | Latest | Interactive data visualization |
| **Authentication** | MSAL.js | 3+ | Microsoft Azure AD integration |
| **Data API** | Microsoft Graph | v1.0 | Unified Microsoft 365 data access |
| **Backend** | SharePoint Online | Latest | Document management and data storage |
| **Hosting** | Azure Static Web Apps | Latest | Serverless hosting with CI/CD |

## Prerequisites

Before installing this application, ensure you have:

### Development Environment
- **Node.js** 18+ and npm 9+
- **Git** for version control
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

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

### 3. Environment Configuration
Copy the environment template and configure your settings:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your specific configuration:

```env
# Azure AD Application Configuration
VITE_CLIENT_ID=your-azure-app-client-id
VITE_TENANT_ID=your-azure-tenant-id

# SharePoint Configuration
VITE_SHAREPOINT_SITE_URL=https://yourcompany.sharepoint.com/sites/YourSite

# SharePoint List Names
VITE_PARTS_LIST_NAME=simt_Parts
VITE_CATEGORIES_LIST_NAME=simt_Categories
VITE_BUYERS_LIST_NAME=simt_Buyers
VITE_INVOICES_LIST_NAME=simt_Invoices
VITE_TRANSACTIONS_LIST_NAME=simt_Transactions
VITE_AUTHORIZED_USERS_LIST_NAME=simt_AuthorizedUsers

# Application Settings
VITE_APP_NAME=Santana Inventory Management
VITE_COMPANY_NAME=Your Company Name

# Development Settings
VITE_DEBUG_MODE=true
```

### 4. SharePoint Lists Setup

Create the following SharePoint lists in your target site:

#### simt_Categories
| Column | Type | Required | Notes |
|--------|------|----------|-------|
| Title | Single line of text | Yes | Category name (Primary Key) |
| Family | Choice | No | Parent family grouping |

#### simt_Parts
| Column | Type | Required | Notes |
|--------|------|----------|-------|
| Title | Single line of text | Yes | Part ID/SKU (Primary Key) |
| Description | Single line of text | No | Part description |
| Category | Single line of text | No | Category reference |
| InventoryOnHand | Number | No | Current stock level |
| UnitCost | Currency | No | Cost per unit |
| UnitPrice | Currency | No | Selling price per unit |
| Status | Choice | No | Active/Obsolete/Disposed |

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
| Buyer | Single line of text | No | Buyer reference |
| InvoiceDate | Date and Time | No | Invoice date |
| TotalAmount | Currency | No | Total invoice amount |
| Status | Choice | No | Draft/Finalized/Paid/Void |

#### simt_Transactions
| Column | Type | Required | Notes |
|--------|------|----------|-------|
| Title | Single line of text | Yes | Auto-generated ID |
| Part | Single line of text | Yes | Part reference |
| MovementType | Choice | Yes | In (Received)/Out (Sold) |
| Quantity | Number | Yes | Movement quantity |
| Invoice | Single line of text | No | Invoice reference (for sales) |
| UnitCost | Currency | No | Cost per unit |
| UnitPrice | Currency | No | Price per unit |
| Notes | Multiple lines of text | No | Additional notes |

#### simt_AuthorizedUsers
| Column | Type | Required | Notes |
|--------|------|----------|-------|
| Title | Single line of text | Yes | User email (Primary Key) |
| DisplayName | Single line of text | Yes | User display name |
| Role | Choice | Yes | Admin/User/ReadOnly |
| IsActive | Yes/No | Yes | Active status |

### 5. Azure AD App Registration

1. Navigate to Azure Portal > Azure Active Directory > App registrations
2. Create a new registration with these settings:
   - **Name**: Santana Inventory Management
   - **Redirect URI**: `https://yourapp.azurestaticapps.net`
   - **Platform**: Single-page application (SPA)

3. Configure API permissions:
   - Microsoft Graph: `User.Read` (Delegated)
   - Microsoft Graph: `Sites.ReadWrite.All` (Delegated)

4. Note the **Application (client) ID** and **Directory (tenant) ID**

## Configuration

### Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_CLIENT_ID` | Azure AD application client ID | `12345678-1234-1234-1234-123456789012` |
| `VITE_TENANT_ID` | Azure AD tenant ID | `87654321-4321-4321-4321-210987654321` |
| `VITE_SHAREPOINT_SITE_URL` | SharePoint site URL | `https://company.sharepoint.com/sites/inventory` |
| `VITE_DEBUG_MODE` | Enable debug logging | `true` or `false` |

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
│   ├── auth/            # Authentication components
│   ├── buyers/          # Buyer management
│   ├── dashboard/       # Dashboard and analytics
│   ├── external/        # External lookup integration
│   ├── invoices/        # Invoice management
│   ├── parts/           # Parts management
│   ├── shared/          # Reusable UI components
│   └── transactions/    # Transaction management
├── context/             # React context providers
├── hooks/               # Custom React hooks
├── services/            # API and SharePoint services
├── config/              # Configuration files
└── utils/               # Utility functions

public/                  # Static assets
docs/                   # Documentation
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
- ✅ **Azure AD Integration**: Enterprise-grade authentication
- ✅ **Token-Based Security**: Secure API communication
- ✅ **Role-Based Access**: Granular permission control
- ✅ **Session Management**: Automatic token refresh
- ✅ **Audit Trail**: Complete user activity logging

## Data Architecture

### SharePoint List Integration

The application uses SharePoint Online lists as the backend data store:

- **simt_Categories**: Product family and category definitions
- **simt_Parts**: Master parts catalog with inventory levels
- **simt_Buyers**: Customer database
- **simt_Invoices**: Sales invoice records
- **simt_Transactions**: Complete audit trail of inventory movements
- **simt_AuthorizedUsers**: User access control list

### Microsoft Graph API Implementation

Data access is handled through Microsoft Graph API v1.0:

- **Unified Endpoint**: Single API for all Microsoft 365 data
- **Consistent Syntax**: Standardized query and update operations
- **Real-Time Updates**: Immediate data synchronization
- **Error Handling**: Comprehensive error management and retry logic

## Key Components

### Dashboard (`/`)
- **Inventory Summary**: Current stock levels and values
- **Recent Activity**: Latest transactions and movements
- **Analytics Charts**: Visual representation of inventory data
- **Quick Actions**: Shortcuts to common tasks

### Parts Management (`/parts`)
- **Parts Catalog**: Complete listing with search and filtering
- **Add/Edit Parts**: Form-based part management
- **Category Management**: Hierarchical organization system
- **Stock Tracking**: Real-time inventory levels

### Invoice System (`/invoices`)
- **Invoice Creation**: Multi-line invoice generation
- **Automatic Updates**: Inventory adjustment on finalization
- **Transaction Integration**: Seamless transaction record creation
- **Status Tracking**: Draft, Finalized, Paid, Void states

### Customer Management (`/buyers`)
- **Customer Database**: Contact information management
- **Purchase History**: Transaction history per customer
- **Quick Add**: Streamlined customer creation

### Transaction History (`/transactions`)
- **Movement Tracking**: Complete audit trail
- **Filtering Options**: Search by date, part, type
- **Bulk Operations**: Import/export capabilities
- **Reporting**: Generate movement reports

### External Lookup (`/external-lookup`)
- **Multi-Provider Search**: RockAuto, Google, Amazon, eBay
- **Quick Reference**: Fast part number lookups
- **Search History**: Recent searches tracking
- **Comparison Shopping**: Multiple source comparison

## Deployment

### Azure Static Web Apps Deployment

1. **Create Static Web App**:
   ```bash
   az staticwebapp create \
     --name santana-inventory \
     --resource-group your-resource-group \
     --source https://github.com/yourusername/repository \
     --location centralus \
     --branch main
   ```

2. **Configure Environment Variables**:
   - Navigate to Azure Portal > Static Web Apps > Configuration
   - Add all required environment variables from `.env.local`

3. **Set Up CI/CD**:
   - Azure automatically creates GitHub Actions workflow
   - Push to main branch triggers production deployment
   - Pull requests create preview environments

### Manual Deployment

For manual deployment to other hosting providers:

```bash
# Build the application
npm run build

# Deploy the dist/ folder to your hosting provider
```

## Security

### Security Checklist

- ✅ **HTTPS Only**: Automatic SSL via Azure Static Web Apps
- ✅ **Azure AD Authentication**: Enterprise-grade identity management
- ✅ **Token Security**: Secure token storage and refresh
- ✅ **Role-Based Access**: Granular permission control
- ✅ **Data Encryption**: SharePoint Online encryption at rest
- ✅ **Audit Logging**: Complete user activity tracking

### Additional Security Measures

1. **Conditional Access**: Configure MFA requirements in Azure AD
2. **Network Security**: Implement IP restrictions if needed
3. **Data Loss Prevention**: Configure SharePoint DLP policies
4. **Regular Updates**: Keep dependencies and frameworks current

## Usage

### Getting Started

1. **Access the Application**: Navigate to your deployed application URL
2. **Sign In**: Use your Microsoft 365 organizational account
3. **Authorization**: Wait for access validation (automatic)
4. **Dashboard**: Start with the dashboard overview

### Common Workflows

#### Adding New Parts
1. Navigate to Parts > Add New Part
2. Fill in part details (ID, description, category)
3. Set initial inventory levels and pricing
4. Save to create the part record

#### Creating an Invoice
1. Navigate to Invoices > Create Invoice
2. Select customer from buyers list
3. Add line items with parts and quantities
4. Review totals and finalize
5. System automatically updates inventory

#### Logging Inventory Receipts
1. Navigate to Transactions > Log Inbound Parts
2. Select parts received
3. Enter quantities and supplier information
4. Save to update inventory levels

### Tips for Efficient Use

- **Bulk Operations**: Use Excel integration for large data imports
- **Search Functions**: Utilize advanced filtering for quick data location
- **External Lookup**: Use integrated search for part research
- **Dashboard Analytics**: Monitor trends with visual charts

## API Reference

### Microsoft Graph Endpoints Used

```javascript
// SharePoint Lists
GET /sites/{site-id}/lists/{list-id}/items
POST /sites/{site-id}/lists/{list-id}/items
PATCH /sites/{site-id}/lists/{list-id}/items/{item-id}
DELETE /sites/{site-id}/lists/{list-id}/items/{item-id}

// User Information
GET /me
GET /me/profile
```

### Custom API Wrappers

The application includes custom API wrappers for:

- **SharePointService**: CRUD operations for all lists
- **AuthService**: Authentication and authorization management
- **GraphService**: Microsoft Graph API communication

## Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make changes and test thoroughly
4. Commit with descriptive messages
5. Submit a pull request

### Coding Standards

- **React Patterns**: Use functional components with hooks
- **Styling**: Tailwind CSS utility classes
- **File Organization**: Group by feature, not by type
- **Error Handling**: Comprehensive error boundaries and validation
- **Documentation**: Comment complex logic and API integrations

### Testing Guidelines

- Test all CRUD operations
- Verify role-based access control
- Validate external integrations
- Check responsive design on multiple devices

## Support

### Documentation Resources

- **Implementation Plan**: Detailed project phases and timelines
- **SharePoint Lists Report**: Complete data model specification
- **Authorization Guide**: Security implementation details
- **Access Control Matrix**: Role-based permission mapping

### Getting Help

1. **Check Documentation**: Review project documentation first
2. **Debug Mode**: Enable debug mode for detailed logging
3. **Azure Logs**: Check Azure Static Web Apps logs for deployment issues
4. **SharePoint Permissions**: Verify user access to SharePoint lists

### Common Issues

**Authentication Problems**:
- Verify Azure AD app registration settings
- Check redirect URI configuration
- Validate API permission grants

**Data Access Issues**:
- Confirm SharePoint list names match environment variables
- Verify user permissions on SharePoint site
- Check Microsoft Graph API permissions

**Deployment Issues**:
- Validate all environment variables in Azure
- Check GitHub Actions workflow logs
- Verify build process completes successfully

---

**Version**: 2.0.0  
**Last Updated**: July 18, 2025  
**License**: Proprietary - Santana Auto Parts  
**Maintainer**: Development Team

For additional support or questions, please contact the development team or refer to the comprehensive project documentation.