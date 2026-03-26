// ===================================
// CIVIC SENSE - DASHBOARD JAVASCRIPT
// ===================================

// State Management
const DashboardState = {
    darkMode: localStorage.getItem('dashboardDarkMode') === 'true',
    activeFilter: 'all',
    issuesLoaded: 6
};

// DOM Elements
const elements = {
    themeToggle: document.getElementById('theme-toggle'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    mobileNav: document.getElementById('mobile-nav'),
    issuesGrid: document.getElementById('issues-grid'),
    loadMoreBtn: document.getElementById('load-more-issues')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
});

function initializeDashboard() {
    // Apply saved theme
    if (DashboardState.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        elements.themeToggle.querySelector('i').className = 'fas fa-sun';
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Animate stats on scroll
    animateStatsOnScroll();
    
    // Animate progress bars
    animateProgressBars();
    
    // Smooth scroll for navigation
    setupSmoothScroll();
}

function setupEventListeners() {
    // Theme Toggle
    elements.themeToggle.addEventListener('click', toggleDarkMode);
    
    // Mobile Menu
    elements.mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    
    // Filter Tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            DashboardState.activeFilter = tab.dataset.filter;
            filterIssues(tab.dataset.filter);
        });
    });
    
    // Load More Issues
    if (elements.loadMoreBtn) {
        elements.loadMoreBtn.addEventListener('click', loadMoreIssues);
    }
    
    // Navigation active state
    setupNavigationHighlight();
    
    // Upvote buttons
    setupUpvoteButtons();
    
    // Like buttons
    setupLikeButtons();
}

// Theme Functions
function toggleDarkMode() {
    DashboardState.darkMode = !DashboardState.darkMode;
    document.documentElement.setAttribute('data-theme', DashboardState.darkMode ? 'dark' : '');
    elements.themeToggle.querySelector('i').className = DashboardState.darkMode ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('dashboardDarkMode', DashboardState.darkMode);
}

// Mobile Menu
function toggleMobileMenu() {
    elements.mobileNav.classList.toggle('hidden');
}

// Filter Issues
function filterIssues(filter) {
    const issues = document.querySelectorAll('.issue-card');
    
    issues.forEach(issue => {
        const status = issue.dataset.status;
        
        if (filter === 'all' || status === filter) {
            issue.style.display = 'block';
            issue.style.animation = 'fadeIn 0.5s ease';
        } else {
            issue.style.display = 'none';
        }
    });
}

// Load More Issues
function loadMoreIssues() {
    const btn = elements.loadMoreBtn;
    const icon = btn.querySelector('i');
    
    // Show loading state
    icon.className = 'fas fa-spinner fa-spin';
    btn.disabled = true;
    
    // Simulate loading delay
    setTimeout(() => {
        // Add more issue cards (demo data)
        const newIssues = [
            {
                status: 'reported',
                category: 'Roads',
                categoryIcon: 'fa-road',
                title: 'Broken Road Divider',
                description: 'Metal divider damaged causing traffic issues.',
                location: 'Indiranagar, Bangalore',
                time: '6 hours ago',
                likes: 34,
                comments: 8,
                image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400&h=250&fit=crop'
            },
            {
                status: 'progress',
                category: 'Water',
                categoryIcon: 'fa-tint',
                title: 'Water Pipeline Leak',
                description: 'Municipal team working on fixing the leak.',
                location: 'Jayanagar, Bangalore',
                time: '2 days ago',
                likes: 156,
                comments: 28,
                image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=250&fit=crop'
            }
        ];
        
        newIssues.forEach(issue => {
            const card = createIssueCard(issue);
            elements.issuesGrid.insertAdjacentHTML('beforeend', card);
        });
        
        // Re-apply current filter
        filterIssues(DashboardState.activeFilter);
        
        // Reset button
        icon.className = 'fas fa-plus';
        btn.disabled = false;
        
        // Re-setup event listeners for new cards
        setupUpvoteButtons();
        setupLikeButtons();
        
    }, 1000);
}

function createIssueCard(issue) {
    return `
        <div class="issue-card" data-status="${issue.status}">
            <div class="issue-image">
                <img src="${issue.image}" alt="${issue.title}">
                <span class="issue-category"><i class="fas ${issue.categoryIcon}"></i> ${issue.category}</span>
                <div class="issue-media-type">
                    <i class="fas fa-camera"></i>
                </div>
            </div>
            <div class="issue-content">
                <div class="issue-status ${issue.status}">
                    <i class="fas ${issue.status === 'reported' ? 'fa-circle' : issue.status === 'progress' ? 'fa-spinner' : 'fa-check'}"></i> 
                    ${issue.status === 'reported' ? 'Reported' : issue.status === 'progress' ? 'In Progress' : 'Resolved'}
                </div>
                <h3 class="issue-title">${issue.title}</h3>
                <p class="issue-description">${issue.description}</p>
                <div class="issue-meta">
                    <span class="issue-location">
                        <i class="fas fa-map-marker-alt"></i> ${issue.location}
                    </span>
                    <span class="issue-time">
                        <i class="far fa-clock"></i> ${issue.time}
                    </span>
                </div>
                <div class="issue-footer">
                    <div class="issue-engagement">
                        <button class="engage-btn like-btn"><i class="far fa-heart"></i> ${issue.likes}</button>
                        <button class="engage-btn"><i class="far fa-comment"></i> ${issue.comments}</button>
                    </div>
                    <button class="upvote-btn">
                        <i class="fas fa-arrow-up"></i> Upvote
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Upvote Buttons
function setupUpvoteButtons() {
    document.querySelectorAll('.upvote-btn:not(.resolved)').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.classList.contains('upvoted')) {
                this.classList.remove('upvoted');
                this.innerHTML = '<i class="fas fa-arrow-up"></i> Upvote';
            } else {
                this.classList.add('upvoted');
                this.innerHTML = '<i class="fas fa-check"></i> Upvoted';
            }
        });
    });
}

// Like Buttons
function setupLikeButtons() {
    document.querySelectorAll('.engage-btn').forEach(btn => {
        if (btn.querySelector('.fa-heart') || btn.querySelector('.far.fa-heart')) {
            btn.addEventListener('click', function() {
                const icon = this.querySelector('i');
                const count = parseInt(this.textContent.match(/\d+/)[0]);
                
                if (icon.classList.contains('far')) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                    this.innerHTML = `<i class="fas fa-heart"></i> ${count + 1}`;
                    this.style.color = 'var(--danger-500)';
                } else {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                    this.innerHTML = `<i class="far fa-heart"></i> ${count - 1}`;
                    this.style.color = '';
                }
            });
        }
    });
}

// Animate Stats on Scroll
function animateStatsOnScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statValues = entry.target.querySelectorAll('.stat-value, .stat-number');
                statValues.forEach(stat => {
                    animateNumber(stat);
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    
    document.querySelectorAll('.impact-section, .hero-stats-preview').forEach(section => {
        observer.observe(section);
    });
}

function animateNumber(element) {
    const target = parseInt(element.dataset.target || element.dataset.count);
    if (!target) return;
    
    const duration = 2000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
    }, 16);
}

// Animate Progress Bars
function animateProgressBars() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressBars = entry.target.querySelectorAll('.progress-bar');
                progressBars.forEach(bar => {
                    const width = bar.dataset.width;
                    setTimeout(() => {
                        bar.style.width = width + '%';
                    }, 300);
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    
    document.querySelectorAll('.impact-section').forEach(section => {
        observer.observe(section);
    });
}

// Smooth Scroll
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Navigation Highlight
function setupNavigationHighlight() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, { threshold: 0.3 });
    
    sections.forEach(section => {
        observer.observe(section);
    });
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) {
    // D for dark mode toggle
    if (e.key === 'd' && !e.target.matches('input, textarea')) {
        toggleDarkMode();
    }
    
    // Escape to close mobile menu
    if (e.key === 'Escape') {
        elements.mobileNav.classList.add('hidden');
    }
});

// Add fadeIn animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);

// Console welcome message
console.log('%c🏛️ Civic Sense Dashboard', 'font-size: 20px; font-weight: bold; color: #3b82f6;');
console.log('%cWelcome to Civic Sense - Making cities better together!', 'font-size: 14px; color: #64748b;');
