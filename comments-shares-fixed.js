// Comments and Shares functionality for the website

class CommentsManager {
    constructor() {
        this.apiBase = 'http://localhost:3000';
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
    constructor() {
        this.apiBase = 'http://localhost:3000';
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
        commentDiv.innerHTML = `
            <div class="comment-header">
                <strong>${comment.author}</strong>
                <span class="comment-time">${new Date(comment.timestamp).toLocaleString()}</span>
            </div>
            <div class="comment-content">${comment.content}</div>
            <div class="comment-actions">
                <button class="like-btn" data-comment-id="${comment.id}">
                    👍 ${comment.likes || 0}
                </button>
            </div>
        `;
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

// Utility functions for loading content
async function loadComments(contentType, contentId) {
    const commentsContainer = document.querySelector(`[data-type="${contentType}"][data-id="${contentId}"] .comments-list`);
    if (!commentsContainer) return;
    
    const comments = await new CommentsManager().getComments(contentType, contentId);
    commentsContainer.innerHTML = '';
    
    comments.forEach(comment => {
        commentsContainer.appendChild(DOMUtils.createCommentElement(comment));
    });
}

async function updateShareCount(contentType, contentId) {
    const shareCountElement = document.querySelector(`[data-type="${contentType}"][data-id="${contentId}"] .share-count`);
    if (!shareCountElement) return;
    
    const shareData = await new SharesManager().getShareCount(contentType, contentId);
    shareCountElement.textContent = `${shareData.count} shares`;
}
