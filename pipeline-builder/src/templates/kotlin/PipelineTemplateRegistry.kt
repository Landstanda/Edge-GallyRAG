package com.google.ai.edge.gallery.pipeline.nodes

import android.content.Context
import com.google.ai.edge.gallery.rag.RagPipeline

/**
 * Central registry for all pipeline node templates.
 * Provides factory methods and template information for code generation.
 */
object PipelineTemplateRegistry {
    
    /**
     * Node template information for the visual pipeline builder
     */
    data class NodeTemplate(
        val id: String,
        val name: String,
        val category: String,
        val description: String,
        val className: String,
        val configTemplate: String,
        val inputPorts: List<PortTemplate>,
        val outputPorts: List<PortTemplate>,
        val kotlinCode: String
    )
    
    data class PortTemplate(
        val name: String,
        val dataType: String,
        val required: Boolean = true,
        val description: String = ""
    )
    
    /**
     * Gets all available node templates
     */
    fun getAllTemplates(): List<NodeTemplate> {
        return listOf(
            // Input Nodes
            NodeTemplate(
                id = "pdf-input",
                name = "PDF Input",
                category = "input",
                description = "Load PDF documents from device storage",
                className = "PdfInputNode",
                configTemplate = """{ "allowMultiple": false, "fileFilter": "*.pdf", "maxSize": "10MB" }""",
                inputPorts = emptyList(),
                outputPorts = listOf(
                    PortTemplate("pdf", "PDF", true, "PDF document content")
                ),
                kotlinCode = generatePdfInputCode()
            ),
            
            NodeTemplate(
                id = "text-input",
                name = "Text Input",
                category = "input",
                description = "Direct text input for processing",
                className = "TextInputNode",
                configTemplate = """{ "placeholder": "Enter your text here...", "maxLength": 10000 }""",
                inputPorts = emptyList(),
                outputPorts = listOf(
                    PortTemplate("text", "TEXT", true, "Input text content")
                ),
                kotlinCode = generateTextInputCode()
            ),
            
            // Processing Nodes
            NodeTemplate(
                id = "pdf-text-extractor",
                name = "PDF Text Extractor",
                category = "processing",
                description = "Extract text content from PDF documents",
                className = "PdfTextExtractorNode",
                configTemplate = """{ "stripFormatting": true, "preserveLineBreaks": false }""",
                inputPorts = listOf(
                    PortTemplate("pdf", "PDF", true, "PDF document to extract text from")
                ),
                outputPorts = listOf(
                    PortTemplate("text", "TEXT", true, "Extracted text content")
                ),
                kotlinCode = generatePdfTextExtractorCode()
            ),
            
            NodeTemplate(
                id = "text-chunker",
                name = "Text Chunker",
                category = "processing",
                description = "Split text into chunks for processing",
                className = "TextChunkerNode",
                configTemplate = """{ "chunkSize": 512, "overlap": 64, "method": "fixed-size" }""",
                inputPorts = listOf(
                    PortTemplate("text", "TEXT", true, "Text to be chunked")
                ),
                outputPorts = listOf(
                    PortTemplate("chunks", "CHUNKS", true, "Text chunks")
                ),
                kotlinCode = generateTextChunkerCode()
            ),
            
            NodeTemplate(
                id = "embedding-generator",
                name = "Embedding Generator",
                category = "processing",
                description = "Generate vector embeddings using Gecko model",
                className = "EmbeddingGeneratorNode",
                configTemplate = """{ "model": "gecko", "dimensions": 768, "useGpu": true }""",
                inputPorts = listOf(
                    PortTemplate("chunks", "CHUNKS", true, "Text chunks to embed")
                ),
                outputPorts = listOf(
                    PortTemplate("embeddings", "EMBEDDINGS", true, "Vector embeddings")
                ),
                kotlinCode = generateEmbeddingGeneratorCode()
            ),
            
            // Retrieval Nodes
            NodeTemplate(
                id = "vector-store",
                name = "Vector Store",
                category = "retrieval",
                description = "Manages the vector database for embeddings",
                className = "VectorStoreNode",
                configTemplate = """{ "dimensions": 768, "database": "sqlite", "indexType": "flat" }""",
                inputPorts = listOf(
                    PortTemplate("embeddings", "EMBEDDINGS", false, "Vector embeddings to store")
                ),
                outputPorts = listOf(
                    PortTemplate("store", "EMBEDDINGS", true, "Vector store reference")
                ),
                kotlinCode = generateVectorStoreCode()
            ),
            
            NodeTemplate(
                id = "similarity-search",
                name = "Similarity Search",
                category = "retrieval",
                description = "Performs semantic similarity search in vector space",
                className = "SimilaritySearchNode",
                configTemplate = """{ "topK": 5, "threshold": 0.0, "taskType": "QUESTION_ANSWERING" }""",
                inputPorts = listOf(
                    PortTemplate("query", "TEXT", true, "Search query"),
                    PortTemplate("store", "EMBEDDINGS", true, "Vector store to search")
                ),
                outputPorts = listOf(
                    PortTemplate("results", "CHUNKS", true, "Retrieved text chunks")
                ),
                kotlinCode = generateSimilaritySearchCode()
            ),
            
            // LLM Nodes
            NodeTemplate(
                id = "gemma-llm",
                name = "Gemma LLM",
                category = "llm",
                description = "On-device language model for text generation",
                className = "GemmaLlmNode",
                configTemplate = """{ "model": "gemma3-1b-it", "temperature": 0.8, "maxTokens": 2048, "topP": 0.95 }""",
                inputPorts = listOf(
                    PortTemplate("query", "TEXT", true, "Input query"),
                    PortTemplate("context", "CHUNKS", false, "Retrieved context chunks")
                ),
                outputPorts = listOf(
                    PortTemplate("response", "TEXT", true, "Generated response")
                ),
                kotlinCode = generateGemmaLlmCode()
            ),
            
            NodeTemplate(
                id = "prompt-builder",
                name = "Prompt Builder",
                category = "llm",
                description = "Constructs prompts for LLM processing",
                className = "PromptBuilderNode",
                configTemplate = """{ "template": "default", "includeContext": true, "systemPrompt": "" }""",
                inputPorts = listOf(
                    PortTemplate("query", "TEXT", true, "User query"),
                    PortTemplate("context", "CHUNKS", false, "Context chunks")
                ),
                outputPorts = listOf(
                    PortTemplate("prompt", "TEXT", true, "Built prompt")
                ),
                kotlinCode = generatePromptBuilderCode()
            ),
            
            // Logic Nodes
            NodeTemplate(
                id = "if-then",
                name = "If/Then",
                category = "logic",
                description = "Conditional logic for pipeline branching",
                className = "IfThenNode",
                configTemplate = """{ "condition": "contains", "value": "", "caseSensitive": false }""",
                inputPorts = listOf(
                    PortTemplate("input", "TEXT", true, "Input data to evaluate")
                ),
                outputPorts = listOf(
                    PortTemplate("true", "TEXT", false, "Output if condition is true"),
                    PortTemplate("false", "TEXT", false, "Output if condition is false")
                ),
                kotlinCode = generateIfThenCode()
            ),
            
            NodeTemplate(
                id = "filter",
                name = "Filter",
                category = "logic",
                description = "Filters data based on criteria",
                className = "FilterNode",
                configTemplate = """{ "filterType": "include", "criteria": "length", "threshold": 100 }""",
                inputPorts = listOf(
                    PortTemplate("input", "CHUNKS", true, "Input chunks to filter")
                ),
                outputPorts = listOf(
                    PortTemplate("filtered", "CHUNKS", true, "Filtered chunks")
                ),
                kotlinCode = generateFilterCode()
            ),
            
            NodeTemplate(
                id = "merge",
                name = "Merge",
                category = "logic",
                description = "Combines multiple data streams",
                className = "MergeNode",
                configTemplate = """{ "mergeType": "concatenate", "separator": "\n", "removeDuplicates": true }""",
                inputPorts = listOf(
                    PortTemplate("input1", "TEXT", true, "First input"),
                    PortTemplate("input2", "TEXT", false, "Second input"),
                    PortTemplate("input3", "TEXT", false, "Third input")
                ),
                outputPorts = listOf(
                    PortTemplate("merged", "TEXT", true, "Merged output")
                ),
                kotlinCode = generateMergeCode()
            ),
            
            // Output Nodes
            NodeTemplate(
                id = "text-output",
                name = "Text Output",
                category = "output",
                description = "Formats and outputs text results",
                className = "TextOutputNode",
                configTemplate = """{ "format": "plain", "includeMetadata": true, "timestampFormat": "yyyy-MM-dd HH:mm:ss" }""",
                inputPorts = listOf(
                    PortTemplate("input", "TEXT", true, "Text to format and output")
                ),
                outputPorts = emptyList(),
                kotlinCode = generateTextOutputCode()
            ),
            
            NodeTemplate(
                id = "json-output",
                name = "JSON Output",
                category = "output",
                description = "Formats output as structured JSON",
                className = "JsonOutputNode",
                configTemplate = """{ "prettyPrint": true, "includeMetadata": true, "wrapInArray": false }""",
                inputPorts = listOf(
                    PortTemplate("input", "TEXT", true, "Text to format as JSON"),
                    PortTemplate("query", "TEXT", false, "Original query for context")
                ),
                outputPorts = emptyList(),
                kotlinCode = generateJsonOutputCode()
            )
        )
    }
    
    /**
     * Gets a template by ID
     */
    fun getTemplate(id: String): NodeTemplate? {
        return getAllTemplates().find { it.id == id }
    }
    
    /**
     * Gets templates by category
     */
    fun getTemplatesByCategory(category: String): List<NodeTemplate> {
        return getAllTemplates().filter { it.category == category }
    }
    
    /**
     * Factory methods for creating node instances
     */
    object NodeFactory {
        
        fun createPdfInputNode(context: Context, ragPipeline: RagPipeline): PdfInputNode {
            return PdfInputNode(ragPipeline, context)
        }
        
        fun createTextInputNode(ragPipeline: RagPipeline): TextInputNode {
            return TextInputNode(ragPipeline)
        }
        
        fun createPdfTextExtractorNode(context: Context): PdfTextExtractorNode {
            return PdfTextExtractorNode(context)
        }
        
        fun createTextChunkerNode(): TextChunkerNode {
            return TextChunkerNode()
        }
        
        fun createEmbeddingGeneratorNode(ragPipeline: RagPipeline): EmbeddingGeneratorNode {
            return EmbeddingGeneratorNode(ragPipeline)
        }
        
        fun createVectorStoreNode(ragPipeline: RagPipeline): VectorStoreNode {
            return VectorStoreNode(ragPipeline)
        }
        
        fun createSimilaritySearchNode(ragPipeline: RagPipeline): SimilaritySearchNode {
            return SimilaritySearchNode(ragPipeline)
        }
        
        fun createGemmaLlmNode(ragPipeline: RagPipeline): GemmaLlmNode {
            return GemmaLlmNode(ragPipeline)
        }
        
        fun createPromptBuilderNode(): PromptBuilderNode {
            return PromptBuilderNode()
        }
        
        fun createIfThenNode(): IfThenNode {
            return IfThenNode()
        }
        
        fun createFilterNode(): FilterNode {
            return FilterNode()
        }
        
        fun createMergeNode(): MergeNode {
            return MergeNode()
        }
        
        fun createTextOutputNode(): TextOutputNode {
            return TextOutputNode()
        }
        
        fun createJsonOutputNode(): JsonOutputNode {
            return JsonOutputNode()
        }
    }
    
    // Code generation templates
    private fun generatePdfInputCode(): String = """
        val pdfInputNode = PdfInputNode(ragPipeline, context)
        val result = pdfInputNode.execute(pdfUri)
        if (result.success) {
            Log.d("Pipeline", "PDF loaded: ${'$'}{result.message}")
        }
    """.trimIndent()
    
    private fun generateTextInputCode(): String = """
        val textInputNode = TextInputNode(ragPipeline)
        val result = textInputNode.execute(inputText)
        if (result.success) {
            Log.d("Pipeline", "Text added: ${'$'}{result.message}")
        }
    """.trimIndent()
    
    private fun generatePdfTextExtractorCode(): String = """
        val pdfExtractorNode = PdfTextExtractorNode(context)
        val result = pdfExtractorNode.execute(pdfUri)
        if (result.success) {
            val extractedText = result.extractedText
            Log.d("Pipeline", "Extracted ${'$'}{result.characterCount} characters")
        }
    """.trimIndent()
    
    private fun generateTextChunkerCode(): String = """
        val textChunkerNode = TextChunkerNode()
        val result = textChunkerNode.execute(inputText)
        if (result.success) {
            val chunks = result.chunks
            Log.d("Pipeline", "Created ${'$'}{result.chunkCount} chunks")
        }
    """.trimIndent()
    
    private fun generateEmbeddingGeneratorCode(): String = """
        val embeddingNode = EmbeddingGeneratorNode(ragPipeline)
        val result = embeddingNode.execute(textChunks)
        if (result.success) {
            Log.d("Pipeline", "Generated embeddings for ${'$'}{result.embeddingsGenerated} chunks")
        }
    """.trimIndent()
    
    private fun generateVectorStoreCode(): String = """
        val vectorStoreNode = VectorStoreNode(ragPipeline)
        val result = vectorStoreNode.getStoreInfo()
        if (result.success) {
            Log.d("Pipeline", "Vector store has ${'$'}{result.totalVectors} vectors")
        }
    """.trimIndent()
    
    private fun generateSimilaritySearchCode(): String = """
        val similaritySearchNode = SimilaritySearchNode(ragPipeline)
        val result = similaritySearchNode.execute(query)
        if (result.success) {
            val retrievedChunks = result.retrievedChunks
            Log.d("Pipeline", "Retrieved ${'$'}{result.retrievalCount} chunks")
        }
    """.trimIndent()
    
    private fun generateGemmaLlmCode(): String = """
        val gemmaLlmNode = GemmaLlmNode(ragPipeline)
        val result = gemmaLlmNode.executeWithRag(query)
        if (result.success) {
            val response = result.generatedText
            Log.d("Pipeline", "Generated response: ${'$'}{response.take(100)}...")
        }
    """.trimIndent()
    
    private fun generatePromptBuilderCode(): String = """
        val promptBuilderNode = PromptBuilderNode()
        val result = promptBuilderNode.buildRagPrompt(query, context)
        if (result.success) {
            val builtPrompt = result.builtPrompt
            Log.d("Pipeline", "Built prompt with ${'$'}{result.templateUsed} template")
        }
    """.trimIndent()
    
    private fun generateIfThenCode(): String = """
        val ifThenNode = IfThenNode()
        val result = ifThenNode.execute(inputData)
        if (result.success) {
            val conditionMet = result.conditionMet
            val output = if (conditionMet) result.outputData else ""
            Log.d("Pipeline", "Condition evaluated to: ${'$'}conditionMet")
        }
    """.trimIndent()
    
    private fun generateFilterCode(): String = """
        val filterNode = FilterNode()
        val result = filterNode.execute(inputChunks)
        if (result.success) {
            val filteredChunks = result.filteredData
            Log.d("Pipeline", "Filtered ${'$'}{result.originalCount} to ${'$'}{result.filteredCount} chunks")
        }
    """.trimIndent()
    
    private fun generateMergeCode(): String = """
        val mergeNode = MergeNode()
        val result = mergeNode.execute(input1, input2, input3)
        if (result.success) {
            val mergedData = result.mergedData
            Log.d("Pipeline", "Merged ${'$'}{result.inputCount} inputs")
        }
    """.trimIndent()
    
    private fun generateTextOutputCode(): String = """
        val textOutputNode = TextOutputNode()
        val result = textOutputNode.execute(inputText, "Pipeline Result")
        if (result.success) {
            val formattedOutput = result.formattedOutput
            Log.d("Pipeline", "Formatted output: ${'$'}{result.outputLength} characters")
        }
    """.trimIndent()
    
    private fun generateJsonOutputCode(): String = """
        val jsonOutputNode = JsonOutputNode()
        val result = jsonOutputNode.execute(inputText, query)
        if (result.success) {
            val jsonOutput = result.jsonOutput
            Log.d("Pipeline", "Generated JSON output")
        }
    """.trimIndent()
}
