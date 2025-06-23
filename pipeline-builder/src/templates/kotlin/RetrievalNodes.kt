package com.google.ai.edge.gallery.pipeline.nodes

import android.util.Log
import com.google.ai.edge.gallery.rag.RagPipeline
import com.google.ai.edge.localagents.rag.retrieval.RetrievalConfig
import com.google.ai.edge.localagents.rag.retrieval.RetrievalRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Kotlin templates for Retrieval nodes in the visual pipeline builder.
 * These handle vector storage, similarity search, and retrieval operations.
 */

/**
 * Vector Store Node - Manages the vector database for embeddings
 * Visual Node Config: { dimensions: 768, database: "sqlite", indexType: "flat" }
 */
class VectorStoreNode(
    private val ragPipeline: RagPipeline,
    private val config: VectorStoreConfig = VectorStoreConfig()
) {
    data class VectorStoreConfig(
        val dimensions: Int = 768,
        val database: String = "sqlite",
        val indexType: String = "flat"
    )
    
    data class VectorStoreResult(
        val success: Boolean,
        val message: String,
        val totalVectors: Int = 0,
        val storageInfo: String = ""
    )
    
    /**
     * Gets information about the current vector store
     */
    suspend fun getStoreInfo(): VectorStoreResult = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Vector Store Node getting store information")
            
            val knowledgeBaseSize = ragPipeline.getKnowledgeBaseSize()
            val documentsInfo = ragPipeline.getLoadedDocumentsInfo()
            
            Log.d(TAG, "Vector Store info retrieved: $knowledgeBaseSize vectors")
            
            VectorStoreResult(
                success = true,
                message = "Vector store is operational with $knowledgeBaseSize vectors",
                totalVectors = knowledgeBaseSize,
                storageInfo = documentsInfo
            )
            
        } catch (e: Exception) {
            Log.e(TAG, "Vector Store Node exception", e)
            VectorStoreResult(
                success = false,
                message = "Exception in Vector Store: ${e.message}"
            )
        }
    }
    
    /**
     * Validates vector store health
     */
    suspend fun validateStore(): VectorStoreResult = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Vector Store Node validating store health")
            
            val knowledgeBaseSize = ragPipeline.getKnowledgeBaseSize()
            
            val isHealthy = knowledgeBaseSize > 0
            val message = if (isHealthy) {
                "Vector store is healthy with $knowledgeBaseSize vectors"
            } else {
                "Vector store is empty - no vectors found"
            }
            
            Log.d(TAG, "Vector Store validation: $message")
            
            VectorStoreResult(
                success = isHealthy,
                message = message,
                totalVectors = knowledgeBaseSize
            )
            
        } catch (e: Exception) {
            Log.e(TAG, "Vector Store Node validation exception", e)
            VectorStoreResult(
                success = false,
                message = "Exception during Vector Store validation: ${e.message}"
            )
        }
    }
    
    companion object {
        private const val TAG = "VectorStoreNode"
    }
}

/**
 * Similarity Search Node - Performs semantic similarity search in vector space
 * Visual Node Config: { topK: 5, threshold: 0.0, taskType: "QUESTION_ANSWERING" }
 */
class SimilaritySearchNode(
    private val ragPipeline: RagPipeline,
    private val config: SimilaritySearchConfig = SimilaritySearchConfig()
) {
    data class SimilaritySearchConfig(
        val topK: Int = 5,
        val threshold: Float = 0.0f,
        val taskType: String = "QUESTION_ANSWERING"
    )
    
    data class SimilaritySearchResult(
        val success: Boolean,
        val message: String,
        val retrievedChunks: List<String> = emptyList(),
        val retrievalCount: Int = 0,
        val query: String = ""
    )
    
    /**
     * Executes similarity search for the given query
     */
    suspend fun execute(query: String): SimilaritySearchResult = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Similarity Search Node executing with query: ${query.take(100)}...")
            
            if (query.isBlank()) {
                return@withContext SimilaritySearchResult(
                    success = false,
                    message = "Query cannot be empty"
                )
            }
            
            // Use the RAG pipeline's test retrieval method
            val retrievalResult = ragPipeline.testRetrieval(query, config.topK)
            
            return@withContext if (retrievalResult.isSuccess) {
                val retrievedChunks = retrievalResult.getOrNull() ?: emptyList()
                
                Log.d(TAG, "Similarity Search completed: ${retrievedChunks.size} chunks retrieved")
                
                SimilaritySearchResult(
                    success = true,
                    message = "Successfully retrieved ${retrievedChunks.size} similar chunks for query",
                    retrievedChunks = retrievedChunks,
                    retrievalCount = retrievedChunks.size,
                    query = query
                )
            } else {
                val error = retrievalResult.exceptionOrNull()?.message ?: "Unknown retrieval error"
                Log.e(TAG, "Similarity Search failed: $error")
                SimilaritySearchResult(
                    success = false,
                    message = "Failed to perform similarity search: $error",
                    query = query
                )
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Similarity Search Node exception", e)
            SimilaritySearchResult(
                success = false,
                message = "Exception in Similarity Search: ${e.message}",
                query = query
            )
        }
    }
    
    /**
     * Creates retrieval configuration based on node settings
     */
    private fun createRetrievalConfig(): RetrievalConfig {
        val taskType = when (config.taskType.uppercase()) {
            "QUESTION_ANSWERING" -> RetrievalConfig.TaskType.QUESTION_ANSWERING
            "FACT_VERIFICATION" -> RetrievalConfig.TaskType.FACT_VERIFICATION
            "SUMMARIZATION" -> RetrievalConfig.TaskType.SUMMARIZATION
            else -> RetrievalConfig.TaskType.QUESTION_ANSWERING
        }
        
        return RetrievalConfig.create(
            config.topK,
            config.threshold,
            taskType
        )
    }
    
    /**
     * Executes advanced similarity search with custom configuration
     */
    suspend fun executeAdvanced(
        query: String,
        customTopK: Int? = null,
        customThreshold: Float? = null
    ): SimilaritySearchResult = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Advanced Similarity Search executing with custom parameters")
            
            val effectiveTopK = customTopK ?: config.topK
            val effectiveThreshold = customThreshold ?: config.threshold
            
            // Create custom retrieval configuration
            val customConfig = RetrievalConfig.create(
                effectiveTopK,
                effectiveThreshold,
                when (config.taskType.uppercase()) {
                    "QUESTION_ANSWERING" -> RetrievalConfig.TaskType.QUESTION_ANSWERING
                    "FACT_VERIFICATION" -> RetrievalConfig.TaskType.FACT_VERIFICATION
                    "SUMMARIZATION" -> RetrievalConfig.TaskType.SUMMARIZATION
                    else -> RetrievalConfig.TaskType.QUESTION_ANSWERING
                }
            )
            
            // Use the test retrieval with custom parameters
            val retrievalResult = ragPipeline.testRetrieval(query, effectiveTopK)
            
            return@withContext if (retrievalResult.isSuccess) {
                val retrievedChunks = retrievalResult.getOrNull() ?: emptyList()
                
                Log.d(TAG, "Advanced Similarity Search completed: ${retrievedChunks.size} chunks retrieved")
                
                SimilaritySearchResult(
                    success = true,
                    message = "Advanced search retrieved ${retrievedChunks.size} chunks (topK=$effectiveTopK, threshold=$effectiveThreshold)",
                    retrievedChunks = retrievedChunks,
                    retrievalCount = retrievedChunks.size,
                    query = query
                )
            } else {
                val error = retrievalResult.exceptionOrNull()?.message ?: "Unknown retrieval error"
                Log.e(TAG, "Advanced Similarity Search failed: $error")
                SimilaritySearchResult(
                    success = false,
                    message = "Failed to perform advanced similarity search: $error",
                    query = query
                )
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Advanced Similarity Search Node exception", e)
            SimilaritySearchResult(
                success = false,
                message = "Exception in Advanced Similarity Search: ${e.message}",
                query = query
            )
        }
    }
    
    companion object {
        private const val TAG = "SimilaritySearchNode"
    }
} 