import type { Node, Edge } from '@xyflow/react';
import type { Pipeline, PipelineNode, PipelineEdge, GeneratedCode, CodeGenContext } from '../types/pipeline';
import { NodeType, DataType } from '../types/pipeline';

/**
 * Edge-GallyRAG Code Generation Engine
 * Transforms visual pipeline into working Kotlin code for Android Edge Gallery
 */
export class CodeGenerator {
  private pipeline: Pipeline;
  private context: CodeGenContext;
  
  constructor(nodes: Node[], edges: Edge[], pipelineName: string = 'Generated Pipeline') {
    this.pipeline = this.buildPipeline(nodes, edges, pipelineName);
    this.context = {
      pipeline: this.pipeline,
      imports: [],
      dependencies: [],
      kotlinVersion: '1.9.10',
      targetPackage: 'com.google.ai.edge.gallery.rag.generated'
    };
  }

  /**
   * Main entry point: Generate complete Kotlin code
   */
  public generate(): GeneratedCode {
    try {
      // 1. Validate pipeline structure
      const validationErrors = this.validatePipeline();
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors,
          warnings: []
        };
      }

      // 2. Analyze execution order (topological sort)
      const executionOrder = this.topologicalSort();
      if (!executionOrder) {
        return {
          success: false,
          errors: ['Pipeline contains circular dependencies'],
          warnings: []
        };
      }

      // 3. Generate Kotlin code
      const kotlinCode = this.generateKotlinCode(executionOrder);
      const buildGradle = this.generateBuildGradle();

      return {
        success: true,
        kotlinCode,
        buildGradle,
        errors: [],
        warnings: this.getWarnings()
      };

    } catch (error) {
      return {
        success: false,
        errors: [`Code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  /**
   * Build Pipeline object from React Flow nodes and edges
   */
  private buildPipeline(nodes: Node[], edges: Edge[], name: string): Pipeline {
    const pipelineNodes: PipelineNode[] = nodes.map(node => ({
      ...node,
      type: (node.data?.type as NodeType) || NodeType.PROCESSING,
      data: {
        id: node.id,
        type: (node.data?.type as NodeType) || NodeType.PROCESSING,
        label: (node.data?.label as string) || 'Unknown Node',
        description: (node.data?.description as string) || '',
        icon: (node.data?.icon as string) || 'Circle',
        inputs: (node.data?.inputs as any[]) || [],
        outputs: (node.data?.outputs as any[]) || [],
        config: (node.data?.config as any) || {},
        position: node.position
      }
    }));

    const pipelineEdges: PipelineEdge[] = edges.map(edge => ({
      ...edge,
      sourcePort: edge.sourceHandle || 'output',
      targetPort: edge.targetHandle || 'input',
      dataType: this.inferDataType(edge, pipelineNodes),
      validated: true
    }));

    return {
      id: `pipeline-${Date.now()}`,
      name,
      description: `Generated pipeline with ${nodes.length} nodes and ${edges.length} connections`,
      version: '1.0.0',
      nodes: pipelineNodes,
      edges: pipelineEdges,
      createdAt: new Date(),
      updatedAt: new Date(),
      isValid: true,
      validationErrors: []
    };
  }

  /**
   * Validate pipeline structure and data flow
   */
  private validatePipeline(): string[] {
    const errors: string[] = [];
    
    // Check for input nodes
    const inputNodes = this.pipeline.nodes.filter(node => node.data.type === NodeType.INPUT);
    if (inputNodes.length === 0) {
      errors.push('Pipeline must have at least one input node');
    }

    // Check for output nodes
    const outputNodes = this.pipeline.nodes.filter(node => node.data.type === NodeType.OUTPUT);
    if (outputNodes.length === 0) {
      errors.push('Pipeline must have at least one output node');
    }

    // Validate connections
    for (const edge of this.pipeline.edges) {
      const sourceNode = this.pipeline.nodes.find(n => n.id === edge.source);
      const targetNode = this.pipeline.nodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) {
        errors.push(`Invalid connection: ${edge.source} -> ${edge.target}`);
        continue;
      }

      // Check data type compatibility
      const sourcePort = sourceNode.data.outputs.find(p => p.id === edge.sourceHandle);
      const targetPort = targetNode.data.inputs.find(p => p.id === edge.targetHandle);
      
      if (sourcePort && targetPort && !this.isDataTypeCompatible(sourcePort.dataType, targetPort.dataType)) {
        errors.push(`Incompatible data types: ${sourcePort.dataType} -> ${targetPort.dataType} (${sourceNode.data.label} -> ${targetNode.data.label})`);
      }
    }

    return errors;
  }

  /**
   * Topological sort to determine execution order
   */
  private topologicalSort(): string[] | null {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: string[] = [];

    const visit = (nodeId: string): boolean => {
      if (visiting.has(nodeId)) {
        return false; // Circular dependency
      }
      if (visited.has(nodeId)) {
        return true;
      }

      visiting.add(nodeId);

      // Visit all dependencies first
      const dependencies = this.pipeline.edges
        .filter(edge => edge.target === nodeId)
        .map(edge => edge.source);

      for (const depId of dependencies) {
        if (!visit(depId)) {
          return false;
        }
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      result.push(nodeId);
      return true;
    };

    // Visit all nodes
    for (const node of this.pipeline.nodes) {
      if (!visit(node.id)) {
        return null; // Circular dependency detected
      }
    }

    return result;
  }

  /**
   * Generate complete Kotlin code for the pipeline
   */
  private generateKotlinCode(executionOrder: string[]): string {
    this.addRequiredImports();
    
    const imports = this.context.imports.join('\n');
    const classBody = this.generateClassBody(executionOrder);
    
    return `package ${this.context.targetPackage}

${imports}

/**
 * Generated RAG Pipeline: ${this.pipeline.name}
 * Nodes: ${this.pipeline.nodes.length}
 * Edges: ${this.pipeline.edges.length}
 * Generated at: ${new Date().toISOString()}
 */
class GeneratedRagPipeline private constructor(private val application: Application) {
    
    companion object {
        @Volatile
        private var INSTANCE: GeneratedRagPipeline? = null
        
        fun getInstance(application: Application): GeneratedRagPipeline {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: GeneratedRagPipeline(application).also { INSTANCE = it }
            }
        }
    }
    
    // Node execution variables
    private val nodeOutputs = mutableMapOf<String, Any>()
    private val nodeConfigs = mutableMapOf<String, Map<String, Any>>()
    
    // RAG Components
    private lateinit var ragPipeline: RagPipeline
    
    init {
        initializeComponents()
        setupNodeConfigurations()
    }
    
    private fun initializeComponents() {
        // Initialize RAG components
        ragPipeline = RagPipeline.getInstance(application)
    }
    
    private fun setupNodeConfigurations() {
${this.generateNodeConfigurations()}
    }
    
${classBody}
    
    /**
     * Execute the complete pipeline
     */
    fun executePipeline(input: Map<String, Any>): Map<String, Any> {
        try {
            // Clear previous outputs
            nodeOutputs.clear()
            
            // Set initial inputs
            input.forEach { (key, value) ->
                nodeOutputs[key] = value
            }
            
            // Execute nodes in topological order
${this.generateExecutionSequence(executionOrder)}
            
            // Return final outputs
            return extractFinalOutputs()
            
        } catch (e: Exception) {
            throw RuntimeException("Pipeline execution failed: \${e.message}", e)
        }
    }
    
    private fun extractFinalOutputs(): Map<String, Any> {
        val finalOutputs = mutableMapOf<String, Any>()
        
        // Extract outputs from output nodes
${this.generateOutputExtraction()}
        
        return finalOutputs
    }
}`;
  }

  /**
   * Generate node configurations initialization
   */
  private generateNodeConfigurations(): string {
    return this.pipeline.nodes.map(node => {
      return `        nodeConfigs["${node.id}"] = mapOf(${this.formatConfigMap(node.data.config)})`;
    }).join('\n');
  }

  /**
   * Generate execution sequence for all nodes
   */
  private generateExecutionSequence(executionOrder: string[]): string {
    return executionOrder.map(nodeId => {
      const node = this.pipeline.nodes.find(n => n.id === nodeId)!;
      return `            // Execute: ${node.data.label}
            executeNode_${nodeId.replace(/[^a-zA-Z0-9]/g, '_')}()`;
    }).join('\n\n');
  }

  /**
   * Generate class body with all node execution methods
   */
  private generateClassBody(executionOrder: string[]): string {
    return executionOrder.map(nodeId => {
      const node = this.pipeline.nodes.find(n => n.id === nodeId)!;
      return this.generateNodeMethod(node);
    }).join('\n\n');
  }

  /**
   * Generate individual node execution method
   */
  private generateNodeMethod(node: PipelineNode): string {
    const methodName = `executeNode_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    // Get input connections
    const inputConnections = this.pipeline.edges.filter(edge => edge.target === node.id);
    const inputMappings = inputConnections.map(edge => {
      const sourceOutput = edge.sourceHandle || 'output';
      const targetInput = edge.targetHandle || 'input';
      return `        val ${targetInput} = nodeOutputs["${edge.source}_${sourceOutput}"]`;
    }).join('\n');

    // Generate output assignments
    const outputAssignments = node.data.outputs.map(output => {
      return `        nodeOutputs["${node.id}_${output.id}"] = ${output.id}Result`;
    }).join('\n');

    return `    /**
     * Execute ${node.data.label}
     * ${node.data.description}
     */
    private fun ${methodName}() {
        try {
            val config = nodeConfigs["${node.id}"] ?: emptyMap()
            
            // Get inputs from connected nodes
${inputMappings}
            
            // Execute node logic
${this.generateNodeLogic(node)}
            
            // Store outputs
${outputAssignments}
            
        } catch (e: Exception) {
            throw RuntimeException("Node '${node.data.label}' execution failed: \${e.message}", e)
        }
    }`;
  }

  /**
   * Generate node-specific execution logic
   */
  private generateNodeLogic(node: PipelineNode): string {
    switch (node.data.type) {
      case NodeType.INPUT:
        return this.generateInputNodeLogic(node);
      case NodeType.PROCESSING:
        return this.generateProcessingNodeLogic(node);
      case NodeType.RETRIEVAL:
        return this.generateRetrievalNodeLogic(node);
      case NodeType.LLM:
        return this.generateLlmNodeLogic(node);
      case NodeType.LOGIC:
        return this.generateLogicNodeLogic(node);
      case NodeType.OUTPUT:
        return this.generateOutputNodeLogic(node);
      default:
        return '            // Unknown node type';
    }
  }

  /**
   * Generate input node logic
   */
  private generateInputNodeLogic(node: PipelineNode): string {
    if (node.data.label.toLowerCase().includes('pdf')) {
      return `            // PDF Input Node
            val pdfResult = nodeOutputs["pdf"] ?: throw IllegalArgumentException("PDF input required")`;
    } else if (node.data.label.toLowerCase().includes('text')) {
      return `            // Text Input Node
            val textResult = nodeOutputs["text"] ?: config["defaultText"] ?: ""`;
    }
    return `            // Generic Input Node
            val inputResult = nodeOutputs["data"] ?: ""`;
  }

  /**
   * Generate processing node logic
   */
  private generateProcessingNodeLogic(node: PipelineNode): string {
    if (node.data.label.toLowerCase().includes('chunker')) {
      return `            // Text Chunker Node
            val inputText = input as? String ?: ""
            val chunkSize = config["chunkSize"] as? Int ?: 512
            val overlap = config["overlap"] as? Int ?: 64
            
            val chunksResult = ragPipeline.chunkText(inputText, chunkSize, overlap)`;
    } else if (node.data.label.toLowerCase().includes('embedding')) {
      return `            // Embedding Generator Node
            val inputChunks = chunks as? List<String> ?: emptyList()
            val embeddingsResult = ragPipeline.generateEmbeddings(inputChunks)`;
    } else if (node.data.label.toLowerCase().includes('extractor')) {
      return `            // PDF Text Extractor Node
            val pdfUri = pdf as? String ?: ""
            val textResult = ragPipeline.extractTextFromPdf(pdfUri)`;
    }
    return `            // Generic Processing Node
            val processedResult = input`;
  }

  /**
   * Generate retrieval node logic
   */
  private generateRetrievalNodeLogic(node: PipelineNode): string {
    if (node.data.label.toLowerCase().includes('search')) {
      return `            // Similarity Search Node
            val queryText = query as? String ?: ""
            val topK = config["topK"] as? Int ?: 3
            val threshold = config["threshold"] as? Double ?: 0.0
            
            val resultsResult = ragPipeline.searchSimilar(queryText, topK, threshold)`;
    } else if (node.data.label.toLowerCase().includes('vector')) {
      return `            // Vector Store Node
            val inputEmbeddings = embeddings as? List<FloatArray> ?: emptyList()
            val storedResult = ragPipeline.storeEmbeddings(inputEmbeddings)`;
    }
    return `            // Generic Retrieval Node
            val retrievalResult = input`;
  }

  /**
   * Generate LLM node logic
   */
  private generateLlmNodeLogic(node: PipelineNode): string {
    if (node.data.label.toLowerCase().includes('gemma')) {
      // Get the input connections for this node
      const inputConnections = this.pipeline.edges.filter(edge => edge.target === node.id);
      const promptInput = inputConnections.find(edge => edge.targetHandle === 'prompt');
      const contextInput = inputConnections.find(edge => edge.targetHandle === 'context');
      
      return `            // Gemma LLM Node
            val inputPrompt = ${promptInput ? 'prompt as? String ?: ""' : 'config["defaultPrompt"] as? String ?: ""'}
            val contextChunks = ${contextInput ? 'context as? List<String> ?: emptyList()' : 'emptyList<String>()'}
            val temperature = config["temperature"] as? Double ?: 0.8
            val maxTokens = config["maxTokens"] as? Int ?: 150
            
            val responseResult = ragPipeline.generateResponse(inputPrompt, contextChunks, temperature, maxTokens)`;
    } else if (node.data.label.toLowerCase().includes('prompt')) {
      // Get the input connections for this node
      const inputConnections = this.pipeline.edges.filter(edge => edge.target === node.id);
      const queryInput = inputConnections.find(edge => edge.targetHandle === 'query');
      const contextInput = inputConnections.find(edge => edge.targetHandle === 'context');
      
      return `            // Prompt Builder Node
            val userQuery = ${queryInput ? 'query as? String ?: ""' : 'config["defaultQuery"] as? String ?: ""'}
            val contextChunks = ${contextInput ? 'context as? List<String> ?: emptyList()' : 'emptyList<String>()'}
            val template = config["template"] as? String ?: "default"
            
            val promptResult = ragPipeline.buildPrompt(userQuery, contextChunks, template)`;
    }
    return `            // Generic LLM Node
            val llmResult = nodeOutputs["input"] ?: ""`;
  }

  /**
   * Generate logic node logic
   */
  private generateLogicNodeLogic(node: PipelineNode): string {
    if (node.data.label.toLowerCase().includes('if')) {
      return `            // If/Then Logic Node
            val inputValue = input as? String ?: ""
            val condition = config["condition"] as? String ?: "contains"
            val checkValue = config["value"] as? String ?: ""
            
            val conditionResult = when (condition) {
                "contains" -> inputValue.contains(checkValue)
                "equals" -> inputValue == checkValue
                "startsWith" -> inputValue.startsWith(checkValue)
                "endsWith" -> inputValue.endsWith(checkValue)
                else -> false
            }
            
            val trueResult = if (conditionResult) inputValue else null
            val falseResult = if (!conditionResult) inputValue else null`;
    }
    return `            // Generic Logic Node
            val logicResult = input`;
  }

  /**
   * Generate output node logic
   */
  private generateOutputNodeLogic(node: PipelineNode): string {
    // Get the input connections for this node
    const inputConnections = this.pipeline.edges.filter(edge => edge.target === node.id);
    const primaryInput = inputConnections[0]; // Use first input as primary
    
    if (primaryInput) {
      const inputVar = primaryInput.targetHandle || 'input';
      return `            // Output Node
            val outputResult = ${inputVar} ?: ""`;
    }
    
    return `            // Output Node
            val outputResult = nodeOutputs["input"] ?: ""`;
  }

  /**
   * Generate output extraction logic
   */
  private generateOutputExtraction(): string {
    const outputNodes = this.pipeline.nodes.filter(node => node.data.type === NodeType.OUTPUT);
    return outputNodes.map(node => {
      // Use the first output port or default to "output"
      const outputPort = node.data.outputs[0]?.id || 'output';
      return `        finalOutputs["${node.data.label}"] = nodeOutputs["${node.id}_${outputPort}"] ?: ""`;
    }).join('\n');
  }

  /**
   * Add required imports based on node types
   */
  private addRequiredImports(): void {
    const imports = new Set([
      'import android.app.Application',
      'import com.google.ai.edge.gallery.rag.RagPipeline'
    ]);

    this.context.imports = Array.from(imports);
  }

  /**
   * Generate build.gradle.kts dependencies
   */
  private generateBuildGradle(): string {
    const dependencies = [
      'implementation("com.google.ai.edge:local-agents-rag:1.0.0")',
      'implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")'
    ];

    return `dependencies {
    ${dependencies.join('\n    ')}
}`;
  }

  /**
   * Helper methods
   */
  private inferDataType(edge: Edge, nodes: PipelineNode[]): DataType {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const sourcePort = sourceNode?.data.outputs.find(p => p.id === edge.sourceHandle);
    return sourcePort?.dataType || DataType.TEXT;
  }

  private isDataTypeCompatible(sourceType: DataType, targetType: DataType): boolean {
    if (sourceType === targetType) return true;
    
    const compatibilityRules: Record<DataType, DataType[]> = {
      [DataType.PDF]: [DataType.TEXT],
      [DataType.TEXT]: [DataType.CHUNKS],
      [DataType.CHUNKS]: [DataType.EMBEDDINGS, DataType.TEXT],
      [DataType.EMBEDDINGS]: [],
      [DataType.JSON]: [DataType.TEXT],
      [DataType.BOOLEAN]: [DataType.TEXT],
      [DataType.NUMBER]: [DataType.TEXT]
    };
    
    return compatibilityRules[sourceType]?.includes(targetType) || false;
  }

  private formatConfigMap(config: any): string {
    return Object.entries(config).map(([key, value]) => {
      if (typeof value === 'string') {
        return `"${key}" to "${value}"`;
      } else if (typeof value === 'number') {
        return `"${key}" to ${value}`;
      } else if (typeof value === 'boolean') {
        return `"${key}" to ${value}`;
      } else {
        return `"${key}" to "${JSON.stringify(value)}"`;
      }
    }).join(', ');
  }

  private getWarnings(): string[] {
    const warnings: string[] = [];
    
    const processingNodes = this.pipeline.nodes.filter(n => n.data.type === NodeType.PROCESSING);
    if (processingNodes.length > 10) {
      warnings.push('Pipeline has many processing nodes - consider optimizing for performance');
    }
    
    for (const node of this.pipeline.nodes) {
      if (Object.keys(node.data.config).length === 0) {
        warnings.push(`Node '${node.data.label}' has no configuration - using defaults`);
      }
    }
    
    return warnings;
  }
}

/**
 * Convenience function to generate code from React Flow components
 */
export function generateCodeFromPipeline(
  nodes: Node[], 
  edges: Edge[], 
  pipelineName?: string
): GeneratedCode {
  const generator = new CodeGenerator(nodes, edges, pipelineName);
  return generator.generate();
} 