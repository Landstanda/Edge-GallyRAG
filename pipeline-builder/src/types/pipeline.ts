import type { Node, Edge } from '@xyflow/react';

// Node Types - matching the color-coded system from the roadmap
export const NodeType = {
  INPUT: 'input',
  PROCESSING: 'processing', 
  RETRIEVAL: 'retrieval',
  LLM: 'llm',
  LOGIC: 'logic',
  OUTPUT: 'output'
} as const;

export type NodeType = typeof NodeType[keyof typeof NodeType];

// Data Types that can flow between nodes
export const DataType = {
  TEXT: 'text',
  EMBEDDINGS: 'embeddings',
  JSON: 'json',
  PDF: 'pdf',
  CHUNKS: 'chunks',
  BOOLEAN: 'boolean',
  NUMBER: 'number'
} as const;

export type DataType = typeof DataType[keyof typeof DataType];

// Node Configuration Interface
export interface NodeConfig {
  [key: string]: any;
}

// Input/Output Port Definition
export interface NodePort {
  id: string;
  label: string;
  dataType: DataType;
  required: boolean;
  description?: string;
}

// Base Node Data Structure
export interface PipelineNodeData extends Record<string, unknown> {
  id: string;
  type: NodeType;
  label: string;
  description: string;
  icon: string;
  inputs: NodePort[];
  outputs: NodePort[];
  config: NodeConfig;
  position: { x: number; y: number };
  status?: 'idle' | 'running' | 'success' | 'error';
  errorMessage?: string;
}

// Extended React Flow Node
export interface PipelineNode extends Node {
  data: PipelineNodeData;
  type: NodeType;
}

// Extended React Flow Edge with data type validation
export interface PipelineEdge extends Edge {
  sourcePort: string;
  targetPort: string;
  dataType: DataType;
  validated: boolean;
}

// Pipeline Definition
export interface Pipeline {
  id: string;
  name: string;
  description: string;
  version: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  createdAt: Date;
  updatedAt: Date;
  isValid: boolean;
  validationErrors: string[];
}

// Node Templates for the palette
export interface NodeTemplate {
  type: NodeType;
  label: string;
  description: string;
  icon: string;
  category: string;
  inputs: NodePort[];
  outputs: NodePort[];
  defaultConfig: NodeConfig;
  color: string;
}

// Validation Rules
export interface ValidationRule {
  id: string;
  description: string;
  validate: (pipeline: Pipeline) => string[];
}

// Kotlin Code Generation Context
export interface CodeGenContext {
  pipeline: Pipeline;
  imports: string[];
  dependencies: string[];
  kotlinVersion: string;
  targetPackage: string;
}

// Generated Code Result
export interface GeneratedCode {
  success: boolean;
  kotlinCode?: string;
  buildGradle?: string;
  errors: string[];
  warnings: string[];
}

// Execution Context for pipeline runs
export interface ExecutionContext {
  pipeline: Pipeline;
  currentNode?: string;
  variables: Record<string, any>;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  startTime?: Date;
  endTime?: Date;
  logs: ExecutionLog[];
}

export interface ExecutionLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  nodeId?: string;
  message: string;
  data?: any;
}

// Settings and Configuration
export interface PipelineBuilderSettings {
  autoSave: boolean;
  snapToGrid: boolean;
  showMinimap: boolean;
  darkMode: boolean;
  codeGenSettings: {
    packageName: string;
    kotlinVersion: string;
    includeComments: boolean;
    includeLogging: boolean;
  };
} 