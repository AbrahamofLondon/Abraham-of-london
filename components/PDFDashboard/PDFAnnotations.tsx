// components/PDFDashboard/PDFAnnotations.tsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  MessageSquare, 
  Highlighter,
  Type,
  Circle,
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
  const [isDrawing, setIsDrawing] = useState(false);
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
      createdBy: 'user', // In real app, get from auth
      page: 1, // In real app, track current page
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

  const saveToHistory = (newAnnotations: Annotation[]) => {
    const newHistory = [...history.slice(0, historyIndex + 1), newAnnotations];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevAnnotations = history[historyIndex - 1];
      if (prevAnnotations) {
        setHistoryIndex(historyIndex - 1);
        setAnnotations(prevAnnotations);
      }
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextAnnotations = history[historyIndex + 1];
      if (nextAnnotations) {
        setHistoryIndex(historyIndex + 1);
        setAnnotations(nextAnnotations);
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
    <div className="mt-6 border border-gray-700/50 rounded-xl bg-gray-800/30 overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-gray-700/50 p-4 bg-gray-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-300">Annotations</span>
            <span className="text-xs px-2 py-1 bg-gray-700 rounded-full text-gray-400">
              {annotations.length}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={undo}
              disabled={historyIndex === 0}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </button>
            
            <button
              onClick={redo}
              disabled={historyIndex === history.length - 1}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-sm flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>

        {/* Tools */}
        <div className="mt-4 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {tools.map(tool => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id as any)}
                  className={`p-2 rounded-lg flex items-center gap-2 transition-colors ${
                    selectedTool === tool.id
                      ? 'bg-blue-900/30 text-blue-400'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                  title={tool.label}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm hidden md:inline">{tool.label}</span>
                </button>
              );
            })}
          </div>

          {/* Colors */}
          <div className="flex items-center space-x-2">
            {colors.map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`h-8 w-8 rounded-full border-2 ${
                  selectedColor === color ? 'border-white' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
                title={`Color: ${color}`}
              />
            ))}
          </div>

          <button
            onClick={clearAll}
            className="ml-auto px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* Annotations List */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {annotations.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No annotations yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Select a tool above to add annotations to your PDF
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {annotations.map(annotation => (
              <div
                key={annotation.id}
                className="p-3 border border-gray-700/50 rounded-lg bg-gray-900/30 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: annotation.color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-300 capitalize">
                          {annotation.type}
                        </span>
                        <span className="text-xs text-gray-500">
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
                          className="mt-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white w-full"
                          autoFocus
                        />
                      ) : (
                        <p className="text-sm text-gray-400 mt-1">
                          {annotation.content || `Annotation at position (${annotation.position.x}, ${annotation.position.y})`}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingId(annotation.id)}
                      className="p-1 text-gray-400 hover:text-gray-300"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteAnnotation(annotation.id)}
                      className="p-1 text-gray-400 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                  <span>{new Date(annotation.createdAt).toLocaleString()}</span>
                  <span>By {annotation.createdBy}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add */}
      <div className="border-t border-gray-700/50 p-4 bg-gray-900/50">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Click to add {selectedTool} annotations
          </p>
          <button
            onClick={() => addAnnotation(selectedTool, { x: 50, y: 50 })}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg font-medium text-sm flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add {selectedTool}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFAnnotations;