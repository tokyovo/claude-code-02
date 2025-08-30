/**
 * Markdown Parser Module
 * Converts Markdown text to HTML using regular expressions
 */

class MarkdownParser {
    constructor() {
        this.rules = this.initializeRules();
    }

    /**
     * Initialize parsing rules with regex patterns
     */
    initializeRules() {
        return [
            // Headers (h1-h6)
            { pattern: /^#{6}\s+(.+)$/gm, replacement: '<h6>$1</h6>' },
            { pattern: /^#{5}\s+(.+)$/gm, replacement: '<h5>$1</h5>' },
            { pattern: /^#{4}\s+(.+)$/gm, replacement: '<h4>$1</h4>' },
            { pattern: /^#{3}\s+(.+)$/gm, replacement: '<h3>$1</h3>' },
            { pattern: /^#{2}\s+(.+)$/gm, replacement: '<h2>$1</h2>' },
            { pattern: /^#\s+(.+)$/gm, replacement: '<h1>$1</h1>' },
            
            // Horizontal rules
            { pattern: /^---+$/gm, replacement: '<hr>' },
            { pattern: /^\*\*\*+$/gm, replacement: '<hr>' },
            { pattern: /^___+$/gm, replacement: '<hr>' },
            
            // Bold and Italic
            { pattern: /\*\*\*(.+?)\*\*\*/g, replacement: '<strong><em>$1</em></strong>' },
            { pattern: /___(.+?)___/g, replacement: '<strong><em>$1</em></strong>' },
            { pattern: /\*\*(.+?)\*\*/g, replacement: '<strong>$1</strong>' },
            { pattern: /__(.+?)__/g, replacement: '<strong>$1</strong>' },
            { pattern: /\*(.+?)\*/g, replacement: '<em>$1</em>' },
            { pattern: /_(.+?)_/g, replacement: '<em>$1</em>' },
            
            // Strikethrough
            { pattern: /~~(.+?)~~/g, replacement: '<del>$1</del>' },
            
            // Code blocks
            {
                pattern: /```(\w+)?\n([\s\S]*?)```/g,
                replacement: (match, lang, code) => {
                    const language = lang || 'plaintext';
                    const escapedCode = this.escapeHtml(code.trim());
                    return `<pre><code class="language-${language}">${escapedCode}</code></pre>`;
                }
            },
            
            // Inline code
            { pattern: /`([^`]+)`/g, replacement: '<code>$1</code>' },
            
            // Links
            { pattern: /\[([^\]]+)\]\(([^)]+)\)/g, replacement: '<a href="$2">$1</a>' },
            
            // Images
            { pattern: /!\[([^\]]*)\]\(([^)]+)\)/g, replacement: '<img src="$2" alt="$1">' },
            
            // Blockquotes
            { pattern: /^>\s+(.+)$/gm, replacement: '<blockquote>$1</blockquote>' },
            
            // Task lists (checkboxes)
            {
                pattern: /^[\*\-\+]\s+\[([ x])\]\s+(.+)$/gm,
                replacement: (match, checked, item) => {
                    const isChecked = checked.toLowerCase() === 'x';
                    const checkboxHtml = `<input type="checkbox" ${isChecked ? 'checked' : ''} disabled>`;
                    return `<ul class="task-list"><li class="task-item">${checkboxHtml} ${item}</li></ul>`;
                }
            },

            // Unordered lists
            {
                pattern: /^[\*\-\+]\s+(.+)$/gm,
                replacement: (match, item) => `<ul><li>${item}</li></ul>`
            },
            
            // Ordered lists
            {
                pattern: /^\d+\.\s+(.+)$/gm,
                replacement: (match, item) => `<ol><li>${item}</li></ol>`
            },
            
            // Paragraphs
            {
                pattern: /^(?!<[^>]+>)([^\n]+)$/gm,
                replacement: (match, text) => {
                    // Don't wrap if it's already an HTML tag
                    if (text.trim().startsWith('<')) return text;
                    return `<p>${text}</p>`;
                }
            }
        ];
    }

    /**
     * Escape HTML special characters to prevent XSS
     */
    escapeHtml(text) {
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return text.replace(/[&<>"']/g, char => escapeMap[char]);
    }

    /**
     * Parse Markdown text to HTML
     */
    parse(markdown) {
        if (!markdown) return '';
        
        let html = markdown;
        
        // First, escape HTML in the raw markdown (except in code blocks)
        const codeBlocks = [];
        html = html.replace(/```[\s\S]*?```/g, (match) => {
            codeBlocks.push(match);
            return `___CODE_BLOCK_${codeBlocks.length - 1}___`;
        });
        
        const inlineCode = [];
        html = html.replace(/`[^`]+`/g, (match) => {
            inlineCode.push(match);
            return `___INLINE_CODE_${inlineCode.length - 1}___`;
        });
        
        // Parse tables first (before other rules)
        html = this.parseTables(html);
        
        // Apply parsing rules
        this.rules.forEach(rule => {
            if (typeof rule.replacement === 'function') {
                html = html.replace(rule.pattern, rule.replacement.bind(this));
            } else {
                html = html.replace(rule.pattern, rule.replacement);
            }
        });
        
        // Restore code blocks and inline code
        codeBlocks.forEach((block, index) => {
            html = html.replace(`___CODE_BLOCK_${index}___`, () => {
                const match = block.match(/```(\w+)?\n?([\s\S]*?)```/);
                if (match) {
                    const lang = match[1] || 'plaintext';
                    const code = this.escapeHtml(match[2].trim());
                    return `<pre><code class="language-${lang}">${code}</code></pre>`;
                }
                return block;
            });
        });
        
        inlineCode.forEach((code, index) => {
            html = html.replace(`___INLINE_CODE_${index}___`, () => {
                const content = code.slice(1, -1);
                return `<code>${this.escapeHtml(content)}</code>`;
            });
        });
        
        // Clean up consecutive list items
        html = this.consolidateLists(html);
        
        // Clean up consecutive blockquotes
        html = this.consolidateBlockquotes(html);
        
        return html.trim();
    }

    /**
     * Consolidate consecutive list items into single lists
     */
    consolidateLists(html) {
        // Consolidate unordered lists
        html = html.replace(/(<\/ul>\s*<ul>)/g, '');
        
        // Consolidate ordered lists
        html = html.replace(/(<\/ol>\s*<ol>)/g, '');
        
        return html;
    }

    /**
     * Consolidate consecutive blockquotes
     */
    consolidateBlockquotes(html) {
        html = html.replace(/(<\/blockquote>\s*<blockquote>)/g, '\n');
        return html;
    }

    /**
     * Parse tables (GitHub Flavored Markdown)
     */
    parseTables(text) {
        // Match table patterns
        const tablePattern = /(?:^|\n)((?:\|.*\|(?:\r?\n|\r)?)+)/gm;
        
        return text.replace(tablePattern, (match, tableText) => {
            const lines = tableText.trim().split(/\r?\n/);
            if (lines.length < 2) return match;
            
            const headerLine = lines[0];
            const separatorLine = lines[1];
            
            // Check if it's a valid table
            if (!separatorLine.match(/^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?$/)) {
                return match;
            }
            
            // Parse headers
            const headers = headerLine.split('|').map(h => h.trim()).filter(h => h !== '');
            
            // Parse separator for alignment
            const alignments = separatorLine.split('|')
                .map(sep => sep.trim())
                .filter(sep => sep !== '')
                .map(sep => {
                    if (sep.startsWith(':') && sep.endsWith(':')) return 'center';
                    if (sep.endsWith(':')) return 'right';
                    return 'left';
                });
            
            // Parse rows
            const rows = lines.slice(2).map(line => 
                line.split('|').map(cell => cell.trim()).filter(cell => cell !== '')
            );
            
            let tableHtml = '<table class="markdown-table">\n<thead>\n<tr>\n';
            headers.forEach((header, i) => {
                const align = alignments[i] || 'left';
                const style = align !== 'left' ? ` style="text-align: ${align}"` : '';
                tableHtml += `<th${style}>${this.parseInline(header)}</th>\n`;
            });
            tableHtml += '</tr>\n</thead>\n<tbody>\n';
            
            rows.forEach(row => {
                if (row.length > 0) {
                    tableHtml += '<tr>\n';
                    row.forEach((cell, i) => {
                        const align = alignments[i] || 'left';
                        const style = align !== 'left' ? ` style="text-align: ${align}"` : '';
                        tableHtml += `<td${style}>${this.parseInline(cell)}</td>\n`;
                    });
                    tableHtml += '</tr>\n';
                }
            });
            
            tableHtml += '</tbody>\n</table>';
            return '\n' + tableHtml + '\n';
        });
    }

    /**
     * Parse inline elements (for use in table cells)
     */
    parseInline(text) {
        if (!text) return '';
        
        // Apply inline formatting rules only
        const inlineRules = [
            { pattern: /\*\*\*(.+?)\*\*\*/g, replacement: '<strong><em>$1</em></strong>' },
            { pattern: /___(.+?)___/g, replacement: '<strong><em>$1</em></strong>' },
            { pattern: /\*\*(.+?)\*\*/g, replacement: '<strong>$1</strong>' },
            { pattern: /__(.+?)__/g, replacement: '<strong>$1</strong>' },
            { pattern: /\*(.+?)\*/g, replacement: '<em>$1</em>' },
            { pattern: /_(.+?)_/g, replacement: '<em>$1</em>' },
            { pattern: /~~(.+?)~~/g, replacement: '<del>$1</del>' },
            { pattern: /`([^`]+)`/g, replacement: '<code>$1</code>' },
            { pattern: /\[([^\]]+)\]\(([^)]+)\)/g, replacement: '<a href="$2">$1</a>' }
        ];
        
        let result = text;
        inlineRules.forEach(rule => {
            result = result.replace(rule.pattern, rule.replacement);
        });
        
        return result;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarkdownParser;
}