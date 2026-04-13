'use client';

import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const [rawText, setRawText] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleConvert = async () => {
    if (!rawText.trim()) return;
    
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      alert('Configuration Error: NEXT_PUBLIC_GEMINI_API_KEY is missing. Please add this environment variable in your Netlify deployment settings.');
      return;
    }
    
    setIsConverting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      
      const stylePrompt = "Convert the following raw text into well-structured Markdown. Use appropriate headings, lists, bold/italic text, blockquotes, and code blocks where applicable.";

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${stylePrompt}\nDo not add any extra conversational text like "Here is the markdown", just output the raw Markdown content.\n\nRaw Text:\n${rawText}`,
      });
      
      setMarkdown(response.text || '');
    } catch (error: any) {
      console.error('Error converting text:', error);
      alert(`Failed to convert text: ${error?.message || 'Unknown error'}. Please check your API key and Netlify logs.`);
    } finally {
      setIsConverting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getNoteTitle()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setRawText('');
    setMarkdown('');
  };

  const getNoteTitle = () => {
    const match = markdown.match(/^#+\s+(.*)$/m);
    let title = match ? match[1].trim().replace(/[\\/:*?"<>|]/g, '') : `Note ${new Date().toLocaleDateString().replace(/\//g, '-')}`;
    if (!title) title = 'Untitled Note';
    return title;
  };

  const getObsidianUrl = () => {
    return `obsidian://new?name=${encodeURIComponent(getNoteTitle())}&content=${encodeURIComponent(markdown)}`;
  };

  return (
    <div className="h-[100dvh] bg-[#000000] text-[#ffffff] font-sans flex flex-col selection:bg-white/30 overflow-hidden">
      <header className="px-6 lg:px-8 py-4 lg:py-6 border-b border-white/10 flex items-center justify-between shrink-0">
        <h1 className="text-xs font-medium tracking-[0.2em] uppercase">Markdown Magic</h1>
        <div className="text-[10px] uppercase tracking-widest text-white/40">AI Formatting Tool</div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Left Pane: Input */}
        <div className="flex-1 lg:w-1/2 p-6 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col overflow-hidden min-h-0">
          <div className="flex justify-between items-center mb-6 lg:mb-10 shrink-0">
            <span className="text-[10px] uppercase tracking-widest text-white/40">01 / Input</span>
            <button
              onClick={handleClear}
              disabled={!rawText && !markdown}
              className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors disabled:opacity-0"
            >
              Clear
            </button>
          </div>
          
          <textarea
            className="flex-1 w-full resize-none outline-none text-lg lg:text-xl font-light leading-relaxed placeholder:text-white/20 bg-transparent text-white/90 overflow-auto min-h-0"
            placeholder="Type or paste your unstructured text here..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
          
          <div className="mt-6 lg:mt-8 pt-6 lg:pt-8 border-t border-white/10 flex justify-end shrink-0">
            <button
              onClick={handleConvert}
              disabled={!rawText.trim() || isConverting}
              className="border border-white/20 rounded-full px-8 py-3 text-sm font-medium hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isConverting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Format Text
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Pane: Output */}
        <div className="flex-1 lg:w-1/2 p-6 lg:p-12 flex flex-col bg-[#050505] overflow-hidden min-h-0">
          <div className="flex justify-between items-center mb-6 lg:mb-10 h-4 shrink-0">
            <span className="text-[10px] uppercase tracking-widest text-white/40">02 / Output</span>
            
            <AnimatePresence>
              {markdown && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-4 lg:gap-6"
                >
                  <button
                    onClick={handleCopy}
                    className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                  >
                    Download
                  </button>
                  <a
                    href={getObsidianUrl()}
                    className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                  >
                    Obsidian
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex-1 overflow-auto relative min-h-0">
            <AnimatePresence mode="wait">
              {markdown ? (
                <motion.div 
                  key="content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="prose prose-invert prose-sm sm:prose-base max-w-none prose-headings:font-normal prose-headings:tracking-tight prose-a:text-white prose-a:underline prose-a:underline-offset-4 prose-pre:bg-[#111] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg pb-8"
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {markdown}
                  </ReactMarkdown>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center text-white/20 text-sm font-light tracking-wide"
                >
                  Output will appear here
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
