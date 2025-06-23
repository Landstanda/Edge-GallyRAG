import React, { useCallback, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  MarkerType
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { PipelineNode, PipelineEdge, NodeTemplate, Pipeline } from '../types/pipeline';
import { NodeType, DataType } from '../types/pipeline';
import NodePalette from './NodePalette';
import ConfigurationPanel from './ConfigurationPanel';
import PipelineNodeComponent from './nodes/PipelineNode';

// Custom node types for React Flow
const nodeTypes = {
  [NodeType.INPUT]: PipelineNodeComponent,
  [NodeType.PROCESSING]: PipelineNodeComponent,
  [NodeType.RETRIEVAL]: PipelineNodeComponent,
  [NodeType.LLM]: PipelineNodeComponent,
  [NodeType.LOGIC]: PipelineNodeComponent,
  [NodeType.OUTPUT]: PipelineNodeComponent,
};

interface PipelineCanvasProps {
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  onGenerate?: (nodes: Node[], edges: Edge[]) => void;
}

export interface PipelineCanvasHandle {
  loadTemplate: (template: Pipeline) => void;
  clearCanvas: () => void;
  getCanvasData: () => { nodes: Node[], edges: Edge[] };
}

const PipelineCanvas = forwardRef<PipelineCanvasHandle, PipelineCanvasProps>(({ onSave, onGenerate }, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<PipelineNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<PipelineEdge>([]);
  const [selectedNode, setSelectedNode] = useState<PipelineNode | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      // Get source and target nodes
      const sourceNode = nodes.find(node => node.id === params.source);
      const targetNode = nodes.find(node => node.id === params.target);
      
      if (!sourceNode || !targetNode) {
        console.error('Source or target node not found');
        return;
      }

      // Get port information
      const sourcePort = sourceNode.data.outputs.find(port => port.id === params.sourceHandle);
      const targetPort = targetNode.data.inputs.find(port => port.id === params.targetHandle);
      
      if (!sourcePort || !targetPort) {
        console.error('Source or target port not found');
        return;
      }

      // Validate data type compatibility
      const isCompatible = validateDataTypeCompatibility(sourcePort.dataType, targetPort.dataType);
      
      if (!isCompatible) {
        // Show error feedback to user
        console.warn(`Incompatible data types: ${sourcePort.dataType} → ${targetPort.dataType}`);
        
        // Update target node with error message
        setNodes(nodes => nodes.map(node => 
          node.id === targetNode.id 
            ? {
                ...node,
                data: {
                  ...node.data,
                  status: 'error' as const,
                  errorMessage: `Cannot connect ${sourcePort.dataType} to ${targetPort.dataType}`
                }
              }
            : node
        ));
        
        // Clear error after 3 seconds
        setTimeout(() => {
          setNodes(nodes => nodes.map(node => 
            node.id === targetNode.id && node.data.errorMessage?.includes('Cannot connect')
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    status: 'idle' as const,
                    errorMessage: undefined
                  }
                }
              : node
          ));
        }, 3000);
        
        return;
      }

      // Create valid connection
      const newEdge: PipelineEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        sourcePort: params.sourceHandle || '',
        targetPort: params.targetHandle || '',
        dataType: sourcePort.dataType,
        validated: true,
        style: {
          stroke: getDataTypeColor(sourcePort.dataType),
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: getDataTypeColor(sourcePort.dataType),
        }
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
      console.log(`Connected: ${sourcePort.label} (${sourcePort.dataType}) → ${targetPort.label} (${targetPort.dataType})`);
    },
    [setEdges, nodes, setNodes]
  );

  // Data type compatibility validation
  const validateDataTypeCompatibility = (sourceType: DataType, targetType: DataType): boolean => {
    // Exact match is always valid
    if (sourceType === targetType) return true;
    
    // Define compatibility rules
    const compatibilityRules: Record<DataType, DataType[]> = {
      [DataType.TEXT]: [DataType.CHUNKS], // Text can be chunked
      [DataType.PDF]: [DataType.TEXT], // PDF can be converted to text
      [DataType.CHUNKS]: [DataType.EMBEDDINGS], // Chunks can be embedded
      [DataType.EMBEDDINGS]: [DataType.JSON], // Embeddings can be serialized
      [DataType.JSON]: [DataType.TEXT], // JSON can be stringified
      [DataType.BOOLEAN]: [DataType.JSON], // Boolean can be part of JSON
      [DataType.NUMBER]: [DataType.JSON, DataType.TEXT], // Number can be JSON or text
    };
    
    return compatibilityRules[sourceType]?.includes(targetType) || false;
  };

  // Get data type color for edge styling
  const getDataTypeColor = (dataType: DataType): string => {
    const colors = {
      [DataType.TEXT]: '#10b981',      // Green
      [DataType.PDF]: '#ef4444',       // Red
      [DataType.CHUNKS]: '#f59e0b',    // Orange
      [DataType.EMBEDDINGS]: '#8b5cf6', // Purple
      [DataType.JSON]: '#3b82f6',      // Blue
      [DataType.BOOLEAN]: '#eab308',   // Yellow
      [DataType.NUMBER]: '#06b6d4',    // Cyan
    };
    return colors[dataType] || '#6b7280';
  };

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const pipelineNode = node as PipelineNode;
    
    // Handle multi-select with Ctrl/Cmd key
    if (event.ctrlKey || event.metaKey) {
      setSelectedNodes(prev => {
        if (prev.includes(pipelineNode.id)) {
          // Remove from selection
          const newSelection = prev.filter(id => id !== pipelineNode.id);
          if (newSelection.length === 1) {
            // If only one node left, set it as the primary selected node
            const remainingNode = nodes.find(n => n.id === newSelection[0]);
            setSelectedNode(remainingNode as PipelineNode || null);
          } else if (newSelection.length === 0) {
            setSelectedNode(null);
          }
          return newSelection;
        } else {
          // Add to selection
          const newSelection = [...prev, pipelineNode.id];
          setSelectedNode(pipelineNode); // Set as primary for config panel
          return newSelection;
        }
      });
    } else {
      // Single select
      setSelectedNodes([pipelineNode.id]);
      setSelectedNode(pipelineNode);
    }
    
    setIsConfigOpen(true);
  }, [nodes]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedNodes([]);
    setIsConfigOpen(false);
  }, []);

  // Handle drag over for drop functionality
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    console.log('Drag over triggered');
  }, []);

  // Handle drop to create new nodes
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      console.log('Drop event triggered - wrapper level');

      const templateData = event.dataTransfer.getData('application/reactflow');
      
      console.log('Drop event triggered:', { templateData });
      
      // Check if the dropped element is a node template
      if (typeof templateData === 'undefined' || !templateData) {
        console.log('No template data found');
        return;
      }

      try {
        const template: NodeTemplate = JSON.parse(templateData);
        console.log('Parsed template:', template);
        
        // Check if reactFlowInstance is available
        if (!reactFlowInstance) {
          console.log('React Flow instance not available');
          return;
        }
        
        // Get the drop position
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        
        console.log('Drop position:', position);

        // Create a new node from the template
        const newNode: PipelineNode = {
          id: `${template.type}-${Date.now()}`,
          type: template.type,
          position,
          data: {
            id: `${template.type}-${Date.now()}`,
            type: template.type,
            label: template.label,
            description: template.description,
            icon: template.icon,
            inputs: template.inputs,
            outputs: template.outputs,
            config: { ...template.defaultConfig },
            position,
            status: 'idle'
          }
        };

        console.log('Creating new node:', newNode);
        setNodes((nds) => {
          const updatedNodes = nds.concat(newNode);
          console.log('Updated nodes array:', updatedNodes);
          return updatedNodes;
        });
      } catch (error) {
        console.error('Error creating node from template:', error);
      }
    },
    [reactFlowInstance, setNodes]
  );



  const handleSave = useCallback(() => {
    onSave?.(nodes, edges);
  }, [nodes, edges, onSave]);

  const handleGenerate = useCallback(() => {
    onGenerate?.(nodes, edges);
  }, [nodes, edges, onGenerate]);

  // Keyboard event handling for node operations
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Delete selected nodes
    if (event.key === 'Delete' && selectedNodes.length > 0) {
      event.preventDefault();
      
      // Remove selected nodes
      setNodes(nodes => nodes.filter(node => !selectedNodes.includes(node.id)));
      
      // Remove edges connected to deleted nodes
      setEdges(edges => edges.filter(edge => 
        !selectedNodes.includes(edge.source) && !selectedNodes.includes(edge.target)
      ));
      
      // Clear selection
      setSelectedNodes([]);
      setSelectedNode(null);
      setIsConfigOpen(false);
      
      console.log(`Deleted ${selectedNodes.length} node(s)`);
    }
    
    // Duplicate selected nodes (Ctrl+D)
    if ((event.ctrlKey || event.metaKey) && event.key === 'd' && selectedNodes.length > 0) {
      event.preventDefault();
      
      const nodesToDuplicate = nodes.filter(node => selectedNodes.includes(node.id));
      const duplicatedNodes: PipelineNode[] = [];
      
      nodesToDuplicate.forEach(node => {
        const duplicatedNode: PipelineNode = {
          ...node,
          id: `${node.id}-copy-${Date.now()}`,
          position: {
            x: node.position.x + 50, // Offset duplicated nodes
            y: node.position.y + 50
          },
          data: {
            ...node.data,
            id: `${node.data.id}-copy-${Date.now()}`,
            label: `${node.data.label} (Copy)`,
            position: {
              x: node.position.x + 50,
              y: node.position.y + 50
            }
          }
        };
        duplicatedNodes.push(duplicatedNode);
      });
      
      // Add duplicated nodes
      setNodes(nodes => [...nodes, ...duplicatedNodes]);
      
      // Select the duplicated nodes
      const duplicatedNodeIds = duplicatedNodes.map(node => node.id);
      setSelectedNodes(duplicatedNodeIds);
      setSelectedNode(duplicatedNodes[0]);
      
      console.log(`Duplicated ${duplicatedNodes.length} node(s)`);
    }
  }, [selectedNodes, nodes, setNodes, setEdges]);

  // Add keyboard event listeners
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Template loading functionality
  const loadTemplate = useCallback((template: Pipeline) => {
    console.log('Loading template:', template.name);
    
    // Clear existing nodes and edges
    setNodes([]);
    setEdges([]);
    
    // Load template nodes
    const templateNodes: PipelineNode[] = template.nodes.map(node => ({
      ...node,
      id: `${node.id}-${Date.now()}`, // Ensure unique IDs
      data: {
        ...node.data,
        id: `${node.data.id}-${Date.now()}`,
        status: 'idle'
      }
    }));
    
    // Load template edges with updated node IDs
    const nodeIdMap = new Map<string, string>();
    template.nodes.forEach((originalNode, index) => {
      nodeIdMap.set(originalNode.id, templateNodes[index].id);
    });
    
    const templateEdges: PipelineEdge[] = template.edges.map(edge => ({
      ...edge,
      id: `edge-${Date.now()}-${Math.random()}`,
      source: nodeIdMap.get(edge.source) || edge.source,
      target: nodeIdMap.get(edge.target) || edge.target,
      style: {
        stroke: getDataTypeColor(edge.dataType),
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: getDataTypeColor(edge.dataType),
      }
    }));
    
    setNodes(templateNodes);
    setEdges(templateEdges);
    
    // Clear selections
    setSelectedNode(null);
    setSelectedNodes([]);
    setIsConfigOpen(false);
    
    console.log(`✅ Template loaded: ${templateNodes.length} nodes, ${templateEdges.length} edges`);
  }, [setNodes, setEdges, getDataTypeColor]);

  const clearCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setSelectedNodes([]);
    setIsConfigOpen(false);
    console.log('Canvas cleared');
  }, [setNodes, setEdges]);

  const getCanvasData = useCallback(() => {
    return { nodes, edges };
  }, [nodes, edges]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    loadTemplate,
    clearCanvas,
    getCanvasData
  }), [loadTemplate, clearCanvas, getCanvasData]);

  // Mini map node colors based on node type
  const miniMapNodeColor = (node: Node) => {
    const pipelineNode = node as PipelineNode;
    switch (pipelineNode.type) {
      case NodeType.INPUT: return '#10b981';
      case NodeType.PROCESSING: return '#f59e0b';
      case NodeType.RETRIEVAL: return '#3b82f6';
      case NodeType.LLM: return '#8b5cf6';
      case NodeType.LOGIC: return '#eab308';
      case NodeType.OUTPUT: return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      {/* Left Sidebar - Node Palette */}
      {isPaletteOpen && (
        <div style={{ width: '320px', height: '100%', backgroundColor: 'white', borderRight: '1px solid #e5e7eb' }}>
          <NodePalette onClose={() => setIsPaletteOpen(false)} />
        </div>
      )}

      {/* Main Canvas */}
      <div style={{ flex: 1, height: '100%', position: 'relative' }}>
        <div 
          ref={reactFlowWrapper}
          style={{ width: '100%', height: '100%' }}
        >
          <ReactFlow
            nodes={nodes.map(node => ({
              ...node,
              selected: selectedNodes.includes(node.id)
            }))}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50"
            multiSelectionKeyCode="Control"
            selectionKeyCode="Control"
          >
            <Background color="#f3f4f6" gap={20} />
            <Controls className="bg-white border border-gray-200 rounded-lg shadow-sm" />
            <MiniMap
              nodeColor={miniMapNodeColor}
              className="bg-white border border-gray-200 rounded-lg shadow-sm"
              pannable
              zoomable
            />
            
            {/* Top Panel - Actions */}
            <Panel position="top-right" className="flex gap-2">
              <button
                onClick={() => setIsPaletteOpen(!isPaletteOpen)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
              >
                {isPaletteOpen ? 'Hide Palette' : 'Show Palette'}
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
              >
                Save Pipeline
              </button>
              <button
                onClick={handleGenerate}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg shadow-sm hover:bg-purple-700 transition-colors"
              >
                Generate Code
              </button>
            </Panel>

            {/* Data Type Legend */}
            <Panel position="top-left" className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="text-xs font-semibold text-gray-700 mb-2">Data Types</div>
              <div className="space-y-1">
                {Object.entries({
                  [DataType.TEXT]: 'Text',
                  [DataType.PDF]: 'PDF',
                  [DataType.CHUNKS]: 'Chunks',
                  [DataType.EMBEDDINGS]: 'Embeddings',
                  [DataType.JSON]: 'JSON',
                  [DataType.BOOLEAN]: 'Boolean',
                  [DataType.NUMBER]: 'Number'
                }).map(([type, label]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full border border-white"
                      style={{ backgroundColor: getDataTypeColor(type as DataType) }}
                    />
                    <span className="text-xs text-gray-600">{label}</span>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Bottom Panel - Status */}
            <Panel position="bottom-left" className="text-sm text-gray-600 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-4">
                <span>Nodes: {nodes.length} | Edges: {edges.length}</span>
                {selectedNodes.length > 0 && (
                  <span className="text-blue-600 font-medium">
                    Selected: {selectedNodes.length}
                  </span>
                )}
                <span className="text-gray-400">|</span>
                <span className="text-xs">
                  💡 Ctrl+Click: Multi-select • Del: Delete • Ctrl+D: Duplicate
                </span>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* Right Sidebar - Configuration Panel */}
      {isConfigOpen && selectedNode && (
        <div style={{ width: '320px', height: '100%', backgroundColor: 'white', borderLeft: '1px solid #e5e7eb' }}>
          <ConfigurationPanel 
            node={selectedNode} 
            onClose={() => setIsConfigOpen(false)}
            onNodeUpdate={(updatedNode: PipelineNode) => {
              setNodes((nodes) =>
                nodes.map((node) =>
                  node.id === updatedNode.id ? updatedNode : node
                )
              );
            }}
          />
        </div>
      )}
    </div>
  );
});

PipelineCanvas.displayName = 'PipelineCanvas';

export default PipelineCanvas; 