import React, { useState, useRef } from 'react';
import { Bold, Italic, Heading, Link, Image, Quote, Code, List, Eye, Edit3 } from 'lucide-react';

// Custom Markdown to HTML regex-based parser
export const parseMarkdown = (markdown) => {
  if (!markdown) return '';
  let html = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 1. Code Blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre style="background:var(--bg-body); padding:1rem; border-radius:6px; overflow-x:auto; border:1px solid var(--border-color); font-family:monospace; margin-bottom:1rem; color:var(--text-main)"><code>$1</code></pre>');

  // 2. Inline Code
  html = html.replace(/`([^`]+)`/g, '<code style="background:var(--border-color); padding:2px 6px; border-radius:4px; font-family:monospace;">$1</code>');

  // 3. Headers
  html = html.replace(/^\s*### (.*$)/gim, '<h3 style="margin: 1.2rem 0 0.6rem; font-weight:700;">$1</h3>');
  html = html.replace(/^\s*## (.*$)/gim, '<h2 style="margin: 1.5rem 0 0.8rem; font-weight:700; border-bottom:1px solid var(--border-color); padding-bottom:0.3rem;">$1</h2>');
  html = html.replace(/^\s*# (.*$)/gim, '<h1 style="margin: 2rem 0 1rem; font-weight:800;">$1</h1>');

  // 4. Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // 5. Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // 6. Blockquotes
  html = html.replace(/^\s*>\s*(.*$)/gim, '<blockquote style="border-left: 4px solid var(--color-primary); padding: 0.5rem 1rem; margin: 1rem 0; background: var(--color-primary-light); border-radius: 0 6px 6px 0; font-style: italic; color: var(--text-muted);">$1</blockquote>');

  // 7. Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%; height:auto; border-radius:8px; margin: 1rem 0; box-shadow:var(--shadow-sm);" />');

  // 8. Links
  html = html.replace(/\[([^\]]*)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--color-primary); text-decoration:underline; font-weight:600;">$1</a>');

  // 9. Unordered Lists
  html = html.replace(/^\s*-\s*(.*$)/gim, '<li style="margin-left: 1.5rem; margin-bottom: 0.4rem;">$1</li>');

  // Combine consecutive list items
  // Since we replace line by line, wraps list elements
  // Simple approximation: check if list items exist and wrap them
  
  // 10. Paragraph splits on double newlines
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map(p => {
      // If paragraph contains headers or list items or code blocks, don't wrap in <p>
      if (p.trim().startsWith('<h') || p.trim().startsWith('<blockquote') || p.trim().startsWith('<pre') || p.trim().startsWith('<li')) {
        return p;
      }
      return `<p style="line-height:1.7; margin-bottom:1rem; font-size:1.05rem;">${p}</p>`;
    })
    .join('\n');

  // Single newlines become breaklines
  html = html.replace(/\n/g, '<br />');

  // Clean up duplicate <br> inside tags
  html = html.replace(/<br \/><li/g, '<li');
  html = html.replace(/<\/li><br \/>/g, '</li>');
  html = html.replace(/<br \/><h/g, '<h');
  html = html.replace(/<\/h(\d)><br \/>/g, '</h$1>');
  html = html.replace(/<br \/><pre/g, '<pre');
  html = html.replace(/<\/pre><br \/>/g, '</pre>');
  html = html.replace(/<br \/><blockquote/g, '<blockquote');
  html = html.replace(/<\/blockquote><br \/>/g, '</blockquote>');

  return html;
};

const MarkdownEditor = ({ value, onChange, placeholder = 'Write your story in markdown...' }) => {
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'preview' | 'split'
  const textareaRef = useRef(null);

  // Helper to insert markdown tags at selection
  const insertMarkdown = (syntaxBefore, syntaxAfter = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    const replacement = syntaxBefore + (selectedText || 'text') + syntaxAfter;

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    onChange(newValue);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + syntaxBefore.length,
        start + syntaxBefore.length + (selectedText || 'text').length
      );
    }, 0);
  };

  const toolbarButtons = [
    { icon: <Bold size={16} />, label: 'Bold', action: () => insertMarkdown('**', '**') },
    { icon: <Italic size={16} />, label: 'Italic', action: () => insertMarkdown('*', '*') },
    { icon: <Heading size={16} />, label: 'Header', action: () => insertMarkdown('## ', '\n') },
    { icon: <Link size={16} />, label: 'Link', action: () => insertMarkdown('[', '](https://example.com)') },
    { icon: <Image size={16} />, label: 'Image', action: () => insertMarkdown('![Image description](', ')') },
    { icon: <Quote size={16} />, label: 'Quote', action: () => insertMarkdown('\n> ', '\n') },
    { icon: <Code size={16} />, label: 'Code Block', action: () => insertMarkdown('\n```\n', '\n```\n') },
    { icon: <List size={16} />, label: 'List', action: () => insertMarkdown('\n- ', '\n') },
  ];

  return (
    <div className="form-control" style={editorContainerStyle}>
      {/* Editor Header Toolbar */}
      <div style={toolbarStyle}>
        <div style={shortcutWrapperStyle}>
          {toolbarButtons.map((btn, idx) => (
            <button
              key={idx}
              type="button"
              onClick={btn.action}
              style={toolbarBtnStyle}
              title={btn.label}
            >
              {btn.icon}
            </button>
          ))}
        </div>

        {/* View Toggles */}
        <div style={tabGroupStyle}>
          <button
            type="button"
            style={activeTab === 'write' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('write')}
          >
            <Edit3 size={14} /> Write
          </button>
          <button
            type="button"
            style={activeTab === 'preview' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('preview')}
          >
            <Eye size={14} /> Preview
          </button>
          <button
            type="button"
            className="desktop-only"
            style={activeTab === 'split' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('split')}
          >
            Split View
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div style={bodyWrapperStyle(activeTab)}>
        {/* Textarea Panel */}
        {(activeTab === 'write' || activeTab === 'split') && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={textareaStyle(activeTab)}
          />
        )}

        {/* Preview Panel */}
        {(activeTab === 'preview' || activeTab === 'split') && (
          <div
            className="preview-content"
            style={previewPanelStyle(activeTab)}
            dangerouslySetInnerHTML={{ __html: parseMarkdown(value) || `<p style="color:var(--text-muted); font-style:italic;">Nothing to preview yet...</p>` }}
          />
        )}
      </div>
    </div>
  );
};

// Styles
const editorContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  padding: 0,
  overflow: 'hidden',
  minHeight: '400px',
  height: '500px',
  borderRadius: 'var(--radius-md)',
  borderColor: 'var(--border-color)',
  boxShadow: 'var(--shadow-sm)'
};

const toolbarStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 12px',
  backgroundColor: 'var(--bg-card-hover)',
  borderBottom: '1px solid var(--border-color)',
  flexWrap: 'wrap',
  gap: '8px'
};

const shortcutWrapperStyle = {
  display: 'flex',
  gap: '4px',
  flexWrap: 'wrap'
};

const toolbarBtnStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--text-main)',
  cursor: 'pointer',
  padding: '6px',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.2s',
  ':hover': {
    backgroundColor: 'var(--border-color)'
  }
};

const tabGroupStyle = {
  display: 'flex',
  backgroundColor: 'var(--border-color)',
  padding: '2px',
  borderRadius: '6px',
  gap: '2px'
};

const tabStyle = {
  background: 'none',
  border: 'none',
  fontSize: '0.8rem',
  fontWeight: 600,
  padding: '6px 12px',
  borderRadius: '4px',
  cursor: 'pointer',
  color: 'var(--text-muted)',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  transition: 'all 0.2s'
};

const activeTabStyle = {
  ...tabStyle,
  backgroundColor: 'var(--bg-card)',
  color: 'var(--color-primary)',
  boxShadow: 'var(--shadow-sm)'
};

const bodyWrapperStyle = (tab) => ({
  display: 'grid',
  gridTemplateColumns: tab === 'split' ? '1fr 1fr' : '1fr',
  flex: 1,
  height: 'calc(100% - 46px)',
  overflow: 'hidden'
});

const textareaStyle = (tab) => ({
  width: '100%',
  height: '100%',
  resize: 'none',
  padding: '1.25rem',
  border: 'none',
  background: 'transparent',
  color: 'var(--text-main)',
  fontFamily: 'monospace',
  fontSize: '0.95rem',
  lineHeight: 1.6,
  outline: 'none',
  borderRight: tab === 'split' ? '1px solid var(--border-color)' : 'none',
  overflowY: 'auto'
});

const previewPanelStyle = (tab) => ({
  padding: '1.25rem',
  overflowY: 'auto',
  height: '100%',
  textAlign: 'left',
  backgroundColor: tab === 'split' ? 'var(--bg-card)' : 'transparent',
  wordBreak: 'break-word'
});

// CSS styles to support desktop tab display and hover
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    .desktop-only { display: none !important; }
    @media (min-width: 768px) {
      .desktop-only { display: flex !important; }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default MarkdownEditor;
