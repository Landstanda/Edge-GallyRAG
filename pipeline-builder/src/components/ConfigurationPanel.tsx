import React, { useState, useEffect } from 'react';
import { X, Settings, Info } from 'lucide-react';

import type { PipelineNode } from '../types/pipeline';

interface ConfigurationPanelProps {
  node: PipelineNode | null;
  onClose: () => void;
  onNodeUpdate: (node: PipelineNode) => void;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ 
  node, 
  onClose, 
  onNodeUpdate 
}) => {
  const [config, setConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    if (node) {
      setConfig(node.data.config);
    }
  }, [node]);

  if (!node) return null;

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    
    const updatedNode = {
      ...node,
      data: {
        ...node.data,
        config: newConfig
      }
    };
    onNodeUpdate(updatedNode);
  };

  const renderConfigField = (key: string, value: any) => {
    const handleChange = (newValue: any) => {
      handleConfigChange(key, newValue);
    };

    if (typeof value === 'boolean') {
      return (
        <div key={key} className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
            </span>
          </label>
        </div>
      );
    }

    if (typeof value === 'number') {
      return (
        <div key={key} className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      );
    }

    if (typeof value === 'string') {
      // Multi-line for templates and long strings
      if (key.toLowerCase().includes('template') || value.length > 100) {
        return (
          <div key={key} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        );
      }

      return (
        <div key={key} className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="sidebar h-full flex flex-col">
      {/* Header */}
      <div className="sidebar-section flex items-center justify-between">
        <div className="flex items-center">
          <Settings size={20} className="text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Configuration</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Node Info */}
      <div className="sidebar-section">
        <div className="flex items-center mb-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
            style={{ 
              backgroundColor: `${getNodeTypeColor(node.data.type)}20`, 
              color: getNodeTypeColor(node.data.type) 
            }}
          >
            <Info size={16} />
          </div>
          <div>
            <div className="font-medium text-gray-900">{node.data.label}</div>
            <div className="text-xs text-gray-500">{node.data.type}</div>
          </div>
        </div>
        <p className="text-sm text-gray-600">{node.data.description}</p>
      </div>

      {/* Configuration Fields */}
      <div className="flex-1 overflow-y-auto">
        <div className="sidebar-section">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Settings</h4>
          {Object.entries(config).map(([key, value]) => renderConfigField(key, value))}
        </div>

        {/* Input/Output Ports Info */}
        <div className="sidebar-section border-t">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Inputs</h4>
          {node.data.inputs.map((input) => (
            <div key={input.id} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{input.label}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  input.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {input.dataType}
                </span>
              </div>
              {input.description && (
                <p className="text-xs text-gray-600">{input.description}</p>
              )}
            </div>
          ))}

          <h4 className="text-sm font-medium text-gray-900 mb-3 mt-4">Outputs</h4>
          {node.data.outputs.map((output) => (
            <div key={output.id} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{output.label}</span>
                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                  {output.dataType}
                </span>
              </div>
              {output.description && (
                <p className="text-xs text-gray-600">{output.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper function to get node type color
const getNodeTypeColor = (type: string) => {
  switch (type) {
    case 'input': return '#10b981';
    case 'processing': return '#f59e0b';
    case 'retrieval': return '#3b82f6';
    case 'llm': return '#8b5cf6';
    case 'logic': return '#eab308';
    case 'output': return '#ef4444';
    default: return '#6b7280';
  }
};

export default ConfigurationPanel; 