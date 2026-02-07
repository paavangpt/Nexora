const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Version API calls
export const versionAPI = {
    // Get all versions
    getAll: () => apiCall('/versions'),

    // Get single version
    getOne: (versionId) => apiCall(`/versions/${versionId}`),

    // Create new version
    create: (versionData) => apiCall('/versions', {
        method: 'POST',
        body: JSON.stringify(versionData)
    }),

    // Delete version
    delete: (versionId) => apiCall(`/versions/${versionId}`, {
        method: 'DELETE'
    }),

    // Get version chain
    getChain: (versionId) => apiCall(`/versions/${versionId}/chain`),

    // Get diff between versions
    getDiff: (versionId1, versionId2) =>
        apiCall(`/versions/diff/${versionId1}/${versionId2}`),

    // Merge versions
    merge: (mergeData) => apiCall('/versions/merge', {
        method: 'POST',
        body: JSON.stringify(mergeData)
    })
};

// Branch API calls
export const branchAPI = {
    // Get all branches
    getAll: () => apiCall('/branches'),

    // Get single branch
    getOne: (name) => apiCall(`/branches/${name}`),

    // Create new branch
    create: (branchData) => apiCall('/branches', {
        method: 'POST',
        body: JSON.stringify(branchData)
    }),

    // Update branch
    update: (name, versionId) => apiCall(`/branches/${name}`, {
        method: 'PUT',
        body: JSON.stringify({ versionId })
    }),

    // Delete branch
    delete: (name) => apiCall(`/branches/${name}`, {
        method: 'DELETE'
    }),

    // Get active branch
    getActive: () => apiCall('/branches/active'),

    // Set active branch
    setActive: (name) => apiCall(`/branches/${name}/activate`, {
        method: 'PUT'
    })
};
