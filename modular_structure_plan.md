# **Modular Structure Implementation Plan: SharePoint Inventory App**

Version: 5.0 (Modular Architecture)  
Date: July 14, 2025

## **Project Goal**
Transition from single-file HTML structure to a professional, modular Vite + React application with proper component organization, build tools, and deployment pipeline.

## **1. Target Folder Structure**

```
santana-inventory/
├── public/
│   ├── favicon.ico
│   └── index.html                    # Clean HTML template
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthButton.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── index.js              # Barrel exports
│   │   ├── parts/
│   │   │   ├── PartsTable.jsx        # List/view all parts
│   │   │   ├── PartForm.jsx          # Add/edit single part
│   │   │   ├── PartDetails.jsx       # View single part details
│   │   │   └── index.js
│   │   ├── buyers/
│   │   │   ├── BuyersTable.jsx
│   │   │   ├── BuyerForm.jsx
│   │   │   └── index.js
│   │   ├── invoices/
│   │   │   ├── InvoiceList.jsx       # List all invoices
│   │   │   ├── InvoiceForm.jsx       # Create/edit invoice
│   │   │   ├── InvoiceLineItem.jsx   # Individual line item component
│   │   │   ├── InvoiceDetails.jsx    # View single invoice
│   │   │   └── index.js
│   │   ├── transactions/
│   │   │   ├── TransactionForm.jsx   # Log inbound parts
│   │   │   ├── TransactionHistory.jsx
│   │   │   └── index.js
│   │   ├── dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── SummaryCards.jsx
│   │   │   ├── InventoryChart.jsx
│   │   │   ├── RecentActivity.jsx
│   │   │   └── index.js
│   │   ├── external/
│   │   │   ├── ExternalLookup.jsx    # RockAuto, Google search
│   │   │   └── index.js
│   │   └── shared/
│   │       ├── Layout.jsx            # Main app layout
│   │       ├── Navigation.jsx        # Top nav and sidebar
│   │       ├── LoadingSpinner.jsx
│   │       ├── ErrorBoundary.jsx
│   │       └── ui/
│   │           ├── Modal.jsx
│   │           ├── Button.jsx
│   │           ├── Input.jsx
│   │           ├── Select.jsx
│   │           ├── Table.jsx
│   │           ├── Toast.jsx
│   │           └── index.js
│   ├── services/
│   │   ├── auth.js                   # MSAL configuration & helpers
│   │   ├── sharepoint.js             # Graph API calls to SharePoint
│   │   ├── api.js                    # Generic API utilities
│   │   └── constants.js              # API endpoints, list names
│   ├── utils/
│   │   ├── helpers.js                # General utility functions
│   │   ├── validation.js             # Form validation helpers
│   │   ├── formatting.js             # Date/currency formatting
│   │   └── calculations.js           # Inventory calculations
│   ├── hooks/
│   │   ├── useAuth.js                # Authentication hook
│   │   ├── useSharePoint.js          # SharePoint data fetching
│   │   ├── useToast.js               # Toast notifications
│   │   └── useLocalStorage.js        # Local storage helper
│   ├── context/
│   │   ├── AuthContext.jsx           # Global auth state
│   │   ├── ToastContext.jsx          # Global toast state
│   │   └── AppContext.jsx            # Global app state
│   ├── styles/
│   │   ├── globals.css               # Global styles
│   │   └── components.css            # Component-specific styles
│   ├── config/
│   │   ├── app.js                    # App configuration
│   │   ├── msal.js                   # MSAL configuration
│   │   └── sharepoint.js             # SharePoint list definitions
│   ├── App.jsx                       # Main app component
│   ├── main.jsx                      # Entry point
│   └── router.jsx                    # React Router setup
├── .env.example                      # Environment variables template
├── .env.local                        # Local environment variables
├── .gitignore
├── package.json
├── vite.config.js                    # Vite configuration
├── tailwind.config.js                # Tailwind configuration
├── postcss.config.js                 # PostCSS configuration
├── index.html                        # Current working file (to be replaced)
├── config.js                         # Current config (to be migrated)
└── README.md
```

## **2. Migration Steps**

### **Step 1: Initialize Vite Project**
```bash
# Create new Vite React project
npm create vite@latest santana-inventory -- --template react
cd santana-inventory
npm install

# Install additional dependencies
npm install @azure/msal-browser @azure/msal-react
npm install @microsoft/microsoft-graph-client
npm install react-router-dom
npm install recharts
npm install lucide-react
npm install axios
npm install date-fns
```

### **Step 2: Configure Tailwind CSS**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### **Step 3: Create Folder Structure**
```bash
mkdir -p src/{components/{auth,parts,buyers,invoices,transactions,dashboard,external,shared/ui},services,utils,hooks,context,styles,config}
```

### **Step 4: Migrate Configuration**
- Move current `config.js` content to `src/config/app.js`
- Create environment variables in `.env.local`
- Set up MSAL configuration in `src/config/msal.js`

### **Step 5: Extract Components**
- Break down current `index.html` components into separate `.jsx` files
- Implement proper React Router for navigation
- Set up context providers for global state

### **Step 6: Implement Services Layer**
- Create SharePoint API service with Graph API calls
- Implement authentication service wrapper
- Add error handling and retry logic

### **Step 7: Add Development Tools**
```bash
npm install -D eslint @vitejs/plugin-react
npm install -D prettier eslint-config-prettier
```

## **3. Key Configuration Files**

### **3.1 vite.config.js**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

### **3.2 package.json Scripts**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint src --ext js,jsx --fix",
    "format": "prettier --write src/**/*.{js,jsx,css,md}"
  }
}
```

### **3.3 tailwind.config.js**
```javascript
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

## **4. Component Architecture**

### **4.1 Routing Structure**
```
/                     → Dashboard
/parts                → PartsTable
/parts/new            → PartForm (create mode)
/parts/:id            → PartDetails
/parts/:id/edit       → PartForm (edit mode)
/buyers               → BuyersTable
/buyers/new           → BuyerForm (create mode)
/buyers/:id/edit      → BuyerForm (edit mode)
/invoices             → InvoiceList
/invoices/new         → InvoiceForm (create mode)
/invoices/:id         → InvoiceDetails
/invoices/:id/edit    → InvoiceForm (edit mode)
/transactions         → TransactionHistory
/transactions/new     → TransactionForm
/external-lookup      → ExternalLookup
```

### **4.2 State Management Strategy**
- **Authentication**: React Context + MSAL
- **Global App State**: React Context + useReducer
- **Component State**: useState + useEffect
- **Server State**: Custom hooks with caching
- **Form State**: Controlled components

### **4.3 Data Flow Pattern**
```
Component → Custom Hook → Service Layer → Graph API → SharePoint
```

## **5. Implementation Timeline**

| Phase | Tasks | Duration | Files Created |
|-------|--------|----------|---------------|
| **Migration Setup** | • Initialize Vite project<br>• Install dependencies<br>• Create folder structure<br>• Configure build tools | 1 day | Project foundation |
| **Core Infrastructure** | • Set up routing<br>• Create layout components<br>• Implement auth context<br>• Create service layer | 2 days | 15-20 core files |
| **UI Component Library** | • Build reusable UI components<br>• Implement design system<br>• Create shared utilities | 2 days | 10-15 UI components |
| **Feature Components** | • Parts management<br>• Buyers management<br>• Invoice system<br>• Transaction logging | 4 days | 20-25 feature components |
| **Integration & Testing** | • Connect all components<br>• Test SharePoint integration<br>• Implement error handling | 2 days | Testing & refinement |
| **Dashboard & Reporting** | • Build dashboard<br>• Implement charts<br>• Create summary views | 2 days | 5-8 dashboard components |

**Total Estimated Time: 2 weeks**

## **6. Development Workflow**

### **6.1 Branch Strategy**
```
main              → Production-ready code
develop           → Integration branch
feature/parts     → Parts management features
feature/invoices  → Invoice management features
```

### **6.2 Development Commands**
```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Check code quality
npm run format    # Format code
```

## **7. Deployment Configuration**

### **7.1 Azure Static Web Apps**
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: Migrate from current config

### **7.2 Environment Variables**
```
VITE_CLIENT_ID=fe520206-1b39-4126-8108-6e5625ff80e4
VITE_TENANT_ID=52ae8d25-07f3-4012-8a6f-1410c83ce9a8
VITE_SHAREPOINT_SITE_URL=https://cabreraautopr.sharepoint.com/sites/DataCollectionSystem
```

## **8. Benefits of Modular Structure**

1. **Better Code Organization**: Clear separation of concerns
2. **Improved Maintainability**: Easier to find and modify code
3. **Enhanced Scalability**: Easy to add new features
4. **Better Testing**: Components can be tested in isolation
5. **Improved Performance**: Code splitting and lazy loading
6. **Better Developer Experience**: Hot reload, TypeScript support, linting
7. **Professional Deployment**: Proper build pipeline and optimization

## **9. Next Steps**

1. **Immediate**: Initialize Vite project and migrate configuration
2. **Week 1**: Set up core infrastructure and UI components
3. **Week 2**: Implement feature components and integration
4. **Week 3**: Testing, refinement, and deployment