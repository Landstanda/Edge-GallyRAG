import type { NodeTemplate } from '../types/pipeline';
import { NodeType, DataType } from '../types/pipeline';

// Node Templates - based on the Edge Gallery RAG architecture
export const NODE_TEMPLATES: NodeTemplate[] = [
  // INPUT NODES (Green)
  {
    type: NodeType.INPUT,
    label: 'PDF Input',
    description: 'Load PDF documents from device storage',
    icon: 'FileText',
    category: 'Input',
    color: '#10b981',
    inputs: [],
    outputs: [
      {
        id: 'pdf',
        label: 'PDF Document',
        dataType: DataType.PDF,
        required: true,
        description: 'Raw PDF document'
      }
    ],
    defaultConfig: {
      allowMultiple: false,
      fileFilter: '*.pdf',
      maxSize: '10MB'
    }
  },
  {
    type: NodeType.INPUT,
    label: 'Text Input',
    description: 'Direct text input for processing',
    icon: 'Type',
    category: 'Input',
    color: '#10b981',
    inputs: [],
    outputs: [
      {
        id: 'text',
        label: 'Text',
        dataType: DataType.TEXT,
        required: true,
        description: 'Raw text content'
      }
    ],
    defaultConfig: {
      placeholder: 'Enter your text here...',
      maxLength: 10000
    }
  },

  // PROCESSING NODES (Orange)
  {
    type: NodeType.PROCESSING,
    label: 'PDF Text Extractor',
    description: 'Extract text content from PDF documents',
    icon: 'FileText',
    category: 'Processing',
    color: '#f59e0b',
    inputs: [
      {
        id: 'pdf',
        label: 'PDF Document',
        dataType: DataType.PDF,
        required: true,
        description: 'PDF document to extract text from'
      }
    ],
    outputs: [
      {
        id: 'text',
        label: 'Extracted Text',
        dataType: DataType.TEXT,
        required: true,
        description: 'Text extracted from PDF'
      }
    ],
    defaultConfig: {
      stripFormatting: true,
      preserveLineBreaks: false
    }
  },
  {
    type: NodeType.PROCESSING,
    label: 'Text Chunker',
    description: 'Split text into chunks for processing',
    icon: 'Scissors',
    category: 'Processing',
    color: '#f59e0b',
    inputs: [
      {
        id: 'text',
        label: 'Text',
        dataType: DataType.TEXT,
        required: true,
        description: 'Text to chunk'
      }
    ],
    outputs: [
      {
        id: 'chunks',
        label: 'Text Chunks',
        dataType: DataType.CHUNKS,
        required: true,
        description: 'Chunked text segments'
      }
    ],
    defaultConfig: {
      chunkSize: 512,
      overlap: 64,
      method: 'fixed-size'
    }
  },
  {
    type: NodeType.PROCESSING,
    label: 'Embedding Generator',
    description: 'Generate vector embeddings using Gecko model',
    icon: 'Zap',
    category: 'Processing',
    color: '#f59e0b',
    inputs: [
      {
        id: 'chunks',
        label: 'Text Chunks',
        dataType: DataType.CHUNKS,
        required: true,
        description: 'Text chunks to embed'
      }
    ],
    outputs: [
      {
        id: 'embeddings',
        label: 'Embeddings',
        dataType: DataType.EMBEDDINGS,
        required: true,
        description: '768-dimensional embeddings'
      }
    ],
    defaultConfig: {
      model: 'gecko',
      dimensions: 768,
      useGpu: true
    }
  },

  // RETRIEVAL NODES (Blue)
  {
    type: NodeType.RETRIEVAL,
    label: 'Vector Store',
    description: 'Store embeddings in SQLite vector database',
    icon: 'Database',
    category: 'Retrieval',
    color: '#3b82f6',
    inputs: [
      {
        id: 'embeddings',
        label: 'Embeddings',
        dataType: DataType.EMBEDDINGS,
        required: true,
        description: 'Vector embeddings to store'
      },
      {
        id: 'metadata',
        label: 'Metadata',
        dataType: DataType.JSON,
        required: false,
        description: 'Optional chunk metadata'
      }
    ],
    outputs: [
      {
        id: 'stored',
        label: 'Stored Count',
        dataType: DataType.NUMBER,
        required: true,
        description: 'Number of embeddings stored'
      }
    ],
    defaultConfig: {
      tableName: 'embeddings',
      indexType: 'cosine',
      persistent: true
    }
  },
  {
    type: NodeType.RETRIEVAL,
    label: 'Semantic Search',
    description: 'Search vector database for relevant chunks',
    icon: 'Search',
    category: 'Retrieval',
    color: '#3b82f6',
    inputs: [
      {
        id: 'query',
        label: 'Query',
        dataType: DataType.TEXT,
        required: true,
        description: 'Search query'
      }
    ],
    outputs: [
      {
        id: 'results',
        label: 'Search Results',
        dataType: DataType.CHUNKS,
        required: true,
        description: 'Relevant text chunks'
      },
      {
        id: 'scores',
        label: 'Similarity Scores',
        dataType: DataType.JSON,
        required: false,
        description: 'Similarity scores for results'
      }
    ],
    defaultConfig: {
      topK: 3,
      minSimilarity: 0.0,
      rerankResults: false
    }
  },

  // LLM NODES (Purple)
  {
    type: NodeType.LLM,
    label: 'Gemma Generator',
    description: 'Generate responses using Gemma 3B model',
    icon: 'Brain',
    category: 'LLM',
    color: '#8b5cf6',
    inputs: [
      {
        id: 'prompt',
        label: 'Prompt',
        dataType: DataType.TEXT,
        required: true,
        description: 'Input prompt for generation'
      },
      {
        id: 'context',
        label: 'Context',
        dataType: DataType.CHUNKS,
        required: false,
        description: 'Retrieved context chunks'
      }
    ],
    outputs: [
      {
        id: 'response',
        label: 'Generated Text',
        dataType: DataType.TEXT,
        required: true,
        description: 'LLM generated response'
      }
    ],
    defaultConfig: {
      model: 'gemma-3b-1b-int4',
      temperature: 0.8,
      topP: 0.95,
      topK: 40,
      maxTokens: 2048,
      useGpu: true
    }
  },
  {
    type: NodeType.LLM,
    label: 'Prompt Builder',
    description: 'Build prompts with context injection',
    icon: 'MessageSquare',
    category: 'LLM',
    color: '#8b5cf6',
    inputs: [
      {
        id: 'query',
        label: 'User Query',
        dataType: DataType.TEXT,
        required: true,
        description: 'User question'
      },
      {
        id: 'context',
        label: 'Context',
        dataType: DataType.CHUNKS,
        required: false,
        description: 'Retrieved context'
      }
    ],
    outputs: [
      {
        id: 'prompt',
        label: 'Formatted Prompt',
        dataType: DataType.TEXT,
        required: true,
        description: 'Formatted prompt with context'
      }
    ],
    defaultConfig: {
      template: 'You are a helpful assistant. Use the following information to answer the user\'s question. If the answer is not in the context, say you don\'t know.\n\nContext: {context}\n\nQuestion: {query}',
      contextSeparator: '\n\n',
      maxContextLength: 4000
    }
  },

  // LOGIC NODES (Yellow)
  {
    type: NodeType.LOGIC,
    label: 'Conditional Branch',
    description: 'Branch execution based on conditions',
    icon: 'GitBranch',
    category: 'Logic',
    color: '#eab308',
    inputs: [
      {
        id: 'input',
        label: 'Input Value',
        dataType: DataType.TEXT,
        required: true,
        description: 'Value to evaluate'
      }
    ],
    outputs: [
      {
        id: 'true',
        label: 'True Branch',
        dataType: DataType.TEXT,
        required: false,
        description: 'Output if condition is true'
      },
      {
        id: 'false',
        label: 'False Branch',
        dataType: DataType.TEXT,
        required: false,
        description: 'Output if condition is false'
      }
    ],
    defaultConfig: {
      condition: 'length > 0',
      operator: 'greater_than',
      value: '0'
    }
  },
  {
    type: NodeType.LOGIC,
    label: 'Data Merger',
    description: 'Combine multiple inputs into one',
    icon: 'Merge',
    category: 'Logic',
    color: '#eab308',
    inputs: [
      {
        id: 'input1',
        label: 'Input 1',
        dataType: DataType.TEXT,
        required: true,
        description: 'First input'
      },
      {
        id: 'input2',
        label: 'Input 2',
        dataType: DataType.TEXT,
        required: false,
        description: 'Second input'
      }
    ],
    outputs: [
      {
        id: 'merged',
        label: 'Merged Output',
        dataType: DataType.TEXT,
        required: true,
        description: 'Combined output'
      }
    ],
    defaultConfig: {
      separator: '\n',
      mergeMethod: 'concatenate'
    }
  },

  // OUTPUT NODES (Red)
  {
    type: NodeType.OUTPUT,
    label: 'Text Response',
    description: 'Display generated text response',
    icon: 'MessageCircle',
    category: 'Output',
    color: '#ef4444',
    inputs: [
      {
        id: 'text',
        label: 'Response Text',
        dataType: DataType.TEXT,
        required: true,
        description: 'Text to display'
      }
    ],
    outputs: [],
    defaultConfig: {
      displayType: 'chat-message',
      enableMarkdown: true,
      showMetadata: false
    }
  },
  {
    type: NodeType.OUTPUT,
    label: 'JSON Export',
    description: 'Export results as JSON data',
    icon: 'Download',
    category: 'Output',
    color: '#ef4444',
    inputs: [
      {
        id: 'data',
        label: 'Data',
        dataType: DataType.JSON,
        required: true,
        description: 'Data to export'
      }
    ],
    outputs: [],
    defaultConfig: {
      filename: 'pipeline-results.json',
      prettyPrint: true,
      includeMetadata: true
    }
  }
];

// Group templates by category for the palette
export const GROUPED_TEMPLATES = NODE_TEMPLATES.reduce((acc, template) => {
  if (!acc[template.category]) {
    acc[template.category] = [];
  }
  acc[template.category].push(template);
  return acc;
}, {} as Record<string, NodeTemplate[]>); 