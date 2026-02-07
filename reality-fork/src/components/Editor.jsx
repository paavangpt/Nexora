import { useState, useEffect, useCallback } from 'react';
import { FaCode, FaAlignLeft, FaPlus, FaRocket, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

/**
 * JSON Editor component with syntax validation and formatting
 */
export default function Editor({ data, onChange, readOnly = false }) {
    const [textValue, setTextValue] = useState('');
    // const [error, setError] = useState(null); // No validation errors for generic text
    // const [isValid, setIsValid] = useState(true); // Always valid
    const [lineCount, setLineCount] = useState(1);
    const [charCount, setCharCount] = useState(0);

    // Sync text value with data prop
    useEffect(() => {
        try {
            // Check if data is an object (from JSON legacy) or string
            let content = '';
            if (typeof data === 'string') {
                content = data;
            } else if (data && typeof data === 'object' && data.type === 'text' && typeof data.content === 'string') {
                // New wrapper format
                content = data.content;
            } else if (data && typeof data === 'object') {
                // Legacy support or if passing object (assume JSON)
                content = JSON.stringify(data, null, 2);
                if (content === '{}') content = ''; // Empty object -> empty string
            }

            setTextValue(content);
            setLineCount(content.split('\n').length || 1);
            setCharCount(content.length);
        } catch (e) {
            console.error('Error parsing data for editor', e);
            setTextValue('');
        }
    }, [data]);

    const handleChange = useCallback((e) => {
        const value = e.target.value;
        setTextValue(value);
        setCharCount(value.length);
        setLineCount(value.split('\n').length);

        // For generic text, we just pass the string value or a simple wrapper
        // The App/UseVersionControl expects "data" to be the state.
        // We can pass the raw string if we update everything else, 
        // OR we can pass { content: value } if we want to keep "object" structure.
        // BUT, given the requirement "anything", passing raw string is risky if 
        // the top-level state MUST be an object for some other reason (diffing?).
        // 'useVersionControl' treats 'currentData' as what it saves. 
        // 'getDiff' expects objects currently. 
        // let's wrap it to keep compatibility with existing object-diff logic for now, 
        // OR we update 'useVersionControl' to handle strings. 
        // Plan said: "treat it as a string... or wrap". 
        // Let's WRAP it transparently here so the rest of the app sees an object, 
        // but the user sees text.
        // ACTUALLY, to make "JSON" still work nicely as a subset, we could try to parse, 
        // but user wants "anything". 
        // Let's just pass the raw value. I need to update getDiff to handle strings too.
        // PROCEEDING WITH: Pass raw value (or object if valid JSON? No, consistency first).
        // Let's standardise on passing the value directly. 
        // Wait, 'data' prop coming in might be object from legacy. 
        // Let's try to emit { content: value, type: 'text' } wrapper? 
        // UseVersionControl's `createVersion` just JSON.stringifies. 
        // `getDiff` keys off user data. 
        // If I change data shape to just "string", `getDiff` (keys) fails.
        // So I MUST Wrap.

        onChange({ content: value, type: 'text' });

    }, [onChange]);

    // We need to unwrap in the effect above.
    // Let's refine the Effect to handle the wrapper.

    /*
    useEffect(() => {
        let content = '';
        if (data && data.type === 'text' && typeof data.content === 'string') {
             content = data.content;
        } else if (Object.keys(data).length === 0) {
             content = '';
        } else {
             // Legacy or imported JSON
             content = JSON.stringify(data, null, 2);
        }
        ...
    */

    // handleFormat and handleAddField are removed as they are JSON-specific.

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const { selectionStart, selectionEnd, value } = e.target;
            const newValue = value.substring(0, selectionStart) + '  ' + value.substring(selectionEnd);

            setTextValue(newValue);
            setCharCount(newValue.length); // Update char count immediately

            // Trigger change with wrapper
            onChange({ content: newValue, type: 'text' });

            // Restore cursor position
            requestAnimationFrame(() => {
                if (e.target) {
                    e.target.selectionStart = selectionStart + 2;
                    e.target.selectionEnd = selectionStart + 2;
                }
            });
        }
    }, [onChange]);

    // Generate line numbers
    const lineNumbers = Array.from({ length: Math.max(1, lineCount) }, (_, i) => i + 1);

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800/50">
                <div className="flex items-center gap-2">
                    <FaCode className="text-blue-400" />
                    <span className="font-semibold text-gray-200">Reality Editor</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                        <span className="text-[10px] font-medium text-blue-300 uppercase tracking-wider">Text Mode</span>
                    </div>
                </div>
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-900/50 text-xs">
                <div className="flex items-center gap-4">
                    <span className="text-gray-400">
                        Lines: <span className="text-blue-400">{lineCount}</span>
                    </span>
                    <span className="text-gray-400">
                        Characters: <span className="text-blue-400">{charCount}</span>
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Validation status removed */}
                </div>
            </div>

            {/* Error message */}
            {/* Error message removed */}

            {/* Editor area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Line numbers */}
                <div className="w-12 bg-gray-900/80 border-r border-gray-700 overflow-hidden select-none">
                    <div className="p-3 code-editor text-gray-500 text-right">
                        {lineNumbers.map(num => (
                            <div key={num} className="h-6 leading-6">{num}</div>
                        ))}
                    </div>
                </div>

                {/* Text area */}
                <div className="flex-1 relative">
                    <textarea
                        value={textValue}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        readOnly={readOnly}
                        className={`
              w-full h-full resize-none p-3 
              bg-gray-900 text-gray-100 
              code-editor leading-6
              focus:outline-none
              ${readOnly ? 'cursor-not-allowed opacity-70' : ''}
            `}
                        spellCheck={false}
                        placeholder={readOnly ? 'Read-only mode' : 'Enter text here...'}
                    />

                    {/* Decorative overlay */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-gray-900/50" />
                </div>
            </div>

            {/* Footer with tips */}
            <div className="px-4 py-2 border-t border-gray-700 bg-gray-800/50 text-xs text-gray-500 flex items-center gap-2">
                <FaRocket className="text-blue-400" />
                <span>Edit your reality data, then commit changes to create a new version in the timeline.</span>
            </div>
        </div>
    );
}
