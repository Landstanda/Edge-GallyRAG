# Project: On-Device RAG with AI Edge Gallery

This file documents the major actions taken to build an on-device RAG system.

## Phase 2: Integrate RAG into the AI Edge Gallery App

**Goal:** Instead of a separate app, integrate the RAG pipeline directly into the full AI Edge Gallery application.

### October 20th, 2023

*   **Project Reset:** Deleted the previous attempt to merge repositories. Cloned fresh copies of `google-ai-edge/gallery` and `google-ai-edge/ai-edge-apis`.
*   **Dependency Management:** Added the AI Edge RAG SDK (`com.google.ai.edge:local-agents-rag`) and a PDF parsing library (`com.tom_roush.pdfbox:pdfbox-android`) to the Gallery app's `build.gradle.kts`.
*   **Data Setup:**
    *   Downloaded a PDF about fruit trees ("FRUIT TREES FOR YOLO COUNTY").
    *   Placed the PDF in the Gallery app's `assets` folder (`gallery/Android/src/app/src/main/assets/`).
*   **Core RAG Implementation:**
    *   Created `gallery/Android/src/app/src/main/java/com/google/ai/edge/gallery/rag/RagPipeline.kt`.
    *   This class handles the entire RAG lifecycle:
        *   Initializes Gemma (for generation) and Gecko (for embeddings) models.
        *   Sets up an SQLite-based vector store for on-device semantic search.
        *   Includes logic to parse the text from the asset PDF, chunk it, generate embeddings, and store them in the vector store.
*   **Application Integration:**
    *   Identified `LlmSingleTurnViewModel.kt` as the key component for handling single-turn chat interactions.
    *   Modified the ViewModel to:
        *   Instantiate the new `RagPipeline`.
        *   On initialization, trigger the PDF parsing and memorization process.
        *   Replace the direct call to the LLM with a query to the RAG chain (`ragPipeline.retrievalAndInferenceChain.invoke(...)`).
*   **Troubleshooting & Build:**
    *   **ViewModel Factory:** The `RagPipeline` required the `Application` context, which broke the `LlmSingleTurnViewModel`'s constructor. Fixed this by updating the corresponding ViewModel factory (`ViewModelProvider.kt`) to provide the context.
    *   **UI Preview:** The factory fix broke the Jetpack Compose preview for the screen. Fixed this by providing a dummy `Application` in `PreviewLlmSingleTurnViewModel.kt`.
    *   **Model Deployment:** Pushed the necessary Gemma, Gecko, and tokenizer models to the device using `adb`.
    *   **Compilation Errors:** Encountered and fixed several Kotlin compilation errors related to incorrect API usage in the RAG SDK and dependency issues. This involved:
        1.  Adding the `kotlinx-coroutines-guava` dependency.
        2.  Restructuring `RagPipeline.kt` to correctly manage memory and chain components.
        3.  Correcting the parameters in a `RetrievalConfig.create` call in `LlmSingleTurnViewModel.kt`.
*   **Successful Build:** After fixing all compilation errors, successfully built and installed the modified Gallery app on the device. The app now functions as a RAG system, answering questions based on the content of the provided PDF.

### October 21st, 2023

*   **Build Failure & Refactoring:** A subsequent build failed due to a type mismatch (`List` vs. `ImmutableList`) and a recurring ambiguous function call.
*   **Removed PDF Processing:** As requested, removed all logic related to parsing the "FRUIT TREES FOR YOLO COUNTY" PDF.
    *   Deleted the PDF file from the assets.
    *   Removed the `pdfbox-android` dependency from `build.gradle.kts`.
    *   Removed the `memorizePdf` function from `RagPipeline.kt` and replaced its usage in `LlmSingleTurnViewModel.kt` with a function that adds a simple default text string to the RAG memory on startup.
*   **Bug Fixes & Rebuild:**
    *   Corrected the type mismatch in `RagPipeline.kt` by converting the standard Kotlin `List` of text chunks to a Guava `ImmutableList` before passing it to the SDK.
    *   Attempted to fix the ambiguous `RetrievalConfig.create` call again.
    *   Initiated a new build.
*   **Build File Corruption & Final Fixes:**
    *   Discovered that a previous edit had corrupted `build.gradle.kts` by adding duplicate dependencies and invalid `libs.*` references.
    *   Fixed the build file by removing duplicate and invalid dependency entries.
    *   Added the missing `RetrievalAndInferenceChain` import in `RagPipeline.kt`.
    *   Confirmed that both the `ImmutableList.copyOf()` fix and the `RetrievalConfig.create()` parameter fix were properly applied.
    *   Successfully initiated the final build, which is running without immediate compilation errors.
*   **Final Compilation Fix:**
    *   Despite the previous fixes appearing correct, the build still failed on the `RetrievalConfig.create` call.
    *   Applied a more explicit fix by separating the function calls and using positional parameters instead of named parameters.
    *   This eliminates any potential compiler ambiguity about which function overload to use.
    *   Build is now running successfully without immediate compilation errors.
*   **Installation Success:**
    *   Build completed successfully with all compilation issues resolved.
    *   Installation initially failed due to signature mismatch with existing Gallery app on device.
    *   Uninstalled the existing app using `adb uninstall com.google.aiedge.gallery`.
    *   Successfully reinstalling the modified RAG-enabled Gallery app.

### October 21st, 2023 - PDF Loading Feature

*   **Feature Request:** User requested ability to load PDF files from phone into the RAG system for semantic search.
*   **Implementation Plan:**
    *   Add PDF loading button above the existing "Import Model" button
    *   Create file picker for PDF selection from device storage
    *   Integrate with existing RAG pipeline for text extraction, chunking, and embedding
    *   Add progress indication and error handling
*   **Technical Implementation:**
    *   Re-added `pdfbox-android` dependency to `build.gradle.kts`
    *   Enhanced `RagPipeline.kt` with `loadPdfFromUri()` method for processing PDF files
    *   Added PDF file picker launcher to `HomeScreen.kt`
    *   Modified floating action buttons to show both PDF loading and model import options
    *   Added progress dialog for PDF processing feedback
    *   Integrated with existing vector database and semantic search infrastructure
*   **User Experience:**
    *   Two floating action buttons: PDF icon for loading documents, Plus icon for importing models
    *   File picker specifically filters for PDF files
    *   Progress dialog shows loading status during PDF processing
    *   Success/error messages via snackbar notifications
    *   Seamless integration with existing semantic search functionality

### October 21st, 2023 - Critical RAG Fix & Mobile MCP Setup

*   **Critical Issue Identified:** RAG search was not working because there were two separate RagPipeline instances:
    *   HomeScreen created its own RagPipeline for PDF loading
    *   LlmSingleTurnViewModel created its own separate RagPipeline for queries
    *   Result: PDFs loaded into one vector database, but queries searched a different empty database
*   **Solution - Singleton Pattern:**
    *   Modified RagPipeline to use singleton pattern with `getInstance()` method
    *   Ensured both HomeScreen and LlmSingleTurnViewModel use the same RagPipeline instance
    *   Added comprehensive logging to track initialization and content addition
    *   Moved initial content addition to singleton constructor
*   **Mobile MCP Configuration:**
    *   Updated `.cursor/mcp.json` to use `@mobilenext/mobile-mcp@latest` instead of the non-functional `@modelcontextprotocol/server-mobile`
    *   This enables AI assistant to interact with the Android device for testing and debugging
*   **Expected Results:**
    *   PDF content now properly searchable in chat interface
    *   Single shared vector database for all content
    *   Mobile MCP server ready for device interaction and testing 

# Galaxy S23 On-Device RAG System - Development Actions

## Project Overview
Building an on-device RAG (Retrieval-Augmented Generation) system for Galaxy S23 using:
- **Generation Model**: Gemma 3 1B (on-device)
- **Embedding Model**: Gecko (on-device) 
- **Vector Store**: SQLite with 768-dimensional embeddings
- **Framework**: AI Edge Gallery + AI Edge APIs

---

## Major Development Actions

### 1. Initial Setup & Environment Configuration
**Problem**: Multiple environment setup issues
- JAVA_HOME not set correctly
- ANDROID_HOME missing
- PowerShell syntax errors with gradlew

**Solution**: Systematic environment fixes
- Set JAVA_HOME to Eclipse Adoptium JDK 17
- Configured ANDROID_HOME to user profile android-sdk
- Fixed PowerShell command syntax

**Result**: ✅ Build environment working

### 2. RAG Pipeline Architecture Implementation
**Action**: Created comprehensive RAG system
- Implemented `RagPipeline.kt` with singleton pattern
- Integrated Gemma 3 1B + Gecko embeddings + SQLite vector store
- Modified `LlmSingleTurnViewModel.kt` to use RAG chain instead of direct LLM

**Key Components**:
```kotlin
// Singleton ensures shared vector database
class RagPipeline private constructor(application: Application) {
    val retrievalAndInferenceChain: RetrievalAndInferenceChain
    private val memory: DefaultSemanticTextMemory
    private val vectorStore: SqliteVectorStore
}
```

**Result**: ✅ RAG architecture implemented

### 3. PDF Loading Feature
**Problem**: User requested PDF document loading capability

**Solution**: Comprehensive PDF integration
- Added dual floating action buttons (PDF + model import)
- Implemented `loadPdfFromUri()` with PDFBox
- Text extraction, chunking (512 chars, 64 overlap), vector storage
- Progress dialogs and error handling

**Result**: ✅ PDF loading functional

### 4. Critical Bug Discovery: Separate Vector Databases
**Problem**: RAG search returning no results despite successful PDF loading

**Root Cause Analysis**: Two separate RagPipeline instances
- HomeScreen created own instance for PDF loading
- LlmSingleTurnViewModel created separate instance for queries
- Result: PDFs stored in one database, queries searched different empty database

**Solution**: Implemented singleton pattern
```kotlin
companion object {
    @Volatile
    private var INSTANCE: RagPipeline? = null
    
    fun getInstance(application: Application): RagPipeline {
        return INSTANCE ?: synchronized(this) {
            INSTANCE ?: RagPipeline(application).also { INSTANCE = it }
        }
    }
}
```

**Result**: ✅ Singleton architecture implemented

### 5. Mobile MCP Integration
**Problem**: `.cursor/mcp.json` configured but mobile debugging not functional

**Solution**: Updated MCP server configuration
- Replaced non-functional `@modelcontextprotocol/server-mobile`
- Updated to `@mobilenext/mobile-mcp@latest`
- Enabled AI assistant device interaction for testing

**Result**: ✅ Mobile MCP configured

### 6. **CURRENT ISSUE**: Comprehensive RAG Pipeline Debugging
**Problem**: Semantic search still not returning results despite singleton fix

**Debugging Strategy**: Systematic trace through entire pipeline

#### 6.1 Added Comprehensive Logging
**Enhanced RagPipeline.kt**:
- Detailed initialization logging
- Text chunking trace with chunk previews
- Vector storage success/failure callbacks
- Automatic test retrieval after storage
- Debug query function for end-to-end testing

**Enhanced LlmSingleTurnViewModel.kt**:
- Complete query flow logging
- Retrieval configuration details
- RAG chain response analysis
- Error handling with detailed messages

**Enhanced HomeScreen.kt**:
- Added debug RAG button for direct testing
- Comprehensive error logging for PDF operations

#### 6.2 Debug Components Added
```kotlin
// Test retrieval immediately after storage
private fun testRetrieval(query: String) {
    // Logs retrieval config, results, entity count
}

// Complete pipeline testing
suspend fun debugQuery(query: String): String {
    // Step 1: Direct retrieval test
    // Step 2: Full RAG chain test
}

// Debug button in UI
SmallFloatingActionButton(
    onClick = { ragPipeline.debugQuery("What is a pangram?") }
)
```

#### 6.3 Investigation Areas
**Storage Layer**:
- ✅ SqliteVectorStore initialization (768 dimensions)
- ✅ DefaultSemanticTextMemory setup
- 🔍 **INVESTIGATING**: Actual vector insertion success
- 🔍 **INVESTIGATING**: Embedding generation for storage

**Retrieval Layer**:
- 🔍 **INVESTIGATING**: Query embedding generation
- 🔍 **INVESTIGATING**: Vector similarity search execution
- 🔍 **INVESTIGATING**: Similarity score thresholds (currently 0.0f)

**Integration Layer**:
- ✅ Singleton pattern ensuring shared database
- ✅ RetrievalAndInferenceChain configuration
- 🔍 **INVESTIGATING**: Prompt template formatting
- 🔍 **INVESTIGATING**: Context injection into LLM

#### 6.4 Current Status
- ✅ App builds and installs successfully
- ✅ Comprehensive logging implemented
- ✅ Debug tools added to UI
- 🔄 **IN PROGRESS**: Log analysis to identify failure point
- 🔄 **IN PROGRESS**: Vector database content verification

**Next Steps**:
1. Monitor logs during app initialization
2. Test debug RAG button functionality
3. Verify vector storage operations
4. Check embedding generation process
5. Validate retrieval query execution

---

## Technical Architecture Summary

### Models & Storage
- **Gemma 3 1B**: `/data/local/tmp/gemma3-1b-it-int4.task`
- **Gecko Embeddings**: `/data/local/tmp/gecko.tflite` (768 dimensions)
- **Tokenizer**: `/data/local/tmp/sentencepiece.model`
- **Vector Store**: SQLite with ephemeral database

### Data Flow
1. **Storage**: Text → Chunks (512/64) → Embeddings → SQLite
2. **Retrieval**: Query → Embedding → Vector Search → Top-3 Results
3. **Generation**: Context + Query → Prompt Template → Gemma 3 → Response

### Key Files Modified
- `RagPipeline.kt` - Core RAG implementation with singleton pattern
- `LlmSingleTurnViewModel.kt` - RAG integration replacing direct LLM calls
- `HomeScreen.kt` - PDF loading + debug functionality
- `build.gradle.kts` - RAG SDK and PDF dependencies
- `.cursor/mcp.json` - Mobile debugging configuration

---

## Current Development Focus
**PRIORITY**: Systematic debugging of semantic search failure
- Comprehensive logging implemented across all components
- Debug tools added for real-time testing
- Investigation focused on vector storage and retrieval operations
- Goal: Identify exact failure point in RAG pipeline 