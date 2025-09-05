import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'

// Download helper function
const downloadFile = async (endpoint, data, filename) => {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error('Download failed')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    alert('Download failed: ' + error.message)
  }
}

export default function SystematicReviewApp() {
  const [activeTab, setActiveTab] = useState('protocol')
  const [protocol, setProtocol] = useState(null)
  const [studies, setStudies] = useState([])
  const [screenedStudies, setScreenedStudies] = useState([])
  const [extractedData, setExtractedData] = useState([])
  const [qualityAssessments, setQualityAssessments] = useState([])
  const [metaResults, setMetaResults] = useState(null)
  const [generatedArticle, setGeneratedArticle] = useState(null)
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [availableModels, setAvailableModels] = useState({})
  const [modelStatus, setModelStatus] = useState({})

  // Vibrant color scheme
  const colors = {
    primary: 'from-purple-600 to-blue-600',
    secondary: 'from-emerald-500 to-teal-500',
    accent: 'from-orange-400 to-pink-500',
    success: 'from-green-500 to-green-600',
    warning: 'from-yellow-400 to-orange-500',
    error: 'from-red-500 to-red-600',
    neutral: 'from-gray-500 to-gray-600',
    background: 'from-slate-50 to-blue-50',
    card: 'from-white to-slate-50',
    tabActive: 'from-purple-500 to-blue-600',
    tabInactive: 'from-gray-100 to-gray-200',
  }

  // Protocol Generation
  const [researchQuestion, setResearchQuestion] = useState('')
  const [pico, setPico] = useState({ population: '', intervention: '', comparison: '', outcome: '' })

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])

  // Screening
  const [inclusionCriteria, setInclusionCriteria] = useState('')
  const [exclusionCriteria, setExclusionCriteria] = useState('')

  // Auto-load available models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await fetch('/api/models')
        const data = await response.json()
        setAvailableModels(data.available_models || {})

        // Auto-select the default model if available
        if (data.default_model && data.available_models[data.default_model]?.available) {
          setSelectedModel(data.default_model)
          // For free models, set a dummy API key
          if (data.available_models[data.default_model].free) {
            setApiKey('free-model-nokey-required')
          }
        }
      } catch (error) {
        console.error('Failed to load models:', error)
        // Fallback to free models
        const fallbackModels = {
          'deepseek-chat': { provider: 'deepseek', available: true, free: true, requires_key: false, recommended: true }
        }
        setAvailableModels(fallbackModels)
        setSelectedModel('deepseek-chat')
        setApiKey('free-model-nokey-required')
      }
    }

    loadModels()
  }, [])

  // Update API key when model changes
  useEffect(() => {
    if (selectedModel && availableModels[selectedModel]) {
      if (availableModels[selectedModel].free) {
        // Free models don't need API keys
        setApiKey('free-model-nokey-required')
      } else {
        // Clear API key for paid models (user needs to enter it)
        setApiKey('')
      }
    }
  }, [selectedModel, availableModels])

  const getProviderName = (model) => {
    const providers = {
      'gpt-4-turbo': 'OpenAI',
      'gpt-4': 'OpenAI',
      'gpt-3.5-turbo': 'OpenAI',
      'claude-3-opus': 'Anthropic',
      'claude-3-sonnet': 'Anthropic',
      'claude-haiku': 'Anthropic',
      'gemini-pro': 'Google',
      'gemini-pro-vision': 'Google',
      'deepseek-chat': 'DeepSeek',
      'deepseek-coder': 'DeepSeek',
      'llama-2-7b': 'Ollama',
      'codellama': 'Ollama'
    }
    return providers[model] || 'Unknown'
  }

  const getModelInfo = (model) => {
    const info = {
      'gpt-4-turbo': 'OpenAI GPT-4 Turbo - High performance, fast responses',
      'gpt-4': 'OpenAI GPT-4 - Premium model with excellent reasoning',
      'gpt-3.5-turbo': 'OpenAI GPT-3.5 Turbo - Cost-effective choice',
      'claude-3-opus': 'Claude 3 Opus - Excellent for complex analysis',
      'claude-3-sonnet': 'Claude 3 Sonnet - Balanced performance & speed',
      'claude-haiku': 'Claude 3 Haiku - Fast responses, good for simple tasks',
      'gemini-pro': 'Google Gemini Pro - Multi-modal understanding',
      'gemini-pro-vision': 'Google Gemini Vision - Image & text analysis',
      'deepseek-chat': 'DeepSeek Chat - FREE open-source model, good performance',
      'deepseek-coder': 'DeepSeek Coder - FREE specialized for programming',
      'llama-2-7b': 'Llama 2 7B - LOCAL model, requires Ollama installation',
      'codellama': 'CodeLlama - LOCAL model for coding tasks'
    }
    return info[model] || 'Unknown model'
  }

  const tabs = [
    { id: 'protocol', label: 'Protocol', icon: '📋' },
    { id: 'search', label: 'Literature Search', icon: '🔍' },
    { id: 'screening', label: 'Screening', icon: '⚖️' },
    { id: 'extraction', label: 'Data Extraction', icon: '📊' },
    { id: 'quality', label: 'Quality Assessment', icon: '⭐' },
    { id: 'analysis', label: 'Meta-Analysis', icon: '📈' },
    { id: 'article', label: 'Generate Article', icon: '📝' }
  ]

  const generateProtocol = async () => {
    if (!researchQuestion || !apiKey) return
    setLoading(true)
    try {
      const response = await fetch('/api/generate-protocol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ researchQuestion, pico, apiKey })
      })
      const data = await response.json()
      setProtocol(data)
    } catch (error) {
      console.error('Protocol generation failed:', error)
    }
    setLoading(false)
  }

  const searchLiterature = async () => {
    if (!searchQuery || !apiKey) return
    setLoading(true)
    try {
      const response = await fetch('/api/search-literature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, apiKey })
      })
      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error('Literature search failed:', error)
    }
    setLoading(false)
  }

  const screenStudies = async () => {
    if (!searchResults.length || !apiKey) return
    setLoading(true)
    try {
      const response = await fetch('/api/screen-studies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studies: searchResults,
          inclusionCriteria,
          exclusionCriteria,
          apiKey
        })
      })
      const data = await response.json()
      setScreenedStudies(data)
    } catch (error) {
      console.error('Screening failed:', error)
    }
    setLoading(false)
  }

  const extractData = async () => {
    if (!screenedStudies.length || !apiKey) return
    setLoading(true)
    try {
      const response = await fetch('/api/extract-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studies: screenedStudies, apiKey })
      })
      const data = await response.json()
      setExtractedData(data)
    } catch (error) {
      console.error('Data extraction failed:', error)
    }
    setLoading(false)
  }

  const assessQuality = async () => {
    if (!screenedStudies.length || !apiKey) return
    setLoading(true)
    try {
      const response = await fetch('/api/assess-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studies: screenedStudies, apiKey })
      })
      const data = await response.json()
      setQualityAssessments(data)
    } catch (error) {
      console.error('Quality assessment failed:', error)
    }
    setLoading(false)
  }

  const performMetaAnalysis = async () => {
    if (!extractedData.length || !apiKey) return
    setLoading(true)
    try {
      const response = await fetch('/api/meta-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractedData, apiKey })
      })
      const data = await response.json()
      setMetaResults(data)
    } catch (error) {
      console.error('Meta-analysis failed:', error)
    }
    setLoading(false)
  }

  const generateArticle = async () => {
    if (!protocol || !screenedStudies.length || !apiKey) return
    setLoading(true)
    try {
      const response = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol,
          studies: screenedStudies,
          extractedData,
          qualityAssessments,
          metaResults,
          apiKey
        })
      })
      const data = await response.json()
      setGeneratedArticle(data)
    } catch (error) {
      console.error('Article generation failed:', error)
    }
    setLoading(false)
  }

  const renderProtocolTab = () => (
    <div className="space-y-10">
      {/* Main Protocol Generation Card */}
      <div className={`bg-gradient-to-br ${colors.card} p-10 rounded-3xl shadow-2xl border-l-8 border-purple-500 hover:shadow-3xl transition-all duration-500 relative overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-400 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-400 rounded-full blur-2xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center mb-8">
            <div className={`bg-gradient-to-r ${colors.primary} p-4 rounded-2xl mr-6 shadow-lg`}>
              <span className="text-3xl">📋</span>
            </div>
            <div>
              <h2 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 leading-tight">
                Generate Systematic Review Protocol
              </h2>
              <p className="text-lg md:text-xl text-gray-600 font-medium">Create a comprehensive research protocol with AI assistance</p>
            </div>
          </div>

          {/* Model Status Summary */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">🤖 Available AI Models</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {Object.entries(availableModels).map(([model, info]) => (
                <div key={model} className={`p-2 rounded ${info.available ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <span className={info.free ? 'text-green-600 font-bold' : 'text-gray-600'}>
                    {info.free ? '🆓' : '💰'} {model.split('-')[0]}
                  </span>
                  <br />
                  <span className="text-xs text-gray-500">{info.provider}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">AI Model Selection</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-2 border rounded mb-2"
              disabled={Object.keys(availableModels).length === 0}
            >
              <option value="">
                {Object.keys(availableModels).length === 0 ? 'Loading models...' : 'Select a model'}
              </option>
              {Object.entries(availableModels)
                .filter(([model, info]) => info.available)
                .sort((a, b) => {
                  // Sort by: free first, then recommended, then alphabetically
                  if (a[1].free && !b[1].free) return -1
                  if (!a[1].free && b[1].free) return 1
                  if (a[1].recommended && !b[1].recommended) return -1
                  if (!a[1].recommended && b[1].recommended) return 1
                  return a[0].localeCompare(b[0])
                })
                .map(([model, info]) => (
                  <option key={model} value={model}>
                    {info.free ? '🆓 ' : '💰 '}
                    {model.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    {info.recommended ? ' ⭐' : ''}
                  </option>
                ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {selectedModel ? getModelInfo(selectedModel) : 'Select an AI model to continue'}
            </p>
          </div>

          {/* Only show API key for non-free models */}
          {selectedModel && availableModels[selectedModel] && !availableModels[selectedModel].free && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {getProviderName(selectedModel)} API Key
                {availableModels[selectedModel].requires_key && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder={`Enter your ${getProviderName(selectedModel)} API key`}
                required={availableModels[selectedModel].requires_key}
              />
              <p className="text-xs text-gray-500 mt-1">
                Required for {getProviderName(selectedModel)} models. Your key is not stored.
              </p>
            </div>
          )}

          {/* Free model notice */}
          {selectedModel && availableModels[selectedModel] && availableModels[selectedModel].free && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-700">
                ✅ <strong>No API key required!</strong> This is a free/open model that works immediately.
              </p>
              {selectedModel.includes('deepseek') && (
                <p className="text-xs text-green-600 mt-1">
                  DeepSeek provides high-quality responses at no cost for basic usage.
                </p>
              )}
            </div>
          )}

          {/* Research Question */}
          <div className="mb-8">
            <label className="block text-2xl font-bold mb-4 text-gray-800">Research Question</label>
            <textarea
              value={researchQuestion}
              onChange={(e) => setResearchQuestion(e.target.value)}
              className="w-full p-4 border-2 border-purple-200 rounded-xl h-32 text-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all"
              placeholder="Enter your research question (e.g., 'What is the effect of exercise on cardiovascular health in adults?')"
            />
          </div>

          {/* PICO Framework */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">PICO Framework</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200">
                <label className="block text-lg font-semibold mb-2 text-blue-800">Population (P)</label>
                <input
                  value={pico.population}
                  onChange={(e) => setPico({...pico, population: e.target.value})}
                  className="w-full p-3 border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Study population (e.g., adults, children, patients with diabetes)"
                />
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200">
                <label className="block text-lg font-semibold mb-2 text-green-800">Intervention (I)</label>
                <input
                  value={pico.intervention}
                  onChange={(e) => setPico({...pico, intervention: e.target.value})}
                  className="w-full p-3 border border-green-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  placeholder="Intervention (e.g., exercise, medication, therapy)"
                />
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl border-2 border-yellow-200">
                <label className="block text-lg font-semibold mb-2 text-orange-800">Comparison (C)</label>
                <input
                  value={pico.comparison}
                  onChange={(e) => setPico({...pico, comparison: e.target.value})}
                  className="w-full p-3 border border-yellow-300 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                  placeholder="Comparison group (e.g., placebo, usual care, no intervention)"
                />
              </div>
              <div className="bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-xl border-2 border-red-200">
                <label className="block text-lg font-semibold mb-2 text-red-800">Outcome (O)</label>
                <input
                  value={pico.outcome}
                  onChange={(e) => setPico({...pico, outcome: e.target.value})}
                  className="w-full p-3 border border-red-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  placeholder="Outcome measures (e.g., mortality, quality of life, blood pressure)"
                />
              </div>
            </div>
          </div>

          {/* Inclusion and Exclusion Criteria - Prominent Section */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-6 text-gray-800 text-center">📋 Inclusion & Exclusion Criteria</h3>
            <div className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 p-6 rounded-2xl border-2 border-green-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Inclusion Criteria */}
                <div className="bg-white p-6 rounded-xl border-2 border-green-300 shadow-lg">
                  <div className="flex items-center mb-4">
                    <div className="bg-green-500 p-2 rounded-lg mr-3">
                      <span className="text-white text-xl">✅</span>
                    </div>
                    <h4 className="text-xl font-bold text-green-800">Inclusion Criteria</h4>
                  </div>
                  <textarea
                    value={inclusionCriteria}
                    onChange={(e) => setInclusionCriteria(e.target.value)}
                    className="w-full p-3 border border-green-300 rounded-lg h-40 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 resize-none"
                    placeholder="• Specific study types (e.g., RCTs, cohort studies)
• Population characteristics (e.g., age, gender)
• Intervention details
• Outcome measures
• Publication criteria (e.g., language, date range)
• Geographic restrictions"
                  />
                </div>

                {/* Exclusion Criteria */}
                <div className="bg-white p-6 rounded-xl border-2 border-red-300 shadow-lg">
                  <div className="flex items-center mb-4">
                    <div className="bg-red-500 p-2 rounded-lg mr-3">
                      <span className="text-white text-xl">❌</span>
                    </div>
                    <h4 className="text-xl font-bold text-red-800">Exclusion Criteria</h4>
                  </div>
                  <textarea
                    value={exclusionCriteria}
                    onChange={(e) => setExclusionCriteria(e.target.value)}
                    className="w-full p-3 border border-red-300 rounded-lg h-40 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 resize-none"
                    placeholder="• Uncontrolled studies
• Animal studies
• Case reports/series
• Non-relevant interventions
• Missing outcome data
• Poor quality studies
• Duplicate publications"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="text-center">
            <button
              onClick={generateProtocol}
              disabled={loading || !researchQuestion || !apiKey}
              className={`bg-gradient-to-r ${colors.primary} text-white px-12 py-4 rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Generating Protocol...
                </div>
              ) : (
                '🚀 Generate Systematic Review Protocol'
              )}
            </button>
          </div>
        </div>
      </div>

      {protocol && (
        <div className="bg-gradient-to-br from-white to-blue-50 p-8 rounded-3xl shadow-xl border-l-8 border-blue-500">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              📄 Generated Systematic Review Protocol
            </h3>
            <button
              onClick={() => downloadFile('/download/protocol/1', {}, 'protocol.json')}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
            >
              📥 Download JSON
            </button>
          </div>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border-l-4 border-blue-400">
              <h4 className="text-xl font-bold text-blue-800 mb-2">🎯 Research Question</h4>
              <p className="text-lg text-gray-700">{protocol.research_question}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border-l-4 border-purple-400">
              <h4 className="text-xl font-bold text-purple-800 mb-2">🎯 Objectives</h4>
              <p className="text-lg text-gray-700">{protocol.objectives}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border-l-4 border-green-400">
              <h4 className="text-xl font-bold text-green-800 mb-4">✅ Eligibility Criteria</h4>
              <div className="space-y-3">
                <div className="bg-green-50 p-4 rounded-lg">
                  <strong className="text-green-800">Inclusion:</strong>
                  <p className="text-gray-700 mt-1">{protocol.inclusion_criteria}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <strong className="text-red-800">Exclusion:</strong>
                  <p className="text-gray-700 mt-1">{protocol.exclusion_criteria}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderSearchTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Literature Search</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Search Query</label>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter PubMed search query..."
          />
        </div>

        <button
          onClick={searchLiterature}
          disabled={loading || !searchQuery || !apiKey}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search PubMed'}
        </button>
      </div>

      {searchResults.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Search Results ({searchResults.length} studies)</h3>
            <button
              onClick={() => downloadFile('/download/literature-search', { results: searchResults }, 'literature_search_results.csv')}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
            >
              📥 Download CSV
            </button>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {searchResults.slice(0, 10).map((study, index) => (
              <div key={index} className="border-b pb-4">
                <h4 className="font-semibold">{study.title}</h4>
                <p className="text-sm text-gray-600">{study.authors?.join(', ')} ({study.year})</p>
                <p className="text-sm mt-2">{study.abstract?.substring(0, 200)}...</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderScreeningTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Study Screening</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Inclusion Criteria</label>
            <textarea
              value={inclusionCriteria}
              onChange={(e) => setInclusionCriteria(e.target.value)}
              className="w-full p-2 border rounded h-32"
              placeholder="Enter inclusion criteria..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Exclusion Criteria</label>
            <textarea
              value={exclusionCriteria}
              onChange={(e) => setExclusionCriteria(e.target.value)}
              className="w-full p-2 border rounded h-32"
              placeholder="Enter exclusion criteria..."
            />
          </div>
        </div>

        <button
          onClick={screenStudies}
          disabled={loading || !searchResults.length || !apiKey}
          className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Screening...' : 'Screen Studies'}
        </button>
      </div>

      {screenedStudies.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Screening Results</h3>
            <button
              onClick={() => downloadFile('/download/screening-results', { results: screenedStudies }, 'screening_results.csv')}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
            >
              📥 Download CSV
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-green-100 rounded">
              <div className="text-2xl font-bold text-green-600">
                {screenedStudies.filter(s => s.screening_decision === 'include').length}
              </div>
              <div className="text-sm">Included</div>
            </div>
            <div className="text-center p-4 bg-red-100 rounded">
              <div className="text-2xl font-bold text-red-600">
                {screenedStudies.filter(s => s.screening_decision === 'exclude').length}
              </div>
              <div className="text-sm">Excluded</div>
            </div>
            <div className="text-center p-4 bg-yellow-100 rounded">
              <div className="text-2xl font-bold text-yellow-600">
                {screenedStudies.filter(s => s.screening_decision === 'unclear').length}
              </div>
              <div className="text-sm">Unclear</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderExtractionTab = () => (
    <div className="space-y-8">
      {/* Main Data Extraction Card */}
      <div className={`bg-gradient-to-br ${colors.card} p-8 rounded-2xl shadow-xl border-l-8 border-indigo-500`}>
        <div className="flex items-center mb-6">
          <div className={`bg-gradient-to-r ${colors.secondary} p-3 rounded-xl mr-4`}>
            <span className="text-2xl">📊</span>
          </div>
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Data Extraction
            </h2>
            <p className="text-lg text-gray-600 font-medium">Extract quantitative data from selected studies</p>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={extractData}
            disabled={loading || !screenedStudies.length || !apiKey}
            className={`bg-gradient-to-r ${colors.secondary} text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Extracting Data...
              </div>
            ) : (
              `📊 Extract Data from ${screenedStudies.length} Studies`
            )}
          </button>
        </div>
      </div>

      {/* Results Display */}
      {extractedData.length > 0 && (
        <div className="bg-gradient-to-br from-white to-blue-50 p-8 rounded-3xl shadow-xl border-l-8 border-blue-500">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              📋 Extracted Data Results ({extractedData.length} studies)
            </h3>
            <button
              onClick={() => downloadFile('/download/extracted-data', { results: extractedData }, 'extracted_data.csv')}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
            >
              📥 Download CSV
            </button>
          </div>

          {/* Statistics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{extractedData.length}</div>
                <div className="text-blue-800 font-semibold">Total Studies</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {extractedData.filter(d => d.extracted_data?.effect_size).length}
                </div>
                <div className="text-green-800 font-semibold">With Effect Sizes</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {extractedData.filter(d => d.extraction_status === 'success').length}
                </div>
                <div className="text-purple-800 font-semibold">Successful Extractions</div>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-lg">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b-2 border-gray-200">
              <h4 className="text-lg font-bold text-gray-800">📊 Extracted Data Table</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="text-left p-4 font-bold text-blue-800 border-b">Study ID</th>
                    <th className="text-left p-4 font-bold text-blue-800 border-b">Status</th>
                    <th className="text-left p-4 font-bold text-blue-800 border-b">Study Design</th>
                    <th className="text-left p-4 font-bold text-blue-800 border-b">Sample Size</th>
                    <th className="text-left p-4 font-bold text-blue-800 border-b">Intervention</th>
                    <th className="text-left p-4 font-bold text-blue-800 border-b">Control</th>
                    <th className="text-left p-4 font-bold text-blue-800 border-b">Outcome</th>
                    <th className="text-left p-4 font-bold text-blue-800 border-b">Effect Size</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedData.map((data, index) => {
                    const extracted = data.extracted_data || {};
                    return (
                      <tr key={index} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors`}>
                        <td className="p-4 border-b border-gray-200 font-semibold text-gray-800">
                          {extracted.study_id || data.article_id || `Study ${index + 1}`}
                        </td>
                        <td className="p-4 border-b border-gray-200">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            data.extraction_status === 'success'
                              ? 'bg-green-100 text-green-800'
                              : data.extraction_status === 'partial'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {data.extraction_status || 'pending'}
                          </span>
                        </td>
                        <td className="p-4 border-b border-gray-200">{extracted.study_design || 'N/A'}</td>
                        <td className="p-4 border-b border-gray-200">{extracted.sample_size || 'N/A'}</td>
                        <td className="p-4 border-b border-gray-200">{extracted.intervention || 'N/A'}</td>
                        <td className="p-4 border-b border-gray-200">{extracted.control || 'N/A'}</td>
                        <td className="p-4 border-b border-gray-200">{extracted.outcome || 'N/A'}</td>
                        <td className="p-4 border-b border-gray-200">
                          {extracted.effect_size
                            ? <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                {extracted.effect_size.toFixed(3)}
                              </span>
                            : 'N/A'
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Additional Info */}
          {extractedData.filter(d => d.extraction_notes).length > 0 && (
            <div className="mt-8 bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
              <h4 className="text-lg font-bold text-orange-800 mb-4">📝 Extraction Notes</h4>
              <div className="space-y-3">
                {extractedData
                  .filter(d => d.extraction_notes)
                  .map((data, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-yellow-200">
                      <strong className="text-orange-800">
                        {data.extracted_data?.study_id || data.article_id || `Study ${index + 1}`}:
                      </strong>
                      <p className="text-gray-700 mt-1">{data.extraction_notes}</p>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderQualityTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Quality Assessment</h2>

        <button
          onClick={assessQuality}
          disabled={loading || !screenedStudies.length || !apiKey}
          className="bg-yellow-600 text-white px-6 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
        >
          {loading ? 'Assessing...' : 'Assess Quality (NOS)'}
        </button>
      </div>

      {qualityAssessments.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Quality Assessment Results</h3>
            <button
              onClick={() => downloadFile('/download/quality-assessment', { results: qualityAssessments }, 'quality_assessment.csv')}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
            >
              📥 Download CSV
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-green-100 rounded">
              <div className="text-2xl font-bold text-green-600">
                {qualityAssessments.filter(q => q.risk_of_bias === 'Low').length}
              </div>
              <div className="text-sm">Low Risk</div>
            </div>
            <div className="text-center p-4 bg-orange-100 rounded">
              <div className="text-2xl font-bold text-orange-600">
                {qualityAssessments.filter(q => q.risk_of_bias === 'Unclear').length}
              </div>
              <div className="text-sm">Unclear</div>
            </div>
            <div className="text-center p-4 bg-red-100 rounded">
              <div className="text-2xl font-bold text-red-600">
                {qualityAssessments.filter(q => q.risk_of_bias === 'High').length}
              </div>
              <div className="text-sm">High Risk</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderAnalysisTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Meta-Analysis</h2>

        <button
          onClick={performMetaAnalysis}
          disabled={loading || !extractedData.length || !apiKey}
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Perform Meta-Analysis'}
        </button>
      </div>

      {metaResults && !metaResults.error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Meta-Analysis Results</h3>
              <button
                onClick={() => downloadFile('/download/meta-analysis', { results: metaResults }, 'meta_analysis_results.json')}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
              >
                📥 Download JSON
              </button>
            </div>
            <div className="space-y-2">
              <p><strong>Studies:</strong> {metaResults.num_studies}</p>
              <p><strong>Pooled Effect:</strong> {metaResults.pooled_effect?.toFixed(3)}</p>
              <p><strong>95% CI:</strong> [{metaResults.confidence_interval_lower?.toFixed(3)}, {metaResults.confidence_interval_upper?.toFixed(3)}]</p>
              <p><strong>P-value:</strong> {metaResults.p_value?.toFixed(3)}</p>
              <p><strong>I²:</strong> {metaResults.heterogeneity_i2?.toFixed(1)}%</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">Forest Plot</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metaResults.study_effects?.slice(0, 10) || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="study" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="effect_size" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderArticleTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Generate Systematic Review Article</h2>

        <button
          onClick={generateArticle}
          disabled={loading || !protocol || !screenedStudies.length || !apiKey}
          className="bg-teal-600 text-white px-6 py-2 rounded hover:bg-teal-700 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Article'}
        </button>
      </div>

      {generatedArticle && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Generated Article</h3>
            <div className="flex gap-2">
              <button
                onClick={() => downloadFile('/download/article', { article: generatedArticle }, 'systematic_review_article.md')}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
              >
                📥 Download Markdown
              </button>
              <button
                onClick={() => downloadFile('/download/article-word', { article: generatedArticle }, 'systematic_review_article.docx')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
              >
                📥 Download Word
              </button>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold mb-2">Title</h4>
              <p className="text-lg">{generatedArticle.sections?.title}</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-2">Abstract</h4>
              <p className="text-justify">{generatedArticle.sections?.abstract}</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-2">Introduction</h4>
              <p className="text-justify">{generatedArticle.sections?.introduction}</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-2">Methods</h4>
              <p className="text-justify">{generatedArticle.sections?.methods}</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-2">Results</h4>
              <p className="text-justify">{generatedArticle.sections?.results}</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-2">Discussion</h4>
              <p className="text-justify">{generatedArticle.sections?.discussion}</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-2">Conclusion</h4>
              <p className="text-justify">{generatedArticle.sections?.conclusion}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.background}`}>
      {/* Hero Header */}
      <div className={`bg-gradient-to-r ${colors.primary} shadow-xl`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="py-8">
            <div className="text-center text-white">
              <h1 className="text-6xl md:text-7xl font-extrabold mb-4 bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-400 bg-clip-text text-transparent leading-tight">
                🤖 AI Systematic Review Agent
              </h1>
              <p className="text-xl md:text-2xl opacity-95 mb-8 font-semibold">
                Revolutionizing research with multi-model AI assistance
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-sm">
                <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">DeepSeek Free</span>
                <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">Multi-Model Support</span>
                <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">Download Suite</span>
                <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">Zero Setup</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={`bg-gradient-to-r ${colors.card} shadow-lg border-b-4 border-orange-400`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-2 py-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-3 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 transform hover:scale-105 ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${colors.tabActive} text-white shadow-lg`
                    : `bg-gradient-to-r ${colors.tabInactive} text-gray-700 hover:bg-gradient-to-r hover:from-purple-300 hover:to-blue-300`
                }`}
              >
                <span className="mr-2 text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'protocol' && renderProtocolTab()}
        {activeTab === 'search' && renderSearchTab()}
        {activeTab === 'screening' && renderScreeningTab()}
        {activeTab === 'extraction' && renderExtractionTab()}
        {activeTab === 'quality' && renderQualityTab()}
        {activeTab === 'analysis' && renderAnalysisTab()}
        {activeTab === 'article' && renderArticleTab()}
      </div>
    </div>
  )
}
