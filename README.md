# Edge-GallyRAG: On-Device RAG with AI Edge Gallery

A comprehensive on-device Retrieval-Augmented Generation (RAG) system built on Google's AI Edge Gallery, enabling semantic search and document-based question answering entirely on Android devices.

## 🚀 Project Overview

Edge-GallyRAG transforms Google's AI Edge Gallery into a powerful on-device RAG system that can:
- Load and process PDF documents directly on your Android device
- Perform semantic search across multiple documents using vector embeddings
- Generate contextually relevant responses using on-device LLMs
- Maintain complete privacy with no cloud dependencies

## 📱 Key Features

### ✨ **On-Device RAG Pipeline**
- **Document Processing**: PDF text extraction and intelligent chunking (512 chars, 64 overlap)
- **Vector Embeddings**: Gecko model generating 768-dimensional embeddings
- **Semantic Search**: SQLite-based vector store with similarity search
- **LLM Generation**: Gemma 3B model for contextual response generation
- **Configurable RAG TopK**: Adjustable retrieval precision (1-20 chunks)
- **Smart Response Length Control**: Average ± variance token management

### 🔧 **Technical Capabilities**
- **GPU Acceleration**: Both embedding generation and LLM inference
- **Multi-Document Support**: Load and search across multiple PDFs simultaneously
- **Duplicate Prevention**: Smart deduplication prevents reloading same documents
- **Real-time Monitoring**: Comprehensive logging for debugging and optimization
- **Persistent Storage**: SQLite vector database survives app restarts
- **Performance Tuning**: Separate LLM TopK vs RAG TopK configuration

### 📊 **Performance Metrics**
- **Response Time**: ~7-8 seconds for complex queries (optimized with TopK tuning)
- **Storage**: Unlimited capacity (scales with device storage)
- **Memory Efficiency**: Singleton pattern ensures optimal resource usage
- **Chunk Tracking**: Real-time monitoring of database contents
- **Performance Insight**: RAG retrieval is lightning fast, LLM generation scales with TopK

## 🎯 **Next Major Feature: Visual Pipeline Builder**

We're building a **React Flow + n8n-style visual pipeline builder** that will:

### 🌟 **Pipeline Builder Features**
- **Visual Node Canvas**: Drag-and-drop pipeline creation with React Flow
- **n8n-Style Interface**: Familiar workflow builder with left palette and right configuration panel
- **Code Generation**: Automatically generates working Kotlin code for Edge Gallery
- **Node Types**: Input, Processing, Retrieval, LLM, Logic, and Output nodes
- **Real-time Validation**: Visual feedback for pipeline correctness
- **Template System**: Pre-built pipelines (Document Q&A, Classification, etc.)

### 🎨 **Visual Design**
- **Color-Coded Nodes**: Green (Input), Blue (Processing), Purple (Retrieval), Orange (LLM), Yellow (Logic), Red (Output)
- **Typed Connections**: Visual validation of compatible input/output types
- **Live Execution**: Real-time node status during pipeline execution
- **Offline Capability**: Complete local operation for privacy and performance

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   PDF Documents │───▶│   RAG Pipeline   │───▶│  LLM Response   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Vector Database  │
                    │ (SQLite + Gecko) │
                    └──────────────────┘
```

### Core Components:
- **RagPipeline.kt**: Singleton managing the entire RAG workflow
- **LlmChatViewModel.kt**: Integration with Gallery's chat interface
- **Vector Store**: SQLite database with Gecko embeddings
- **MediaPipe Backend**: Gemma model for text generation
- **🚀 Pipeline Builder** (Coming Soon): Visual workflow creator

## 🛠️ Installation & Setup

### Prerequisites
- Android device with USB debugging enabled
- Android SDK and ADB tools
- Java 17 (Eclipse Adoptium recommended)

### Model Deployment
```bash
# Push required models to device
adb push gemma3-1b-it-int4.task /data/local/tmp/
adb push gecko.tflite /data/local/tmp/
adb push sentencepiece.model /data/local/tmp/
```

### Build & Install
```bash
# Set environment variables
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-17.0.15.6-hotspot'
$env:ANDROID_HOME="$env:USERPROFILE\android-sdk"

# Build and install
cd gallery/Android/src
.\gradlew.bat assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## 📖 Usage

### Loading Documents
1. Open the AI Edge Gallery app
2. Tap the PDF icon to load documents from device storage
3. Documents are automatically processed and indexed

### Querying Documents
1. Navigate to "LLM Chat" feature
2. Ask questions about your loaded documents
3. The system will retrieve relevant context and generate responses

### Configuring RAG Settings
1. Open model settings (gear icon)
2. Adjust **RAG Retrieval TopK** (1-20 chunks)
3. Set **Response Length** (average ± variance)
4. Fine-tune **LLM TopK** for performance vs quality trade-offs

### Example Queries
- "What are the main sustainability challenges discussed in the document?"
- "How can technology help with ecological restoration?"
- "What fruit trees grow well in Yolo County?"

## 🔍 System Prompt

The RAG system uses this prompt template:
```
You are a helpful assistant. Use the following information to answer the user's question. 
If the answer is not in the context, say you don't know.

Context: {retrieved_chunks}

Question: {user_question}
```

## 📊 Configuration

### Retrieval Settings (Configurable)
- **RAG TopK**: 1-20 chunks (default: 3)
- **Similarity Threshold**: 0.0 (no minimum threshold)
- **Task Type**: Question Answering

### Response Control (New!)
- **Response Length (avg)**: 50-500 tokens (default: 150)
- **Response Length (±)**: 10-100 tokens (default: 50)
- **Dynamic Range**: Calculated as avg ± variance with bounds

### Model Settings
- **LLM**: Gemma 3B (1B int4 quantized)
- **Embeddings**: Gecko (768 dimensions)
- **Temperature**: 0.8
- **Top-P**: 0.95
- **LLM TopK**: 5-40 (default: 40, optimize to 15 for speed)
- **Max Tokens**: 2048

## 🧬 Project Origins

This project builds upon two excellent Google AI Edge projects:

### [Google AI Edge Gallery](https://github.com/google-ai-edge/gallery)
- **Original Purpose**: Showcase of on-device AI capabilities
- **Our Enhancement**: Added comprehensive RAG pipeline integration + configurable settings
- **Key Components Used**: UI framework, model management, chat interface

### [Google AI Edge APIs](https://github.com/google-ai-edge/ai-edge-apis)
- **Original Purpose**: APIs and examples for edge AI development
- **Our Enhancement**: Integrated RAG SDK into production app
- **Key Components Used**: LocalAgents RAG SDK, MediaPipe integration

## 🔧 Development Status

### ✅ Completed Features
- Full on-device RAG pipeline with PDF loading
- Multi-document support with duplicate prevention
- Configurable RAG TopK and response length controls
- Performance optimization (separate LLM vs RAG TopK)
- Real-time debugging with Android ADB MCP integration
- Comprehensive logging and monitoring

### 🚧 In Development
- **Visual Pipeline Builder**: React Flow + n8n-style interface
- **Code Generation Engine**: Pipeline-to-Kotlin translator
- **Template System**: Pre-built workflow templates

### Key Files Modified/Added
- `app/src/main/java/com/google/ai/edge/gallery/rag/RagPipeline.kt` - Core RAG implementation
- `app/src/main/java/com/google/ai/edge/gallery/ui/llmchat/LlmChatViewModel.kt` - Chat integration
- `app/src/main/java/com/google/ai/edge/gallery/data/Config.kt` - Configurable settings
- `app/src/main/java/com/google/ai/edge/gallery/data/Consts.kt` - RAG constants
- `TASK.md` - Complete pipeline builder roadmap

### Dependencies Added
```kotlin
implementation("com.google.ai.edge:local-agents-rag:0.1.0")
implementation("com.tom_roush.pdfbox:pdfbox-android:2.0.27.0")
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-guava:1.7.3")
```

## 🚀 Performance & Capabilities

### Verified Functionality
- ✅ **Multi-document loading**: Successfully handles documents of varying sizes
- ✅ **Semantic search**: Accurate retrieval of relevant context
- ✅ **Contextual responses**: LLM generates responses based on retrieved content
- ✅ **Real-time debugging**: Comprehensive logging for system monitoring
- ✅ **Memory efficiency**: Singleton pattern prevents resource duplication
- ✅ **Performance tuning**: TopK optimization reduces response time from 104s to lightning fast
- ✅ **Large document support**: Successfully processed 1.5MB PDFs

### Tested Scenarios
- Small documents (5K chars, 12 chunks)
- Medium documents (13K chars, 30 chunks)
- Large documents (436K chars, 975 chunks)
- Very large documents (1.5MB+ PDFs)
- Multi-document queries across different topics
- Performance optimization with various TopK settings

## 🤝 Contributing

This project demonstrates the power of combining Google's AI Edge technologies to create sophisticated on-device AI applications. The upcoming pipeline builder will make it accessible to create custom RAG workflows visually.

## 📄 License

This project inherits the Apache 2.0 license from the original Google AI Edge projects.

## 🙏 Acknowledgments

- Google AI Edge team for the foundational Gallery and APIs
- MediaPipe team for the efficient on-device inference
- The open-source community for PDF processing and vector search libraries
- React Flow community for the excellent visual workflow library

---

**Edge-GallyRAG**: Bringing the power of RAG to the edge, one Android device at a time! 🚀📱

**Next up**: Visual Pipeline Builder for democratizing RAG workflow creation! 🎨⚡ 