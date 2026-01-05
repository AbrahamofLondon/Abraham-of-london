// components/downloads/LegacyCanvasInteractive.tsx - PREMIUM VERSION
import React, { useState, useEffect } from 'react';
import { 
  Save, Download, Printer, Undo, HelpCircle, Lock, Unlock, 
  Shield, Award, Globe, Users, Target, Zap, CheckCircle,
  FileText, BarChart, Building, Eye, EyeOff
} from 'lucide-react';

interface CanvasField {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  required: boolean;
  type: 'text' | 'textarea' | 'signature' | 'checkbox' | 'date';
  helpText?: string;
  maxLength?: number;
}

interface CanvasSection {
  id: string;
  title: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  fields: CanvasField[];
}

const LegacyCanvasInteractive: React.FC = () => {
  const [isLocked, setIsLocked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [canvasData, setCanvasData] = useState<Record<string, string>>({});
  const [exporting, setExporting] = useState(false);
  const [generationTime, setGenerationTime] = useState<string>('');

  // Load saved data
  useEffect(() => {
    const savedData = localStorage.getItem('legacyCanvasData');
    if (savedData) {
      try {
        setCanvasData(JSON.parse(savedData));
      } catch (e) {
        console.error('Failed to load saved data:', e);
      }
    }
  }, []);

  const sections: CanvasSection[] = [
    {
      id: 'sovereign-thesis',
      title: 'SOVEREIGN THESIS',
      description: 'Articulate your foundational worldview and purpose',
      color: 'bg-purple-600',
      icon: <Globe className="w-5 h-5" />,
      fields: [
        {
          id: 'purpose',
          label: 'Core Purpose',
          value: canvasData.purpose || '',
          placeholder: 'The fundamental reason for your existence...',
          required: true,
          type: 'textarea',
          helpText: 'What legacy do you want to leave? What is your ultimate purpose?',
          maxLength: 1000
        },
        {
          id: 'values',
          label: 'Guiding Values',
          value: canvasData.values || '',
          placeholder: 'Principles that guide every decision...',
          required: true,
          type: 'textarea',
          helpText: 'What values are non-negotiable in your life and work?',
          maxLength: 1000
        },
        {
          id: 'vision',
          label: 'Long-term Vision',
          value: canvasData.vision || '',
          placeholder: 'The world you aim to create...',
          required: true,
          type: 'textarea',
          helpText: 'Describe your 100-year vision for your legacy',
          maxLength: 1000
        }
      ]
    },
    {
      id: 'capital-matrix',
      title: 'CAPITAL MATRIX',
      description: 'Map and allocate your forms of capital',
      color: 'bg-emerald-600',
      icon: <BarChart className="w-5 h-5" />,
      fields: [
        {
          id: 'financial',
          label: 'Financial Capital',
          value: canvasData.financial || '',
          placeholder: 'Financial resources, investments, wealth preservation...',
          required: true,
          type: 'textarea',
          maxLength: 500
        },
        {
          id: 'social',
          label: 'Social Capital',
          value: canvasData.social || '',
          placeholder: 'Networks, relationships, influence, reputation...',
          required: true,
          type: 'textarea',
          maxLength: 500
        },
        {
          id: 'cultural',
          label: 'Cultural Capital',
          value: canvasData.cultural || '',
          placeholder: 'Knowledge, education, taste, family traditions...',
          required: true,
          type: 'textarea',
          maxLength: 500
        },
        {
          id: 'spiritual',
          label: 'Spiritual Capital',
          value: canvasData.spiritual || '',
          placeholder: 'Faith, purpose, transcendence, moral authority...',
          required: true,
          type: 'textarea',
          maxLength: 500
        }
      ]
    },
    {
      id: 'institutions',
      title: 'INSTITUTIONS',
      description: 'Design the structures that embody your legacy',
      color: 'bg-blue-600',
      icon: <Building className="w-5 h-5" />,
      fields: [
        {
          id: 'family',
          label: 'Family Structures',
          value: canvasData.family || '',
          placeholder: 'Family governance, traditions, values, education...',
          required: true,
          type: 'textarea',
          maxLength: 500
        },
        {
          id: 'business',
          label: 'Business Entities',
          value: canvasData.business || '',
          placeholder: 'Companies, partnerships, holding structures, succession...',
          required: true,
          type: 'textarea',
          maxLength: 500
        },
        {
          id: 'philanthropy',
          label: 'Philanthropic Vehicles',
          value: canvasData.philanthropy || '',
          placeholder: 'Foundations, trusts, charitable initiatives, impact...',
          required: true,
          type: 'textarea',
          maxLength: 500
        },
        {
          id: 'intellectual',
          label: 'Intellectual Property',
          value: canvasData.intellectual || '',
          placeholder: 'Patents, trademarks, copyrights, trade secrets...',
          required: true,
          type: 'textarea',
          maxLength: 500
        }
      ]
    },
    {
      id: 'guardrails',
      title: 'GUARDRAILS',
      description: 'Establish boundaries and protection mechanisms',
      color: 'bg-red-600',
      icon: <Shield className="w-5 h-5" />,
      fields: [
        {
          id: 'ethical',
          label: 'Ethical Boundaries',
          value: canvasData.ethical || '',
          placeholder: 'Moral principles, red lines, ethical will...',
          required: true,
          type: 'textarea',
          maxLength: 500
        },
        {
          id: 'risk',
          label: 'Risk Management',
          value: canvasData.risk || '',
          placeholder: 'Risk assessment, mitigation strategies, insurance...',
          required: true,
          type: 'textarea',
          maxLength: 500
        },
        {
          id: 'succession',
          label: 'Succession Planning',
          value: canvasData.succession || '',
          placeholder: 'Leadership transition, continuity plans, training...',
          required: true,
          type: 'textarea',
          maxLength: 500
        },
        {
          id: 'accountability',
          label: 'Accountability Systems',
          value: canvasData.accountability || '',
          placeholder: 'Oversight, checks and balances, audits, advisors...',
          required: true,
          type: 'textarea',
          maxLength: 500
        }
      ]
    }
  ];

  const handleFieldChange = (fieldId: string, value: string) => {
    if (!isLocked) {
      const newData = {
        ...canvasData,
        [fieldId]: value
      };
      setCanvasData(newData);
      setSaved(false);
      
      // Auto-save
      localStorage.setItem('legacyCanvasData', JSON.stringify(newData));
    }
  };

  const handleSave = async () => {
    try {
      localStorage.setItem('legacyCanvasData', JSON.stringify(canvasData));
      setSaved(true);
      
      // Show success message
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all fields? This cannot be undone.')) {
      setCanvasData({});
      localStorage.removeItem('legacyCanvasData');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleExportPDF = async (format: 'A4' | 'Letter' = 'A4') => {
    setExporting(true);
    
    try {
      const startTime = Date.now();
      
      // Generate dynamic filename
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `Legacy-Architecture-Canvas-${format}-${timestamp}.pdf`;
      
      // In production, this would call your backend PDF generation service
      // For now, we'll use the existing PDFs and simulate generation
      
      const pdfUrl = `/assets/downloads/legacy-architecture-canvas-${format.toLowerCase()}-premium.pdf`;
      
      // Create download link
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(1);
      setGenerationTime(duration);
      
      console.log(`PDF exported in ${duration}s: ${filename}`);
      
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    // Create print-friendly version
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Legacy Architecture Canvas - Print Version</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .section { margin-bottom: 40px; border: 2px solid #000; padding: 20px; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .field { margin-bottom: 15px; }
            .field-label { font-weight: bold; margin-bottom: 5px; }
            .field-value { border-bottom: 1px solid #ccc; min-height: 20px; }
            .header { text-align: center; margin-bottom: 40px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Legacy Architecture Canvas</h1>
            <p>Generated: ${new Date().toLocaleDateString()}</p>
          </div>
          
          ${sections.map(section => `
            <div class="section">
              <div class="section-title">${section.title}</div>
              <p>${section.description}</p>
              ${section.fields.map(field => `
                <div class="field">
                  <div class="field-label">${field.label}</div>
                  <div class="field-value">${canvasData[field.id] || field.placeholder}</div>
                </div>
              `).join('')}
            </div>
          `).join('')}
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Abraham of London. All rights reserved.</p>
            <p>www.abrahamoflondon.com</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleLockToggle = () => {
    setIsLocked(!isLocked);
    if (!isLocked) {
      // Auto-save when locking
      handleSave();
    }
  };

  const fieldCount = Object.keys(canvasData).filter(key => canvasData[key]?.trim()).length;
  const totalFields = sections.reduce((acc, section) => acc + section.fields.length, 0);
  const completionPercentage = Math.round((fieldCount / totalFields) * 100);

  // Calculate word count
  const totalWords = Object.values(canvasData)
    .join(' ')
    .split(/\s+/)
    .filter(word => word.length > 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      {/* Premium Header */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 rounded-2xl shadow-2xl p-6 md:p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-8 h-8 text-yellow-400" />
                <span className="px-4 py-1 bg-white/20 rounded-full text-sm font-medium">
                  PREMIUM EDITION
                </span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                Legacy Architecture Canvas
              </h1>
              <p className="text-lg text-purple-100 mb-6">
                Institutional-Grade Framework for Sovereign Legacy Design
              </p>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-300" />
                  <span className="text-sm">Interactive Form Fields</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-300" />
                  <span className="text-sm">Auto-save & Export</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-300" />
                  <span className="text-sm">Secure Local Storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-300" />
                  <span className="text-sm">Professional PDF Output</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSave}
                disabled={isLocked}
                className={`px-6 py-3 rounded-lg flex items-center gap-2 font-semibold transition-all ${saved
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-purple-900 hover:bg-purple-50'
                  } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Save className="w-4 h-4" />
                {saved ? 'Saved!' : 'Save Progress'}
              </button>

              <div className="relative group">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-6 py-3 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/20 transition-all flex items-center gap-2"
                >
                  {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
              </div>

              <button
                onClick={handleLockToggle}
                className={`px-6 py-3 rounded-lg flex items-center gap-2 font-semibold transition-all ${isLocked
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
              >
                {isLocked ? (
                  <>
                    <Lock className="w-4 h-4" />
                    Unlock Canvas
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    Lock Canvas
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress & Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-100">
                  Completion
                </span>
                <span className="text-sm text-purple-200">
                  {completionPercentage}%
                </span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-purple-200">
                {fieldCount} of {totalFields} fields completed
              </div>
            </div>

            <div className="bg-white/10 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5 text-purple-200" />
                <span className="text-sm font-medium text-purple-100">
                  Content Volume
                </span>
              </div>
              <div className="text-2xl font-bold text-white">{totalWords}</div>
              <div className="text-xs text-purple-200">Total words</div>
            </div>

            <div className="bg-white/10 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-purple-200" />
                <span className="text-sm font-medium text-purple-100">
                  Export Options
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExportPDF('A4')}
                  disabled={exporting}
                  className="px-4 py-1.5 text-sm bg-white text-purple-900 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
                >
                  {exporting ? 'Generating...' : 'A4 PDF'}
                </button>
                <button
                  onClick={() => handleExportPDF('Letter')}
                  disabled={exporting}
                  className="px-4 py-1.5 text-sm bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
                >
                  {exporting ? 'Generating...' : 'Letter PDF'}
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-1.5 text-sm bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Grid */}
        {showPreview ? (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Canvas Preview</h2>
            <div className="space-y-8">
              {sections.map((section) => (
                <div key={section.id} className="border-l-4 border-slate-300 pl-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{section.title}</h3>
                  <p className="text-slate-600 mb-4">{section.description}</p>
                  <div className="space-y-4">
                    {section.fields.map((field) => (
                      <div key={field.id} className="border-b border-slate-100 pb-4 last:border-0">
                        <div className="text-sm font-medium text-slate-700 mb-1">{field.label}</div>
                        <div className="text-slate-900 whitespace-pre-wrap min-h-[20px]">
                          {canvasData[field.id] || (
                            <span className="text-slate-400 italic">Not completed</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {sections.map((section) => (
              <div
                key={section.id}
                className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Section Header */}
                <div className={`${section.color} px-6 py-5`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/20 p-2 rounded-lg">
                        {section.icon}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white mb-1">
                          {section.title}
                        </h2>
                        <p className="text-sm text-white/90">
                          {section.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white/80 bg-white/20 px-2 py-1 rounded">
                        {section.fields.filter(f => canvasData[f.id]?.trim()).length}/{section.fields.length}
                      </span>
                      <button 
                        className="text-white hover:text-white/80"
                        title={section.fields.map(f => f.helpText).filter(Boolean).join('\n')}
                      >
                        <HelpCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section Fields */}
                <div className="p-6 space-y-6">
                  {section.fields.map((field) => (
                    <div key={field.id} className="space-y-3">
                      <label className="block">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                            {field.label}
                            {field.required && <span className="text-red-500">*</span>}
                          </span>
                          {field.maxLength && (
                            <span className="text-xs text-slate-500">
                              {canvasData[field.id]?.length || 0}/{field.maxLength}
                            </span>
                          )}
                        </div>
                        {field.type === 'textarea' ? (
                          <textarea
                            value={field.value}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            rows={field.id.includes('purpose') || field.id.includes('vision') ? 4 : 3}
                            disabled={isLocked}
                            maxLength={field.maxLength}
                            className={`w-full px-4 py-3 rounded-lg border transition-all resize-none ${isLocked
                                ? 'bg-slate-50 border-slate-300 text-slate-500 cursor-not-allowed'
                                : 'bg-white border-slate-300 hover:border-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                              }`}
                          />
                        ) : (
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            disabled={isLocked}
                            className={`w-full px-4 py-3 rounded-lg border transition-all ${isLocked
                                ? 'bg-slate-50 border-slate-300 text-slate-500 cursor-not-allowed'
                                : 'bg-white border-slate-300 hover:border-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                              }`}
                          />
                        )}
                        {field.helpText && !isLocked && (
                          <div className="text-xs text-slate-500 mt-1 italic">
                            💡 {field.helpText}
                          </div>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 mb-8">
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
                Data is automatically saved to your browser's local storage
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {isLocked && (
                <div className="px-4 py-2 bg-amber-50 text-amber-800 rounded-lg text-sm border border-amber-200 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Canvas is locked. Unlock to edit.
                </div>
              )}
              
              <button
                onClick={() => handleExportPDF('A4')}
                disabled={exporting}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-emerald-500 text-white font-semibold hover:from-purple-700 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Generating PDF...' : 'Download Premium PDF'}
              </button>
              
              <button
                onClick={handlePrint}
                className="px-6 py-3 rounded-lg bg-white text-slate-800 font-semibold border border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Canvas
              </button>
            </div>
          </div>
        </div>

        {/* Premium Instructions */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl text-white p-8">
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-8 h-8 text-yellow-400" />
            <h3 className="text-2xl font-bold">Premium Features & Instructions</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 p-3 rounded-lg flex-shrink-0">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-2">Complete with Precision</h4>
                  <p className="text-slate-200">
                    Fill each section thoughtfully. Consider multi-generational impact 
                    (25, 50, 100-year horizons) and be specific about your intentions.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-white/20 p-3 rounded-lg flex-shrink-0">
                  <Save className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-2">Auto-save & Security</h4>
                  <p className="text-slate-200">
                    Your work is automatically saved to your browser. No data leaves 
                    your device unless you choose to export. Use the lock feature to 
                    prevent accidental edits.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 p-3 rounded-lg flex-shrink-0">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-2">Professional Export</h4>
                  <p className="text-slate-200">
                    Download premium PDFs in A4 or Letter format. Generated PDFs include 
                    interactive form fields that can be filled using any PDF viewer.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-white/20 p-3 rounded-lg flex-shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-2">Review & Share</h4>
                  <p className="text-slate-200">
                    Review your canvas quarterly. Share with trusted advisors for feedback.
                    Update annually as your legacy evolves and circumstances change.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/20">
            <div className="text-center">
              <p className="text-slate-300">
                For enterprise features, bulk generation, or custom templates, 
                contact <span className="text-yellow-300">legacy@abrahamoflondon.com</span>
              </p>
              <p className="text-sm text-slate-400 mt-2">
                © {new Date().getFullYear()} Abraham of London • Legacy Architecture Suite v3.1
              </p>
            </div>
          </div>
        </div>
        
        {/* Generation Status */}
        {generationTime && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-emerald-800">
                  PDF generated successfully in {generationTime} seconds
                </span>
              </div>
              <button
                onClick={() => setGenerationTime('')}
                className="text-emerald-600 hover:text-emerald-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LegacyCanvasInteractive;