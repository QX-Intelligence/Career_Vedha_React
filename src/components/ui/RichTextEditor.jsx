import React, { useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { 
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    Heading1, Heading2, Heading3, 
    List, ListOrdered,
    AlignLeft, AlignCenter, AlignRight,
    Link as LinkIcon, Image as ImageIcon,
    Table as TableIcon, 
    Highlighter, Baseline
} from 'lucide-react';
import './RichTextEditor.css';

const MenuBar = ({ editor, onImageClick }) => {
    if (!editor) {
        return null;
    }

    const addLink = () => {
        const previousUrl = editor.getAttributes('link').href
        const url = window.prompt('URL', previousUrl)

        if (url === null) {
            return
        }

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }

    const insertTable = () => {
        const rows = prompt('Number of rows', '3');
        const cols = prompt('Number of columns', '3');
        if (rows && cols) {
            editor.chain().focus().insertTable({ rows: parseInt(rows), cols: parseInt(cols), withHeaderRow: true }).run();
        }
    }

    const lastSelection = React.useRef(null);

    React.useEffect(() => {
        if (!editor) return;
        
        const updateSelection = () => {
            const { from, to } = editor.state.selection;
            // Only save if it's an actual text selection (not just a cursor)
            if (from !== to) {
                lastSelection.current = { from, to };
            }
        };

        editor.on('selectionUpdate', updateSelection);
        return () => editor.off('selectionUpdate', updateSelection);
    }, [editor]);

    const setColor = (e) => {
        const color = e.target.value;
        if (lastSelection.current) {
            editor.chain().focus().setTextSelection(lastSelection.current).setColor(color).run();
        } else {
            editor.chain().focus().setColor(color).run();
        }
    }

    return (
        <div className="tiptap-toolbar">
            <div className="toolbar-group">
                <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''} title="Bold">
                    <Bold size={16} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''} title="Italic">
                    <Italic size={16} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'is-active' : ''} title="Underline">
                    <UnderlineIcon size={16} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''} title="Strikethrough">
                    <Strikethrough size={16} />
                </button>
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-group">
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''} title="Heading 1">
                    <Heading1 size={16} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''} title="Heading 2">
                    <Heading2 size={16} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''} title="Heading 3">
                    <Heading3 size={16} />
                </button>
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-group">
                <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''} title="Bullet List">
                    <List size={16} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''} title="Ordered List">
                    <ListOrdered size={16} />
                </button>
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-group">
                <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''} title="Align Left">
                    <AlignLeft size={16} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''} title="Align Center">
                    <AlignCenter size={16} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''} title="Align Right">
                    <AlignRight size={16} />
                </button>
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-group">
                <button type="button" onClick={addLink} className={editor.isActive('link') ? 'is-active' : ''} title="Link">
                    <LinkIcon size={16} />
                </button>
                <button type="button" onClick={onImageClick} title="Image">
                    <ImageIcon size={16} />
                </button>
                <button type="button" onClick={insertTable} title="Insert Table">
                    <TableIcon size={16} />
                </button>
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-group">
                <div className="color-picker-wrapper" title="Text Color">
                    <Baseline size={16} style={{ color: editor.getAttributes('textStyle').color || 'currentColor' }} />
                    <input type="color" onInput={setColor} onChange={setColor} value={editor.getAttributes('textStyle').color || '#000000'} />
                </div>
                <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()} className={editor.isActive('highlight') ? 'is-active' : ''} title="Highlight">
                    <Highlighter size={16} />
                </button>
            </div>
            
            {editor.isActive('table') && (
                <>
                    <div className="toolbar-divider" />
                    <div className="toolbar-group">
                        <button type="button" onClick={() => editor.chain().focus().addColumnBefore().run()} title="Add Column Before" style={{fontSize:'12px'}}>+Col Left</button>
                        <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column After" style={{fontSize:'12px'}}>+Col Right</button>
                        <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete Column" style={{fontSize:'12px', color: '#ef4444'}}>-Col</button>
                        <button type="button" onClick={() => editor.chain().focus().addRowBefore().run()} title="Add Row Before" style={{fontSize:'12px'}}>+Row Above</button>
                        <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row After" style={{fontSize:'12px'}}>+Row Below</button>
                        <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} title="Delete Row" style={{fontSize:'12px', color: '#ef4444'}}>-Row</button>
                        <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table" style={{fontSize:'12px', color: '#ef4444'}}>-Table</button>
                    </div>
                </>
            )}
        </div>
    );
};

const RichTextEditor = React.forwardRef(({ value, onChange, placeholder, style, customImageHandler }, ref) => {
    
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
            Link.configure({
                openOnClick: false,
            }),
            Color,
            TextStyle,
            Highlight.configure({ multicolor: true }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'tiptap-editor-content',
                style: `min-height: 250px; outline: none; padding: 1rem; ${style?.height ? `height: ${style.height}; overflow-y: auto;` : ''}`
            }
        }
    });

    React.useImperativeHandle(ref, () => ({
        getEditor: () => editor,
        insertEmbed: (index, type, url) => {
            if (editor && type === 'image') {
                editor.chain().focus().setImage({ src: url }).run();
            }
        },
        getLength: () => {
            return editor ? editor.state.doc.content.size : 0;
        },
        getSelection: () => {
            return editor ? { index: editor.state.selection.from } : null;
        }
    }));

    // Update editor content when value prop changes externally (e.g. initial load)
    React.useEffect(() => {
        if (editor && value !== undefined) {
            const isSame = editor.getHTML() === value;
            if (!isSame) {
                // Ensure we handle cases where value might be empty string
                if (value === "") {
                    editor.commands.clearContent();
                } else {
                    editor.commands.setContent(value, false);
                }
            }
        }
    }, [value, editor]);

    const handleImageClick = () => {
        if (customImageHandler) {
            customImageHandler();
        } else {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.click();

            input.onchange = () => {
                const file = input.files[0];
                if (file) {
                    // Check file size (e.g., 5MB limit)
                    if (file.size > 5 * 1024 * 1024) {
                        alert('Image is too large. Maximum size is 5MB.');
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                        const base64 = reader.result;
                        editor.chain().focus().setImage({ src: base64 }).run();
                    };
                    reader.readAsDataURL(file);
                }
            };
        }
    };

    return (
        <div className="tiptap-container" style={{ ...style, height: 'auto' }}>
            <MenuBar editor={editor} onImageClick={handleImageClick} />
            <EditorContent editor={editor} />
        </div>
    );
});

export default RichTextEditor;
