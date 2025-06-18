import type { Pipeline } from '../types/pipeline';
import { NodeType, DataType } from '../types/pipeline';

// Pre-built template: Document Q&A Pipeline
export const DOCUMENT_QA_TEMPLATE: Pipeline = {
  id: 'document-qa-template',
  name: 'Document Q&A Pipeline',
  description: 'Complete RAG pipeline for document-based question answering',
  version: '1.0.0',
  createdAt: new Date(),
  updatedAt: new Date(),
  isValid: true,
  validationErrors: [],
  nodes: [
    // PDF Input Node
    {
      id: 'pdf-input-1',
      type: NodeType.INPUT,
      position: { x: 100, y: 100 },
      data: {
        id: 'pdf-input-1',
        type: NodeType.INPUT,
        label: 'PDF Input',
        description: 'Load PDF documents from device storage',
        icon: 'FileText',
        inputs: [],
        outputs: [{
          id: 'pdf',
          label: 'PDF Document',
          dataType: DataType.PDF,
          required: true,
          description: 'Raw PDF document'
        }],
        config: {
          allowMultiple: false,
          fileFilter: '*.pdf',
          maxSize: '10MB'
        },
        position: { x: 100, y: 100 },
        status: 'idle'
      }
    },
    
    // PDF Text Extractor
    {
      id: 'pdf-extractor-1',
      type: NodeType.PROCESSING,
      position: { x: 350, y: 100 },
      data: {
        id: 'pdf-extractor-1',
        type: NodeType.PROCESSING,
        label: 'PDF Text Extractor',
        description: 'Extract text content from PDF documents',
        icon: 'FileText',
        inputs: [{
          id: 'pdf',
          label: 'PDF Document',
          dataType: DataType.PDF,
          required: true,
          description: 'PDF document to extract text from'
        }],
        outputs: [{
          id: 'text',
          label: 'Extracted Text',
          dataType: DataType.TEXT,
          required: true,
          description: 'Text extracted from PDF'
        }],
        config: {
          stripFormatting: true,
          preserveLineBreaks: false
        },
        position: { x: 350, y: 100 },
        status: 'idle'
      }
    },

    // Text Chunker
    {
      id: 'text-chunker-1',
      type: NodeType.PROCESSING,
      position: { x: 600, y: 100 },
      data: {
        id: 'text-chunker-1',
        type: NodeType.PROCESSING,
        label: 'Text Chunker',
        description: 'Split text into chunks for processing',
        icon: 'Scissors',
        inputs: [{
          id: 'text',
          label: 'Text',
          dataType: DataType.TEXT,
          required: true,
          description: 'Text to chunk'
        }],
        outputs: [{
          id: 'chunks',
          label: 'Text Chunks',
          dataType: DataType.CHUNKS,
          required: true,
          description: 'Chunked text segments'
        }],
        config: {
          chunkSize: 512,
          overlap: 64,
          method: 'fixed-size'
        },
        position: { x: 600, y: 100 },
        status: 'idle'
      }
    },

    // Embedding Generator
    {
      id: 'embedding-gen-1',
      type: NodeType.PROCESSING,
      position: { x: 850, y: 100 },
      data: {
        id: 'embedding-gen-1',
        type: NodeType.PROCESSING,
        label: 'Embedding Generator',
        description: 'Generate vector embeddings using Gecko model',
        icon: 'Zap',
        inputs: [{
          id: 'chunks',
          label: 'Text Chunks',
          dataType: DataType.CHUNKS,
          required: true,
          description: 'Text chunks to embed'
        }],
        outputs: [{
          id: 'embeddings',
          label: 'Embeddings',
          dataType: DataType.EMBEDDINGS,
          required: true,
          description: '768-dimensional embeddings'
        }],
        config: {
          model: 'gecko',
          dimensions: 768,
          useGpu: true
        },
        position: { x: 850, y: 100 },
        status: 'idle'
      }
    },

    // Vector Store
    {
      id: 'vector-store-1',
      type: NodeType.RETRIEVAL,
      position: { x: 1100, y: 100 },
      data: {
        id: 'vector-store-1',
        type: NodeType.RETRIEVAL,
        label: 'Vector Store',
        description: 'Store embeddings in SQLite vector database',
        icon: 'Database',
        inputs: [{
          id: 'embeddings',
          label: 'Embeddings',
          dataType: DataType.EMBEDDINGS,
          required: true,
          description: 'Vector embeddings to store'
        }],
        outputs: [{
          id: 'stored',
          label: 'Stored Count',
          dataType: DataType.NUMBER,
          required: true,
          description: 'Number of embeddings stored'
        }],
        config: {
          tableName: 'embeddings',
          indexType: 'cosine',
          persistent: true
        },
        position: { x: 1100, y: 100 },
        status: 'idle'
      }
    },

    // Query Input
    {
      id: 'query-input-1',
      type: NodeType.INPUT,
      position: { x: 100, y: 400 },
      data: {
        id: 'query-input-1',
        type: NodeType.INPUT,
        label: 'Text Input',
        description: 'User question input',
        icon: 'Type',
        inputs: [],
        outputs: [{
          id: 'text',
          label: 'Text',
          dataType: DataType.TEXT,
          required: true,
          description: 'User question'
        }],
        config: {
          placeholder: 'Enter your question here...',
          maxLength: 1000
        },
        position: { x: 100, y: 400 },
        status: 'idle'
      }
    },

    // Semantic Search
    {
      id: 'semantic-search-1',
      type: NodeType.RETRIEVAL,
      position: { x: 350, y: 400 },
      data: {
        id: 'semantic-search-1',
        type: NodeType.RETRIEVAL,
        label: 'Semantic Search',
        description: 'Search vector database for relevant chunks',
        icon: 'Search',
        inputs: [{
          id: 'query',
          label: 'Query',
          dataType: DataType.TEXT,
          required: true,
          description: 'Search query'
        }],
        outputs: [{
          id: 'results',
          label: 'Search Results',
          dataType: DataType.CHUNKS,
          required: true,
          description: 'Relevant text chunks'
        }],
        config: {
          topK: 3,
          minSimilarity: 0.0,
          rerankResults: false
        },
        position: { x: 350, y: 400 },
        status: 'idle'
      }
    },

    // Prompt Builder
    {
      id: 'prompt-builder-1',
      type: NodeType.LLM,
      position: { x: 600, y: 400 },
      data: {
        id: 'prompt-builder-1',
        type: NodeType.LLM,
        label: 'Prompt Builder',
        description: 'Build prompts with context injection',
        icon: 'MessageSquare',
        inputs: [{
          id: 'query',
          label: 'User Query',
          dataType: DataType.TEXT,
          required: true,
          description: 'User question'
        }, {
          id: 'context',
          label: 'Context',
          dataType: DataType.CHUNKS,
          required: false,
          description: 'Retrieved context'
        }],
        outputs: [{
          id: 'prompt',
          label: 'Formatted Prompt',
          dataType: DataType.TEXT,
          required: true,
          description: 'Formatted prompt with context'
        }],
        config: {
          template: 'You are a helpful assistant. Use the following information to answer the user\'s question. If the answer is not in the context, say you don\'t know.\n\nContext: {context}\n\nQuestion: {query}',
          contextSeparator: '\n\n',
          maxContextLength: 4000
        },
        position: { x: 600, y: 400 },
        status: 'idle'
      }
    },

    // Gemma Generator
    {
      id: 'gemma-gen-1',
      type: NodeType.LLM,
      position: { x: 850, y: 400 },
      data: {
        id: 'gemma-gen-1',
        type: NodeType.LLM,
        label: 'Gemma Generator',
        description: 'Generate responses using Gemma 3B model',
        icon: 'Brain',
        inputs: [{
          id: 'prompt',
          label: 'Prompt',
          dataType: DataType.TEXT,
          required: true,
          description: 'Input prompt for generation'
        }],
        outputs: [{
          id: 'response',
          label: 'Generated Text',
          dataType: DataType.TEXT,
          required: true,
          description: 'LLM generated response'
        }],
        config: {
          model: 'gemma-3b-1b-int4',
          temperature: 0.8,
          topP: 0.95,
          topK: 40,
          maxTokens: 2048,
          useGpu: true
        },
        position: { x: 850, y: 400 },
        status: 'idle'
      }
    },

    // Text Response Output
    {
      id: 'text-response-1',
      type: NodeType.OUTPUT,
      position: { x: 1100, y: 400 },
      data: {
        id: 'text-response-1',
        type: NodeType.OUTPUT,
        label: 'Text Response',
        description: 'Display generated text response',
        icon: 'MessageCircle',
        inputs: [{
          id: 'text',
          label: 'Response Text',
          dataType: DataType.TEXT,
          required: true,
          description: 'Text to display'
        }],
        outputs: [],
        config: {
          displayType: 'chat-message',
          enableMarkdown: true,
          showMetadata: false
        },
        position: { x: 1100, y: 400 },
        status: 'idle'
      }
    }
  ],
  
  edges: [
    // Document processing flow
    {
      id: 'edge-1',
      source: 'pdf-input-1',
      target: 'pdf-extractor-1',
      sourceHandle: 'pdf',
      targetHandle: 'pdf',
      sourcePort: 'pdf',
      targetPort: 'pdf',
      dataType: DataType.PDF,
      validated: true
    },
    {
      id: 'edge-2',
      source: 'pdf-extractor-1',
      target: 'text-chunker-1',
      sourceHandle: 'text',
      targetHandle: 'text',
      sourcePort: 'text',
      targetPort: 'text',
      dataType: DataType.TEXT,
      validated: true
    },
    {
      id: 'edge-3',
      source: 'text-chunker-1',
      target: 'embedding-gen-1',
      sourceHandle: 'chunks',
      targetHandle: 'chunks',
      sourcePort: 'chunks',
      targetPort: 'chunks',
      dataType: DataType.CHUNKS,
      validated: true
    },
    {
      id: 'edge-4',
      source: 'embedding-gen-1',
      target: 'vector-store-1',
      sourceHandle: 'embeddings',
      targetHandle: 'embeddings',
      sourcePort: 'embeddings',
      targetPort: 'embeddings',
      dataType: DataType.EMBEDDINGS,
      validated: true
    },

    // Query processing flow
    {
      id: 'edge-5',
      source: 'query-input-1',
      target: 'semantic-search-1',
      sourceHandle: 'text',
      targetHandle: 'query',
      sourcePort: 'text',
      targetPort: 'query',
      dataType: DataType.TEXT,
      validated: true
    },
    {
      id: 'edge-6',
      source: 'query-input-1',
      target: 'prompt-builder-1',
      sourceHandle: 'text',
      targetHandle: 'query',
      sourcePort: 'text',
      targetPort: 'query',
      dataType: DataType.TEXT,
      validated: true
    },
    {
      id: 'edge-7',
      source: 'semantic-search-1',
      target: 'prompt-builder-1',
      sourceHandle: 'results',
      targetHandle: 'context',
      sourcePort: 'results',
      targetPort: 'context',
      dataType: DataType.CHUNKS,
      validated: true
    },
    {
      id: 'edge-8',
      source: 'prompt-builder-1',
      target: 'gemma-gen-1',
      sourceHandle: 'prompt',
      targetHandle: 'prompt',
      sourcePort: 'prompt',
      targetPort: 'prompt',
      dataType: DataType.TEXT,
      validated: true
    },
    {
      id: 'edge-9',
      source: 'gemma-gen-1',
      target: 'text-response-1',
      sourceHandle: 'response',
      targetHandle: 'text',
      sourcePort: 'response',
      targetPort: 'text',
      dataType: DataType.TEXT,
      validated: true
    }
  ]
};

export const PIPELINE_TEMPLATES = [
  DOCUMENT_QA_TEMPLATE
]; 