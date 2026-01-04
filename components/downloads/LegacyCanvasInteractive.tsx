import React, { useState } from 'react'
import { Save, Download, Printer, Undo, HelpCircle, Lock, Unlock } from 'lucide-react'

interface CanvasField {
  id: string
  label: string
  value: string
  placeholder: string
  required: boolean
  type: 'text' | 'textarea' | 'signature' | 'checkbox' | 'date'
}

interface CanvasSection {
  id: string
  title: string
  description: string
  color: string
  fields: CanvasField[]
}

const LegacyCanvasInteractive: React.FC = () => {
  const [isLocked, setIsLocked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [canvasData, setCanvasData] = useState<Record<string, string>>({})

  const sections: CanvasSection[] = [
    {
      id: 'sovereign-thesis',
      title: 'SOVEREIGN THESIS',
      description: 'Articulate your foundational worldview and purpose',
      color: 'bg-purple-600',
      fields: [
        {
          id: 'purpose',
          label: 'Core Purpose',
          value: canvasData.purpose || '',
          placeholder: 'The fundamental reason for your existence...',
          required: true,
          type: 'textarea'
        },
        {
          id: 'values',
          label: 'Guiding Values',
          value: canvasData.values || '',
          placeholder: 'Principles that guide every decision...',
          required: true,
          type: 'textarea'
        },
        {
          id: 'vision',
          label: 'Long-term Vision',
          value: canvasData.vision || '',
          placeholder: 'The world you aim to create...',
          required: true,
          type: 'textarea'
        }
      ]
    },
    {
      id: 'capital-matrix',
      title: 'CAPITAL MATRIX',
      description: 'Map and allocate your forms of capital',
      color: 'bg-emerald-600',
      fields: [
        {
          id: 'financial',
          label: 'Financial Capital',
          value: canvasData.financial || '',
          placeholder: 'Financial resources and investments...',
          required: true,
          type: 'textarea'
        },
        {
          id: 'social',
          label: 'Social Capital',
          value: canvasData.social || '',
          placeholder: 'Networks, relationships, influence...',
          required: true,
          type: 'textarea'
        },
        {
          id: 'cultural',
          label: 'Cultural Capital',
          value: canvasData.cultural || '',
          placeholder: 'Knowledge, education, taste...',
          required: true,
          type: 'textarea'
        },
        {
          id: 'spiritual',
          label: 'Spiritual Capital',
          value: canvasData.spiritual || '',
          placeholder: 'Faith, purpose, transcendence...',
          required: true,
          type: 'textarea'
        }
      ]
    },
    {
      id: 'institutions',
      title: 'INSTITUTIONS',
      description: 'Design the structures that embody your legacy',
      color: 'bg-blue-600',
      fields: [
        {
          id: 'family',
          label: 'Family Structures',
          value: canvasData.family || '',
          placeholder: 'Family governance, traditions, values...',
          required: true,
          type: 'textarea'
        },
        {
          id: 'business',
          label: 'Business Entities',
          value: canvasData.business || '',
          placeholder: 'Companies, partnerships, holding structures...',
          required: true,
          type: 'textarea'
        },
        {
          id: 'philanthropy',
          label: 'Philanthropic Vehicles',
          value: canvasData.philanthropy || '',
          placeholder: 'Foundations, trusts, charitable initiatives...',
          required: true,
          type: 'textarea'
        },
        {
          id: 'intellectual',
          label: 'Intellectual Property',
          value: canvasData.intellectual || '',
          placeholder: 'Patents, trademarks, copyrights, trade secrets...',
          required: true,
          type: 'textarea'
        }
      ]
    },
    {
      id: 'guardrails',
      title: 'GUARDRAILS',
      description: 'Establish boundaries and protection mechanisms',
      color: 'bg-red-600',
      fields: [
        {
          id: 'ethical',
          label: 'Ethical Boundaries',
          value: canvasData.ethical || '',
          placeholder: 'Moral principles and red lines...',
          required: true,
          type: 'textarea'
        },
        {
          id: 'risk',
          label: 'Risk Management',
          value: canvasData.risk || '',
          placeholder: 'Risk assessment and mitigation strategies...',
          required: true,
          type: 'textarea'
        },
        {
          id: 'succession',
          label: 'Succession Planning',
          value: canvasData.succession || '',
          placeholder: 'Leadership transition and continuity plans...',
          required: true,
          type: 'textarea'
        },
        {
          id: 'accountability',
          label: 'Accountability Systems',
          value: canvasData.accountability || '',
          placeholder: 'Oversight, checks and balances, audits...',
          required: true,
          type: 'textarea'
        }
      ]
    }
  ]

  const handleFieldChange = (fieldId: string, value: string) => {
    if (!isLocked) {
      setCanvasData(prev => ({
        ...prev,
        [fieldId]: value
      }))
      setSaved(false)
    }
  }

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('legacyCanvasData', JSON.stringify(canvasData))
    setSaved(true)
    
    // Show success message
    setTimeout(() => setSaved(false), 3000)
  }

  const handleReset = () => {
    setCanvasData({})
    localStorage.removeItem('legacyCanvasData')
  }

  const handleExportPDF = () => {
    // Trigger PDF download
    window.open('/assets/downloads/legacy-architecture-canvas-a4-premium.pdf', '_blank')
  }

  const handlePrint = () => {
    window.print()
  }

  const handleLockToggle = () => {
    setIsLocked(!isLocked)
  }

  const fieldCount = Object.keys(canvasData).filter(key => canvasData[key]?.trim()).length
  const totalFields = sections.reduce((acc, section) => acc + section.fields.length, 0)
  const completionPercentage = Math.round((fieldCount / totalFields) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8 border border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                Legacy Architecture Canvas
              </h1>
              <p className="text-lg text-slate-600 mb-4">
                Institutional-Grade Framework for Sovereign Design
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-sm text-slate-600">Interactive Canvas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm text-slate-600">Auto-save Enabled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-slate-600">Export to PDF</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSave}
                className={`px-6 py-3 rounded-lg flex items-center gap-2 font-semibold transition-all ${
                  saved
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : 'bg-slate-800 text-white hover:bg-slate-900'
                }`}
              >
                <Save className="w-4 h-4" />
                {saved ? 'Saved!' : 'Save Progress'}
              </button>

              <button
                onClick={handleExportPDF}
                className="px-6 py-3 rounded-lg bg-white text-slate-800 font-semibold border border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>

              <button
                onClick={handlePrint}
                className="px-6 py-3 rounded-lg bg-white text-slate-800 font-semibold border border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>

              <button
                onClick={handleLockToggle}
                className="px-6 py-3 rounded-lg flex items-center gap-2 font-semibold transition-all"
                style={{
                  backgroundColor: isLocked ? '#fef3c7' : '#f1f5f9',
                  color: isLocked ? '#92400e' : '#334155',
                  border: `1px solid ${isLocked ? '#fbbf24' : '#cbd5e1'}`
                }}
              >
                {isLocked ? (
                  <>
                    <Lock className="w-4 h-4" />
                    Unlock
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    Lock
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                Canvas Completion: {completionPercentage}%
              </span>
              <span className="text-sm text-slate-500">
                {fieldCount} of {totalFields} fields completed
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-emerald-500 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Canvas Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {sections.map((section) => (
            <div
              key={section.id}
              className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              {/* Section Header */}
              <div className={`${section.color} px-6 py-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">
                      {section.title}
                    </h2>
                    <p className="text-sm text-white/90">
                      {section.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white/80 bg-white/20 px-2 py-1 rounded">
                      {section.fields.filter(f => canvasData[f.id]?.trim()).length}/{section.fields.length}
                    </span>
                    <button className="text-white hover:text-white/80">
                      <HelpCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Section Fields */}
              <div className="p-6 space-y-4">
                {section.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                        {field.label}
                        {field.required && <span className="text-red-500">*</span>}
                      </span>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={field.value}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          placeholder={field.placeholder}
                          rows={3}
                          disabled={isLocked}
                          className={`w-full px-4 py-3 rounded-lg border ${
                            isLocked
                              ? 'bg-slate-50 border-slate-300 text-slate-500'
                              : 'bg-white border-slate-300 hover:border-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                          } transition-colors resize-none`}
                        />
                      ) : (
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          placeholder={field.placeholder}
                          disabled={isLocked}
                          className={`w-full px-4 py-3 rounded-lg border ${
                            isLocked
                              ? 'bg-slate-50 border-slate-300 text-slate-500'
                              : 'bg-white border-slate-300 hover:border-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                          } transition-colors`}
                        />
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-2"
              >
                <Undo className="w-4 h-4" />
                Reset Canvas
              </button>
              <div className="text-sm text-slate-500">
                Your work is automatically saved to your browser
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isLocked && (
                <div className="px-4 py-2 bg-amber-50 text-amber-800 rounded-lg text-sm border border-amber-200">
                  Canvas is locked. Unlock to edit.
                </div>
              )}
              <button
                onClick={handleExportPDF}
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-emerald-500 text-white font-semibold hover:from-purple-700 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl"
              >
                Download Master PDF
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl text-white">
          <h3 className="text-xl font-bold mb-4">Instructions for Use:</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <p className="text-slate-200">
                  Complete each section with precision and foresight. Think multi-generationally.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <p className="text-slate-200">
                  Your work is saved automatically. Export to PDF for permanent records.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <p className="text-slate-200">
                  Review quarterly and update as your legacy evolves. Share with trusted advisors.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  4
                </div>
                <p className="text-slate-200">
                  Use "Lock" feature to prevent accidental edits when canvas is complete.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LegacyCanvasInteractive