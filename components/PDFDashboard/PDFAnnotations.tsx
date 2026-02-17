// components/PDFDashboard/PDFAnnotations.tsx
import React, { useState, useRef, useEffect } from 'react';
import { safeSlice } from "@/lib/utils/safe";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  MessageSquare, 
  Highlighter,
  Type,
  Square,
  ArrowRight,
  Undo,
  Redo
} from 'lucide-react';

interface Annotation {
  id: string;
  type: 'text' | 'highlight' | 'comment' | 'shape' | 'arrow';
  content: string;
  position: { x: number; y: number };
  color: string;
  createdAt: string;
  createdBy: string;
  page: number;
  metadata?: Record<string, any>;
}

interface PDFAnnotationsProps {
  pdfId: string;
  onSave?: (annotations: Annotation[]) => void;
  initialAnnotations?: Annotation[];
}

const PDFAnnotations: React.FC<PDFAnnotationsProps> = ({
  pdfId,
  onSave,
  initialAnnotations = [],
}) => {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [selectedTool, setSelectedTool] = useState<'text' | 'highlight' | 'comment' | 'shape' | 'arrow'>('comment');
  const [selectedColor, setSelectedColor] = useState('#3B82F6'); // blue-500
  const [editingId, setEditingId] = useState<string | null>(null);
  const [history, setHistory] = useState<Annotation[][]>([initialAnnotations]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const colors = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#6B7280', // gray-500
  ];

  const tools = [
    { id: 'text', label: 'Text', icon: Type, color: '#3B82F6' },
    { id: 'highlight', label: 'Highlight', icon: Highlighter, color: '#F59E0B' },
    { id: 'comment', label: 'Comment', icon: MessageSquare, color: '#10B981' },
    { id: 'shape', label: 'Shape', icon: Square, color: '#8B5CF6' },
    { id: 'arrow', label: 'Arrow', icon: ArrowRight, color: '#EF4444' },
  ];

  const addAnnotation = (type: Annotation['type'], position: { x: number; y: number }) => {
    const newAnnotation: Annotation = {
      id: `anno_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: type === 'comment' ? 'New comment...' : '',
      position,
      color: selectedColor,
      createdAt: new Date().toISOString(),
      createdBy: 'user',
      page: 1,
      metadata: { tool: selectedTool }
    };

    const newAnnotations = [...annotations, newAnnotation];
    setAnnotations(newAnnotations);
    saveToHistory(newAnnotations);
    
    if (type === 'comment' || type === 'text') {
      setEditingId(newAnnotation.id);
    }
  };

  const updateAnnotation = (id: string, updates: Partial<Annotation>) => {
    const newAnnotations = annotations.map(ann => 
      ann.id === id ? { ...ann, ...updates } : ann
    );
    setAnnotations(newAnnotations);
    saveToHistory(newAnnotations);
  };

  const deleteAnnotation = (id: string) => {
    const newAnnotations = annotations.filter(ann => ann.id !== id);
    setAnnotations(newAnnotations);
    saveToHistory(newAnnotations);
  };

  // ✅ FIXED: Properly typed history management without relying on safeSlice return type
  const saveToHistory = (newAnnotations: Annotation[]) => {
    // Manual slice implementation to avoid type issues
    const slicedHistory: Annotation[][] = [];
    for (let i = 0; i <= historyIndex && i < history.length; i++) {
      slicedHistory.push(history[i] as Annotation[]);
    }
    
    const newHistory: Annotation[][] = [...slicedHistory, newAnnotations];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevAnnotations = history[historyIndex - 1];
      if (prevAnnotations) {
        setHistoryIndex(historyIndex - 1);
        setAnnotations([...prevAnnotations]); // Create new array to ensure re-render
      }
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextAnnotations = history[historyIndex + 1];
      if (nextAnnotations) {
        setHistoryIndex(historyIndex + 1);
        setAnnotations([...nextAnnotations]); // Create new array to ensure re-render
      }
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(annotations);
    }
  };

  const clearAll = () => {
    setAnnotations([]);
    saveToHistory([]);
  };

  useEffect(() => {
    if (onSave && annotations.length > 0) {
      const timeoutId = setTimeout(() => {
        onSave(annotations);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [annotations, onSave]);

  return (
    <div className="mt-6 border border-gray-700/50 rounded-xl bg-gradient-to-br from-gray-800/40 to-gray-900/60 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/20">
      {/* Toolbar */}
      <div className="border-b border-gray-700/50 p-4 bg-gradient-to-r from-gray-900/80 to-gray-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-300 bg-gradient-to-r from-gray-700/50 to-gray-800/50 px-3 py-1.5 rounded-lg">
                Annotations
              </span>
              <span className="text-xs px-3 py-1.5 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-full text-blue-300 font-medium">
                {annotations.length}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={undo}
              disabled={historyIndex === 0}
              className="p-2.5 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 shadow-md"
              title="Undo"
            >
              <Undo className="h-4 w-4 text-gray-300" />
            </button>
            
            <button
              onClick={redo}
              disabled={historyIndex === history.length - 1}
              className="p-2.5 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 shadow-md"
              title="Redo"
            >
              <Redo className="h-4 w-4 text-gray-300" />
            </button>
            
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl font-medium text-sm flex items-center gap-3 transition-all duration-300 shadow-lg hover:shadow-blue-500/20"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>

        {/* Tools */}
        <div className="mt-4 flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            {tools.map(tool => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id as any)}
                  className={`p-3 rounded-xl flex items-center gap-3 transition-all duration-300 shadow-md ${
                    selectedTool === tool.id
                      ? 'bg-gradient-to-r from-blue-900/40 to-blue-800/40 text-blue-400 border border-blue-500/30'
                      : 'bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-300 border border-gray-600/30'
                  }`}
                  title={tool.label}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm hidden md:inline font-medium">{tool.label}</span>
                </button>
              );
            })}
          </div>

          {/* Colors */}
          <div className="flex items-center space-x-3 ml-4 p-2 bg-gray-800/50 rounded-xl border border-gray-700/50">
            <span className="text-sm text-gray-400 font-medium mr-2">Colors:</span>
            {colors.map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`h-9 w-9 rounded-full border-2 transition-all duration-300 hover:scale-110 ${
                  selectedColor === color ? 'border-white shadow-lg shadow-white/20' : 'border-transparent hover:border-gray-400'
                }`}
                style={{ backgroundColor: color }}
                title={`Color: ${color}`}
              />
            ))}
          </div>

          <button
            onClick={clearAll}
            className="ml-auto px-4 py-2.5 bg-gradient-to-r from-red-600/20 to-red-700/20 hover:from-red-600/30 hover:to-red-700/30 text-red-400 rounded-xl text-sm flex items-center gap-3 border border-red-500/30 transition-all duration-300"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* Annotations List */}
      <div className="p-5 max-h-96 overflow-y-auto">
        {annotations.length === 0 ? (
          <div className="text-center py-10">
            <MessageSquare className="h-16 w-16 text-gray-600 mx-auto mb-5 opacity-50" />
            <p className="text-gray-400 text-lg font-medium mb-2">No annotations yet</p>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Select a tool above to add annotations to your PDF. Your annotations will be automatically saved.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {annotations.map(annotation => (
              <div
                key={annotation.id}
                className="p-4 border border-gray-700/50 rounded-xl bg-gradient-to-br from-gray-900/40 to-gray-800/60 hover:from-gray-800/60 hover:to-gray-700/40 transition-all duration-300 group shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="h-4 w-4 rounded-full shadow-md"
                      style={{ backgroundColor: annotation.color }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-gray-300 capitalize px-3 py-1 bg-gray-800/50 rounded-lg">
                          {annotation.type}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          Page {annotation.page}
                        </span>
                      </div>
                      {editingId === annotation.id ? (
                        <input
                          type="text"
                          value={annotation.content}
                          onChange={(e) => updateAnnotation(annotation.id, { content: e.target.value })}
                          onBlur={() => setEditingId(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setEditingId(null);
                          }}
                          className="mt-1 bg-gray-800/70 border border-gray-600/50 rounded-lg px-3 py-2 text-sm text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                          autoFocus
                        />
                      ) : (
                        <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                          {annotation.content || `Annotation at position (${annotation.position.x}, ${annotation.position.y})`}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => setEditingId(annotation.id)}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors duration-200"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteAnnotation(annotation.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors duration-200"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-700/30 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">
                    {new Date(annotation.createdAt).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-800/50 px-2.5 py-1 rounded-full">
                    By {annotation.createdBy}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add */}
      <div className="border-t border-gray-700/50 p-5 bg-gradient-to-r from-gray-900/80 to-gray-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <p className="text-sm text-gray-400 font-medium">
              Click to add <span className="text-blue-400 capitalize">{selectedTool}</span> annotations
            </p>
          </div>
          <button
            onClick={() => addAnnotation(selectedTool, { x: 50, y: 50 })}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl font-medium text-sm flex items-center gap-3 transition-all duration-300 shadow-lg hover:shadow-blue-500/20"
          >
            <Plus className="h-5 w-5" />
            Add {selectedTool}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFAnnotations;