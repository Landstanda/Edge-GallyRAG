import React from 'react';
import { Handle, Position } from '@xyflow/react';
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

import type { PipelineNodeData } from '../../types/pipeline';
import { NodeType, DataType } from '../../types/pipeline';

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

// Data type colors for port visualization
const DATA_TYPE_COLORS = {
  [DataType.TEXT]: '#10b981',      // Green - Text content
  [DataType.PDF]: '#ef4444',       // Red - PDF documents
  [DataType.CHUNKS]: '#f59e0b',    // Orange - Text chunks
  [DataType.EMBEDDINGS]: '#8b5cf6', // Purple - Vector embeddings
  [DataType.JSON]: '#3b82f6',      // Blue - Structured data
  [DataType.BOOLEAN]: '#eab308',   // Yellow - Boolean values
  [DataType.NUMBER]: '#06b6d4',    // Cyan - Numeric values
};

interface PipelineNodeProps {
  data: PipelineNodeData;
  selected?: boolean;
}

const PipelineNodeComponent: React.FC<PipelineNodeProps> = ({ data, selected }) => {
  const IconComponent = ICON_MAP[data.icon as keyof typeof ICON_MAP] || Type;
  
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

  const nodeColor = getNodeColor(data.type);
  const simplifiedTitle = getSimplifiedTitle(data.label);

  return (
    <div className="group relative">
      {/* Square Node Container with Solid Border */}
      <div 
        className={`relative bg-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl ${
          selected ? 'ring-3 ring-blue-400 ring-opacity-75' : ''
        }`}
        style={{ 
          border: `3px solid ${nodeColor}`,
          width: '120px',
          height: '120px',
          minWidth: '120px',
          minHeight: '120px'
        }}
      >
        {/* Input Handles with Data Type Colors */}
        {data.inputs.map((input, index) => (
          <Handle
            key={input.id}
            type="target"
            position={Position.Left}
            id={input.id}
            style={{ 
              top: `${((index + 1) / (data.inputs.length + 1)) * 100}%`,
              backgroundColor: DATA_TYPE_COLORS[input.dataType],
              left: '-6px'
            }}
            className="w-3 h-3 border-2 border-white rounded-full hover:w-4 hover:h-4 transition-all duration-200"
          />
        ))}

        {/* Output Handles with Data Type Colors */}
        {data.outputs.map((output, index) => (
          <Handle
            key={output.id}
            type="source"
            position={Position.Right}
            id={output.id}
            style={{ 
              top: `${((index + 1) / (data.outputs.length + 1)) * 100}%`,
              backgroundColor: DATA_TYPE_COLORS[output.dataType],
              right: '-6px'
            }}
            className="w-3 h-3 border-2 border-white rounded-full hover:w-4 hover:h-4 transition-all duration-200"
          />
        ))}

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

          {/* Status indicator - minimal */}
          {data.status && data.status !== 'idle' && (
            <div className="absolute top-2 right-2">
              <div className={`w-2 h-2 rounded-full ${
                data.status === 'running' ? 'bg-yellow-400 animate-pulse' :
                data.status === 'success' ? 'bg-green-400' :
                data.status === 'error' ? 'bg-red-400' : 'bg-gray-400'
              }`} />
            </div>
          )}

          {/* Error message - minimal */}
          {data.errorMessage && (
            <div className="absolute bottom-1 left-1 right-1 text-xs text-red-600 bg-red-50 px-1 py-0.5 rounded text-center truncate">
              Error
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PipelineNodeComponent; 