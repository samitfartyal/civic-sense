// Civic Sense - AI News Hub Application
// =======================================

// State Management
const AppState = {
    currentScope: 'local',
    currentCategory: 'all',
    currentSort: 'latest',
    news: [],
    trending: [],
    bookmarks: JSON.parse(localStorage.getItem('newsBookmarks')) || [],
    interests: JSON.parse(localStorage.getItem('userInterests')) || [],
    readingHistory: JSON.parse(localStorage.getItem('readingHistory')) || [],
    searchHistory: JSON.parse(localStorage.getItem('searchHistory')) || [],
    articlesRead: parseInt(localStorage.getItem('articlesRead')) || 0,
    timeSpent: parseInt(localStorage.getItem('timeSpent')) || 0,
    darkMode: localStorage.getItem('darkMode') === 'true',
    currentPage: 1,
    isLoading: false,
    breakingNewsShown: false
};

// DOM Elements
const elements = {
    breakingBanner: document.getElementById('breaking-news-banner'),
    breakingText: document.getElementById('breaking-text'),
    searchInput: document.getElementById('search-input'),
    searchSuggestions: document.getElementById('search-suggestions'),
    themeToggle: document.getElementById('theme-toggle'),
    bookmarksBtn: document.getElementById('bookmarks-btn'),
    bookmarkCount: document.getElementById('bookmark-count'),
    chatbotBtn: document.getElementById('chatbot-btn'),
    trendingContainer: document.getElementById('trending-container'),
    newsFeed: document.getElementById('news-feed'),
    feedTitle: document.getElementById('feed-title'),
    refreshBtn: document.getElementById('refresh-btn'),
    sortSelect: document.getElementById('sort-select'),
    loadMore: document.getElementById('load-more'),
    bookmarksPanel: document.getElementById('bookmarks-panel'),
    bookmarksList: document.getElementById('bookmarks-list'),
    chatbotPanel: document.getElementById('chatbot-panel'),
    chatMessages: document.getElementById('chat-messages'),
    chatInput: document.getElementById('chat-input'),
    chatSend: document.getElementById('chat-send'),
    articleModal: document.getElementById('article-modal'),
    modalContent: document.getElementById('modal-article-content'),
    toastContainer: document.getElementById('toast-container'),
    interestsContainer: document.getElementById('interests-container'),
    articlesReadEl: document.getElementById('articles-read'),
    bookmarksCountEl: document.getElementById('bookmarks-count'),
    timeSpentEl: document.getElementById('time-spent')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Apply saved theme
    if (AppState.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        elements.themeToggle.querySelector('i').className = 'fas fa-sun';
    }
    
    // Load user interests
    loadUserInterests();
    
    // Update stats display
    updateStats();
    
    // Load initial data
    loadNews();
    loadTrending();
    checkBreakingNews();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start time tracking
    startTimeTracking();
    
    // Auto-refresh news every 5 minutes
    setInterval(() => {
        loadNews(false);
        checkBreakingNews();
    }, 5 * 60 * 1000);
}

function setupEventListeners() {
    // Theme Toggle
    elements.themeToggle.addEventListener('click', toggleDarkMode);
    
    // Search
    elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
    elements.searchInput.addEventListener('focus', () => {
        if (elements.searchInput.value.length > 0) {
            handleSearch();
        }
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            elements.searchSuggestions.classList.add('hidden');
        }
    });
    
    // Enter key to search
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = elements.searchInput.value.trim();
            if (query.length >= 2) {
                elements.searchSuggestions.classList.add('hidden');
                performSearch(query);
            }
        }
    });
    
    // Double-click logo to reset to home
    document.querySelector('.logo').addEventListener('dblclick', resetToHomeFeed);
    
    // Scope Toggle
    document.querySelectorAll('.scope-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.scope-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            AppState.currentScope = btn.dataset.scope;
            loadNews();
            updateFeedTitle();
        });
    });
    
    // Category Filters
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            AppState.currentCategory = btn.dataset.category;
            loadNews();
            updateFeedTitle();
        });
    });
    
    // Sort Select
    elements.sortSelect.addEventListener('change', (e) => {
        AppState.currentSort = e.target.value;
        loadNews();
    });
    
    // Refresh Button
    elements.refreshBtn.addEventListener('click', () => {
        const icon = elements.refreshBtn.querySelector('i');
        icon.classList.add('fa-spin');
        loadNews().then(() => {
            icon.classList.remove('fa-spin');
            showToast('News refreshed!', 'success');
        });
    });
    
    // Load More
    elements.loadMore.querySelector('button').addEventListener('click', () => {
        AppState.currentPage++;
        loadNews(false);
    });
    
    // Bookmarks
    elements.bookmarksBtn.addEventListener('click', openBookmarksPanel);
    
    // Chatbot
    elements.chatbotBtn.addEventListener('click', toggleChatbot);
    elements.chatSend.addEventListener('click', sendChatMessage);
    elements.chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
    
    // Interests
    document.querySelectorAll('.interest-tag').forEach(tag => {
        if (AppState.interests.includes(tag.dataset.interest)) {
            tag.classList.add('active');
        }
        tag.addEventListener('click', () => {
            tag.classList.toggle('active');
            const interest = tag.dataset.interest;
            if (tag.classList.contains('active')) {
                if (!AppState.interests.includes(interest)) {
                    AppState.interests.push(interest);
                }
            } else {
                AppState.interests = AppState.interests.filter(i => i !== interest);
            }
            localStorage.setItem('userInterests', JSON.stringify(AppState.interests));
            loadNews();
        });
    });
    
    // Quick Links
    document.querySelectorAll('.quick-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = link.dataset.category;
            if (category === 'bookmarks') {
                openBookmarksPanel();
            } else if (category === 'trending') {
                document.querySelector('.trending-section').scrollIntoView({ behavior: 'smooth' });
            } else if (category === 'breaking') {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                loadBreakingNews();
            }
        });
    });
    
    // Bottom Navigation (Mobile)
    document.querySelectorAll('.bottom-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.bottom-nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const action = btn.dataset.action;
            switch(action) {
                case 'home':
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    break;
                case 'trending':
                    document.querySelector('.trending-section').scrollIntoView({ behavior: 'smooth' });
                    break;
                case 'search':
                    elements.searchInput.focus();
                    break;
                case 'bookmarks':
                    openBookmarksPanel();
                    break;
                case 'profile':
                    showToast('Profile coming soon!', 'warning');
                    break;
            }
        });
    });
}

// Theme Functions
function toggleDarkMode() {
    AppState.darkMode = !AppState.darkMode;
    document.documentElement.setAttribute('data-theme', AppState.darkMode ? 'dark' : '');
    elements.themeToggle.querySelector('i').className = AppState.darkMode ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('darkMode', AppState.darkMode);
}

// News Loading Functions
async function loadNews(showLoading = true) {
    if (AppState.isLoading) return;
    AppState.isLoading = true;
    
    if (showLoading) {
        elements.newsFeed.innerHTML = Array(6).fill('<div class="loading-skeleton card-skeleton"></div>').join('');
    }
    
    try {
        let url = '/api/news';
        const params = new URLSearchParams();
        
        if (AppState.currentScope !== 'global') {
            params.append('scope', AppState.currentScope);
        }
        if (AppState.currentCategory !== 'all') {
            params.append('category', AppState.currentCategory);
        }
        params.append('sort', AppState.currentSort);
        params.append('page', AppState.currentPage);
        
        if (AppState.interests.length > 0) {
            params.append('interests', AppState.interests.join(','));
        }
        
        const response = await fetch(`${url}?${params}&_=${Date.now()}`);
        const news = await response.json();
        
        if (showLoading || AppState.currentPage === 1) {
            AppState.news = news;
            renderNews(news);
        } else {
            AppState.news = [...AppState.news, ...news];
            appendNews(news);
        }
        
        // Show/hide load more button
        elements.loadMore.classList.toggle('hidden', news.length < 10);
        
    } catch (error) {
        console.error('Error loading news:', error);
        elements.newsFeed.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load news. Please try again.</p>
            </div>
        `;
    }
    
    AppState.isLoading = false;
}

async function loadTrending() {
    try {
        const response = await fetch('/api/news/trending?_=' + Date.now());
        const trending = await response.json();
        AppState.trending = trending;
        renderTrending(trending);
    } catch (error) {
        console.error('Error loading trending:', error);
        elements.trendingContainer.innerHTML = '<p class="empty-state">Unable to load trending news</p>';
    }
}

async function checkBreakingNews() {
    try {
        const response = await fetch('/api/news/breaking?_=' + Date.now());
        const breaking = await response.json();
        
        if (breaking && breaking.length > 0 && !AppState.breakingNewsShown) {
            showBreakingNews(breaking[0]);
        }
    } catch (error) {
        console.error('Error checking breaking news:', error);
    }
}

function showBreakingNews(article) {
    elements.breakingText.textContent = article.title;
    elements.breakingBanner.classList.remove('hidden');
    AppState.breakingNewsShown = true;
    
    elements.breakingBanner.addEventListener('click', () => {
        openArticleModal(article);
    });
}

function dismissBreaking() {
    elements.breakingBanner.classList.add('hidden');
}

async function loadBreakingNews() {
    try {
        const response = await fetch('/api/news/breaking?_=' + Date.now());
        const news = await response.json();
        renderNews(news);
        elements.feedTitle.innerHTML = '<i class="fas fa-exclamation-circle"></i> Breaking News';
    } catch (error) {
        console.error('Error loading breaking news:', error);
    }
}

// Render Functions
function renderNews(articles) {
    if (!articles || articles.length === 0) {
        elements.newsFeed.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-newspaper"></i>
                <p>No news articles found. Try different filters.</p>
            </div>
        `;
        return;
    }
    
    elements.newsFeed.innerHTML = articles.map(article => createNewsCard(article)).join('');
    attachCardListeners();
}

function appendNews(articles) {
    const html = articles.map(article => createNewsCard(article)).join('');
    elements.newsFeed.insertAdjacentHTML('beforeend', html);
    attachCardListeners();
}

function createNewsCard(article) {
    const isBookmarked = AppState.bookmarks.some(b => b.url === article.url);
    const timeAgo = getTimeAgo(article.publishedAt);
    const category = article.category || detectCategory(article.title + ' ' + article.description);
    const summary = generateSummary(article.description || article.content || article.title);
    
    return `
        <article class="news-card" data-id="${article.id || article.url}">
            <div class="card-image">
                <img src="${article.urlToImage || 'https://via.placeholder.com/400x200?text=News'}" 
                     alt="${article.title}" 
                     onerror="this.src='https://via.placeholder.com/400x200?text=News'">
                <span class="card-category">${category}</span>
                <div class="card-actions">
                    <button class="card-action-btn bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" 
                            data-article='${encodeURIComponent(JSON.stringify(article))}'
                            title="${isBookmarked ? 'Remove bookmark' : 'Save article'}">
                        <i class="fas fa-bookmark"></i>
                    </button>
                    <button class="card-action-btn share-btn" 
                            data-url="${article.url}" 
                            data-title="${article.title}"
                            title="Share article">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
            </div>
            <div class="card-body">
                <h3 class="card-title">${article.title}</h3>
                <div class="card-summary">
                    <div class="card-summary-header">
                        <i class="fas fa-robot"></i> AI Summary
                    </div>
                    <ul>
                        ${summary.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                </div>
                <div class="card-meta">
                    <span class="card-source">${article.source?.name || 'Unknown'}</span>
                    <span class="card-time"><i class="far fa-clock"></i> ${timeAgo}</span>
                </div>
                <div class="card-engagement">
                    <button class="engagement-btn like-btn" data-id="${article.id || article.url}">
                        <i class="far fa-heart"></i>
                        <span>${article.likes || 0}</span>
                    </button>
                    <button class="engagement-btn comment-btn">
                        <i class="far fa-comment"></i>
                        <span>${article.comments || 0}</span>
                    </button>
                    <button class="engagement-btn read-btn" 
                            data-article='${encodeURIComponent(JSON.stringify(article))}'>
                        <i class="fas fa-book-open"></i>
                        <span>Read</span>
                    </button>
                </div>
            </div>
        </article>
    `;
}

function renderTrending(articles) {
    if (!articles || articles.length === 0) {
        elements.trendingContainer.innerHTML = '<p class="empty-state">No trending news</p>';
        return;
    }
    
    elements.trendingContainer.innerHTML = articles.slice(0, 10).map((article, index) => `
        <div class="trending-card" data-article='${encodeURIComponent(JSON.stringify(article))}'>
            <div class="trending-image">
                <img src="${article.urlToImage || 'https://via.placeholder.com/280x150?text=Trending'}" 
                     alt="${article.title}"
                     onerror="this.src='https://via.placeholder.com/280x150?text=Trending'">
                <span class="trending-rank">${index + 1}</span>
            </div>
            <div class="trending-content">
                <h4 class="trending-title">${article.title}</h4>
                <div class="trending-meta">
                    <span class="trending-views"><i class="fas fa-eye"></i> ${article.views || Math.floor(Math.random() * 10000)}</span>
                    <span>${getTimeAgo(article.publishedAt)}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add click listeners to trending cards
    document.querySelectorAll('.trending-card').forEach(card => {
        card.addEventListener('click', () => {
            const article = JSON.parse(decodeURIComponent(card.dataset.article));
            openArticleModal(article);
        });
    });
}

function attachCardListeners() {
    // Bookmark buttons
    document.querySelectorAll('.bookmark-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const article = JSON.parse(decodeURIComponent(btn.dataset.article));
            toggleBookmark(article, btn);
        });
    });
    
    // Share buttons
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            shareArticle(btn.dataset.url, btn.dataset.title);
        });
    });
    
    // Read buttons
    document.querySelectorAll('.read-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const article = JSON.parse(decodeURIComponent(btn.dataset.article));
            openArticleModal(article);
            trackReading(article);
        });
    });
    
    // Like buttons
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            likeArticle(btn);
        });
    });
    
    // Card click
    document.querySelectorAll('.news-card').forEach(card => {
        card.addEventListener('click', () => {
            const readBtn = card.querySelector('.read-btn');
            if (readBtn) {
                const article = JSON.parse(decodeURIComponent(readBtn.dataset.article));
                openArticleModal(article);
                trackReading(article);
            }
        });
    });
}

// Bookmark Functions
function toggleBookmark(article, btn) {
    const index = AppState.bookmarks.findIndex(b => b.url === article.url);
    
    if (index > -1) {
        AppState.bookmarks.splice(index, 1);
        btn.classList.remove('bookmarked');
        showToast('Article removed from bookmarks', 'success');
    } else {
        AppState.bookmarks.push({
            ...article,
            savedAt: new Date().toISOString()
        });
        btn.classList.add('bookmarked');
        showToast('Article saved to bookmarks', 'success');
    }
    
    localStorage.setItem('newsBookmarks', JSON.stringify(AppState.bookmarks));
    updateBookmarkCount();
}

function openBookmarksPanel() {
    elements.bookmarksPanel.classList.remove('hidden');
    renderBookmarks();
}

function closeBookmarksPanel() {
    elements.bookmarksPanel.classList.add('hidden');
}

function renderBookmarks() {
    if (AppState.bookmarks.length === 0) {
        elements.bookmarksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bookmark"></i>
                <p>No saved articles yet</p>
            </div>
        `;
        return;
    }
    
    elements.bookmarksList.innerHTML = AppState.bookmarks.map((article, index) => `
        <div class="bookmark-item" data-index="${index}">
            <div class="bookmark-image">
                <img src="${article.urlToImage || 'https://via.placeholder.com/80x60?text=News'}" 
                     alt="${article.title}"
                     onerror="this.src='https://via.placeholder.com/80x60?text=News'">
            </div>
            <div class="bookmark-info">
                <h4 class="bookmark-title">${article.title}</h4>
                <p class="bookmark-meta">${article.source?.name || 'Unknown'} • ${getTimeAgo(article.savedAt)}</p>
            </div>
            <button class="bookmark-remove" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    // Add click listeners
    document.querySelectorAll('.bookmark-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.bookmark-remove')) {
                const index = parseInt(item.dataset.index);
                openArticleModal(AppState.bookmarks[index]);
            }
        });
    });
    
    document.querySelectorAll('.bookmark-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            AppState.bookmarks.splice(index, 1);
            localStorage.setItem('newsBookmarks', JSON.stringify(AppState.bookmarks));
            renderBookmarks();
            updateBookmarkCount();
            showToast('Bookmark removed', 'success');
        });
    });
}

function updateBookmarkCount() {
    const count = AppState.bookmarks.length;
    elements.bookmarkCount.textContent = count;
    elements.bookmarkCount.classList.toggle('hidden', count === 0);
    elements.bookmarksCountEl.textContent = count;
}

// Chat Functions
function toggleChatbot() {
    elements.chatbotPanel.classList.toggle('hidden');
    if (!elements.chatbotPanel.classList.contains('hidden')) {
        elements.chatInput.focus();
    }
}

function closeChatbot() {
    elements.chatbotPanel.classList.add('hidden');
}

async function sendChatMessage() {
    const message = elements.chatInput.value.trim();
    if (!message) return;
    
    // Add user message
    addChatMessage(message, 'user');
    elements.chatInput.value = '';
    
    // Show typing indicator
    const typingId = addChatMessage('<i class="fas fa-spinner fa-spin"></i> Thinking...', 'bot', true);
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        document.getElementById(typingId)?.remove();
        
        // Add bot response
        addChatMessage(data.response, 'bot');
        
    } catch (error) {
        document.getElementById(typingId)?.remove();
        addChatMessage('Sorry, I encountered an error. Please try again.', 'bot');
    }
}

function addChatMessage(content, type, isTyping = false) {
    const messageId = isTyping ? 'typing-' + Date.now() : null;
    const avatar = type === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
    
    const messageHtml = `
        <div class="chat-message ${type}-message" ${messageId ? `id="${messageId}"` : ''}>
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <p>${content}</p>
            </div>
        </div>
    `;
    
    elements.chatMessages.insertAdjacentHTML('beforeend', messageHtml);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    
    return messageId;
}

// Search Functions
let searchTimeout = null;

async function handleSearch() {
    const query = elements.searchInput.value.trim();
    
    if (query.length < 2) {
        elements.searchSuggestions.classList.add('hidden');
        return;
    }
    
    // Debounce the API call
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&_=${Date.now()}`);
            const suggestions = await response.json();
            
            renderSearchSuggestions(suggestions, query);
        } catch (error) {
            console.error('Search error:', error);
        }
    }, 300);
}

function renderSearchSuggestions(suggestions, query) {
    if (!suggestions || suggestions.length === 0) {
        elements.searchSuggestions.classList.add('hidden');
        return;
    }
    
    // Add "Search for [query]" option at the top
    let html = `
        <div class="suggestion-item search-all" data-query="${query}" data-type="search">
            <i class="fas fa-search"></i>
            <span>Search for "<strong>${query}</strong>"</span>
            <span class="suggestion-category">search</span>
        </div>
    `;
    
    html += suggestions.map(s => {
        const icon = getIconForType(s.type);
        return `
            <div class="suggestion-item" data-query="${s.text}" data-type="${s.type}">
                <i class="${icon}"></i>
                <span>${highlightMatch(s.text, query)}</span>
                <span class="suggestion-category">${s.type}</span>
            </div>
        `;
    }).join('');
    
    elements.searchSuggestions.innerHTML = html;
    elements.searchSuggestions.classList.remove('hidden');
    
    // Add click listeners
    document.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            elements.searchInput.value = item.dataset.query;
            elements.searchSuggestions.classList.add('hidden');
            performSearch(item.dataset.query);
        });
    });
}

function getIconForType(type) {
    const icons = {
        topic: 'fas fa-tag',
        location: 'fas fa-map-marker-alt',
        keyword: 'fas fa-key',
        source: 'fas fa-newspaper',
        category: 'fas fa-folder',
        search: 'fas fa-search'
    };
    return icons[type] || 'fas fa-search';
}

function highlightMatch(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<strong>$1</strong>');
}

async function performSearch(query) {
    if (!query || query.length < 2) return;
    
    // Save to search history
    AppState.searchHistory.unshift(query);
    if (AppState.searchHistory.length > 10) {
        AppState.searchHistory.pop();
    }
    localStorage.setItem('searchHistory', JSON.stringify(AppState.searchHistory));
    
    // Show loading state
    elements.newsFeed.innerHTML = Array(6).fill('<div class="loading-skeleton card-skeleton"></div>').join('');
    elements.feedTitle.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Searching for "${query}"...`;
    
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&_=${Date.now()}`);
        const results = await response.json();
        
        if (results.length === 0) {
            elements.newsFeed.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fas fa-search"></i>
                    <p>No results found for "${query}". Try different keywords.</p>
                </div>
            `;
            elements.feedTitle.innerHTML = `<i class="fas fa-search"></i> No results for "${query}"`;
        } else {
            AppState.news = results;
            renderNews(results);
            elements.feedTitle.innerHTML = `<i class="fas fa-search"></i> ${results.length} results for "${query}"`;
        }
    } catch (error) {
        console.error('Search error:', error);
        elements.newsFeed.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-exclamation-circle"></i>
                <p>Search failed. Please try again.</p>
            </div>
        `;
        showToast('Search failed. Please try again.', 'error');
    }
}

// Reset to home feed
function resetToHomeFeed() {
    elements.searchInput.value = '';
    elements.searchSuggestions.classList.add('hidden');
    elements.feedTitle.innerHTML = '<i class="fas fa-newspaper"></i> Your News Feed';
    AppState.currentPage = 1;
    loadNews();
}

// Article Modal Functions
function openArticleModal(article) {
    const summary = generateSummary(article.description || article.content || article.title);
    const isBookmarked = AppState.bookmarks.some(b => b.url === article.url);
    
    elements.modalContent.innerHTML = `
        ${article.urlToImage ? `
            <img class="article-reader-image" 
                 src="${article.urlToImage}" 
                 alt="${article.title}"
                 onerror="this.style.display='none'">
        ` : ''}
        <h1>${article.title}</h1>
        <div class="article-reader-meta">
            <span><i class="fas fa-newspaper"></i> ${article.source?.name || 'Unknown'}</span>
            <span><i class="far fa-clock"></i> ${getTimeAgo(article.publishedAt)}</span>
            ${article.author ? `<span><i class="fas fa-user"></i> ${article.author}</span>` : ''}
        </div>
        <div class="article-reader-summary">
            <h3><i class="fas fa-robot"></i> AI Summary</h3>
            <ul>
                ${summary.map(s => `<li>${s}</li>`).join('')}
            </ul>
        </div>
        <div class="article-reader-content">
            ${article.content || article.description || '<p>Full article content not available. Click "Read Original" to view the complete article.</p>'}
        </div>
        <div class="article-reader-actions">
            <button class="article-action-btn ${isBookmarked ? 'bookmarked' : ''}" onclick="toggleBookmarkFromModal()">
                <i class="fas fa-bookmark"></i> ${isBookmarked ? 'Saved' : 'Save'}
            </button>
            <button class="article-action-btn" onclick="shareArticle('${article.url}', '${article.title.replace(/'/g, "\\'")}')">
                <i class="fas fa-share-alt"></i> Share
            </button>
            <a href="${article.url}" target="_blank" rel="noopener" class="article-action-btn primary">
                <i class="fas fa-external-link-alt"></i> Read Original
            </a>
        </div>
    `;
    
    // Store current article for modal actions
    window.currentModalArticle = article;
    
    elements.articleModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeArticleModal() {
    elements.articleModal.classList.add('hidden');
    document.body.style.overflow = '';
}

function toggleBookmarkFromModal() {
    if (window.currentModalArticle) {
        const btn = document.querySelector('.article-reader-actions .article-action-btn');
        toggleBookmark(window.currentModalArticle, btn);
        btn.innerHTML = `<i class="fas fa-bookmark"></i> ${AppState.bookmarks.some(b => b.url === window.currentModalArticle.url) ? 'Saved' : 'Save'}`;
    }
}

// Engagement Functions
function likeArticle(btn) {
    const countSpan = btn.querySelector('span');
    const icon = btn.querySelector('i');
    const isLiked = btn.classList.contains('liked');
    
    if (isLiked) {
        countSpan.textContent = parseInt(countSpan.textContent) - 1;
        icon.className = 'far fa-heart';
        btn.classList.remove('liked');
    } else {
        countSpan.textContent = parseInt(countSpan.textContent) + 1;
        icon.className = 'fas fa-heart';
        btn.classList.add('liked');
    }
}

function shareArticle(url, title) {
    if (navigator.share) {
        navigator.share({
            title: title,
            url: url
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(url).then(() => {
            showToast('Link copied to clipboard!', 'success');
        }).catch(() => {
            showToast('Failed to copy link', 'error');
        });
    }
}

// Utility Functions
function generateSummary(text) {
    if (!text) return ['No summary available'];
    
    // Simple extractive summarization
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const summary = sentences.slice(0, 3).map(s => s.trim());
    
    if (summary.length === 0) {
        return [text.substring(0, 100) + '...'];
    }
    
    return summary;
}

function detectCategory(text) {
    const categories = {
        technology: ['tech', 'ai', 'software', 'app', 'digital', 'cyber', 'data', 'startup'],
        politics: ['government', 'election', 'minister', 'policy', 'parliament', 'political'],
        business: ['market', 'economy', 'stock', 'company', 'trade', 'finance', 'investment'],
        sports: ['match', 'game', 'team', 'player', 'league', 'championship', 'score'],
        entertainment: ['movie', 'music', 'celebrity', 'film', 'actor', 'show', 'concert'],
        science: ['research', 'study', 'discovery', 'scientist', 'space', 'climate', 'health']
    };
    
    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => lowerText.includes(keyword))) {
            return category.charAt(0).toUpperCase() + category.slice(1);
        }
    }
    
    return 'General';
}

function getTimeAgo(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function updateFeedTitle() {
    const scope = AppState.currentScope.charAt(0).toUpperCase() + AppState.currentScope.slice(1);
    const category = AppState.currentCategory === 'all' ? '' : ` • ${AppState.currentCategory.charAt(0).toUpperCase() + AppState.currentCategory.slice(1)}`;
    elements.feedTitle.innerHTML = `<i class="fas fa-newspaper"></i> ${scope} News${category}`;
}

function loadUserInterests() {
    document.querySelectorAll('.interest-tag').forEach(tag => {
        if (AppState.interests.includes(tag.dataset.interest)) {
            tag.classList.add('active');
        }
    });
}

function updateStats() {
    elements.articlesReadEl.textContent = AppState.articlesRead;
    elements.bookmarksCountEl.textContent = AppState.bookmarks.length;
    elements.timeSpentEl.textContent = formatTime(AppState.timeSpent);
    updateBookmarkCount();
}

function formatTime(minutes) {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}

function trackReading(article) {
    AppState.articlesRead++;
    localStorage.setItem('articlesRead', AppState.articlesRead);
    
    if (!AppState.readingHistory.some(h => h.url === article.url)) {
        AppState.readingHistory.unshift({
            url: article.url,
            title: article.title,
            category: detectCategory(article.title + ' ' + article.description),
            readAt: new Date().toISOString()
        });
        
        if (AppState.readingHistory.length > 50) {
            AppState.readingHistory.pop();
        }
        
        localStorage.setItem('readingHistory', JSON.stringify(AppState.readingHistory));
    }
    
    updateStats();
}

function startTimeTracking() {
    setInterval(() => {
        AppState.timeSpent++;
        localStorage.setItem('timeSpent', AppState.timeSpent);
        elements.timeSpentEl.textContent = formatTime(AppState.timeSpent);
    }, 60000); // Update every minute
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        elements.searchInput.focus();
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        closeArticleModal();
        closeBookmarksPanel();
        closeChatbot();
    }
    
    // D for dark mode toggle
    if (e.key === 'd' && !e.target.matches('input, textarea')) {
        toggleDarkMode();
    }
});
