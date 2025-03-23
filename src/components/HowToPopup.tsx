import React, { useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

interface HowToPopupProps {
  isOpen: boolean;
  onClose: () => void;
  issue: string;
  solution: string;
  isLoading?: boolean;
}

export const HowToPopup: React.FC<HowToPopupProps> = ({ 
  isOpen, 
  onClose, 
  issue, 
  solution,
  isLoading = false 
}) => {
  // Close popup when Escape key is pressed
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    
    // Prevent scrolling when popup is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Close popup when clicking outside the content
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Format solution text to properly display markdown
  const formatSolution = (text: string) => {
    if (!text) return '';
    
    // Step 1: Replace code blocks with styled HTML
    let formattedText = text.replace(
      /```(\w*)\n([\s\S]*?)```/g, 
      (_, language, code) => `
        <div class="code-block">
          <div class="code-header">${language || 'code'}</div>
          <pre class="code-content">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        </div>
      `
    );
    
    // Step 2: Replace inline code with styled spans
    formattedText = formattedText.replace(
      /`([^`]+)`/g,
      '<code class="inline-code">$1</code>'
    );
    
    // Step 3: Replace headers
    formattedText = formattedText.replace(/^### (.*$)/gm, '<h3 class="markdown-h3">$1</h3>');
    formattedText = formattedText.replace(/^## (.*$)/gm, '<h2 class="markdown-h2">$1</h2>');
    formattedText = formattedText.replace(/^# (.*$)/gm, '<h1 class="markdown-h1">$1</h1>');
    
    // Step 4: Replace bold and italic text
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Step 5: Replace unordered lists
    formattedText = formattedText.replace(
      /^\s*[-*+]\s+(.*?)$/gm,
      '<li class="markdown-list-item">$1</li>'
    );
    formattedText = formattedText.replace(
      /(<li class="markdown-list-item">.*?<\/li>)\s*\n\s*(?!<li)/g,
      '$1</ul>\n\n'
    );
    formattedText = formattedText.replace(
      /(?<!<\/ul>\s*\n\s*)\s*(<li class="markdown-list-item">)/g,
      '<ul class="markdown-list">$1'
    );
    
    // Step 6: Replace ordered lists
    formattedText = formattedText.replace(
      /^\s*(\d+)\.\s+(.*?)$/gm,
      '<li class="markdown-list-item">$2</li>'
    );
    
    // Step 7: Replace paragraphs (lines that aren't headers, lists, or code blocks)
    formattedText = formattedText.replace(
      /^(?!<[hou]).+$/gm,
      '<p class="markdown-paragraph">$&</p>'
    );
    
    // Step 8: Replace line breaks with <br> tags
    formattedText = formattedText.replace(/\n\n/g, '<br><br>');
    
    return formattedText;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto animate-fadeIn shadow-xl shadow-blue-500/10">
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
          <h3 className="text-lg font-semibold text-white">How to Fix This Issue</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-700/50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <h4 className="text-sm font-medium text-slate-400 mb-2">Issue:</h4>
            <p className="text-slate-300 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">{issue}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-emerald-400 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Solution:
            </h4>
            <div className="text-slate-300 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 min-h-[150px] solution-content">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-[150px] text-center">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                  <p className="text-slate-400">Generating personalized solution with AI...</p>
                </div>
              ) : solution ? (
                <div dangerouslySetInnerHTML={{ __html: formatSolution(solution) }} />
              ) : (
                <p className="text-slate-400 italic">Loading solution...</p>
              )}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-slate-700 flex justify-end bg-slate-800/30">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20"
            disabled={isLoading}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}; 