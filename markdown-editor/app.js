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
            helpBtn: document.getElementById('helpBtn')
        };
    }

    /**
     * Initialize the application
     */
    initialize() {
        this.setupEventListeners();
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
        
        // Debounce the preview update for better performance
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.updatePreview();
            this.updateSaveStatus('Ready');
        }, 300);
    }

    /**
     * Update the preview pane
     */
    updatePreview() {
        const markdown = this.elements.markdownInput.value;
        const html = this.parser.parse(markdown);
        this.elements.previewPane.innerHTML = html;
    }

    /**
     * Update word and character count
     */
    updateWordCount() {
        const text = this.elements.markdownInput.value;
        const words = text.trim().split(/\\s+/).filter(word => word.length > 0);
        const characters = text.length;
        
        this.elements.wordCount.textContent = `${words.length} words`;
        this.elements.charCount.textContent = `${characters} characters`;
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
        const content = this.elements.markdownInput.value;
        const filename = this.generateFilename('.md');
        this.downloadFile(content, filename, 'text/markdown');
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
        
        // F11: Toggle fullscreen
        if (e.key === 'F11') {
            e.preventDefault();
            this.toggleFullscreenPreview();
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
     * Download file
     */
    downloadFile(content, filename, mimeType) {
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
Markdown Editor - Keyboard Shortcuts:

• Ctrl/Cmd + S: Save as Markdown
• Ctrl/Cmd + P: Print or Save as PDF
• Ctrl/Cmd + D: Clear editor
• F11: Toggle fullscreen preview

Markdown Syntax:
• # Header 1
• ## Header 2
• **Bold** or __Bold__
• *Italic* or _Italic_
• [Link](url)
• ![Image](url)
• \`Code\`
• > Blockquote
• - List item
• 1. Numbered list

Features:
• Real-time preview
• Auto-save every 10 seconds
• Drag & drop files
• Export to HTML/PDF
• Copy HTML to clipboard
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
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MarkdownEditor();
});