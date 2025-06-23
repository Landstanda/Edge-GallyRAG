package com.google.ai.edge.gallery.pipeline.nodes

import android.content.Context
import android.net.Uri
import android.util.Log
import com.google.ai.edge.gallery.rag.RagPipeline
import com.google.common.collect.ImmutableList
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.text.PDFTextStripper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Kotlin templates for Processing nodes in the visual pipeline builder.
 * These handle text extraction, chunking, and embedding generation.
 */

/**
 * PDF Text Extractor Node - Extract text content from PDF documents
 * Visual Node Config: { stripFormatting: true, preserveLineBreaks: false }
 */
class PdfTextExtractorNode(
    private val context: Context,
    private val config: PdfTextExtractorConfig = PdfTextExtractorConfig()
) {
    data class PdfTextExtractorConfig(
        val stripFormatting: Boolean = true,
        val preserveLineBreaks: Boolean = false
    )
    
    data class PdfTextExtractorResult(
        val success: Boolean,
        val message: String,
        val extractedText: String = "",
        val characterCount: Int = 0
    )
    
    /**
     * Executes PDF text extraction from URI
     */
    suspend fun execute(pdfUri: Uri): PdfTextExtractorResult = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "PDF Text Extractor Node executing with URI: $pdfUri")
            
            // Open the PDF document from the URI
            val inputStream = context.contentResolver.openInputStream(pdfUri)
                ?: return@withContext PdfTextExtractorResult(
                    success = false,
                    message = "Could not open PDF file"
                )
            
            val pdfDocument = PDDocument.load(inputStream)
            val stripper = PDFTextStripper()
            
            // Apply configuration
            if (!config.preserveLineBreaks) {
                stripper.setSortByPosition(true)
            }
            
            val extractedText = stripper.getText(pdfDocument)
            pdfDocument.close()
            inputStream.close()
            
            val processedText = if (config.stripFormatting) {
                extractedText.replace(Regex("\\s+"), " ").trim()
            } else {
                extractedText
            }
            
            Log.d(TAG, "PDF Text Extractor completed: ${processedText.length} characters extracted")
            
            PdfTextExtractorResult(
                success = true,
                message = "Successfully extracted ${processedText.length} characters from PDF",
                extractedText = processedText,
                characterCount = processedText.length
            )
            
        } catch (e: Exception) {
            Log.e(TAG, "PDF Text Extractor Node exception", e)
            PdfTextExtractorResult(
                success = false,
                message = "Exception in PDF Text Extractor: ${e.message}"
            )
        }
    }
    
    companion object {
        private const val TAG = "PdfTextExtractorNode"
    }
}

/**
 * Text Chunker Node - Split text into chunks for processing
 * Visual Node Config: { chunkSize: 512, overlap: 64, method: "fixed-size" }
 */
class TextChunkerNode(
    private val config: TextChunkerConfig = TextChunkerConfig()
) {
    data class TextChunkerConfig(
        val chunkSize: Int = 512,
        val overlap: Int = 64,
        val method: String = "fixed-size"
    )
    
    data class TextChunkerResult(
        val success: Boolean,
        val message: String,
        val chunks: List<String> = emptyList(),
        val chunkCount: Int = 0
    )
    
    /**
     * Executes text chunking
     */
    suspend fun execute(inputText: String): TextChunkerResult = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Text Chunker Node executing with ${inputText.length} characters")
            
            if (inputText.isBlank()) {
                return@withContext TextChunkerResult(
                    success = false,
                    message = "Input text cannot be empty"
                )
            }
            
            val chunks = when (config.method) {
                "fixed-size" -> chunkTextFixedSize(inputText, config.chunkSize, config.overlap)
                "sentence" -> chunkTextBySentence(inputText, config.chunkSize)
                "paragraph" -> chunkTextByParagraph(inputText, config.chunkSize)
                else -> chunkTextFixedSize(inputText, config.chunkSize, config.overlap)
            }
            
            Log.d(TAG, "Text Chunker completed: ${chunks.size} chunks created")
            
            TextChunkerResult(
                success = true,
                message = "Successfully created ${chunks.size} chunks using ${config.method} method",
                chunks = chunks,
                chunkCount = chunks.size
            )
            
        } catch (e: Exception) {
            Log.e(TAG, "Text Chunker Node exception", e)
            TextChunkerResult(
                success = false,
                message = "Exception in Text Chunker: ${e.message}"
            )
        }
    }
    
    /**
     * Fixed-size chunking with overlap (same as RagPipeline)
     */
    private fun chunkTextFixedSize(text: String, chunkSize: Int, overlap: Int): List<String> {
        val chunks = mutableListOf<String>()
        var i = 0
        while (i < text.length) {
            val end = (i + chunkSize).coerceAtMost(text.length)
            chunks.add(text.substring(i, end))
            i += chunkSize - overlap
        }
        return chunks
    }
    
    /**
     * Sentence-based chunking
     */
    private fun chunkTextBySentence(text: String, maxChunkSize: Int): List<String> {
        val sentences = text.split(Regex("[.!?]+\\s+"))
        val chunks = mutableListOf<String>()
        var currentChunk = StringBuilder()
        
        for (sentence in sentences) {
            if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.isNotEmpty()) {
                chunks.add(currentChunk.toString().trim())
                currentChunk = StringBuilder()
            }
            currentChunk.append(sentence).append(". ")
        }
        
        if (currentChunk.isNotEmpty()) {
            chunks.add(currentChunk.toString().trim())
        }
        
        return chunks
    }
    
    /**
     * Paragraph-based chunking
     */
    private fun chunkTextByParagraph(text: String, maxChunkSize: Int): List<String> {
        val paragraphs = text.split(Regex("\\n\\s*\\n"))
        val chunks = mutableListOf<String>()
        var currentChunk = StringBuilder()
        
        for (paragraph in paragraphs) {
            if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.isNotEmpty()) {
                chunks.add(currentChunk.toString().trim())
                currentChunk = StringBuilder()
            }
            currentChunk.append(paragraph).append("\n\n")
        }
        
        if (currentChunk.isNotEmpty()) {
            chunks.add(currentChunk.toString().trim())
        }
        
        return chunks
    }
    
    companion object {
        private const val TAG = "TextChunkerNode"
    }
}

/**
 * Embedding Generator Node - Generate vector embeddings using Gecko model
 * Visual Node Config: { model: "gecko", dimensions: 768, useGpu: true }
 */
class EmbeddingGeneratorNode(
    private val ragPipeline: RagPipeline,
    private val config: EmbeddingGeneratorConfig = EmbeddingGeneratorConfig()
) {
    data class EmbeddingGeneratorConfig(
        val model: String = "gecko",
        val dimensions: Int = 768,
        val useGpu: Boolean = true
    )
    
    data class EmbeddingGeneratorResult(
        val success: Boolean,
        val message: String,
        val embeddingsGenerated: Int = 0,
        val storedInMemory: Boolean = false
    )
    
    /**
     * Executes embedding generation and storage
     */
    suspend fun execute(textChunks: List<String>): EmbeddingGeneratorResult = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Embedding Generator Node executing with ${textChunks.size} chunks")
            
            if (textChunks.isEmpty()) {
                return@withContext EmbeddingGeneratorResult(
                    success = false,
                    message = "No text chunks provided for embedding generation"
                )
            }
            
            // Use the existing RagPipeline memory system to generate and store embeddings
            // The RagPipeline.memory.recordBatchedMemoryItems() handles embedding generation internally
            val immutableChunks = ImmutableList.copyOf(textChunks)
            
            // This will generate embeddings using the Gecko model and store them in the vector database
            ragPipeline.addTextToMemory(textChunks.joinToString("\n"))
            
            Log.d(TAG, "Embedding Generator completed: ${textChunks.size} chunks processed and stored")
            
            EmbeddingGeneratorResult(
                success = true,
                message = "Successfully generated and stored embeddings for ${textChunks.size} text chunks",
                embeddingsGenerated = textChunks.size,
                storedInMemory = true
            )
            
        } catch (e: Exception) {
            Log.e(TAG, "Embedding Generator Node exception", e)
            EmbeddingGeneratorResult(
                success = false,
                message = "Exception in Embedding Generator: ${e.message}"
            )
        }
    }
    
    /**
     * Execute with individual text chunk
     */
    suspend fun executeWithSingleChunk(textChunk: String): EmbeddingGeneratorResult {
        return execute(listOf(textChunk))
    }
    
    companion object {
        private const val TAG = "EmbeddingGeneratorNode"
    }
} 