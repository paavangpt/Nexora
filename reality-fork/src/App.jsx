import { useState, useEffect } from 'react';
import { loadCurrentProjectId, saveCurrentProjectId, loadCurrentFileId, saveCurrentFileId, loadFiles } from './utils/storage';
import ProjectManager from './components/ProjectManager';
import FileDashboard from './components/FileDashboard';
import FileEditor from './components/FileEditor';

function App() {
  const [currentProject, setCurrentProject] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);

  // Initialize project and file state
  useEffect(() => {
    const projectId = loadCurrentProjectId();
    if (projectId) {
      setCurrentProject({ id: projectId, name: 'Current Project' });
      const fileId = loadCurrentFileId(projectId);
      if (fileId) {
        // Load file details
        const files = loadFiles(projectId);
        const file = files.find(f => f.id === fileId);
        if (file) {
          setCurrentFile(file);
        }
      }
    }
  }, []);

  // Handle project selection
  const handleProjectSelect = (project) => {
    setCurrentProject(project);
    saveCurrentProjectId(project.id);
    setCurrentFile(null); // Reset file when switching projects
  };

  const handleBackToProjects = () => {
    setCurrentProject(null);
    setCurrentFile(null);
    saveCurrentProjectId('');
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    setCurrentFile(file);
    if (currentProject?.id) {
      saveCurrentFileId(currentProject.id, file.id);
    }
  };

  const handleBackToFiles = () => {
    setCurrentFile(null);
    if (currentProject?.id) {
      saveCurrentFileId(currentProject.id, '');
    }
  };

  // If no project selected, show Project Manager
  if (!currentProject) {
    return <ProjectManager onSelectProject={handleProjectSelect} />;
  }

  // If project selected but no file, show File Dashboard (with version control)
  if (!currentFile) {
    return (
      <FileDashboard
        project={currentProject}
        onSelectFile={handleFileSelect}
        onBack={handleBackToProjects}
      />
    );
  }

  // If file selected, show File Editor (simple editor, no version control UI)
  return (
    <FileEditor
      project={currentProject}
      file={currentFile}
      onBack={handleBackToFiles}
    />
  );
}

export default App;
