// ===================================
// CIVIC SENSE - SUPABASE CLIENT
// ===================================

// Supabase Configuration
// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';

// Initialize Supabase Client
let supabase = null;

// Check if Supabase is available
async function initSupabase() {
    try {
        // Load Supabase from CDN
        if (!window.supabase) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            document.head.appendChild(script);
            
            await new Promise((resolve) => {
                script.onload = resolve;
            });
        }
        
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        return false;
    }
}

// ===================================
// USER FUNCTIONS
// ===================================

async function createUser(userData) {
    if (!supabase) {
        // Fallback to localStorage
        const users = JSON.parse(localStorage.getItem('civicUsers') || '[]');
        const newUser = { ...userData, id: Date.now(), created_at: new Date().toISOString() };
        users.push(newUser);
        localStorage.setItem('civicUsers', JSON.stringify(users));
        return newUser;
    }
    
    try {
        const { data, error } = await supabase
            .from('users')
            .insert([userData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating user:', error);
        // Fallback to localStorage
        return createUser(userData);
    }
}

async function getUserByEmail(email) {
    if (!supabase) {
        const users = JSON.parse(localStorage.getItem('civicUsers') || '[]');
        return users.find(u => u.email === email);
    }
    
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error getting user:', error);
        return getUserByEmail(email);
    }
}

async function getAllUsers() {
    if (!supabase) {
        return JSON.parse(localStorage.getItem('civicUsers') || '[]');
    }
    
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error getting users:', error);
        return getAllUsers();
    }
}

// ===================================
// REPORTS FUNCTIONS
// ===================================

async function createReport(reportData) {
    if (!supabase) {
        const reports = JSON.parse(localStorage.getItem('civicReports') || '[]');
        const newReport = { ...reportData, id: Date.now().toString(), created_at: new Date().toISOString() };
        reports.unshift(newReport);
        localStorage.setItem('civicReports', JSON.stringify(reports));
        return newReport;
    }
    
    try {
        const { data, error } = await supabase
            .from('reports')
            .insert([reportData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating report:', error);
        return createReport(reportData);
    }
}

async function getAllReports(filters = {}) {
    if (!supabase) {
        let reports = JSON.parse(localStorage.getItem('civicReports') || '[]');
        
        // Apply filters
        if (filters.status) {
            reports = reports.filter(r => r.status === filters.status);
        }
        if (filters.hours) {
            const cutoff = Date.now() - (filters.hours * 60 * 60 * 1000);
            reports = reports.filter(r => new Date(r.created_at || r.submittedAt).getTime() >= cutoff);
        }
        
        return reports;
    }
    
    try {
        let query = supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        if (filters.hours) {
            const cutoff = new Date(Date.now() - (filters.hours * 60 * 60 * 1000)).toISOString();
            query = query.gte('created_at', cutoff);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error getting reports:', error);
        return getAllReports(filters);
    }
}

async function updateReportStatus(reportId, status) {
    if (!supabase) {
        const reports = JSON.parse(localStorage.getItem('civicReports') || '[]');
        const index = reports.findIndex(r => r.id === reportId);
        if (index !== -1) {
            reports[index].status = status;
            reports[index].updated_at = new Date().toISOString();
            localStorage.setItem('civicReports', JSON.stringify(reports));
        }
        return reports[index];
    }
    
    try {
        const { data, error } = await supabase
            .from('reports')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', reportId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating report:', error);
        return updateReportStatus(reportId, status);
    }
}

// ===================================
// POSTS FUNCTIONS
// ===================================

async function createPost(postData) {
    if (!supabase) {
        const posts = JSON.parse(localStorage.getItem('civicPosts') || '[]');
        const newPost = { ...postData, id: Date.now(), created_at: new Date().toISOString() };
        posts.unshift(newPost);
        localStorage.setItem('civicPosts', JSON.stringify(posts));
        return newPost;
    }
    
    try {
        const { data, error } = await supabase
            .from('posts')
            .insert([postData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating post:', error);
        return createPost(postData);
    }
}

async function getAllPosts() {
    if (!supabase) {
        return JSON.parse(localStorage.getItem('civicPosts') || '[]');
    }
    
    try {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error getting posts:', error);
        return getAllPosts();
    }
}

// ===================================
// MEDIA FUNCTIONS
// ===================================

async function createMedia(mediaData) {
    if (!supabase) {
        const media = JSON.parse(localStorage.getItem('civicMedia') || '[]');
        const newMedia = { ...mediaData, id: Date.now(), created_at: new Date().toISOString() };
        media.unshift(newMedia);
        localStorage.setItem('civicMedia', JSON.stringify(media));
        return newMedia;
    }
    
    try {
        const { data, error } = await supabase
            .from('media')
            .insert([mediaData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating media:', error);
        return createMedia(mediaData);
    }
}

async function getAllMedia() {
    if (!supabase) {
        return JSON.parse(localStorage.getItem('civicMedia') || '[]');
    }
    
    try {
        const { data, error } = await supabase
            .from('media')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error getting media:', error);
        return getAllMedia();
    }
}

// ===================================
// MAP ISSUES FUNCTIONS
// ===================================

async function createMapIssue(issueData) {
    if (!supabase) {
        const issues = JSON.parse(localStorage.getItem('civicMapIssues') || '[]');
        const newIssue = { ...issueData, id: Date.now(), created_at: Date.now() };
        issues.unshift(newIssue);
        localStorage.setItem('civicMapIssues', JSON.stringify(issues));
        return newIssue;
    }
    
    try {
        const { data, error } = await supabase
            .from('map_issues')
            .insert([issueData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating map issue:', error);
        return createMapIssue(issueData);
    }
}

async function getAllMapIssues(filters = {}) {
    if (!supabase) {
        let issues = JSON.parse(localStorage.getItem('civicMapIssues') || '[]');
        
        if (filters.status) {
            issues = issues.filter(i => i.status === filters.status);
        }
        if (filters.hours) {
            const cutoff = Date.now() - (filters.hours * 60 * 60 * 1000);
            issues = issues.filter(i => (i.time || i.created_at) >= cutoff);
        }
        
        return issues;
    }
    
    try {
        let query = supabase
            .from('map_issues')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        if (filters.hours) {
            const cutoff = new Date(Date.now() - (filters.hours * 60 * 60 * 1000)).toISOString();
            query = query.gte('created_at', cutoff);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error getting map issues:', error);
        return getAllMapIssues(filters);
    }
}

// ===================================
// STATISTICS FUNCTIONS
// ===================================

async function getStatistics() {
    const reports = await getAllReports();
    const posts = await getAllPosts();
    const media = await getAllMedia();
    const users = await getAllUsers();
    const mapIssues = await getAllMapIssues();
    
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    const totalIssues = reports.length + mapIssues.length;
    const resolvedIssues = reports.filter(r => r.status === 'resolved').length + 
                          mapIssues.filter(i => i.status === 'resolved').length;
    
    const issuesThisWeek = reports.filter(r => {
        const time = new Date(r.created_at || r.submittedAt).getTime();
        return time >= oneWeekAgo;
    }).length + mapIssues.filter(i => {
        const time = new Date(i.created_at).getTime();
        return time >= oneWeekAgo;
    }).length;
    
    return {
        totalIssues,
        resolvedIssues,
        activeUsers: users.length,
        totalPosts: posts.length,
        totalMedia: media.length,
        issuesThisWeek,
        resolutionRate: totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0
    };
}

// ===================================
// INITIALIZE ON PAGE LOAD
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    await initSupabase();
});

// Export functions for use in other scripts
window.civicDB = {
    // Users
    createUser,
    getUserByEmail,
    getAllUsers,
    
    // Reports
    createReport,
    getAllReports,
    updateReportStatus,
    
    // Posts
    createPost,
    getAllPosts,
    
    // Media
    createMedia,
    getAllMedia,
    
    // Map Issues
    createMapIssue,
    getAllMapIssues,
    
    // Statistics
    getStatistics,
    
    // Supabase client
    getClient: () => supabase
};
