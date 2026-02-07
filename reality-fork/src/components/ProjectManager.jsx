import { useState, useEffect } from 'react';
import { FaPlus, FaFolder, FaTrash, FaClock } from 'react-icons/fa';
import { loadProjects, saveProjects, saveCurrentProjectId, deleteProjectData } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';

export default function ProjectManager({ onSelectProject }) {
    const [projects, setProjects] = useState([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const loadedProjects = loadProjects();
        setProjects(loadedProjects);
    }, []);

    const handleCreateProject = (e) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;

        const newProject = {
            id: uuidv4(),
            name: newProjectName.trim(),
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };

        const updatedProjects = [...projects, newProject];
        setProjects(updatedProjects);
        saveProjects(updatedProjects);
        setNewProjectName('');
        setIsCreating(false);

        // Auto select new project
        handleSelectProject(newProject);
    };

    const handleSelectProject = (project) => {
        saveCurrentProjectId(project.id);
        onSelectProject(project);
    };

    const handleDeleteProject = (e, projectId) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this project? All history will be lost.')) {
            const updatedProjects = projects.filter(p => p.id !== projectId);
            setProjects(updatedProjects);
            saveProjects(updatedProjects);
            deleteProjectData(projectId);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100 p-6 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-gray-900 to-gray-900 pointer-events-none" />

            <div className="w-full max-w-5xl z-10">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                            Reality Projects
                        </h1>
                        <p className="text-gray-400 text-lg">Manage your parallel reality timelines</p>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="btn btn-primary px-6 py-3 text-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5"
                    >
                        <FaPlus /> New Project
                    </button>
                </div>

                {isCreating && (
                    <div className="glass-panel p-8 mb-10 animate-fadeIn border border-blue-500/30 shadow-2xl shadow-blue-900/20 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                        <h3 className="text-xl font-semibold mb-6 text-blue-300">Initialize New Reality</h3>
                        <form onSubmit={handleCreateProject} className="flex flex-col md:flex-row gap-4">
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="Enter project designation..."
                                className="input flex-1 text-lg px-4 py-3 bg-gray-900/50 border-gray-700/50 focus:border-blue-500/50 focus:ring-blue-500/20"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setIsCreating(false)} className="btn btn-secondary px-6">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-success px-6 shadow-lg shadow-green-500/20">
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {projects.map(project => (
                        <div
                            key={project.id}
                            onClick={() => handleSelectProject(project)}
                            className="glass-panel p-7 cursor-pointer hover:bg-gray-800/80 transition-all duration-300 group relative border border-gray-700/50 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-900/10 hover:-translate-y-1 rounded-xl"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button
                                    onClick={(e) => handleDeleteProject(e, project.id)}
                                    className="text-gray-500 hover:text-red-400 p-2.5 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Delete Project"
                                >
                                    <FaTrash />
                                </button>
                            </div>

                            <div className="flex items-start justify-between mb-5">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/15 to-purple-600/15 flex items-center justify-center text-blue-400 group-hover:text-blue-300 group-hover:scale-110 transition-all duration-300 border border-blue-500/20 group-hover:border-blue-500/40">
                                    <FaFolder className="text-2xl" />
                                </div>
                            </div>

                            <h3 className="text-xl font-bold mb-4 text-gray-100 group-hover:text-blue-400 transition-colors line-clamp-1">
                                {project.name}
                            </h3>

                            <div className="flex items-center text-sm text-gray-500 gap-2 border-t border-gray-700/50 pt-4 mt-3 group-hover:border-gray-700 transition-colors">
                                <FaClock className="text-xs" />
                                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                                <span className="mx-1">•</span>
                                <span>{new Date(project.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    ))}

                    {projects.length === 0 && !isCreating && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500 border-2 border-dashed border-gray-800 rounded-2xl hover:border-gray-700 transition-colors">
                            <FaFolder className="text-5xl mb-4 text-gray-700" />
                            <p className="mb-6 text-lg">No parallel realities found.</p>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-2"
                            >
                                <FaPlus className="text-sm" /> Create your first project
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
