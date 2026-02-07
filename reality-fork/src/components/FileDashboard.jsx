import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
    FaFile, FaPlus, FaTrash, FaEdit, FaFolder, FaClock, FaArrowLeft,
    FaUpload, FaCodeBranch, FaSave, FaHistory, FaExchangeAlt, FaRocket
} from 'react-icons/fa';
import { loadFiles, saveFiles, deleteFileData } from '../utils/storage';
import { useVersionControl } from '../hooks/useVersionControl';
import { getDiff } from '../utils/versionControl';
import Timeline from './Timeline';
import BranchManager from './BranchManager';

/**
 * FileDashboard - Project-level view with files and version control
 */
export default function FileDashboard({ project, onSelectFile, onBack }) {
    const [files, setFiles] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const fileInputRef = useRef(null);

    // Version control at project level
    const {
        versions,
        branches,
        currentBranch,
        currentVersion,
        currentData,
        selectedVersions,
        isLoading,
        commitVersion,
        createBranch,
        switchBranch,
        deleteBranch,
        rollbackToVersion,
        mergeBranches,
        completeMerge,
        updateCurrentData,
        toggleVersionSelection,
        resetAll,
        initWithData,
        canCommit,
        versionCount,
    } = useVersionControl(project?.id);

    // UI state for modals
    const [showCommitModal, setShowCommitModal] = useState(false);
    const [showTimelineView, setShowTimelineView] = useState(false);
    const [showBranchModal, setShowBranchModal] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');
    const [notification, setNotification] = useState(null);
    const [branchFromVersion, setBranchFromVersion] = useState(null);

    // Load files on mount
    useEffect(() => {
        if (project?.id) {
            const loadedFiles = loadFiles(project.id);
            setFiles(loadedFiles);
        }
    }, [project?.id]);

    // Sync files with version control data
    useEffect(() => {
        if (project?.id && !isLoading && versions.length === 0 && files.length > 0) {
            // Initialize version control with current file list
            const projectData = {};
            files.forEach(file => {
                projectData[file.id] = { name: file.name, content: '' };
            });
            initWithData(projectData);
        }
    }, [project?.id, isLoading, versions.length, files]);

    const showNotification = (message, type = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleCreateFile = (e) => {
        e.preventDefault();
        if (!newFileName.trim()) return;

        const newFile = {
            id: uuidv4(),
            name: newFileName.trim(),
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
        };

        const updatedFiles = [...files, newFile];
        setFiles(updatedFiles);
        saveFiles(project.id, updatedFiles);

        // Update version control data
        const newData = { ...currentData, [newFile.id]: { name: newFile.name, content: '' } };
        updateCurrentData(newData);

        setNewFileName('');
        setIsCreating(false);
        showNotification(`File "${newFile.name}" created`, 'success');
    };

    const handleDeleteFile = (e, fileId) => {
        e.stopPropagation();
        const fileToDelete = files.find(f => f.id === fileId);
        const updatedFiles = files.filter(f => f.id !== fileId);
        setFiles(updatedFiles);
        saveFiles(project.id, updatedFiles);
        deleteFileData(project.id, fileId);

        // Remove from version control data
        const newData = { ...currentData };
        delete newData[fileId];
        updateCurrentData(newData);

        showNotification(`File "${fileToDelete?.name}" deleted`, 'info');
    };

    const handleEditFile = (e, file) => {
        e.stopPropagation();
        onSelectFile(file);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = async (e) => {
        const uploadedFiles = Array.from(e.target.files);
        const textExtensions = ['.txt', '.json', '.md', '.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.xml', '.yaml', '.yml'];

        for (const file of uploadedFiles) {
            const extension = '.' + file.name.split('.').pop().toLowerCase();
            const isTextFile = textExtensions.includes(extension) || file.type.startsWith('text/');

            if (!isTextFile) {
                showNotification(`Skipped ${file.name} - not a text file`, 'warning');
                continue;
            }

            try {
                const content = await file.text();
                const newFile = {
                    id: uuidv4(),
                    name: file.name,
                    createdAt: new Date().toISOString(),
                    lastModified: new Date().toISOString(),
                };

                const updatedFiles = [...files, newFile];
                setFiles(updatedFiles);
                saveFiles(project.id, updatedFiles);

                // Add to version control data
                const newData = { ...currentData, [newFile.id]: { name: newFile.name, content } };
                updateCurrentData(newData);

                showNotification(`Uploaded "${file.name}"`, 'success');
            } catch (error) {
                showNotification(`Failed to upload ${file.name}`, 'error');
            }
        }

        e.target.value = '';
    };

    // Handle commit
    const handleCommit = () => {
        if (!commitMessage.trim()) {
            showNotification('Please enter a commit message', 'error');
            return;
        }
        try {
            commitVersion(commitMessage.trim());
            setCommitMessage('');
            setShowCommitModal(false);
            showNotification('Changes committed successfully!', 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    // Branch operations
    const handleCreateBranch = (branchName, fromVersionId = null) => {
        try {
            createBranch(branchName, fromVersionId);
            setShowBranchModal(false);
            setBranchFromVersion(null);
            showNotification(`Branch "${branchName}" created`, 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    const handleSwitchBranch = (branchName) => {
        try {
            switchBranch(branchName);
            showNotification(`Switched to branch "${branchName}"`, 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    const handleDeleteBranch = (branchName) => {
        try {
            deleteBranch(branchName);
            showNotification(`Branch "${branchName}" deleted`, 'info');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    const handleRollback = (versionId) => {
        try {
            rollbackToVersion(versionId);
            showNotification('Rolled back successfully', 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    const handleBranchFromVersion = (versionId) => {
        setBranchFromVersion(versionId);
        setShowBranchModal(true);
    };

    // Compare selected versions
    const selectedDiff = selectedVersions.length === 2 ? (() => {
        const v1 = versions.find(v => v.id === selectedVersions[0]);
        const v2 = versions.find(v => v.id === selectedVersions[1]);
        return v1 && v2 ? { version1: v1, version2: v2, diff: getDiff(v1, v2) } : null;
    })() : null;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-center">
                    <FaRocket className="text-6xl text-blue-500 animate-pulse mx-auto mb-4" />
                    <p className="text-gray-400">Loading Project...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg animate-fadeIn ${notification.type === 'success' ? 'bg-green-500/90' :
                    notification.type === 'error' ? 'bg-red-500/90' :
                        notification.type === 'warning' ? 'bg-yellow-500/90' : 'bg-blue-500/90'
                    } text-white`}>
                    {notification.message}
                </div>
            )}

            {/* Header */}
            <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <button
                                onClick={onBack}
                                className="p-2.5 rounded-xl hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-200 border border-gray-700/50"
                                title="Back to Projects"
                            >
                                <FaArrowLeft className="text-lg" />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-600/20 flex items-center justify-center border border-purple-500/30">
                                    <FaFolder className="text-xl text-purple-400" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-100">{project?.name}</h1>
                                    <p className="text-sm text-gray-500">
                                        {files.length} file{files.length !== 1 ? 's' : ''} • {versionCount} version{versionCount !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Version Control Actions */}
                        <div className="flex items-center gap-3">
                            {/* Branch indicator */}
                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
                                <FaCodeBranch className="text-purple-400" />
                                <span className="text-sm font-medium">{currentBranch}</span>
                                <span className="text-xs text-gray-500">({versionCount} versions)</span>
                            </div>

                            <button
                                onClick={() => setShowCommitModal(true)}
                                disabled={!canCommit}
                                className={`btn ${canCommit ? 'btn-success' : 'btn-secondary opacity-50 cursor-not-allowed'} px-4 py-2`}
                            >
                                <FaSave className="text-sm" /> Commit
                            </button>

                            <button
                                onClick={() => setShowTimelineView(!showTimelineView)}
                                className={`btn ${showTimelineView ? 'btn-primary' : 'btn-secondary'} px-4 py-2`}
                            >
                                <FaHistory className="text-sm" /> Timeline
                            </button>

                            <button
                                onClick={() => setShowBranchModal(true)}
                                className="btn btn-secondary px-4 py-2"
                            >
                                <FaExchangeAlt className="text-sm" /> Branches
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex">
                {/* Sidebar - Timeline (when active) */}
                {showTimelineView && (
                    <div className="w-80 border-r border-gray-700/50 bg-gray-900/50 h-[calc(100vh-73px)] overflow-y-auto">
                        <Timeline
                            versions={versions}
                            branches={branches}
                            currentBranch={currentBranch}
                            currentVersion={currentVersion}
                            selectedVersions={selectedVersions}
                            onVersionSelect={toggleVersionSelection}
                            onRollback={handleRollback}
                            onBranchFromVersion={handleBranchFromVersion}
                        />
                    </div>
                )}

                {/* Files Area */}
                <main className={`flex-1 px-8 py-8 ${showTimelineView ? '' : 'max-w-6xl mx-auto'}`}>
                    {/* File Actions */}
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-semibold text-gray-200">Project Files</h2>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleUploadClick}
                                className="btn btn-secondary px-5 py-2.5"
                            >
                                <FaUpload className="text-sm" /> Upload
                            </button>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="btn btn-primary px-5 py-2.5 shadow-lg shadow-blue-500/20"
                            >
                                <FaPlus className="text-sm" /> New File
                            </button>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".txt,.json,.md,.js,.jsx,.ts,.tsx,.css,.html,.xml,.yaml,.yml,text/*"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </div>

                    {/* Create File Form */}
                    {isCreating && (
                        <div className="glass-panel p-6 mb-8 animate-fadeIn border border-blue-500/30 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                            <h3 className="text-lg font-semibold mb-4 text-blue-300 ml-4">Create New File</h3>
                            <form onSubmit={handleCreateFile} className="flex flex-col md:flex-row gap-4 ml-4">
                                <input
                                    type="text"
                                    value={newFileName}
                                    onChange={(e) => setNewFileName(e.target.value)}
                                    placeholder="Enter file name (e.g., notes.txt, config.json)"
                                    className="input flex-1 bg-gray-900/50"
                                    autoFocus
                                />
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="btn btn-secondary px-4"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-success px-4">
                                        Create
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Files Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {files.map(file => (
                            <div
                                key={file.id}
                                onClick={() => onSelectFile(file)}
                                className="glass-panel p-6 cursor-pointer hover:bg-gray-800/80 transition-all duration-300 group relative border border-gray-700/50 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-900/10 hover:-translate-y-1 rounded-xl"
                            >
                                {/* Actions */}
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => handleEditFile(e, file)}
                                        className="p-2.5 rounded-lg hover:bg-blue-500/20 text-gray-500 hover:text-blue-400 transition-colors"
                                        title="Edit File"
                                    >
                                        <FaEdit className="text-sm" />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteFile(e, file.id)}
                                        className="p-2.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                                        title="Delete File"
                                    >
                                        <FaTrash className="text-sm" />
                                    </button>
                                </div>

                                {/* File Icon */}
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/15 to-cyan-600/15 flex items-center justify-center mb-5 border border-blue-500/20 group-hover:border-blue-500/40 group-hover:scale-110 transition-all duration-300">
                                    <FaFile className="text-2xl text-blue-400 group-hover:text-blue-300" />
                                </div>

                                {/* File Name */}
                                <h3 className="text-lg font-semibold mb-3 text-gray-100 group-hover:text-blue-400 transition-colors line-clamp-1">
                                    {file.name}
                                </h3>

                                {/* Metadata */}
                                <div className="flex items-center text-xs text-gray-500 gap-2 border-t border-gray-700/50 pt-4 mt-3">
                                    <FaClock className="text-[10px]" />
                                    <span>{new Date(file.lastModified).toLocaleDateString()}</span>
                                    <span className="mx-1">•</span>
                                    <span>{new Date(file.lastModified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        ))}

                        {/* Empty State */}
                        {files.length === 0 && !isCreating && (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500 border-2 border-dashed border-gray-800 rounded-2xl hover:border-gray-700 transition-colors">
                                <FaFile className="text-5xl mb-4 text-gray-700" />
                                <p className="mb-6 text-lg">No files yet in this project.</p>
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-2"
                                >
                                    <FaPlus className="text-sm" /> Create your first file
                                </button>
                            </div>
                        )}
                    </div>
                </main>

                {/* Sidebar - Branches */}
                {showBranchModal && (
                    <div className="w-80 border-l border-gray-700/50 bg-gray-900/50 h-[calc(100vh-73px)] overflow-y-auto">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-lg">Branches</h3>
                                <button
                                    onClick={() => setShowBranchModal(false)}
                                    className="text-gray-500 hover:text-gray-300"
                                >
                                    ×
                                </button>
                            </div>
                            <BranchManager
                                branches={branches}
                                currentBranch={currentBranch}
                                versions={versions}
                                onCreateBranch={handleCreateBranch}
                                onSwitchBranch={handleSwitchBranch}
                                onDeleteBranch={handleDeleteBranch}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Commit Modal */}
            {showCommitModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="glass-panel p-8 max-w-md w-full mx-4 border border-gray-700/50 shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6 text-gray-100 flex items-center gap-3">
                            <FaSave className="text-green-400" />
                            Commit Changes
                        </h2>
                        <p className="text-gray-400 mb-4">
                            Create a snapshot of your project state. This will save all file contents.
                        </p>
                        <input
                            type="text"
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                            placeholder="Describe your changes..."
                            className="input w-full mb-6"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
                        />
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowCommitModal(false)}
                                className="btn btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCommit}
                                className="btn btn-success flex-1"
                            >
                                Commit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
