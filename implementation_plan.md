# **Final Implementation Plan: SharePoint Inventory App**

Version: 2.0 (Final)  
Date: July 14, 2025

### **📌 Project Goal**

Build a light-weight, React-based inventory app—hosted for free on Azure Static Web Apps—that lets authenticated staff:

1. Import a fixed catalog of obsolete parts.  
2. Log inbound (received) and outbound (sold) movements.  
3. View simple on-hand/value summaries.  
4. **Look up parts on external sites like RockAuto.com and Google.**

All data resides in SharePoint Online lists. SharePoint’s built-in Created By / Modified By auditing records who performed each action, eliminating the need for a separate seller table.

### **1\. High-Level Architecture**

| Layer | Technology | Justification |
| :---- | :---- | :---- |
| **Frontend** | React 18 \+ Vite, Tailwind CSS, Recharts | Modern, modular components for fast development; a free and powerful open-source stack. |
| **Auth** | MSAL.js (Microsoft Authentication Library) | Enables users to sign in with their existing Microsoft 365 work accounts; the token is reused for every API call, ensuring secure access. |
| **Data API** | **Microsoft Graph API** (Preferred) | The modern, unified endpoint for all Microsoft 365 data. Provides consistent syntax and is the future-facing standard for M365 development. |
| **Hosting** | **Azure Static Web Apps (Free Plan)** | Provides 100 GB/month egress, custom domains, free SSL, and integrated CI/CD with GitHub Actions. The most efficient and scalable choice. |

### **2\. SharePoint List Design**

#### **2.1 Parts (Master Catalog)**

| Column | Type | Notes |
| :---- | :---- | :---- |
| **Title (Part ID)** | Single line of text | **Unique Key**. Indexed for performance. |
| Description | Multiple lines | — |
| Category | Choice | Optional. |
| UnitCost | Currency | The cost paid for the part. |
| UnitPrice | Currency | The default selling price. |
| Status | Choice | Active, Obsolete, Disposed. |

#### **2.2 Transactions (Movement History)**

| Column | Type | Notes |
| :---- | :---- | :---- |
| **Part** | Lookup → Parts list | **Required**. Indexed for performance. |
| MovementType | Choice | In (Received) / Out (Sold). |
| Quantity | Number | Always a positive number. |
| UnitCost | Currency | Optional. Filled for In movements. |
| UnitPrice | Currency | Optional. Filled for Out movements. |
| Buyer | Lookup → Buyers list | Optional. Left blank for inbound movements. |
| Notes | Multiple lines | For condition, location, etc. |
| **Timestamp** | Date/Time (Default) | Indexed for performance. Defaults to item creation time. |
| **Created By** | Person (System) | Automatically captures the user who logged the transaction. |

**Note on List Thresholds:** SharePoint has a **5,000 item list view threshold**. While API queries with indexed columns can retrieve data from much larger lists, any view *in the SharePoint UI* will fail if it tries to display \>5,000 items at once. This design is safe as the app is the primary interface.

#### **2.3 Buyers (Optional)**

| Column | Type |
| :---- | :---- |
| **Title (Buyer Name)** | Single line of text |
| Contact Email | Single line of text |
| Phone | Single line of text |

### **3\. Frontend Component Map**

| Component | Purpose |
| :---- | :---- |
| AuthProvider | Wraps the entire app with MSAL context, providing user and token data. |
| PartsTable / PartForm | Components for CRUD operations on the master parts catalog. |
| TransactionForm | Logs In/Out movements; fetches parts for lookups. |
| BulkImportModal | Parses a CSV file to batch-create transaction records via the API. |
| BuyersTable / BuyerForm | Optional components for managing buyer information. |
| Dashboard | Fetches aggregated data to render summary cards and charts. |
| ExternalLookup | **Provides a search interface to look up parts on RockAuto and Google.** |
| Shared/UI | Reusable components like dropdowns, modals, toasts, and loaders. |

#### **3.1 External Lookup Feature**

Due to browser security policies (X-Frame-Options), embedding external e-commerce and search sites directly into the app is not feasible. The implemented strategy will be:

1. The user enters a part number/description into the ExternalLookup component.  
2. On clicking "Search," the app constructs search URLs for RockAuto.com and https://www.google.com/search?q=Google.com.  
3. The app then opens these URLs in **two new browser tabs**, providing a seamless lookup experience without violating security best practices.

### **4\. Authentication & API Flow**

1. User navigates to the Azure Static Web App URL.  
2. The app redirects to the Microsoft 365 login page. MSAL.js handles the authentication flow.  
3. Upon successful login, MSAL acquires an access token with the scope for **Microsoft Graph (**https://graph.microsoft.com/.default**)**.  
4. The React app attaches this token to every API request in the Authorization header: Bearer \<token\>.  
5. Microsoft Graph validates the token and executes the request against the SharePoint list in the context of the signed-in user.  
6. The Created By field on the SharePoint list item is automatically populated with the user's identity.

This delegated permission model is secure and requires no app-only secrets.

### **5\. DevOps & Deployment**

| Step | Detail |
| :---- | :---- |
| **Repository** | GitHub (main for production, dev for development). |
| **Build** | npm run build (Vite) generates static assets in the dist/ folder. |
| **CI/CD** | A GitHub Action, auto-generated by Azure Static Web Apps, builds and deploys the app. Pull requests automatically generate preview environments. |
| **Environments** | Tenant ID, Client ID, and SharePoint List IDs are stored securely as **Configuration** secrets in the Azure Static Web App. |
| **Release** | Merging the dev branch into main triggers the production deployment. |

### **6\. Implementation Phases & Timeline**

| Phase | Major Tasks | Owner | ETA |
| :---- | :---- | :---- | :---- |
| **1\. Foundation** | • Create SharePoint lists & columns.\<br\>• Create a dedicated M365/SharePoint security group for users.\<br\>• Register the Azure AD application. | IT Admin | Week 1 |
| **2\. Skeleton** | • Scaffold the React app with Vite and Tailwind CSS.\<br\>• Implement MSAL authentication and protected routes. | Dev | Week 2 |
| **3\. Core Features** | • Build Parts CRUD components.\<br\>• Build the Transaction form (single and batch import).\<br\>• **Build and integrate the** ExternalLookup **component.**\<br\>• Implement validation and toast notifications. | Dev | Weeks 3-4 |
| **4\. Reporting** | • Develop aggregate queries for the dashboard.\<br\>• Build dashboard charts and summary tables with Recharts. | Dev | Week 5 |
| **5\. QA & UAT** | • Test SharePoint permissions via the security group.\<br\>• Test edge-case imports and form validations.\<br\>• Secure stakeholder sign-off. | QA & Stakeholders | Week 6 |
| **6\. Go-Live** | • Deploy to production.\<br\>• Conduct a user training workshop.\<br\>• Monitor Azure logs and quotas. | DevOps | Week 7 |

### **7\. Security & Governance Checklist**

* \[x\] ✅ Use HTTPS-only via Azure Static Web Apps (SSL is automatic).  
* \[x\] ✅ Grant the app only the necessary delegated Microsoft Graph scopes (Sites.ReadWrite.All).  
* \[x\] ✅ Store SharePoint lists in a private Microsoft 365 site.  
* \[x\] ✅ **Manage access using a dedicated SharePoint security group instead of individual user permissions.**  
* \[ \] ⬜ Configure Conditional Access / MFA for users if not already enforced at the organization level.  
* \[ \] ⬜ Set up a budget alert in Azure for the Static Web App to monitor the 100 GB free bandwidth quota.

### **8\. Future Enhancements**

| Idea | Benefit |
| :---- | :---- |
| **Row-Level Security** | Use SharePoint's item-level permissions to restrict access so teams see only their own parts. |
| **Serverless Notifications** | Use an Azure Function (triggered by a list webhook) to send Teams notifications on large sales. |
| **Power BI Integration** | Point a Power BI dataset directly at the SharePoint lists for advanced, rich analytics. |
| **Offline Excel Sync** | Allow power users to perform bulk edits via Excel and sync back to the lists. |
| **Progressive Web App (PWA)** | Add a manifest file to enable "Add to Home Screen" functionality on warehouse tablets for easy access. |

### **✅ Next Concrete Step**

**Spin up the Azure Static Web App (Free plan) and commit the bare React app with MSAL configured.** This will validate the core authentication and hosting architecture, providing a solid foundation for component-by-component development.