package com.google.ai.edge.gallery.pipeline.nodes

import android.content.Context
import android.net.Uri
import android.util.Log
import com.google.ai.edge.gallery.rag.RagPipeline
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Kotlin templates for Input nodes in the visual pipeline builder.
 * These integrate seamlessly with the existing RagPipeline architecture.
 */

/**
 * PDF Input Node - Loads PDF documents from device storage
 * Visual Node Config: { allowMultiple: false, fileFilter: "*.pdf", maxSize: "10MB" }
 */
class PdfInputNode(
    private val ragPipeline: RagPipeline,
    private val context: Context,
    private val config: PdfInputConfig = PdfInputConfig()
) {
    data class PdfInputConfig(
        val allowMultiple: Boolean = false,
        val fileFilter: String = "*.pdf",
        val maxSize: String = "10MB"
    )
    
    data class PdfInputResult(
        val success: Boolean,
        val message: String,
        val chunksAdded: Int = 0
    )
    
    /**
     * Executes the PDF input node with the provided URI
     */
    suspend fun execute(pdfUri: Uri): PdfInputResult = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "PDF Input Node executing with URI: $pdfUri")
            
            val result = ragPipeline.loadPdfFromUri(context, pdfUri)
            
            return@withContext if (result.isSuccess) {
                val message = result.getOrNull() ?: "PDF loaded successfully"
                val chunksMatch = Regex("(\\d+) chunks").find(message)
                val chunksAdded = chunksMatch?.groupValues?.get(1)?.toIntOrNull() ?: 0
                
                Log.d(TAG, "PDF Input Node completed successfully: $message")
                PdfInputResult(
                    success = true,
                    message = message,
                    chunksAdded = chunksAdded
                )
            } else {
                val error = result.exceptionOrNull()?.message ?: "Unknown error"
                Log.e(TAG, "PDF Input Node failed: $error")
                PdfInputResult(
                    success = false,
                    message = "Failed to load PDF: $error"
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "PDF Input Node exception", e)
            PdfInputResult(
                success = false,
                message = "Exception in PDF Input: ${e.message}"
            )
        }
    }
    
    /**
     * Execute with asset PDF (for testing/demo purposes)
     */
    suspend fun executeWithAsset(assetFileName: String): PdfInputResult = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "PDF Input Node executing with asset: $assetFileName")
            
            val result = ragPipeline.loadPdfFromAssets(context, assetFileName)
            
            return@withContext if (result.isSuccess) {
                val message = result.getOrNull() ?: "PDF asset loaded successfully"
                val chunksMatch = Regex("(\\d+) chunks").find(message)
                val chunksAdded = chunksMatch?.groupValues?.get(1)?.toIntOrNull() ?: 0
                
                Log.d(TAG, "PDF Input Node (asset) completed successfully: $message")
                PdfInputResult(
                    success = true,
                    message = message,
                    chunksAdded = chunksAdded
                )
            } else {
                val error = result.exceptionOrNull()?.message ?: "Unknown error"
                Log.e(TAG, "PDF Input Node (asset) failed: $error")
                PdfInputResult(
                    success = false,
                    message = "Failed to load PDF asset: $error"
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "PDF Input Node (asset) exception", e)
            PdfInputResult(
                success = false,
                message = "Exception in PDF Input (asset): ${e.message}"
            )
        }
    }
    
    companion object {
        private const val TAG = "PdfInputNode"
    }
}

/**
 * Text Input Node - Direct text input for processing
 * Visual Node Config: { placeholder: "Enter your text here...", maxLength: 10000 }
 */
class TextInputNode(
    private val ragPipeline: RagPipeline,
    private val config: TextInputConfig = TextInputConfig()
) {
    data class TextInputConfig(
        val placeholder: String = "Enter your text here...",
        val maxLength: Int = 10000
    )
    
    data class TextInputResult(
        val success: Boolean,
        val message: String,
        val chunksAdded: Int = 0,
        val processedText: String = ""
    )
    
    /**
     * Executes the text input node with the provided text
     */
    suspend fun execute(inputText: String): TextInputResult = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Text Input Node executing with ${inputText.length} characters")
            
            // Validate input
            if (inputText.isBlank()) {
                return@withContext TextInputResult(
                    success = false,
                    message = "Input text cannot be empty"
                )
            }
            
            if (inputText.length > config.maxLength) {
                return@withContext TextInputResult(
                    success = false,
                    message = "Input text exceeds maximum length of ${config.maxLength} characters"
                )
            }
            
            // Add text to RAG pipeline memory
            ragPipeline.addTextToMemory(inputText)
            
            // Estimate chunks (using same logic as RagPipeline: 512 chars with 64 overlap)
            val estimatedChunks = estimateChunks(inputText, 512, 64)
            
            Log.d(TAG, "Text Input Node completed successfully, estimated $estimatedChunks chunks")
            
            TextInputResult(
                success = true,
                message = "Successfully added text to memory (estimated $estimatedChunks chunks)",
                chunksAdded = estimatedChunks,
                processedText = inputText
            )
            
        } catch (e: Exception) {
            Log.e(TAG, "Text Input Node exception", e)
            TextInputResult(
                success = false,
                message = "Exception in Text Input: ${e.message}"
            )
        }
    }
    
    /**
     * Estimates the number of chunks that will be created
     */
    private fun estimateChunks(text: String, chunkSize: Int, overlap: Int): Int {
        if (text.length <= chunkSize) return 1
        
        var chunks = 0
        var i = 0
        while (i < text.length) {
            chunks++
            i += chunkSize - overlap
        }
        return chunks
    }
    
    companion object {
        private const val TAG = "TextInputNode"
    }
} 