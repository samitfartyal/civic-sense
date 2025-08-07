// Utility to get current userId from window, localStorage, or sessionStorage
function getCurrentUserId() {
    if (typeof window !== 'undefined' && window.getCurrentUserId) {
        return window.getCurrentUserId();
    } else if (typeof localStorage !== 'undefined' && localStorage.getItem('userId')) {
        return localStorage.getItem('userId');
    } else if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('userId')) {
        return sessionStorage.getItem('userId');
    }
    return null;
}

// Utility to get API base URL from env, window, or fallback
function getApiBaseUrl() {
    return (
        (typeof process !== 'undefined' && process.env && process.env.API_BASE_URL) ||
        (typeof window !== 'undefined' && window.API_BASE_URL) ||
        (typeof window !== 'undefined' && window.FALLBACK_API_BASE_URL) ||
        '/'
    );
}

// Comments and Shares functionality for the website

class CommentsManager {
    constructor() {
        this.apiBase = getApiBaseUrl();
    }

    // Fetch comments for a specific post/reel
    async getComments(contentType, contentId) {
        // Parameter validation
        if (!contentType || typeof contentType !== 'string' || !contentType.trim()) {
            console.error('Invalid contentType');
            return [];
        }
        if (!contentId || typeof contentId !== 'string' || !contentId.trim()) {
            console.error('Invalid contentId');
            return [];
        }
        try {
            const response = await fetch(`${this.apiBase}/comments/${contentType}/${contentId}`);
            if (!response.ok) throw new Error('Failed to fetch comments');
            return await response.json();
        } catch (error) {
            console.error('Error fetching comments:', error);
            return [];
        }
    }

    // Add a new comment
    async addComment(content, author, contentType, contentId) {
        // Input validation
        if (!content || typeof content !== 'string' || !content.trim()) {
            console.error('Invalid comment content');
            return null;
        }
        if (!author || typeof author !== 'string' || !author.trim()) {
            console.error('Invalid author');
            return null;
        }
        if (!contentType || typeof contentType !== 'string' || !contentType.trim()) {
            console.error('Invalid contentType');
            return null;
        }
        if (!contentId || typeof contentId !== 'string' || !contentId.trim()) {
            console.error('Invalid contentId');
            return null;
        }

        // Get auth token (customize as needed)
        let token = null;
        if (typeof window !== 'undefined' && window.getAuthToken) {
            token = window.getAuthToken();
        } else if (typeof this.getAuthToken === 'function') {
            token = this.getAuthToken();
        } else if (typeof localStorage !== 'undefined' && localStorage.getItem('authToken')) {
            token = localStorage.getItem('authToken');
        }

        try {
            const response = await fetch(`${this.apiBase}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    content,
                    author,
                    contentType,
                    contentId
                })
            });
            if (!response.ok) throw new Error('Failed to add comment');
            return await response.json();
        } catch (error) {
            console.error('Error adding comment:', error);
            return null;
        }
    }

    // Like a comment
    async likeComment(commentId) {
        // Get auth token (reuse logic from addComment)
        let token = null;
        if (typeof window !== 'undefined' && window.getAuthToken) {
            token = window.getAuthToken();
        } else if (typeof this.getAuthToken === 'function') {
            token = this.getAuthToken();
        } else if (typeof localStorage !== 'undefined' && localStorage.getItem('authToken')) {
            token = localStorage.getItem('authToken');
        }
        try {
            const response = await fetch(`${this.apiBase}/comments/${commentId}/like`, {
                method: 'PUT',
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });
            if (!response.ok) throw new Error('Failed to like comment');
            return await response.json();
        } catch (error) {
            console.error('Error liking comment:', error);
            return null;
        }
    }

    // Record a new share
    async recordShare(userId, contentType, contentId, platform) {
        try {
            const response = await fetch(`${this.apiBase}/shares`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    userId,
                    contentType,
                    contentId,
                    platform
                })
            });
            if (!response.ok) throw new Error('Failed to record share');
            return await response.json();
        } catch (error) {
            console.error('Error recording share:', error);
            return null;
        }
    }

    getAuthToken() {
        if (typeof window !== 'undefined' && window.getAuthToken) {
            return window.getAuthToken();
        } else if (typeof localStorage !== 'undefined' && localStorage.getItem('authToken')) {
            return localStorage.getItem('authToken');
        } else if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('authToken')) {
            return sessionStorage.getItem('authToken');
        }
        return null;
    }
}

// Utility functions for DOM manipulation
class DOMUtils {
    static createCommentElement(comment) {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment-item';
        
        const header = document.createElement('div');
        header.className = 'comment-header';
        
        const authorStrong = document.createElement('strong');
        authorStrong.textContent = comment.author; // Safe text assignment
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'comment-time';
        timeSpan.textContent = new Date(comment.timestamp).toLocaleString();
        
        header.appendChild(authorStrong);
        header.appendChild(timeSpan);
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'comment-content';
        contentDiv.textContent = comment.content; // Safe text assignment
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'comment-actions';
        
        const likeBtn = document.createElement('button');
        likeBtn.className = 'like-btn';
        likeBtn.dataset.commentId = comment.id;
        likeBtn.textContent = `👍 ${comment.likes || 0}`;
        
        actionsDiv.appendChild(likeBtn);
        commentDiv.appendChild(header);
        commentDiv.appendChild(contentDiv);
        commentDiv.appendChild(actionsDiv);
        
        return commentDiv;
    }

    static createCommentForm(contentType, contentId) {
        const formDiv = document.createElement('div');
        formDiv.className = 'comment-form';

        const heading = document.createElement('h4');
        heading.textContent = 'Add a Comment';
        formDiv.appendChild(heading);

        const textarea = document.createElement('textarea');
        textarea.placeholder = 'Write your comment...';
        textarea.className = 'comment-textarea';
        textarea.rows = 3;
        formDiv.appendChild(textarea);

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Your name';
        input.className = 'comment-author';
        formDiv.appendChild(input);

        const button = document.createElement('button');
        button.className = 'submit-comment-btn';
        button.textContent = 'Post Comment';
        button.dataset.type = contentType;
        button.dataset.id = contentId;
        formDiv.appendChild(button);

        return formDiv;
    }

    static createShareButtons(contentType, contentId) {
        const shareDiv = document.createElement('div');
        shareDiv.className = 'share-buttons';

        const platforms = [
            { name: 'facebook', label: 'Share on Facebook' },
            { name: 'twitter', label: 'Share on Twitter' },
            { name: 'whatsapp', label: 'Share on WhatsApp' }
        ];

        platforms.forEach(platform => {
            const btn = document.createElement('button');
            btn.className = 'share-btn';
            btn.dataset.platform = platform.name;
            btn.dataset.type = contentType;
            btn.dataset.id = contentId;
            btn.textContent = platform.label;
            shareDiv.appendChild(btn);
        });

        const shareCount = document.createElement('span');
        shareCount.className = 'share-count';
        shareCount.textContent = '0 shares';
        shareDiv.appendChild(shareCount);

        return shareDiv;
    }
}

// Initialize the system
document.addEventListener('DOMContentLoaded', () => {
    const commentsManager = new CommentsManager();
    const sharesManager = new SharesManager();
    
    // Handle comment form submissions
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('submit-comment-btn')) {
            e.preventDefault();
            const form = e.target.closest('.comment-form');
            const content = form.querySelector('.comment-textarea').value.trim();
            const author = form.querySelector('.comment-author').value.trim();
            const contentType = e.target.dataset.type;
            const contentId = e.target.dataset.id;
            
            if (!content || !author) {
                alert('Please fill in all fields');
                return;
            }
            
            const result = await commentsManager.addComment(content, author, contentType, contentId);
            if (result) {
                form.querySelector('.comment-textarea').value = '';
                form.querySelector('.comment-author').value = '';
                loadComments(contentType, contentId, commentsManager);
            }
        }
    });
    
    // Handle share button clicks
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('share-btn')) {
            const platform = e.target.dataset.platform;
            const contentType = e.target.dataset.type;
            const contentId = e.target.dataset.id;
            // Retrieve userId from session/auth context
            const userId = getCurrentUserId();
            if (!userId) {
                alert('You must be logged in to share.');
                return;
            }
            await sharesManager.recordShare(userId, contentType, contentId, platform);
            updateShareCount(contentType, contentId, sharesManager);
            // Open share dialog
            const url = window.location.href;
            const text = `Check out this ${contentType}!`;
            switch (platform) {
                case 'facebook':
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                    break;
                case 'twitter':
                    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
                    break;
                case 'whatsapp':
                    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
                    break;
            }
        }
    });
    
    // Handle comment likes
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('like-btn')) {
            const commentId = e.target.dataset.commentId;
            await commentsManager.likeComment(commentId);
            const section = e.target.closest('.comments-section');
            if (section) {
                const contentType = section.dataset.type;
                const contentId = section.dataset.id;
                loadComments(contentType, contentId, commentsManager);
            }
        }
    });
});

// Utility functions for loading content
async function loadComments(contentType, contentId, commentsManager) {
    const commentsContainer = document.querySelector(`[data-type="${contentType}"][data-id="${contentId}"] .comments-list`);
    if (!commentsContainer) return;
    const comments = await commentsManager.getComments(contentType, contentId);
    commentsContainer.innerHTML = '';
    comments.forEach(comment => {
        commentsContainer.appendChild(DOMUtils.createCommentElement(comment));
    });
}

async function updateShareCount(contentType, contentId, sharesManager) {
    const shareCountElement = document.querySelector(`[data-type="${contentType}"][data-id="${contentId}"] .share-count`);
    if (!shareCountElement) return;
    const shareData = await sharesManager.getShareCount(contentType, contentId);
    shareCountElement.textContent = `${shareData.count} shares`;
}
