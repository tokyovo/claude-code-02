/**
 * Markdown Editor Application
 * Main application logic and event handlers
 */

class MarkdownEditor {
    constructor() {
        this.parser = new MarkdownParser();
        this.elements = this.initializeElements();
        this.debounceTimer = null;
        this.autoSaveTimer = null;
        this.initialize();
    }

    /**
     * Get references to DOM elements
     */
    initializeElements() {
        return {
            markdownInput: document.getElementById('markdownInput'),
            previewPane: document.getElementById('previewPane'),
            saveMarkdownBtn: document.getElementById('saveMarkdownBtn'),
            saveHtmlBtn: document.getElementById('saveHtmlBtn'),
            printBtn: document.getElementById('printBtn'),
            clearBtn: document.getElementById('clearBtn'),
            copyHtmlBtn: document.getElementById('copyHtmlBtn'),
            fullscreenBtn: document.getElementById('fullscreenBtn'),
            fileInput: document.getElementById('fileInput'),
            wordCount: document.getElementById('wordCount'),
            charCount: document.getElementById('charCount'),
            saveStatus: document.getElementById('saveStatus'),
            helpBtn: document.getElementById('helpBtn'),
            // Toolbar buttons
            boldBtn: document.getElementById('boldBtn'),
            italicBtn: document.getElementById('italicBtn'),
            strikeBtn: document.getElementById('strikeBtn'),
            h1Btn: document.getElementById('h1Btn'),
            h2Btn: document.getElementById('h2Btn'),
            h3Btn: document.getElementById('h3Btn'),
            linkBtn: document.getElementById('linkBtn'),
            imageBtn: document.getElementById('imageBtn'),
            codeBtn: document.getElementById('codeBtn'),
            blockCodeBtn: document.getElementById('blockCodeBtn'),
            listBtn: document.getElementById('listBtn'),
            numListBtn: document.getElementById('numListBtn'),
            quoteBtn: document.getElementById('quoteBtn'),
            hrBtn: document.getElementById('hrBtn'),
            themeBtn: document.getElementById('themeBtn')
        };
    }

    /**
     * Initialize the application
     */
    initialize() {
        this.setupEventListeners();
        this.loadTheme();
        this.loadAutoSavedContent();
        this.updatePreview();
        this.updateWordCount();
        this.updateSaveStatus('Ready');
        
        // Focus on the editor
        this.elements.markdownInput.focus();
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Editor input events
        this.elements.markdownInput.addEventListener('input', () => {
            this.handleInput();
        });

        // Button events
        this.elements.saveMarkdownBtn.addEventListener('click', () => {
            this.saveAsMarkdown();
        });

        this.elements.saveHtmlBtn.addEventListener('click', () => {
            this.saveAsHtml();
        });

        this.elements.printBtn.addEventListener('click', () => {
            this.printDocument();
        });

        this.elements.clearBtn.addEventListener('click', () => {
            this.clearEditor();
        });

        this.elements.copyHtmlBtn.addEventListener('click', () => {
            this.copyHtmlToClipboard();
        });

        this.elements.fullscreenBtn.addEventListener('click', () => {
            this.toggleFullscreenPreview();
        });

        this.elements.helpBtn.addEventListener('click', () => {
            this.showHelp();
        });

        // Toolbar button events
        this.elements.boldBtn.addEventListener('click', () => {
            this.formatSelection('**', '**');
        });

        this.elements.italicBtn.addEventListener('click', () => {
            this.formatSelection('*', '*');
        });

        this.elements.strikeBtn.addEventListener('click', () => {
            this.formatSelection('~~', '~~');
        });

        this.elements.h1Btn.addEventListener('click', () => {
            this.formatLine('# ');
        });

        this.elements.h2Btn.addEventListener('click', () => {
            this.formatLine('## ');
        });

        this.elements.h3Btn.addEventListener('click', () => {
            this.formatLine('### ');
        });

        this.elements.linkBtn.addEventListener('click', () => {
            this.insertLink();
        });

        this.elements.imageBtn.addEventListener('click', () => {
            this.insertImage();
        });

        this.elements.codeBtn.addEventListener('click', () => {
            this.formatSelection('`', '`');
        });

        this.elements.blockCodeBtn.addEventListener('click', () => {
            this.insertCodeBlock();
        });

        this.elements.listBtn.addEventListener('click', () => {
            this.formatLine('- ');
        });

        this.elements.numListBtn.addEventListener('click', () => {
            this.formatLine('1. ');
        });

        this.elements.quoteBtn.addEventListener('click', () => {
            this.formatLine('> ');
        });

        this.elements.hrBtn.addEventListener('click', () => {
            this.insertHorizontalRule();
        });

        this.elements.themeBtn.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // File drag and drop
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleFileDrop(e);
        });

        // Auto-save
        this.startAutoSave();
    }

    /**
     * Handle input changes with debouncing
     */
    handleInput() {
        this.updateSaveStatus('Typing...');
        this.updateWordCount();
        
        // Dynamic debouncing based on content length for better performance
        const content = this.elements.markdownInput.value;
        const debounceTime = content.length > 10000 ? 500 : content.length > 5000 ? 400 : 300;
        
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.updatePreview();
            this.updateSaveStatus('Ready');
        }, debounceTime);
    }

    /**
     * Update the preview pane with performance optimization
     */
    updatePreview() {
        try {
            const markdown = this.elements.markdownInput.value;
            
            // Performance monitoring for large documents
            const startTime = performance.now();
            const html = this.parser.parse(markdown);
            const parseTime = performance.now() - startTime;
            
            // Use requestAnimationFrame for smooth updates
            requestAnimationFrame(() => {
                this.elements.previewPane.innerHTML = html;
                
                // Performance warning for very slow parsing
                if (parseTime > 100) {
                    console.warn(`Markdown parsing took ${parseTime.toFixed(2)}ms - consider breaking down large documents`);
                }
                
                // Update performance stats in footer (if enabled)
                this.updatePerformanceStats(parseTime, markdown.length);
            });
            
        } catch (error) {
            console.error('Error updating preview:', error);
            this.elements.previewPane.innerHTML = '<p style="color: red;">Error rendering preview. Please check your Markdown syntax.</p>';
            this.showToast('Preview render error - check console for details');
        }
    }

    /**
     * Update word and character count
     */
    updateWordCount() {
        try {
            const text = this.elements.markdownInput.value;
            const words = text.trim().split(/\s+/).filter(word => word.length > 0);
            const characters = text.length;
            
            this.elements.wordCount.textContent = `${words.length} words`;
            this.elements.charCount.textContent = `${characters} characters`;
            
            // Performance warning for very large documents
            if (characters > 100000) {
                this.elements.charCount.style.color = 'var(--danger-color)';
                this.elements.charCount.title = 'Large document - may impact performance';
            } else {
                this.elements.charCount.style.color = '';
                this.elements.charCount.title = '';
            }
        } catch (error) {
            console.error('Error updating word count:', error);
        }
    }

    /**
     * Update performance statistics
     */
    updatePerformanceStats(parseTime, contentLength) {
        // Only show performance stats in development or when explicitly enabled
        if (window.location.search.includes('debug=true')) {
            const perfInfo = `Parse: ${parseTime.toFixed(1)}ms | Size: ${(contentLength/1000).toFixed(1)}k`;
            
            // Update footer with performance info
            let perfElement = document.getElementById('perf-stats');
            if (!perfElement) {
                perfElement = document.createElement('span');
                perfElement.id = 'perf-stats';
                perfElement.style.cssText = 'font-size: 0.7rem; color: var(--text-muted); margin-left: auto;';
                this.elements.saveStatus.parentElement.appendChild(perfElement);
            }
            perfElement.textContent = perfInfo;
        }
    }

    /**
     * Update save status indicator
     */
    updateSaveStatus(status) {
        this.elements.saveStatus.textContent = status;
        this.elements.saveStatus.className = 'save-status';
        
        if (status === 'Saving...') {
            this.elements.saveStatus.classList.add('saving');
        } else if (status === 'Saved') {
            this.elements.saveStatus.classList.add('saved');
        }
    }

    /**
     * Save content as Markdown file
     */
    saveAsMarkdown() {
        try {
            const content = this.elements.markdownInput.value;
            if (!content.trim()) {
                this.showToast('Cannot save empty document');
                return;
            }
            const filename = this.generateFilename('.md');
            this.downloadFile(content, filename, 'text/markdown');
        } catch (error) {
            console.error('Error saving Markdown:', error);
            this.showToast('Failed to save Markdown file');
        }
    }

    /**
     * Save content as HTML file
     */
    saveAsHtml() {
        const markdownContent = this.elements.markdownInput.value;
        const htmlContent = this.parser.parse(markdownContent);
        
        const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown Document</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
        }
        h1, h2 { border-bottom: 1px solid #eee; padding-bottom: 0.3rem; }
        code { 
            background-color: #f6f8fa; 
            padding: 0.2em 0.4em; 
            border-radius: 3px;
            font-family: 'Consolas', 'Monaco', monospace;
        }
        pre { 
            background-color: #f6f8fa; 
            padding: 1rem; 
            border-radius: 6px;
            overflow-x: auto;
        }
        blockquote { 
            border-left: 4px solid #dfe2e5; 
            padding-left: 1rem; 
            color: #6a737d;
        }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #dfe2e5; padding: 0.5rem; text-align: left; }
        th { background-color: #f6f8fa; }
    </style>
</head>
<body>
${htmlContent}
</body>
</html>`;
        
        const filename = this.generateFilename('.html');
        this.downloadFile(fullHtml, filename, 'text/html');
    }

    /**
     * Print or save as PDF
     */
    printDocument() {
        window.print();
    }

    /**
     * Clear the editor
     */
    clearEditor() {
        if (confirm('Are you sure you want to clear the editor? This action cannot be undone.')) {
            this.elements.markdownInput.value = '';
            this.updatePreview();
            this.updateWordCount();
            this.elements.markdownInput.focus();
            localStorage.removeItem('markdownEditor_autoSave');
        }
    }

    /**
     * Copy HTML to clipboard
     */
    async copyHtmlToClipboard() {
        const html = this.elements.previewPane.innerHTML;
        try {
            await navigator.clipboard.writeText(html);
            this.showToast('HTML copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy HTML: ', err);
            this.showToast('Failed to copy HTML');
        }
    }

    /**
     * Toggle fullscreen preview
     */
    toggleFullscreenPreview() {
        const previewPanel = document.querySelector('.preview-panel');
        const editorPanel = document.querySelector('.editor-panel');
        const divider = document.querySelector('.panel-divider');
        
        if (previewPanel.classList.contains('fullscreen')) {
            // Exit fullscreen
            previewPanel.classList.remove('fullscreen');
            editorPanel.style.display = 'flex';
            divider.style.display = 'block';
            this.elements.fullscreenBtn.textContent = '🔳';
        } else {
            // Enter fullscreen
            previewPanel.classList.add('fullscreen');
            editorPanel.style.display = 'none';
            divider.style.display = 'none';
            this.elements.fullscreenBtn.textContent = '📄';
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + S: Save as Markdown
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.saveAsMarkdown();
        }
        
        // Ctrl/Cmd + P: Print
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            this.printDocument();
        }
        
        // Ctrl/Cmd + D: Clear
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            this.clearEditor();
        }
        
        // Ctrl/Cmd + B: Bold
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            this.formatSelection('**', '**');
        }
        
        // Ctrl/Cmd + I: Italic
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
            e.preventDefault();
            this.formatSelection('*', '*');
        }
        
        // Ctrl/Cmd + K: Link
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.insertLink();
        }
        
        // Ctrl/Cmd + Shift + K: Image
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'K') {
            e.preventDefault();
            this.insertImage();
        }
        
        // Ctrl/Cmd + E: Code
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            this.formatSelection('`', '`');
        }
        
        // Ctrl/Cmd + Shift + C: Code block
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            this.insertCodeBlock();
        }
        
        // Ctrl/Cmd + L: List
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            this.formatLine('- ');
        }
        
        // Ctrl/Cmd + Shift + L: Numbered list
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
            e.preventDefault();
            this.formatLine('1. ');
        }
        
        // Ctrl/Cmd + Q: Quote
        if ((e.ctrlKey || e.metaKey) && e.key === 'q') {
            e.preventDefault();
            this.formatLine('> ');
        }
        
        // Ctrl/Cmd + H: Headers
        if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
            e.preventDefault();
            this.formatLine('# ');
        }
        
        // Ctrl/Cmd + 1-6: Headers
        if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '6') {
            e.preventDefault();
            const level = '#'.repeat(parseInt(e.key));
            this.formatLine(level + ' ');
        }
        
        // F11: Toggle fullscreen
        if (e.key === 'F11') {
            e.preventDefault();
            this.toggleFullscreenPreview();
        }
        
        // Escape: Exit fullscreen
        if (e.key === 'Escape') {
            const previewPanel = document.querySelector('.preview-panel');
            if (previewPanel.classList.contains('fullscreen')) {
                this.toggleFullscreenPreview();
            }
        }
    }

    /**
     * Handle file drop
     */
    handleFileDrop(e) {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'text/markdown' || file.name.endsWith('.md') || file.type === 'text/plain') {
                this.loadFile(file);
            } else {
                this.showToast('Please drop a Markdown (.md) or text file');
            }
        }
    }

    /**
     * Load file content
     */
    loadFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.elements.markdownInput.value = e.target.result;
            this.updatePreview();
            this.updateWordCount();
            this.showToast(`Loaded: ${file.name}`);
        };
        reader.readAsText(file);
    }

    /**
     * Generate filename with timestamp
     */
    generateFilename(extension) {
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
        return `markdown-document-${timestamp}${extension}`;
    }

    /**
     * Download file with error handling
     */
    downloadFile(content, filename, mimeType) {
        try {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast(`Downloaded: ${filename}`);
        } catch (error) {
            console.error('Download failed:', error);
            this.showToast('Download failed - please try again');
        }
    }

    /**
     * Auto-save functionality
     */
    startAutoSave() {
        this.autoSaveTimer = setInterval(() => {
            const content = this.elements.markdownInput.value;
            if (content.trim()) {
                localStorage.setItem('markdownEditor_autoSave', content);
                localStorage.setItem('markdownEditor_autoSave_timestamp', Date.now());
            }
        }, 10000); // Auto-save every 10 seconds
    }

    /**
     * Load auto-saved content
     */
    loadAutoSavedContent() {
        const saved = localStorage.getItem('markdownEditor_autoSave');
        const timestamp = localStorage.getItem('markdownEditor_autoSave_timestamp');
        
        if (saved && timestamp) {
            const savedDate = new Date(parseInt(timestamp));
            const timeDiff = Date.now() - savedDate.getTime();
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            
            // Only restore if saved within the last 24 hours
            if (hoursDiff < 24) {
                if (confirm(`Found auto-saved content from ${savedDate.toLocaleString()}. Restore it?`)) {
                    this.elements.markdownInput.value = saved;
                }
            }
        }
    }

    /**
     * Show help dialog
     */
    showHelp() {
        const helpContent = `
📝 MARKDOWN EDITOR - HELP & SHORTCUTS

🔧 FILE OPERATIONS:
• Ctrl/Cmd + S: Save as Markdown
• Ctrl/Cmd + P: Print or Save as PDF
• Ctrl/Cmd + D: Clear editor
• Drag & drop: Load .md/.txt files

✨ FORMATTING SHORTCUTS:
• Ctrl/Cmd + B: **Bold**
• Ctrl/Cmd + I: *Italic*
• Ctrl/Cmd + E: \`Code\`
• Ctrl/Cmd + K: [Link]
• Ctrl/Cmd + Shift + K: ![Image]
• Ctrl/Cmd + Shift + C: Code Block
• Ctrl/Cmd + L: • List
• Ctrl/Cmd + Shift + L: 1. Numbered List
• Ctrl/Cmd + Q: > Quote
• Ctrl/Cmd + H: # Header
• Ctrl/Cmd + 1-6: # Headers (H1-H6)

🖥️ VIEW OPTIONS:
• F11: Toggle fullscreen preview
• Escape: Exit fullscreen
• 🌙/☀️: Toggle dark/light theme

📋 MARKDOWN SYNTAX:
• Headers: # H1, ## H2, ### H3
• Bold: **text** or __text__
• Italic: *text* or _text_
• Links: [text](url)
• Images: ![alt](url)
• Code: \`inline\` or \`\`\`block\`\`\`
• Lists: - item or 1. item
• Tasks: - [x] done, - [ ] todo
• Quote: > text
• Horizontal rule: ---
• Tables: | col1 | col2 |

🚀 FEATURES:
• Live preview with syntax highlighting
• Auto-save every 10 seconds to localStorage
• Export to Markdown, HTML, or PDF
• Dark/light theme with system preference
• Full GitHub Flavored Markdown support
• Accessibility optimized (WCAG 2.1 AA)
• Responsive design for mobile devices
        `;
        
        alert(helpContent);
    }

    /**
     * Show toast notification
     */
    showToast(message) {
        // Simple toast implementation
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // Fade in
        setTimeout(() => toast.style.opacity = '1', 100);
        
        // Fade out and remove
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    /**
     * Format selected text with prefix and suffix
     */
    formatSelection(prefix, suffix) {
        const textarea = this.elements.markdownInput;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        
        const formattedText = prefix + selectedText + suffix;
        
        // Replace selected text
        textarea.setRangeText(formattedText, start, end);
        
        // Set cursor position
        if (selectedText === '') {
            // No selection: place cursor between prefix and suffix
            textarea.selectionStart = textarea.selectionEnd = start + prefix.length;
        } else {
            // Had selection: select the formatted text
            textarea.selectionStart = start;
            textarea.selectionEnd = start + formattedText.length;
        }
        
        textarea.focus();
        this.handleInput();
    }

    /**
     * Format current line with prefix
     */
    formatLine(prefix) {
        const textarea = this.elements.markdownInput;
        const start = textarea.selectionStart;
        const value = textarea.value;
        
        // Find the start of current line
        let lineStart = value.lastIndexOf('\n', start - 1) + 1;
        
        // Insert prefix at line start
        const newValue = value.substring(0, lineStart) + prefix + value.substring(lineStart);
        textarea.value = newValue;
        
        // Set cursor position after prefix
        textarea.selectionStart = textarea.selectionEnd = lineStart + prefix.length;
        textarea.focus();
        this.handleInput();
    }

    /**
     * Insert link
     */
    insertLink() {
        const url = prompt('Enter URL:');
        if (url) {
            const text = prompt('Enter link text:', url);
            const linkMarkdown = `[${text || url}](${url})`;
            this.insertAtCursor(linkMarkdown);
        }
    }

    /**
     * Insert image
     */
    insertImage() {
        const url = prompt('Enter image URL:');
        if (url) {
            const alt = prompt('Enter alt text:', 'Image');
            const imageMarkdown = `![${alt || 'Image'}](${url})`;
            this.insertAtCursor(imageMarkdown);
        }
    }

    /**
     * Insert code block
     */
    insertCodeBlock() {
        const language = prompt('Enter language (optional):', 'javascript');
        const codeBlock = `\`\`\`${language || ''}\n\n\`\`\``;
        this.insertAtCursor(codeBlock);
        
        // Place cursor inside code block
        const textarea = this.elements.markdownInput;
        const pos = textarea.selectionStart - 4; // Before closing ```
        textarea.selectionStart = textarea.selectionEnd = pos;
    }

    /**
     * Insert horizontal rule
     */
    insertHorizontalRule() {
        this.insertAtCursor('\n---\n');
    }

    /**
     * Insert text at cursor position
     */
    insertAtCursor(text) {
        const textarea = this.elements.markdownInput;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        textarea.setRangeText(text, start, end);
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();
        this.handleInput();
    }

    /**
     * Toggle dark/light theme
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('markdownEditor_theme', newTheme);
        
        // Update theme button icon
        this.elements.themeBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        
        this.showToast(`Switched to ${newTheme} theme`);
    }

    /**
     * Load saved theme
     */
    loadTheme() {
        const savedTheme = localStorage.getItem('markdownEditor_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.elements.themeBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MarkdownEditor();
});