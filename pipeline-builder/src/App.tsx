import { useState, useRef } from 'react';
import { Workflow, Code, Save, Settings, FileText } from 'lucide-react';

import PipelineCanvas, { type PipelineCanvasHandle } from './components/PipelineCanvas';
import { DOCUMENT_QA_TEMPLATE } from './data/templates';
import { generateCodeFromPipeline } from './utils/codeGenerator';
import type { Node, Edge } from '@xyflow/react';

function App() {
  const [currentPipeline, setCurrentPipeline] = useState<string>('Untitled Pipeline');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const canvasRef = useRef<PipelineCanvasHandle>(null);

  const handleSave = (nodes: Node[], edges: Edge[]) => {
    console.log('Saving pipeline:', { nodes, edges });
    // TODO: Implement save functionality
    alert(`Pipeline saved! Nodes: ${nodes.length}, Edges: ${edges.length}`);
  };

  const handleLoadTemplate = () => {
    if (canvasRef.current) {
      canvasRef.current.loadTemplate(DOCUMENT_QA_TEMPLATE);
      setCurrentPipeline(DOCUMENT_QA_TEMPLATE.name);
    }
  };

  const handleGenerate = (nodes: Node[], edges: Edge[]) => {
    console.log('Generating Kotlin code for:', { nodes, edges });
    
    // Generate real Kotlin code using our code generator
    const codeResult = generateCodeFromPipeline(nodes, edges, currentPipeline);
    
    if (codeResult.success && codeResult.kotlinCode) {
      setGeneratedCode(codeResult.kotlinCode);
      console.log('✅ Code generation successful!');
      if (codeResult.warnings.length > 0) {
        console.warn('⚠️ Warnings:', codeResult.warnings);
      }
    } else {
      // Show error in generated code
      const errorCode = `/*
❌ CODE GENERATION FAILED

Errors:
${codeResult.errors.map(err => `- ${err}`).join('\n')}

Warnings:
${codeResult.warnings.map(warn => `- ${warn}`).join('\n')}

Please fix the pipeline structure and try again.
*/

// Pipeline Analysis Results:
// Nodes: ${nodes.length}
// Edges: ${edges.length}
// Validation Status: ${codeResult.success ? 'PASSED' : 'FAILED'}

${codeResult.kotlinCode || '// No code generated due to errors'}`;
      
      setGeneratedCode(errorCode);
      console.error('❌ Code generation failed:', codeResult.errors);
    }
    
    setShowCodeModal(true);
  };

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <div className="flex items-center mr-6">
            <Workflow className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Edge-GallyRAG Pipeline Builder
              </h1>
              <p className="text-sm text-gray-600">
                Visual RAG workflow creator for Android Edge AI
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 mr-4">
            Pipeline: <span className="font-medium">{currentPipeline}</span>
          </span>
          
          <button className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings size={16} className="mr-2" />
            Settings
          </button>
          
          <div className="w-px h-6 bg-gray-300" />
          
          <button 
            onClick={handleLoadTemplate}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            <FileText size={16} className="mr-2" />
            Load Template
          </button>
          
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <Save size={16} className="mr-2" />
            Save
          </button>
          
          <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm">
            <Code size={16} className="mr-2" />
            Generate
          </button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main style={{ flex: 1, overflow: 'hidden' }}>
        <PipelineCanvas ref={canvasRef} onSave={handleSave} onGenerate={handleGenerate} />
      </main>

      {/* Code Generation Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center">
                <Code className="w-6 h-6 text-purple-600 mr-3" />
                <h2 className="text-xl font-semibold">Generated Kotlin Code</h2>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-auto font-mono">
                {generatedCode}
              </pre>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => navigator.clipboard.writeText(generatedCode)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setShowCodeModal(false)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <footer className="bg-white border-t border-gray-200 px-6 py-2 text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>🚀 Edge-GallyRAG Pipeline Builder v1.0</span>
            <span>•</span>
            <span>React Flow + n8n Style Interface</span>
            <span>•</span>
            <span>Generate Android/Kotlin Code</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
