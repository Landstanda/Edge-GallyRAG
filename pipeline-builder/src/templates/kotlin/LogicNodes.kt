package com.google.ai.edge.gallery.pipeline.nodes

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Kotlin templates for Logic nodes in the visual pipeline builder.
 * These handle conditional logic, filtering, and data flow control.
 */

/**
 * If/Then Node - Conditional logic for pipeline branching
 * Visual Node Config: { condition: "contains", value: "", caseSensitive: false }
 */
class IfThenNode(
    private val config: IfThenConfig = IfThenConfig()
) {
    data class IfThenConfig(
        val condition: String = "contains",
        val value: String = "",
        val caseSensitive: Boolean = false
    )
    
    data class IfThenResult(
        val success: Boolean,
        val message: String,
        val conditionMet: Boolean = false,
        val inputData: String = "",
        val outputData: String = ""
    )
    
    /**
     * Executes the conditional logic
     */
    suspend fun execute(inputData: String): IfThenResult = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "If/Then Node executing with condition: ${config.condition}")
            
            if (inputData.isBlank()) {
                return@withContext IfThenResult(
                    success = false,
                    message = "Input data cannot be empty"
                )
            }
            
            val conditionMet = evaluateCondition(inputData, config.condition, config.value, config.caseSensitive)
            
            Log.d(TAG, "If/Then condition evaluation: $conditionMet")
            
            IfThenResult(
                success = true,
                message = "Condition '${config.condition}' evaluated to: $conditionMet",
                conditionMet = conditionMet,
                inputData = inputData,
                outputData = if (conditionMet) inputData else ""
            )
            
        } catch (e: Exception) {
            Log.e(TAG, "If/Then Node exception", e)
            IfThenResult(
                success = false,
                message = "Exception in If/Then: ${e.message}",
                inputData = inputData
            )
        }
    }
    
    /**
     * Executes with custom condition
     */
    suspend fun executeWithCustomCondition(
        inputData: String,
        customCondition: String,
        customValue: String
    ): IfThenResult = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "If/Then Node executing with custom condition: $customCondition")
            
            val conditionMet = evaluateCondition(inputData, customCondition, customValue, config.caseSensitive)
            
            Log.d(TAG, "If/Then custom condition evaluation: $conditionMet")
            
            IfThenResult(
                success = true,
                message = "Custom condition '$customCondition' evaluated to: $conditionMet",
                conditionMet = conditionMet,
                inputData = inputData,
                outputData = if (conditionMet) inputData else ""
            )
            
        } catch (e: Exception) {
            Log.e(TAG, "If/Then Node custom condition exception", e)
            IfThenResult(
                success = false,
                message = "Exception in If/Then custom condition: ${e.message}",
                inputData = inputData
            )
        }
    }
    
    /**
     * Evaluates the condition based on the input data
     */
    private fun evaluateCondition(
        inputData: String,
        condition: String,
        value: String,
        caseSensitive: Boolean
    ): Boolean {
        val dataToCheck = if (caseSensitive) inputData else inputData.lowercase()
        val valueToCheck = if (caseSensitive) value else value.lowercase()
        
        return when (condition.lowercase()) {
            "contains" -> dataToCheck.contains(valueToCheck)
            "equals" -> dataToCheck == valueToCheck
            "starts_with" -> dataToCheck.startsWith(valueToCheck)
            "ends_with" -> dataToCheck.endsWith(valueToCheck)
            "not_contains" -> !dataToCheck.contains(valueToCheck)
            "not_equals" -> dataToCheck != valueToCheck
            "is_empty" -> inputData.isBlank()
            "is_not_empty" -> inputData.isNotBlank()
            "length_greater_than" -> {
                val threshold = value.toIntOrNull() ?: 0
                inputData.length > threshold
            }
            "length_less_than" -> {
                val threshold = value.toIntOrNull() ?: 0
                inputData.length < threshold
            }
            "matches_regex" -> {
                try {
                    inputData.matches(Regex(value))
                } catch (e: Exception) {
                    false
                }
            }
            else -> false
        }
    }
    
    companion object {
        private const val TAG = "IfThenNode"
    }
}

/**
 * Filter Node - Filters data based on criteria
 * Visual Node Config: { filterType: "include", criteria: "length", threshold: 100 }
 */
class FilterNode(
    private val config: FilterConfig = FilterConfig()
) {
    data class FilterConfig(
        val filterType: String = "include",
        val criteria: String = "length",
        val threshold: Int = 100
    )
    
    data class FilterResult(
        val success: Boolean,
        val message: String,
        val filteredData: List<String> = emptyList(),
        val originalCount: Int = 0,
        val filteredCount: Int = 0
    )
    
    /**
     * Executes filtering on a list of text chunks
     */
    suspend fun execute(inputChunks: List<String>): FilterResult = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Filter Node executing with ${inputChunks.size} chunks")
            
            if (inputChunks.isEmpty()) {
                return@withContext FilterResult(
                    success = false,
                    message = "Input chunks cannot be empty"
                )
            }
            
            val filteredChunks = when (config.criteria.lowercase()) {
                "length" -> filterByLength(inputChunks, config.threshold, config.filterType)
                "contains_word" -> filterByWordContains(inputChunks, config.filterType)
                "word_count" -> filterByWordCount(inputChunks, config.threshold, config.filterType)
                "alphabetic_only" -> filterAlphabeticOnly(inputChunks, config.filterType)
                "has_numbers" -> filterHasNumbers(inputChunks, config.filterType)
                else -> inputChunks
            }
            
            Log.d(TAG, "Filter completed: ${filteredChunks.size}/${inputChunks.size} chunks passed filter")
            
            FilterResult(
                success = true,
                message = "Filter applied: ${filteredChunks.size}/${inputChunks.size} chunks passed",
                filteredData = filteredChunks,
                originalCount = inputChunks.size,
                filteredCount = filteredChunks.size
            )
            
        } catch (e: Exception) {
            Log.e(TAG, "Filter Node exception", e)
            FilterResult(
                success = false,
                message = "Exception in Filter: ${e.message}",
                originalCount = inputChunks.size
            )
        }
    }
    
    /**
     * Filters by text length
     */
    private fun filterByLength(chunks: List<String>, threshold: Int, filterType: String): List<String> {
        return when (filterType.lowercase()) {
            "include" -> chunks.filter { it.length >= threshold }
            "exclude" -> chunks.filter { it.length < threshold }
            else -> chunks
        }
    }
    
    /**
     * Filters by word contains (placeholder - would need specific word)
     */
    private fun filterByWordContains(chunks: List<String>, filterType: String): List<String> {
        // This would typically take a specific word to search for
        // For now, filter chunks that have common question words
        val questionWords = listOf("what", "how", "why", "when", "where", "who")
        
        return when (filterType.lowercase()) {
            "include" -> chunks.filter { chunk ->
                questionWords.any { word -> chunk.lowercase().contains(word) }
            }
            "exclude" -> chunks.filter { chunk ->
                questionWords.none { word -> chunk.lowercase().contains(word) }
            }
            else -> chunks
        }
    }
    
    /**
     * Filters by word count
     */
    private fun filterByWordCount(chunks: List<String>, threshold: Int, filterType: String): List<String> {
        return when (filterType.lowercase()) {
            "include" -> chunks.filter { it.split("\\s+".toRegex()).size >= threshold }
            "exclude" -> chunks.filter { it.split("\\s+".toRegex()).size < threshold }
            else -> chunks
        }
    }
    
    /**
     * Filters for alphabetic-only content
     */
    private fun filterAlphabeticOnly(chunks: List<String>, filterType: String): List<String> {
        return when (filterType.lowercase()) {
            "include" -> chunks.filter { it.matches(Regex("[a-zA-Z\\s.,!?;:()-]+")) }
            "exclude" -> chunks.filter { !it.matches(Regex("[a-zA-Z\\s.,!?;:()-]+")) }
            else -> chunks
        }
    }
    
    /**
     * Filters for content with numbers
     */
    private fun filterHasNumbers(chunks: List<String>, filterType: String): List<String> {
        return when (filterType.lowercase()) {
            "include" -> chunks.filter { it.contains(Regex("\\d")) }
            "exclude" -> chunks.filter { !it.contains(Regex("\\d")) }
            else -> chunks
        }
    }
    
    companion object {
        private const val TAG = "FilterNode"
    }
}

/**
 * Merge Node - Combines multiple data streams
 * Visual Node Config: { mergeType: "concatenate", separator: "\n", removeDuplicates: true }
 */
class MergeNode(
    private val config: MergeConfig = MergeConfig()
) {
    data class MergeConfig(
        val mergeType: String = "concatenate",
        val separator: String = "\n",
        val removeDuplicates: Boolean = true
    )
    
    data class MergeResult(
        val success: Boolean,
        val message: String,
        val mergedData: String = "",
        val mergedList: List<String> = emptyList(),
        val inputCount: Int = 0,
        val outputCount: Int = 0
    )
    
    /**
     * Merges multiple text inputs
     */
    suspend fun execute(vararg inputs: String): MergeResult = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Merge Node executing with ${inputs.size} inputs")
            
            val filteredInputs = inputs.filter { it.isNotBlank() }
            
            if (filteredInputs.isEmpty()) {
                return@withContext MergeResult(
                    success = false,
                    message = "All inputs are empty"
                )
            }
            
            val mergedData = when (config.mergeType.lowercase()) {
                "concatenate" -> filteredInputs.joinToString(config.separator)
                "interleave" -> interleaveInputs(filteredInputs, config.separator)
                "unique_only" -> filteredInputs.distinct().joinToString(config.separator)
                else -> filteredInputs.joinToString(config.separator)
            }
            
            val finalData = if (config.removeDuplicates && config.mergeType != "unique_only") {
                // Remove duplicate lines/chunks
                mergedData.split(config.separator).distinct().joinToString(config.separator)
            } else {
                mergedData
            }
            
            Log.d(TAG, "Merge completed: ${finalData.length} characters")
            
            MergeResult(
                success = true,
                message = "Successfully merged ${filteredInputs.size} inputs using ${config.mergeType}",
                mergedData = finalData,
                inputCount = inputs.size,
                outputCount = 1
            )
            
        } catch (e: Exception) {
            Log.e(TAG, "Merge Node exception", e)
            MergeResult(
                success = false,
                message = "Exception in Merge: ${e.message}",
                inputCount = inputs.size
            )
        }
    }
    
    /**
     * Merges lists of chunks
     */
    suspend fun executeWithLists(vararg inputLists: List<String>): MergeResult = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Merge Node executing with ${inputLists.size} lists")
            
            val allChunks = mutableListOf<String>()
            var totalInputCount = 0
            
            for (list in inputLists) {
                allChunks.addAll(list.filter { it.isNotBlank() })
                totalInputCount += list.size
            }
            
            if (allChunks.isEmpty()) {
                return@withContext MergeResult(
                    success = false,
                    message = "All input lists are empty"
                )
            }
            
            val processedChunks = when (config.mergeType.lowercase()) {
                "concatenate" -> allChunks
                "interleave" -> interleaveChunks(inputLists)
                "unique_only" -> allChunks.distinct()
                else -> allChunks
            }
            
            val finalChunks = if (config.removeDuplicates && config.mergeType != "unique_only") {
                processedChunks.distinct()
            } else {
                processedChunks
            }
            
            val mergedData = finalChunks.joinToString(config.separator)
            
            Log.d(TAG, "Merge lists completed: ${finalChunks.size} chunks")
            
            MergeResult(
                success = true,
                message = "Successfully merged ${inputLists.size} lists into ${finalChunks.size} chunks",
                mergedData = mergedData,
                mergedList = finalChunks,
                inputCount = totalInputCount,
                outputCount = finalChunks.size
            )
            
        } catch (e: Exception) {
            Log.e(TAG, "Merge Node lists exception", e)
            MergeResult(
                success = false,
                message = "Exception in Merge lists: ${e.message}",
                inputCount = inputLists.sumOf { it.size }
            )
        }
    }
    
    /**
     * Interleaves multiple text inputs
     */
    private fun interleaveInputs(inputs: List<String>, separator: String): String {
        val lines = inputs.map { it.split(separator) }
        val maxLines = lines.maxOfOrNull { it.size } ?: 0
        val interleaved = mutableListOf<String>()
        
        for (i in 0 until maxLines) {
            for (lineList in lines) {
                if (i < lineList.size && lineList[i].isNotBlank()) {
                    interleaved.add(lineList[i])
                }
            }
        }
        
        return interleaved.joinToString(separator)
    }
    
    /**
     * Interleaves multiple chunk lists
     */
    private fun interleaveChunks(inputLists: Array<out List<String>>): List<String> {
        val maxSize = inputLists.maxOfOrNull { it.size } ?: 0
        val interleaved = mutableListOf<String>()
        
        for (i in 0 until maxSize) {
            for (list in inputLists) {
                if (i < list.size && list[i].isNotBlank()) {
                    interleaved.add(list[i])
                }
            }
        }
        
        return interleaved
    }
    
    companion object {
        private const val TAG = "MergeNode"
    }
} 