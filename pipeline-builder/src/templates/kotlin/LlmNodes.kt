package com.google.ai.edge.gallery.pipeline.nodes

import android.util.Log
import com.google.ai.edge.gallery.rag.RagPipeline
import com.google.ai.edge.localagents.rag.chains.ChainRequest
import com.google.ai.edge.localagents.rag.prompt.PromptBuilder
import com.google.ai.edge.localagents.rag.retrieval.RetrievalConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Kotlin templates for LLM nodes in the visual pipeline builder.
 * These handle language model operations, prompt building, and text generation.
 */

/**
 * Gemma LLM Node - On-device language model for text generation
 * Visual Node Config: { model: "gemma3-1b-it", temperature: 0.8, maxTokens: 2048, topP: 0.95 }
 */
class GemmaLlmNode(
    private val ragPipeline: RagPipeline,
    private val config: GemmaLlmConfig = GemmaLlmConfig()
) {
    data class GemmaLlmConfig(
        val model: String = "gemma3-1b-it",
        val temperature: Float = 0.8f,
        val maxTokens: Int = 2048,
        val topP: Float = 0.95f
    )
    
    data class GemmaLlmResult(
        val success: Boolean,
        val message: String,
        val generatedText: String = "",
        val inputQuery: String = "",
        val contextUsed: Boolean = false
    )
    
    /**
     * Executes the Gemma LLM with RAG (Retrieval-Augmented Generation)
     */
    suspend fun executeWithRag(query: String, topK: Int = 5): GemmaLlmResult = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Gemma LLM Node executing RAG query: ${query.take(100)}...")
            
            if (query.isBlank()) {
                return@withContext GemmaLlmResult(
                    success = false,
                    message = "Query cannot be empty"
                )
            }
            
            // Create retrieval configuration
            val retrievalConfig = RetrievalConfig.create(
                topK,
                0.0f,
                RetrievalConfig.TaskType.QUESTION_ANSWERING
            )
            
            // Create chain request for RAG
            val chainRequest = ChainRequest.create(query, retrievalConfig)
            
            // Execute the full RAG chain (retrieval + inference)
            val chainResult = ragPipeline.retrievalAndInferenceChain.execute(chainRequest)
            
            return@withContext if (chainResult.isSuccess) {
                val generatedText = chainResult.getOrNull() ?: "No response generated"
                
                Log.d(TAG, "Gemma LLM RAG completed successfully: ${generatedText.take(100)}...")
                
                GemmaLlmResult(
                    success = true,
                    message = "Successfully generated RAG response using Gemma LLM",
                    generatedText = generatedText,
                    inputQuery = query,
                    contextUsed = true
                )
            } else {
                val error = chainResult.exceptionOrNull()?.message ?: "Unknown generation error"
                Log.e(TAG, "Gemma LLM RAG failed: $error")
                GemmaLlmResult(
                    success = false,
                    message = "Failed to generate RAG response: $error",
                    inputQuery = query
                )
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Gemma LLM Node RAG exception", e)
            GemmaLlmResult(
                success = false,
                message = "Exception in Gemma LLM RAG: ${e.message}",
                inputQuery = query
            )
        }
    }
    
    /**
     * Executes the Gemma LLM with provided context (manual RAG)
     */
    suspend fun executeWithContext(
        query: String,
        context: String
    ): GemmaLlmResult = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Gemma LLM Node executing with manual context")
            
            if (query.isBlank()) {
                return@withContext GemmaLlmResult(
                    success = false,
                    message = "Query cannot be empty"
                )
            }
            
            // Create a formatted prompt with context
            val formattedPrompt = buildPromptWithContext(query, context)
            
            // For manual context, we'd need direct LLM access
            // Since we're using the existing RagPipeline, we'll simulate this
            // by creating a temporary context and using the RAG chain
            
            Log.d(TAG, "Gemma LLM with context: using formatted prompt")
            
            // Use the RAG chain with the formatted prompt
            val retrievalConfig = RetrievalConfig.create(
                1, // Minimal retrieval since we have manual context
                0.0f,
                RetrievalConfig.TaskType.QUESTION_ANSWERING
            )
            
            val chainRequest = ChainRequest.create(formattedPrompt, retrievalConfig)
            val chainResult = ragPipeline.retrievalAndInferenceChain.execute(chainRequest)
            
            return@withContext if (chainResult.isSuccess) {
                val generatedText = chainResult.getOrNull() ?: "No response generated"
                
                Log.d(TAG, "Gemma LLM with context completed: ${generatedText.take(100)}...")
                
                GemmaLlmResult(
                    success = true,
                    message = "Successfully generated response with provided context",
                    generatedText = generatedText,
                    inputQuery = query,
                    contextUsed = true
                )
            } else {
                val error = chainResult.exceptionOrNull()?.message ?: "Unknown generation error"
                Log.e(TAG, "Gemma LLM with context failed: $error")
                GemmaLlmResult(
                    success = false,
                    message = "Failed to generate response with context: $error",
                    inputQuery = query
                )
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Gemma LLM Node with context exception", e)
            GemmaLlmResult(
                success = false,
                message = "Exception in Gemma LLM with context: ${e.message}",
                inputQuery = query
            )
        }
    }
    
    /**
     * Builds a formatted prompt with context
     */
    private fun buildPromptWithContext(query: String, context: String): String {
        return "You are a helpful assistant. Use the following information to answer the user's question. " +
                "If the answer is not in the context, say you don't know.\n\n" +
                "Context: $context\n\n" +
                "Question: $query"
    }
    
    companion object {
        private const val TAG = "GemmaLlmNode"
    }
}

/**
 * Prompt Builder Node - Constructs prompts for LLM processing
 * Visual Node Config: { template: "default", includeContext: true, systemPrompt: "" }
 */
class PromptBuilderNode(
    private val config: PromptBuilderConfig = PromptBuilderConfig()
) {
    data class PromptBuilderConfig(
        val template: String = "default",
        val includeContext: Boolean = true,
        val systemPrompt: String = ""
    )
    
    data class PromptBuilderResult(
        val success: Boolean,
        val message: String,
        val builtPrompt: String = "",
        val templateUsed: String = ""
    )
    
    /**
     * Builds a prompt using the default RAG template
     */
    suspend fun buildRagPrompt(
        query: String,
        context: String = ""
    ): PromptBuilderResult = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Prompt Builder Node building RAG prompt")
            
            if (query.isBlank()) {
                return@withContext PromptBuilderResult(
                    success = false,
                    message = "Query cannot be empty"
                )
            }
            
            val template = getPromptTemplate(config.template)
            val builtPrompt = when {
                config.includeContext && context.isNotBlank() -> {
                    String.format(template, context, query)
                }
                config.systemPrompt.isNotBlank() -> {
                    "${config.systemPrompt}\n\nQuestion: $query"
                }
                else -> {
                    "Question: $query"
                }
            }
            
            Log.d(TAG, "Prompt Builder completed: ${builtPrompt.take(100)}...")
            
            PromptBuilderResult(
                success = true,
                message = "Successfully built prompt using ${config.template} template",
                builtPrompt = builtPrompt,
                templateUsed = config.template
            )
            
        } catch (e: Exception) {
            Log.e(TAG, "Prompt Builder Node exception", e)
            PromptBuilderResult(
                success = false,
                message = "Exception in Prompt Builder: ${e.message}"
            )
        }
    }
    
    /**
     * Builds a custom prompt with provided template
     */
    suspend fun buildCustomPrompt(
        query: String,
        customTemplate: String,
        context: String = ""
    ): PromptBuilderResult = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Prompt Builder Node building custom prompt")
            
            if (query.isBlank()) {
                return@withContext PromptBuilderResult(
                    success = false,
                    message = "Query cannot be empty"
                )
            }
            
            if (customTemplate.isBlank()) {
                return@withContext PromptBuilderResult(
                    success = false,
                    message = "Custom template cannot be empty"
                )
            }
            
            val builtPrompt = if (context.isNotBlank() && customTemplate.contains("{0}") && customTemplate.contains("{1}")) {
                String.format(customTemplate, context, query)
            } else if (customTemplate.contains("{query}")) {
                customTemplate.replace("{query}", query)
            } else {
                "$customTemplate\n\nQuestion: $query"
            }
            
            Log.d(TAG, "Custom Prompt Builder completed: ${builtPrompt.take(100)}...")
            
            PromptBuilderResult(
                success = true,
                message = "Successfully built prompt using custom template",
                builtPrompt = builtPrompt,
                templateUsed = "custom"
            )
            
        } catch (e: Exception) {
            Log.e(TAG, "Custom Prompt Builder Node exception", e)
            PromptBuilderResult(
                success = false,
                message = "Exception in Custom Prompt Builder: ${e.message}"
            )
        }
    }
    
    /**
     * Gets the prompt template based on the template name
     */
    private fun getPromptTemplate(templateName: String): String {
        return when (templateName.lowercase()) {
            "default", "rag" -> {
                "You are a helpful assistant. Use the following information to answer the user's question. " +
                        "If the answer is not in the context, say you don't know.\n\n" +
                        "Context: %s\n\n" +
                        "Question: %s"
            }
            "chat" -> {
                "You are a helpful AI assistant. Please answer the following question:\n\n%s"
            }
            "summarization" -> {
                "Please provide a concise summary of the following information in relation to this question.\n\n" +
                        "Information: %s\n\n" +
                        "Question: %s"
            }
            "fact-checking" -> {
                "Based on the provided information, please verify the accuracy of the following statement. " +
                        "Provide a clear answer with supporting evidence.\n\n" +
                        "Information: %s\n\n" +
                        "Statement to verify: %s"
            }
            else -> {
                "Context: %s\n\nQuestion: %s"
            }
        }
    }
    
    companion object {
        private const val TAG = "PromptBuilderNode"
    }
} 