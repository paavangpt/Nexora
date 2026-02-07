import { useState, useEffect, useCallback } from 'react';
import { FaCode, FaAlignLeft, FaPlus, FaRocket, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

/**
 * JSON Editor component with syntax validation and formatting
 */
export default function Editor({ data, onChange, readOnly = false }) {
    const [textValue, setTextValue] = useState('');
    const [error, setError] = useState(null);
    const [isValid, setIsValid] = useState(true);
    const [lineCount, setLineCount] = useState(1);
    const [charCount, setCharCount] = useState(0);

    // Sync text value with data prop
    useEffect(() => {
        try {
            const formatted = JSON.stringify(data, null, 2);
            setTextValue(formatted);
            setError(null);
            setIsValid(true);
            setLineCount(formatted.split('\n').length);
            setCharCount(formatted.length);
        } catch (e) {
            setTextValue('{}');
            setError('Invalid data received');
            setIsValid(false);
        }
    }, [data]);

    const handleChange = useCallback((e) => {
        const value = e.target.value;
        setTextValue(value);
        setCharCount(value.length);
        setLineCount(value.split('\n').length);

        // Validate JSON
        try {
            const parsed = JSON.parse(value);
            setError(null);
            setIsValid(true);
            onChange(parsed);
        } catch (e) {
            setError(`JSON Error: ${e.message}`);
            setIsValid(false);
        }
    }, [onChange]);

    const handleFormat = useCallback(() => {
        try {
            const parsed = JSON.parse(textValue);
            const formatted = JSON.stringify(parsed, null, 2);
            setTextValue(formatted);
            setError(null);
            setIsValid(true);
            setLineCount(formatted.split('\n').length);
            setCharCount(formatted.length);
            onChange(parsed);
        } catch (e) {
            setError(`Cannot format: ${e.message}`);
        }
    }, [textValue, onChange]);

    const handleAddField = useCallback(() => {
        try {
            const parsed = JSON.parse(textValue);
            const newKey = `newField_${Date.now().toString(36)}`;
            parsed[newKey] = 'value';
            const formatted = JSON.stringify(parsed, null, 2);
            setTextValue(formatted);
            setError(null);
            setIsValid(true);
            setLineCount(formatted.split('\n').length);
            setCharCount(formatted.length);
            onChange(parsed);
        } catch (e) {
            setError(`Cannot add field: ${e.message}`);
        }
    }, [textValue, onChange]);

    // Generate line numbers
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800/50">
                <div className="flex items-center gap-2">
                    <FaCode className="text-blue-400" />
                    <span className="font-semibold text-gray-200">Reality Matrix Editor</span>
                </div>
                <div className="flex items-center gap-2">
                    {!readOnly && (
                        <>
                            <button
                                onClick={handleAddField}
                                className="btn btn-secondary text-sm py-1 px-3"
                                disabled={!isValid}
                            >
                                <FaPlus className="text-xs" />
                                Add Field
                            </button>
                            <button
                                onClick={handleFormat}
                                className="btn btn-secondary text-sm py-1 px-3"
                                disabled={!isValid}
                            >
                                <FaAlignLeft className="text-xs" />
                                Format
                            </button>
                        </>
                    )}
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
                    {isValid ? (
                        <span className="flex items-center gap-1 text-green-400">
                            <FaCheckCircle />
                            Valid JSON
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-red-400">
                            <FaExclamationTriangle />
                            Invalid JSON
                        </span>
                    )}
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="px-4 py-2 bg-red-500/20 border-b border-red-500/50 text-red-400 text-sm animate-fadeIn">
                    {error}
                </div>
            )}

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
                        readOnly={readOnly}
                        className={`
              w-full h-full resize-none p-3 
              bg-gray-900 text-gray-100 
              code-editor leading-6
              focus:outline-none
              ${readOnly ? 'cursor-not-allowed opacity-70' : ''}
              ${!isValid ? 'border-r-2 border-red-500' : ''}
            `}
                        spellCheck={false}
                        placeholder={readOnly ? 'Read-only mode' : 'Enter JSON data to version...'}
                    />

                    {/* Decorative overlay */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-gray-900/50" />
                </div>
            </div>

            {/* Footer with tips */}
            <div className="px-4 py-2 border-t border-gray-700 bg-gray-800/50 text-xs text-gray-500 flex items-center gap-2">
                <FaRocket className="text-blue-400" />
                <span>Edit your reality matrix data, then commit changes to create a new version in the timeline.</span>
            </div>
        </div>
    );
}
