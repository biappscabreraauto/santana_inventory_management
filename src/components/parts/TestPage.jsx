import React, { useState } from 'react'
import { useToast } from '../../context/ToastContext'

const CategorySolutions = () => {
  const { success, info, warning } = useToast()
  const [selectedSolution, setSelectedSolution] = useState('')

  const solutions = [
    {
      id: 'sharepoint-rest',
      title: '🔄 Switch to SharePoint REST API',
      difficulty: 'Medium',
      timeEstimate: '2-3 hours',
      pros: [
        'Bypasses Graph API bug entirely',
        'More reliable for complex SharePoint operations',
        'Better support for lookup fields',
        'More mature API with better documentation'
      ],
      cons: [
        'Requires authentication changes',
        'Different API syntax',
        'Need to rewrite some service methods'
      ],
      implementation: `
// 1. Update authentication to get SharePoint-specific tokens
// 2. Replace Graph API calls with SharePoint REST calls
// 3. Example SharePoint REST call:
const response = await fetch(
  'https://cabreraautopr.sharepoint.com/sites/DataCollectionSystem/_api/web/lists/getbytitle(\'simt_Parts\')/items?$expand=Category',
  {
    headers: {
      'Authorization': 'Bearer ' + sharePointToken,
      'Accept': 'application/json;odata=verbose'
    }
  }
)`,
      nextSteps: [
        'Update MSAL configuration for SharePoint scopes',
        'Create SharePoint REST service layer',
        'Test category field retrieval',
        'Update components to use new service'
      ]
    },
    {
      id: 'choice-field',
      title: '📋 Convert to Choice Field',
      difficulty: 'Easy',
      timeEstimate: '30 minutes',
      pros: [
        'Quick fix that works immediately',
        'No API changes needed',
        'Graph API handles Choice fields perfectly',
        'Easier to manage than lookup fields'
      ],
      cons: [
        'Loses relational benefits of lookup',
        'Must manually sync categories',
        'Less flexible than lookup fields'
      ],
      implementation: `
// 1. In SharePoint, delete current Category lookup field
// 2. Create new Category choice field with options:
//    - Accelerator Cable, Air Filter, Ball Joint, etc.
// 3. No code changes needed - existing code will work!`,
      nextSteps: [
        'Export current category list',
        'Delete lookup Category field in SharePoint',
        'Create Choice field with same name',
        'Add all 66 categories as choices',
        'Test part creation'
      ]
    },
    {
      id: 'text-workaround',
      title: '📝 Temporary Text Field Solution',
      difficulty: 'Very Easy',
      timeEstimate: '10 minutes',
      pros: [
        'Immediate fix',
        'Zero risk',
        'Can validate against category list in code',
        'Easy to convert back later'
      ],
      cons: [
        'No dropdown in SharePoint interface',
        'Relies on manual typing',
        'No built-in validation'
      ],
      implementation: `
// 1. Change Category field type to "Single line of text"
// 2. Add validation in your app:
const validateCategory = (category) => {
  const validCategories = await getValidCategories()
  return validCategories.includes(category)
}`,
      nextSteps: [
        'Change field type in SharePoint',
        'Add category validation to PartForm',
        'Create dropdown component using categories list',
        'Test part creation and editing'
      ]
    },
    {
      id: 'hybrid-approach',
      title: '🔀 Hybrid: Text + Categories List',
      difficulty: 'Easy',
      timeEstimate: '1 hour',
      pros: [
        'Best of both worlds',
        'Maintains category management',
        'Works around Graph API bug',
        'Provides dropdown in your app'
      ],
      cons: [
        'Two sources of truth',
        'Slightly more complex'
      ],
      implementation: `
// 1. Convert Category to text field in Parts list
// 2. Keep Categories list for management
// 3. In your app, create dropdown from Categories list
// 4. Store selected text value in Parts.Category field
const PartForm = () => {
  const { categories } = useCategories() // Still use categories list
  return (
    <select value={category} onChange={handleCategoryChange}>
      {categories.map(cat => 
        <option value={cat.category}>{cat.category}</option>
      )}
    </select>
  )
}`,
      nextSteps: [
        'Change Category field to Single Line Text',
        'Update PartForm to show dropdown from Categories list',
        'Ensure validation matches Categories list',
        'Test complete workflow'
      ]
    }
  ]

  const handleSelectSolution = (solutionId) => {
    setSelectedSolution(solutionId)
    const solution = solutions.find(s => s.id === solutionId)
    info(`Selected: ${solution.title}`)
  }

  const handleImplementSolution = (solution) => {
    warning(`Ready to implement: ${solution.title}. Estimated time: ${solution.timeEstimate}`)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Category Field Solutions
        </h1>
        <p className="text-gray-600">
          Choose your approach to work around the Graph API bug
        </p>
      </div>

      {/* Problem Summary */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-red-900 mb-3">
          🐛 Confirmed Graph API Bug
        </h2>
        <div className="text-red-700 text-sm space-y-2">
          <p><strong>Problem:</strong> Graph API acknowledges Category field exists but never returns it</p>
          <p><strong>Evidence:</strong> OData context shows "fields(Title,Description,Category)" but response only has Title and Description</p>
          <p><strong>Impact:</strong> Cannot read category data through Graph API, but can write it</p>
          <p><strong>Status:</strong> This is a Microsoft Graph API issue, not your configuration</p>
        </div>
      </div>

      {/* Solutions */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900">Available Solutions</h2>
        
        {solutions.map((solution) => (
          <div key={solution.id} className={`border rounded-lg p-6 ${
            selectedSolution === solution.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {solution.title}
                </h3>
                <div className="flex items-center space-x-4 text-sm">
                  <span className={`px-2 py-1 rounded ${
                    solution.difficulty === 'Very Easy' ? 'bg-green-100 text-green-800' :
                    solution.difficulty === 'Easy' ? 'bg-blue-100 text-blue-800' :
                    solution.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {solution.difficulty}
                  </span>
                  <span className="text-gray-600">⏱️ {solution.timeEstimate}</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleSelectSolution(solution.id)}
                  className={`btn ${
                    selectedSolution === solution.id ? 'btn-primary' : 'btn-outline'
                  }`}
                >
                  {selectedSolution === solution.id ? '✅ Selected' : 'Select'}
                </button>
              </div>
            </div>

            {/* Pros and Cons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="font-medium text-green-800 mb-2">✅ Pros</h4>
                <ul className="text-sm space-y-1">
                  {solution.pros.map((pro, index) => (
                    <li key={index} className="text-green-700">• {pro}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-red-800 mb-2">❌ Cons</h4>
                <ul className="text-sm space-y-1">
                  {solution.cons.map((con, index) => (
                    <li key={index} className="text-red-700">• {con}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Implementation Details */}
            {selectedSolution === solution.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Implementation</h4>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto mb-4">
                  {solution.implementation}
                </pre>
                
                <h4 className="font-medium text-gray-900 mb-2">Next Steps</h4>
                <ol className="text-sm space-y-1 mb-4">
                  {solution.nextSteps.map((step, index) => (
                    <li key={index} className="text-gray-700">
                      {index + 1}. {step}
                    </li>
                  ))}
                </ol>

                <button
                  onClick={() => handleImplementSolution(solution)}
                  className="btn btn-primary"
                >
                  🚀 Start Implementation
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recommendation */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-green-900 mb-3">
          💡 My Recommendation
        </h2>
        <div className="text-green-700 text-sm space-y-2">
          <p><strong>For immediate progress:</strong> Use the "Hybrid: Text + Categories List" approach</p>
          <p><strong>Why:</strong> Quick fix (1 hour), maintains your category management, provides good UX</p>
          <p><strong>Timeline:</strong> You can have working categories today, then consider SharePoint REST API later if needed</p>
        </div>
      </div>

      {/* Resources */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-blue-900 mb-3">
          📚 Additional Resources
        </h2>
        <div className="text-blue-700 text-sm space-y-2">
          <p>• <strong>SharePoint REST API docs:</strong> https://docs.microsoft.com/en-us/sharepoint/dev/sp-add-ins/complete-basic-operations-using-sharepoint-rest-endpoints</p>
          <p>• <strong>Graph API feedback:</strong> Report this bug at https://github.com/microsoftgraph/microsoft-graph-docs</p>
          <p>• <strong>Choice field limits:</strong> Maximum 255 choices per field (you have 66, so you're fine)</p>
        </div>
      </div>
    </div>
  )
}

export default CategorySolutions