/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Node type colors matching the n8n style
        'node-input': '#10b981',      // Green for Input nodes
        'node-processing': '#f59e0b',  // Orange for Processing nodes  
        'node-retrieval': '#3b82f6',  // Blue for Retrieval nodes
        'node-llm': '#8b5cf6',        // Purple for LLM nodes
        'node-logic': '#eab308',      // Yellow for Logic nodes
        'node-output': '#ef4444',     // Red for Output nodes
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
} 