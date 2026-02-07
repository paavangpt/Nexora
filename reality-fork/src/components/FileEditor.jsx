import { useState, useEffect } from 'react';
import { FaFile, FaArrowLeft, FaSave, FaCheck } from 'react-icons/fa';
import { loadFiles, saveFiles } from '../utils/storage';
import { loadVersions, saveVersions } from '../utils/storage';
import Editor from './Editor';

/**
 * FileEditor - Simple file editing view
 * Saves content changes to the project's version control data
 */
export default function FileEditor({ project, file, onBack }) {
    const [content, setContent] = useState('');
    const [isSaved, setIsSaved] = useState(true);
    const [notification, setNotification] = useState(null);

    // Load file content from version control data
    useEffect(() => {
        if (project?.id && file?.id) {
            const versions = loadVersions(project.id);
            if (versions.length > 0) {
                // Get the latest version
                const latestVersion = versions[versions.length - 1];
                const fileContent = latestVersion.data?.[file.id]?.content || '';
                setContent(fileContent);
            }
        }
    }, [project?.id, file?.id]);

    const showNotification = (message, type = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleContentChange = (newContent) => {
        setContent(newContent);
        setIsSaved(false);
    };

    const handleSave = () => {
        if (!project?.id || !file?.id) return;

        // Update the file content in the most recent version's data
        // This updates the "working copy" that will be committed
        const versions = loadVersions(project.id);
        if (versions.length > 0) {
            const latestVersion = versions[versions.length - 1];
            const updatedData = {
                ...latestVersion.data,
                [file.id]: { name: file.name, content }
            };
            latestVersion.data = updatedData;
            saveVersions(project.id, versions);
        }

        // Also update file metadata
        const files = loadFiles(project.id);
        const updatedFiles = files.map(f =>
            f.id === file.id ? { ...f, lastModified: new Date().toISOString() } : f
        );
        saveFiles(project.id, updatedFiles);

        setIsSaved(true);
        showNotification('File saved!', 'success');
    };

    // Auto-save when navigating back
    const handleBack = () => {
        if (!isSaved) {
            handleSave();
        }
        onBack();
    };

    // Keyboard shortcut for save
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [content, file?.id]);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg animate-fadeIn ${notification.type === 'success' ? 'bg-green-500/90' :
                        notification.type === 'error' ? 'bg-red-500/90' : 'bg-blue-500/90'
                    } text-white`}>
                    {notification.message}
                </div>
            )}

            {/* Header */}
            <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBack}
                                className="p-2.5 rounded-xl hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-200 border border-gray-700/50"
                                title="Back to Project"
                            >
                                <FaArrowLeft className="text-lg" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-600/20 flex items-center justify-center border border-blue-500/30">
                                    <FaFile className="text-blue-400" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-100">{file?.name}</h1>
                                    <p className="text-xs text-gray-500">{project?.name}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {!isSaved && (
                                <span className="text-yellow-400 text-sm flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                                    Unsaved changes
                                </span>
                            )}
                            <button
                                onClick={handleSave}
                                className={`btn ${isSaved ? 'btn-secondary' : 'btn-success'} px-4 py-2`}
                            >
                                {isSaved ? <FaCheck className="text-sm" /> : <FaSave className="text-sm" />}
                                {isSaved ? 'Saved' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Editor */}
            <main className="flex-1 p-6">
                <div className="max-w-5xl mx-auto h-full">
                    <div className="glass-panel h-full border border-gray-700/50 rounded-xl overflow-hidden">
                        <Editor
                            currentData={content}
                            onDataChange={handleContentChange}
                            isTextMode={true}
                        />
                    </div>
                </div>
            </main>

            {/* Footer hint */}
            <footer className="border-t border-gray-700/50 py-3 px-6 text-center text-gray-500 text-sm">
                <span className="inline-flex items-center gap-2">
                    <kbd className="px-2 py-0.5 bg-gray-800 rounded text-xs">⌘/Ctrl + S</kbd>
                    to save
                </span>
                <span className="mx-4">•</span>
                <span>Changes are saved to the project. Commit from the project dashboard to create a version.</span>
            </footer>
        </div>
    );
}
