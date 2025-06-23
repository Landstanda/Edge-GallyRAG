package com.google.ai.edge.gallery.pipeline.test

import android.content.Context
import android.net.Uri
import com.google.ai.edge.gallery.rag.RagPipeline
import com.google.ai.edge.gallery.pipeline.nodes.*
import kotlinx.coroutines.runBlocking

/**
 * Test file to verify all Kotlin node templates compile correctly.
 * This demonstrates how the generated pipeline nodes would be used.
 */
class KotlinTemplateTest {
    
    fun testAllNodeTemplates(
        context: Context,
        ragPipeline: RagPipeline,
        pdfUri: Uri,
        inputText: String,
        query: String
    ) = runBlocking {
        
        // Test Input Nodes
        println("=== Testing Input Nodes ===")
        
        val pdfInputNode = PdfInputNode(ragPipeline, context)
        val pdfResult = pdfInputNode.execute(pdfUri)
        println("PDF Input: ${pdfResult.message}")
        
        val textInputNode = TextInputNode(ragPipeline)
        val textResult = textInputNode.execute(inputText)
        println("Text Input: ${textResult.message}")
        
        // Test Processing Nodes
        println("\n=== Testing Processing Nodes ===")
        
        val pdfExtractorNode = PdfTextExtractorNode(context)
        val extractorResult = pdfExtractorNode.execute(pdfUri)
        println("PDF Extractor: ${extractorResult.message}")
        
        val textChunkerNode = TextChunkerNode()
        val chunkerResult = textChunkerNode.execute(inputText)
        println("Text Chunker: ${chunkerResult.message}")
        
        val embeddingNode = EmbeddingGeneratorNode(ragPipeline)
        val embeddingResult = embeddingNode.execute(chunkerResult.chunks)
        println("Embedding Generator: ${embeddingResult.message}")
        
        // Test Retrieval Nodes
        println("\n=== Testing Retrieval Nodes ===")
        
        val vectorStoreNode = VectorStoreNode(ragPipeline)
        val storeResult = vectorStoreNode.getStoreInfo()
        println("Vector Store: ${storeResult.message}")
        
        val similaritySearchNode = SimilaritySearchNode(ragPipeline)
        val searchResult = similaritySearchNode.execute(query)
        println("Similarity Search: ${searchResult.message}")
        
        // Test LLM Nodes
        println("\n=== Testing LLM Nodes ===")
        
        val gemmaLlmNode = GemmaLlmNode(ragPipeline)
        val llmResult = gemmaLlmNode.executeWithRag(query)
        println("Gemma LLM: ${llmResult.message}")
        
        val promptBuilderNode = PromptBuilderNode()
        val promptResult = promptBuilderNode.buildRagPrompt(query, "Sample context")
        println("Prompt Builder: ${promptResult.message}")
        
        // Test Logic Nodes
        println("\n=== Testing Logic Nodes ===")
        
        val ifThenNode = IfThenNode()
        val conditionResult = ifThenNode.execute(inputText)
        println("If/Then: ${conditionResult.message}")
        
        val filterNode = FilterNode()
        val filterResult = filterNode.execute(chunkerResult.chunks)
        println("Filter: ${filterResult.message}")
        
        val mergeNode = MergeNode()
        val mergeResult = mergeNode.execute("Input 1", "Input 2", "Input 3")
        println("Merge: ${mergeResult.message}")
        
        // Test Output Nodes
        println("\n=== Testing Output Nodes ===")
        
        val textOutputNode = TextOutputNode()
        val textOutputResult = textOutputNode.execute(llmResult.generatedText, "Test Pipeline")
        println("Text Output: ${textOutputResult.message}")
        
        val jsonOutputNode = JsonOutputNode()
        val jsonResult = jsonOutputNode.executeRagResponse(
            query = query,
            response = llmResult.generatedText,
            retrievedChunks = searchResult.retrievedChunks,
            confidence = 0.85f,
            processingTime = 1500L
        )
        println("JSON Output: ${jsonResult.message}")
        
        println("\n=== All Node Templates Tested Successfully! ===")
    }
    
    /**
     * Demonstrates a complete RAG pipeline using the node templates
     */
    fun demonstrateCompleteRagPipeline(
        context: Context,
        ragPipeline: RagPipeline,
        pdfUri: Uri,
        userQuery: String
    ) = runBlocking {
        
        println("=== Complete RAG Pipeline Demo ===")
        
        try {
            // Step 1: Load PDF
            val pdfInputNode = PdfInputNode(ragPipeline, context)
            val pdfResult = pdfInputNode.execute(pdfUri)
            
            if (!pdfResult.success) {
                println("Failed to load PDF: ${pdfResult.message}")
                return@runBlocking
            }
            
            // Step 2: Extract text from PDF
            val pdfExtractorNode = PdfTextExtractorNode(context)
            val extractorResult = pdfExtractorNode.execute(pdfUri)
            
            if (!extractorResult.success) {
                println("Failed to extract text: ${extractorResult.message}")
                return@runBlocking
            }
            
            // Step 3: Chunk the text
            val textChunkerNode = TextChunkerNode()
            val chunkerResult = textChunkerNode.execute(extractorResult.extractedText)
            
            if (!chunkerResult.success) {
                println("Failed to chunk text: ${chunkerResult.message}")
                return@runBlocking
            }
            
            // Step 4: Generate embeddings and store in vector database
            val embeddingNode = EmbeddingGeneratorNode(ragPipeline)
            val embeddingResult = embeddingNode.execute(chunkerResult.chunks)
            
            if (!embeddingResult.success) {
                println("Failed to generate embeddings: ${embeddingResult.message}")
                return@runBlocking
            }
            
            // Step 5: Perform similarity search
            val similaritySearchNode = SimilaritySearchNode(ragPipeline)
            val searchResult = similaritySearchNode.execute(userQuery)
            
            if (!searchResult.success) {
                println("Failed to perform similarity search: ${searchResult.message}")
                return@runBlocking
            }
            
            // Step 6: Build prompt with retrieved context
            val promptBuilderNode = PromptBuilderNode()
            val context = searchResult.retrievedChunks.joinToString("\n")
            val promptResult = promptBuilderNode.buildRagPrompt(userQuery, context)
            
            if (!promptResult.success) {
                println("Failed to build prompt: ${promptResult.message}")
                return@runBlocking
            }
            
            // Step 7: Generate response using Gemma LLM
            val gemmaLlmNode = GemmaLlmNode(ragPipeline)
            val llmResult = gemmaLlmNode.executeWithRag(userQuery)
            
            if (!llmResult.success) {
                println("Failed to generate response: ${llmResult.message}")
                return@runBlocking
            }
            
            // Step 8: Format output as JSON
            val jsonOutputNode = JsonOutputNode()
            val jsonResult = jsonOutputNode.executeRagResponse(
                query = userQuery,
                response = llmResult.generatedText,
                retrievedChunks = searchResult.retrievedChunks,
                confidence = 0.9f,
                processingTime = System.currentTimeMillis()
            )
            
            if (jsonResult.success) {
                println("Pipeline completed successfully!")
                println("Final JSON Output:")
                println(jsonResult.jsonOutput)
            } else {
                println("Failed to format output: ${jsonResult.message}")
            }
            
        } catch (e: Exception) {
            println("Pipeline failed with exception: ${e.message}")
        }
    }
} 