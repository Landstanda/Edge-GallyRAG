# TODO: On-Device RAG Integration into AI Edge Gallery

This document outlines the plan to integrate an on-device Retrieval-Augmented Generation (RAG) pipeline into the AI Edge Gallery application. The goal is to replace the backend of the "AI Chat" feature with this RAG pipeline, while leaving the entire Gallery UI unchanged.

---

### **Phase 1: Project Setup and Dependencies**

1.  **[✓] Reset Workspace:** The workspace has been reset to clean clones of `gallery` and `ai-edge-apis`.

2.  **[  ] Add Dependencies:**
    *   Locate the app-level Gradle file at `gallery/Android/build.gradle.kts`.
    *   Add the necessary dependencies for the RAG SDK, MediaPipe, and a PDF parsing library.
    ```groovy
    // RAG and GenAI SDKs
    implementation("com.google.ai.edge.localagents:localagents-rag:0.1.0")
    implementation("com.google.mediapipe:tasks-genai:0.10.22")

    // For parsing PDF documents
    implementation("com.tom-roush:pdfbox-android:2.0.27.0")
    ```

3.  **[  ] Acquire and Place Data:**
    *   Download the source document for our knowledge base. A search for "Fruit and Nut Tree, and Grapevines List for Yolo County" yields a PDF from the University of California. I will download this.
    *   Place the downloaded PDF file inside the Gallery app's assets folder at `gallery/Android/src/app/src/main/assets/`. Let's name it `yolo_county_fruit_trees.pdf`.

---

### **Phase 2: Implement the RAG Pipeline**

1.  **[  ] Create Pipeline Class:**
    *   Create a new Kotlin file named `RagPipeline.kt` inside the `gallery` source code at `gallery/Android/src/app/src/main/java/com/google/ai/edge/gallery/rag/`.
    *   This class will encapsulate all RAG logic, inspired by the pipeline in the `ai-edge-apis` sample.

2.  **[  ] Initialize Core Components:**
    *   Inside `RagPipeline.kt`, set up the primary components for the RAG chain.
        *   **LLM:** Configure `MediaPipeLlmBackend` to use the Gemma model from the device path (`/data/local/tmp/gemma3-1b-it-int4.task`).
        *   **Embedder:** Configure `GeckoEmbeddingModel` to use the Gecko model and tokenizer from the device (`/data/local/tmp/gecko.tflite` and `/data/local/tmp/sentencepiece.model`).
        *   **Vector Store:** Configure `SqliteVectorStore` with an embedding dimension of 768.
        *   **Chain:** Instantiate a `RetrievalAndInferenceChain` using the components above.

3.  **[  ] Implement Data Ingestion:**
    *   Create a public function `memorizePdf(context: Context, assetName: String)` in `RagPipeline.kt`.
    *   This function will run asynchronously and perform the following steps:
        1.  Open the PDF from assets using the `pdfbox-android` library.
        2.  Extract the full text content.
        3.  Use a `FixedSizeChunker` (e.g., 512 characters with 64 overlap) to split the text into manageable chunks.
        4.  Pass the list of text chunks to the RAG SDK's memory to be embedded and stored in the SQLite database.

---

### **Phase 3: Integrate Pipeline into ViewModel**

1.  **[  ] Locate the ViewModel:**
    *   Find the existing ViewModel responsible for handling the chat logic. This is likely `LlmSingleTurnViewModel.kt` or a similarly named file in the `gallery` source.

2.  **[  ] Inject the RAG Pipeline:**
    *   In the identified ViewModel, create an instance of our new `RagPipeline`.
    *   In the ViewModel's `init` block, call `ragPipeline.memorizePdf()` to begin indexing the document as soon as the ViewModel is created.

3.  **[  ] Reroute the Chat Logic:**
    *   Find the function that currently sends the user's prompt directly to the LLM (e.g., `sendMessage` or `generateResponse`).
    *   Replace the body of this function with a call to the RAG chain, as per the instructions:
    ```kotlin
    // New implementation for the chat function
    val request = RetrievalRequest.create(prompt, RetrievalConfig.create(topK = 3))
    val response = ragPipeline.retrievalAndInferenceChain.invoke(request, null).await()
    return response.text
    ```

---

### **Phase 4: Set Up On-Device Models**

1.  **[  ] Manually Download Models:**
    *   **Gemma:** User must log in to Hugging Face, accept the terms on the [Gemma3-1B-IT model page](https://huggingface.co/litert-community/Gemma3-1B-IT), and download the `gemma3-1b-it-int4.task` file.
    *   **Gecko & Tokenizer:** Download `Gecko_256_quant.tflite` and `sentencepiece.model` from the [Gecko Hugging Face page](https://huggingface.co/litert-community/Gecko-110m-en).
    *   Place all three files into a local `models/` directory for easy access.

2.  **[  ] Push Models to Device:**
    *   Use `adb` to push the models to the required on-device location.
    ```powershell
    adb push models/gemma3-1b-it-int4.task /data/local/tmp/gemma3-1b-it-int4.task
    adb push models/Gecko_256_quant.tflite /data/local/tmp/gecko.tflite
    adb push models/sentencepiece.model /data/local/tmp/sentencepiece.model
    ```

---

### **Phase 5: Build and Deploy**

1.  **[  ] Execute the Build Command:**
    *   Run the final, all-in-one command we developed previously, ensuring the `cd` path points to the `gallery` project. This command sets the required environment variables for the session and runs the build.
    *   **Run this exact command from the project root (`/c/Users/viaco/Desktop/automation/Galaxy`).**

    ```powershell
    $env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-17.0.15.6-hotspot'; $env:ANDROID_HOME="$env:USERPROFILE\android-sdk"; cd gallery/Android; ./gradlew installDebug
    ```
2.  **[  ] Test:**
    *   Open the "AI Edge Gallery" app (the name will not change).
    *   Navigate to the "AI Chat" feature.
    *   Ask a question about fruit trees specific to Yolo County (e.g., "What apple varieties grow well in Yolo county?") and verify that the answer is grounded in the provided document. 