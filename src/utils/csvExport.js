// =================================================================
// CSV EXPORT UTILITY
// =================================================================

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects to convert
 * @param {Array} headers - Array of header objects with key and label
 * @returns {string} CSV string
 */
export const convertToCSV = (data, headers) => {
  if (!data || data.length === 0) return ''
  
  // Create header row
  const headerRow = headers.map(header => `"${header.label}"`).join(',')
  
  // Create data rows
  const dataRows = data.map(item => {
    return headers.map(header => {
      const value = item[header.key] || ''
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      const escapedValue = String(value).replace(/"/g, '""')
      return `"${escapedValue}"`
    }).join(',')
  })
  
  return [headerRow, ...dataRows].join('\n')
}

/**
 * Download CSV file
 * @param {string} csvContent - CSV content string
 * @param {string} filename - Name of the file to download
 */
export const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Export invoices to CSV
 * @param {Array} invoices - Array of invoice objects
 * @param {string} filename - Optional filename (default: invoices-export)
 */
export const exportInvoicesToCSV = (invoices, filename = 'invoices-export') => {
  const headers = [
    { key: 'invoiceNumber', label: 'Invoice #' },
    { key: 'buyer', label: 'Buyer' },
    { key: 'invoiceDate', label: 'Invoice Date' },
    { key: 'totalAmount', label: 'Total Amount' },
    { key: 'status', label: 'Status' },
    { key: 'notes', label: 'Notes' },
    { key: 'created', label: 'Created Date' },
    { key: 'createdBy', label: 'Created By' }
  ]
  
  // Format data for CSV
  const formattedData = invoices.map(invoice => ({
    ...invoice,
    invoiceDate: formatDateForCSV(invoice.invoiceDate),
    created: formatDateForCSV(invoice.created),
    totalAmount: formatCurrencyForCSV(invoice.totalAmount)
  }))
  
  const csvContent = convertToCSV(formattedData, headers)
  const timestamp = new Date().toISOString().slice(0, 10)
  downloadCSV(csvContent, `${filename}-${timestamp}.csv`)
}

// Helper functions
const formatDateForCSV = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const formatCurrencyForCSV = (amount) => {
  if (!amount) return '0.00'
  return Number(amount).toFixed(2)
}

/**
 * Export parts to CSV
 * @param {Array} parts - Array of part objects
 * @param {string} filename - Optional filename prefix
 */
export const exportPartsToCSV = (parts, filename = 'parts-export') => {
  const headers = [
    { key: 'partId', label: 'Part ID' },
    { key: 'description', label: 'Description' },
    { key: 'category', label: 'Category' },
    { key: 'inventoryOnHand', label: 'Inventory On Hand' },
    { key: 'unitCost', label: 'Unit Cost' },
    { key: 'unitPrice', label: 'Unit Price' },
    { key: 'status', label: 'Status' },
    { key: 'created', label: 'Created Date' },
    { key: 'createdBy', label: 'Created By' }
  ]
  
  // Format data for CSV
  const formattedData = parts.map(part => ({
    ...part,
    created: formatDateForCSV(part.created),
    unitCost: formatCurrencyForCSV(part.unitCost),
    unitPrice: formatCurrencyForCSV(part.unitPrice)
  }))
  
  const csvContent = convertToCSV(formattedData, headers)
  const timestamp = new Date().toISOString().slice(0, 10)
  downloadCSV(csvContent, `${filename}-${timestamp}.csv`)
}

/**
 * Export transactions to CSV
 * @param {Array} transactions - Array of transaction objects
 * @param {string} filename - Optional filename prefix
 */
export const exportTransactionsToCSV = (transactions, filename = 'transactions-export') => {
  const headers = [
    { key: 'created', label: 'Date' },
    { key: 'partId', label: 'Part' },
    { key: 'movementType', label: 'Movement Type' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'unitCost', label: 'Unit Cost' },
    { key: 'unitPrice', label: 'Unit Price' },
    { key: 'buyer', label: 'Buyer' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'invoice', label: 'Invoice' },
    { key: 'notes', label: 'Notes' },
    { key: 'createdBy', label: 'Created By' }
  ]
  
  // Format data for CSV
  const formattedData = transactions.map(transaction => ({
    ...transaction,
    created: formatDateForCSV(transaction.created),
    unitCost: formatCurrencyForCSV(transaction.unitCost),
    unitPrice: formatCurrencyForCSV(transaction.unitPrice)
  }))
  
  const csvContent = convertToCSV(formattedData, headers)
  const timestamp = new Date().toISOString().slice(0, 10)
  downloadCSV(csvContent, `${filename}-${timestamp}.csv`)
}