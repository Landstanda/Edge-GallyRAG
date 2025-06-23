package com.google.ai.edge.gallery.pipeline.nodes

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

/**
 * Kotlin templates for Output nodes in the visual pipeline builder.
 * These handle final data output, formatting, and result presentation.
 */

/**
 * Text Output Node - Formats and outputs text results
 * Visual Node Config: { format: "plain", includeMetadata: true, timestampFormat: "yyyy-MM-dd HH:mm:ss" }
 */
class TextOutputNode(
    private val config: TextOutputConfig = TextOutputConfig()
) {
    data class TextOutputConfig(
        val format: String = "plain",
        val includeMetadata: Boolean = true,
        val timestampFormat: String = "yyyy-MM-dd HH:mm:ss"
    )
    
    data class TextOutputResult(
        val success: Boolean,
        val message: String,
        val formattedOutput: String = "",
        val originalInput: String = "",
        val outputLength: Int = 0,
        val timestamp: String = ""
    )
    
    /**
     * Executes text output formatting
     */
    suspend fun execute(inputText: String, title: String = "RAG Pipeline Output"): TextOutputResult = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Text Output Node executing with ${inputText.length} characters")
            
            if (inputText.isBlank()) {
                return@withContext TextOutputResult(
                    success = false,
                    message = "Input text cannot be empty"
                )
            }
            
            val timestamp = SimpleDateFormat(config.timestampFormat, Locale.getDefault()).format(Date())
            
            val formattedOutput = when (config.format.lowercase()) {
                "plain" -> formatPlainText(inputText, title, timestamp)
                "markdown" -> formatMarkdown(inputText, title, timestamp)
                "html" -> formatHtml(inputText, title, timestamp)
                "structured" -> formatStructured(inputText, title, timestamp)
                else -> formatPlainText(inputText, title, timestamp)
            }
            
            Log.d(TAG, "Text Output completed: ${formattedOutput.length} characters formatted")
            
            TextOutputResult(
                success = true,
                message = "Successfully formatted output using ${config.format} format",
                formattedOutput = formattedOutput,
                originalInput = inputText,
                outputLength = formattedOutput.length,
                timestamp = timestamp
            )
            
        } catch (e: Exception) {
            Log.e(TAG, "Text Output Node exception", e)
            TextOutputResult(
                success = false,
                message = "Exception in Text Output: ${e.message}",
                originalInput = inputText
            )
        }
    }
    
    /**
     * Formats plain text output
     */
    private fun formatPlainText(text: String, title: String, timestamp: String): String {
        return if (config.includeMetadata) {
            """
            $title
            Generated: $timestamp
            
            $text
            """.trimIndent()
        } else {
            text
        }
    }
    
    /**
     * Formats markdown output
     */
    private fun formatMarkdown(text: String, title: String, timestamp: String): String {
        return if (config.includeMetadata) {
            """
            # $title
            
            **Generated:** $timestamp
            
            ## Response
            
            $text
            """.trimIndent()
        } else {
            "## Response\n\n$text"
        }
    }
    
    /**
     * Formats HTML output
     */
    private fun formatHtml(text: String, title: String, timestamp: String): String {
        return if (config.includeMetadata) {
            """
            <!DOCTYPE html>
            <html>
            <head>
                <title>$title</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .metadata { color: #666; font-size: 0.9em; }
                    .content { margin-top: 20px; line-height: 1.6; }
                </style>
            </head>
            <body>
                <h1>$title</h1>
                <div class="metadata">Generated: $timestamp</div>
                <div class="content">
                    <p>${text.replace("\n", "<br>")}</p>
                </div>
            </body>
            </html>
            """.trimIndent()
        } else {
            """
            <div class="content">
                <p>${text.replace("\n", "<br>")}</p>
            </div>
            """.trimIndent()
        }
    }
    
    /**
     * Formats structured output
     */
    private fun formatStructured(text: String, title: String, timestamp: String): String {
        return if (config.includeMetadata) {
            """
            ==========================================
            $title
            ==========================================
            Generated: $timestamp
            Length: ${text.length} characters
            Lines: ${text.lines().size}
            ==========================================
            
            $text
            
            ==========================================
            End of Output
            ==========================================
            """.trimIndent()
        } else {
            """
            ==========================================
            $text
            ==========================================
            """.trimIndent()
        }
    }
    
    companion object {
        private const val TAG = "TextOutputNode"
    }
}

/**
 * JSON Output Node - Formats output as structured JSON
 * Visual Node Config: { prettyPrint: true, includeMetadata: true, wrapInArray: false }
 */
class JsonOutputNode(
    private val config: JsonOutputConfig = JsonOutputConfig()
) {
    data class JsonOutputConfig(
        val prettyPrint: Boolean = true,
        val includeMetadata: Boolean = true,
        val wrapInArray: Boolean = false
    )
    
    data class JsonOutputResult(
        val success: Boolean,
        val message: String,
        val jsonOutput: String = "",
        val originalInput: String = "",
        val jsonObject: JSONObject? = null,
        val isValidJson: Boolean = false
    )
    
    /**
     * Executes JSON output formatting
     */
    suspend fun execute(
        inputText: String,
        query: String = "",
        metadata: Map<String, Any> = emptyMap()
    ): JsonOutputResult = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "JSON Output Node executing")
            
            if (inputText.isBlank()) {
                return@withContext JsonOutputResult(
                    success = false,
                    message = "Input text cannot be empty"
                )
            }
            
            val jsonObject = JSONObject()
            
            // Add main content
            jsonObject.put("response", inputText)
            
            if (query.isNotBlank()) {
                jsonObject.put("query", query)
            }
            
            // Add metadata if enabled
            if (config.includeMetadata) {
                val metadataObj = JSONObject()
                metadataObj.put("timestamp", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date()))
                metadataObj.put("response_length", inputText.length)
                metadataObj.put("response_lines", inputText.lines().size)
                metadataObj.put("format", "json")
                
                // Add custom metadata
                for ((key, value) in metadata) {
                    metadataObj.put(key, value)
                }
                
                jsonObject.put("metadata", metadataObj)
            }
            
            val finalJson = if (config.wrapInArray) {
                val jsonArray = JSONArray()
                jsonArray.put(jsonObject)
                if (config.prettyPrint) jsonArray.toString(2) else jsonArray.toString()
            } else {
                if (config.prettyPrint) jsonObject.toString(2) else jsonObject.toString()
            }
            
            Log.d(TAG, "JSON Output completed: ${finalJson.length} characters")
            
            JsonOutputResult(
                success = true,
                message = "Successfully formatted output as JSON",
                jsonOutput = finalJson,
                originalInput = inputText,
                jsonObject = jsonObject,
                isValidJson = true
            )
            
        } catch (e: Exception) {
            Log.e(TAG, "JSON Output Node exception", e)
            JsonOutputResult(
                success = false,
                message = "Exception in JSON Output: ${e.message}",
                originalInput = inputText
            )
        }
    }
    
    /**
     * Executes JSON output for multiple chunks
     */
    suspend fun executeWithChunks(
        chunks: List<String>,
        query: String = "",
        metadata: Map<String, Any> = emptyMap()
    ): JsonOutputResult = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "JSON Output Node executing with ${chunks.size} chunks")
            
            if (chunks.isEmpty()) {
                return@withContext JsonOutputResult(
                    success = false,
                    message = "Input chunks cannot be empty"
                )
            }
            
            val jsonObject = JSONObject()
            
            // Add chunks as array
            val chunksArray = JSONArray()
            chunks.forEach { chunk ->
                if (chunk.isNotBlank()) {
                    chunksArray.put(chunk)
                }
            }
            jsonObject.put("chunks", chunksArray)
            jsonObject.put("response", chunks.joinToString("\n"))
            
            if (query.isNotBlank()) {
                jsonObject.put("query", query)
            }
            
            // Add metadata if enabled
            if (config.includeMetadata) {
                val metadataObj = JSONObject()
                metadataObj.put("timestamp", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date()))
                metadataObj.put("chunk_count", chunks.size)
                metadataObj.put("total_length", chunks.sumOf { it.length })
                metadataObj.put("format", "json_chunks")
                
                // Add custom metadata
                for ((key, value) in metadata) {
                    metadataObj.put(key, value)
                }
                
                jsonObject.put("metadata", metadataObj)
            }
            
            val finalJson = if (config.wrapInArray) {
                val jsonArray = JSONArray()
                jsonArray.put(jsonObject)
                if (config.prettyPrint) jsonArray.toString(2) else jsonArray.toString()
            } else {
                if (config.prettyPrint) jsonObject.toString(2) else jsonObject.toString()
            }
            
            Log.d(TAG, "JSON Output with chunks completed: ${finalJson.length} characters")
            
            JsonOutputResult(
                success = true,
                message = "Successfully formatted ${chunks.size} chunks as JSON",
                jsonOutput = finalJson,
                originalInput = chunks.joinToString("\n"),
                jsonObject = jsonObject,
                isValidJson = true
            )
            
        } catch (e: Exception) {
            Log.e(TAG, "JSON Output Node chunks exception", e)
            JsonOutputResult(
                success = false,
                message = "Exception in JSON Output chunks: ${e.message}",
                originalInput = chunks.joinToString("\n")
            )
        }
    }
    
    /**
     * Creates a structured RAG response JSON
     */
    suspend fun executeRagResponse(
        query: String,
        response: String,
        retrievedChunks: List<String> = emptyList(),
        confidence: Float = 0.0f,
        processingTime: Long = 0L
    ): JsonOutputResult = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "JSON Output Node creating RAG response")
            
            val jsonObject = JSONObject()
            
            // Main RAG response structure
            jsonObject.put("query", query)
            jsonObject.put("response", response)
            jsonObject.put("confidence", confidence)
            
            // Add retrieved chunks if available
            if (retrievedChunks.isNotEmpty()) {
                val chunksArray = JSONArray()
                retrievedChunks.forEach { chunk ->
                    chunksArray.put(chunk)
                }
                jsonObject.put("retrieved_chunks", chunksArray)
            }
            
            // Add metadata if enabled
            if (config.includeMetadata) {
                val metadataObj = JSONObject()
                metadataObj.put("timestamp", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date()))
                metadataObj.put("processing_time_ms", processingTime)
                metadataObj.put("chunks_retrieved", retrievedChunks.size)
                metadataObj.put("response_length", response.length)
                metadataObj.put("query_length", query.length)
                metadataObj.put("format", "rag_response")
                
                jsonObject.put("metadata", metadataObj)
            }
            
            val finalJson = if (config.prettyPrint) jsonObject.toString(2) else jsonObject.toString()
            
            Log.d(TAG, "RAG JSON Output completed: ${finalJson.length} characters")
            
            JsonOutputResult(
                success = true,
                message = "Successfully formatted RAG response as JSON",
                jsonOutput = finalJson,
                originalInput = response,
                jsonObject = jsonObject,
                isValidJson = true
            )
            
        } catch (e: Exception) {
            Log.e(TAG, "JSON Output RAG response exception", e)
            JsonOutputResult(
                success = false,
                message = "Exception in JSON Output RAG response: ${e.message}",
                originalInput = response
            )
        }
    }
    
    companion object {
        private const val TAG = "JsonOutputNode"
    }
} 