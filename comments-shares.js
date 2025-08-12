// Comments and Shares functionality for the website

class CommentsManager {
    constructor(apiBase) {
        // Use provided apiBase, or window.API_BASE_URL, or environment variable, or fallback
        this.apiBase = apiBase || (typeof window !== 'undefined' && window.API_BASE_URL) || (typeof process !== 'undefined' && process.env.API_BASE_URL) || 'http://localhost:3000';
    }

    // Fetch comments for a specific post/reel
    async getComments(contentType, contentId) {
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
        try {
            const response = await fetch(`${this.apiBase}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
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
        try {
            const response = await fetch(`${this.apiBase}/comments/${commentId}/like`, {
                method: 'PUT'
            });
            
            if (!response.ok) throw new Error('Failed to like comment');
            return await response.json();
        } catch (error) {
            console.error('Error liking comment:', error);
            return null;
        }
    }
}

class SharesManager {
    constructor(apiBase) {
        this.apiBase = apiBase || (typeof window !== 'undefined' && window.API_BASE_URL) || (typeof process !== 'undefined' && process.env.API_BASE_URL) || 'http://localhost:3000';
    }

    // Get share count for a specific post/reel
    async getShareCount(contentType, contentId) {
        try {
            const response = await fetch(`${this.apiBase}/shares/${contentType}/${contentId}`);
            if (!response.ok) throw new Error('Failed to fetch share count');
            return await response.json();
        } catch (error) {
            console.error('Error fetching share count:', error);
            return { count: 0, shares: [] };
        }
    }

    // Record a new share
    async recordShare(userId, contentType, contentId, platform) {
        try {
            const response = await fetch(`${this.apiBase}/shares`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
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
}

// Utility functions for DOM manipulation
class DOMUtils {
    static createCommentElement(comment) {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment-item';

        // Header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'comment-header';
        const strong = document.createElement('strong');
        strong.textContent = comment.author;
        const timeSpan = document.createElement('span');
        timeSpan.className = 'comment-time';
        timeSpan.textContent = new Date(comment.timestamp).toLocaleString();
        headerDiv.appendChild(strong);
        headerDiv.appendChild(timeSpan);

        // Content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'comment-content';
        contentDiv.textContent = comment.content;

        // Actions
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'comment-actions';
        const likeBtn = document.createElement('button');
        likeBtn.className = 'like-btn';
        likeBtn.setAttribute('data-comment-id', comment.id);
        likeBtn.textContent = `👍 ${comment.likes || 0}`;
        actionsDiv.appendChild(likeBtn);

        // Assemble
        commentDiv.appendChild(headerDiv);
        commentDiv.appendChild(contentDiv);
        commentDiv.appendChild(actionsDiv);
        return commentDiv;
    }

    static createCommentForm(contentType, contentId) {
        const formDiv = document.createElement('div');
        formDiv.className = 'comment-form';
        formDiv.innerHTML = `
            <h4>Add a Comment</h4>
            <textarea placeholder="Write your comment..." class="comment-textarea" rows="3"></textarea>
            <input type="text" placeholder="Your name" class="comment-author" />
            <button class="submit-comment-btn" data-type="${contentType}" data-id="${contentId}">
                Post Comment
            </button>
        `;
        return formDiv;
    }

    static createShareButtons(contentType, contentId) {
        const shareDiv = document.createElement('div');
        shareDiv.className = 'share-buttons';
        shareDiv.innerHTML = `
            <button class="share-btn" data-platform="facebook" data-type="${contentType}" data-id="${contentId}">
                Share on Facebook
            </button>
            <button class="share-btn" data-platform="twitter" data-type="${contentType}" data-id="${contentId}">
                Share on Twitter
            </button>
            <button class="share-btn" data-platform="whatsapp" data-type="${contentType}" data-id="${contentId}">
                Share on WhatsApp
            </button>
            <span class="share-count">0 shares</span>
        `;
        return shareDiv;
    }
}

// Initialize the system
    // Optionally set window.API_BASE_URL before this script runs for custom API base
    const apiBase = (typeof window !== 'undefined' && window.API_BASE_URL) || undefined;
    const commentsManager = new CommentsManager(apiBase);
    const sharesManager = new SharesManager(apiBase);
    
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
                loadComments(contentType, contentId);
            }
        }
    });
    
    // Handle share button clicks
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('share-btn')) {
            const platform = e.target.dataset.platform;
            const contentType = e.target.dataset.type;
            const contentId = e.target.dataset.id;
            const userId = 'guest'; // In real app, get from user session
            
            await sharesManager.recordShare(userId, contentType, contentId, platform);
            updateShareCount(contentType, contentId);
            
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
            const contentType = e.target.closest('.comments-section').dataset.type;
            const contentId = e.target.closest('.comments-section').dataset.id;
            loadComments(contentType, contentId);
        }
    });
});

