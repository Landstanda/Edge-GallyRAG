import React from 'react';
import { 
  Type, 
  GitBranch, 
  Merge, 
  MessageCircle, 
  Download,
  File,
  Layers,
  Cpu,
  HardDrive,
  Target,
  Sparkles
} from 'lucide-react';

import { NODE_TEMPLATES } from '../data/nodeTemplates';
import { NodeType, type NodeTemplate } from '../types/pipeline';

// Enhanced icon mapping with more intuitive icons
const ICON_MAP = {
  FileText: File,        // PDF Input
  Type: Type,           // Text Input  
  Scissors: Layers,     // Text Chunker
  Zap: Sparkles,        // Embedding Generator
  Database: HardDrive,  // Vector Store
  Search: Target,       // Semantic Search
  Brain: Cpu,           // Gemma Generator
  MessageSquare: MessageCircle, // Prompt Builder
  GitBranch: GitBranch, // Logic nodes
  Merge: Merge,         // Merge operations
  MessageCircle: MessageCircle, // Text Response
  Download: Download,   // JSON Export
};

// Simplified node titles
const getSimplifiedTitle = (label: string): string => {
  const titleMap: Record<string, string> = {
    'PDF Input': 'PDF Input',
    'Text Input': 'Text Input',
    'PDF Text Extractor': 'PDF Extractor',
    'Text Chunker': 'Text Chunker',
    'Embedding Generator': 'Embeddings',
    'Vector Store': 'Vector Store',
    'Semantic Search': 'Search',
    'Gemma Generator': 'Gemma LLM',
    'Prompt Builder': 'Prompt Builder',
    'Text Response': 'Text Output',
    'JSON Export': 'JSON Export'
  };
  return titleMap[label] || label;
};

// Get node type color
const getNodeColor = (type: NodeType) => {
  switch (type) {
    case NodeType.INPUT: return '#10b981';
    case NodeType.PROCESSING: return '#f59e0b';
    case NodeType.RETRIEVAL: return '#3b82f6';
    case NodeType.LLM: return '#8b5cf6';
    case NodeType.LOGIC: return '#eab308';
    case NodeType.OUTPUT: return '#ef4444';
    default: return '#6b7280';
  }
};

interface NodePaletteProps {
  onClose: () => void;
}

const NodePalette: React.FC<NodePaletteProps> = ({ onClose }) => {
  const onDragStart = (event: React.DragEvent, template: NodeTemplate) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(template));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Group nodes by category
  const nodesByCategory = NODE_TEMPLATES.reduce((acc: Record<NodeType, NodeTemplate[]>, template: NodeTemplate) => {
    if (!acc[template.type]) {
      acc[template.type] = [];
    }
    acc[template.type].push(template);
    return acc;
  }, {} as Record<NodeType, NodeTemplate[]>);

  const categoryLabels = {
    [NodeType.INPUT]: 'Input Nodes',
    [NodeType.PROCESSING]: 'Processing Nodes',
    [NodeType.RETRIEVAL]: 'Retrieval Nodes',
    [NodeType.LLM]: 'LLM Nodes',
    [NodeType.LOGIC]: 'Logic Nodes',
    [NodeType.OUTPUT]: 'Output Nodes',
  };

  return (
    <div style={{ 
      width: '320px', 
      height: '100%', 
      backgroundColor: '#f8fafc',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '16px',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: 'white'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#1e293b' 
          }}>
            Node Palette
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>
        <p style={{ 
          margin: '8px 0 0 0', 
          fontSize: '14px', 
          color: '#64748b' 
        }}>
          Drag nodes to the canvas
        </p>
      </div>

      {/* Scrollable Content */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '16px' 
      }}>
        {Object.entries(nodesByCategory).map(([category, nodes]) => (
          <div key={category} style={{ marginBottom: '24px' }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#374151',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {categoryLabels[category as NodeType]}
            </h4>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '12px' 
            }}>
              {nodes.map((template) => {
                const IconComponent = ICON_MAP[template.icon as keyof typeof ICON_MAP] || Type;
                const nodeColor = getNodeColor(template.type);
                const simplifiedTitle = getSimplifiedTitle(template.label);

                return (
                  <div
                    key={`${template.type}-${template.label}`}
                    className="group relative"
                    draggable
                    onDragStart={(e) => onDragStart(e, template)}
                    style={{ cursor: 'grab' }}
                  >
                    {/* Square Node with Solid Border */}
                    <div 
                      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-grab active:cursor-grabbing"
                      style={{ 
                        border: `3px solid ${nodeColor}`,
                        width: '120px',
                        height: '120px',
                        minWidth: '120px',
                        minHeight: '120px'
                      }}
                    >
                      {/* Node Content - Perfectly Centered Large Icon with Title */}
                      <div className="h-full flex flex-col items-center justify-center px-1 py-2">
                        {/* Extra Large Perfectly Centered Icon */}
                        <div 
                          className="w-24 h-20 rounded-xl flex items-center justify-center mb-1"
                          style={{ backgroundColor: `${nodeColor}08`, color: nodeColor }}
                        >
                          <IconComponent size={56} strokeWidth={1.8} />
                        </div>

                        {/* Centered Title at Bottom */}
                        <div className="text-center w-full px-1">
                          <div className="font-semibold text-gray-900 text-sm leading-tight">
                            {simplifiedTitle}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NodePalette; 