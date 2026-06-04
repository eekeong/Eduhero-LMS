// Main Application Logic
const App = {
    async init() {
        console.log('[App] 🚀 Initializing...');
        // Start store init (branding data) but with a timeout to avoid hanging the UI
        try {
            await Promise.race([
                store.init(),
                new Promise(resolve => setTimeout(resolve, 3000)) // Max 3s for critical branding
            ]);

            // TEMPORARY SCRIPT TO DELETE SYSTEM ADMINS MOVED DOWN
        } catch (err) {
            console.error('[App] Store init timed out or failed:', err);
        }
        
        this.applySystemSettings();
        this.bindEvents();

        // Auth state listener
        firebase.auth().onAuthStateChanged(async (fbUser) => {
            if (auth.isMigrating) return;

            if (fbUser) {
                console.log('[App] 👤 Auth State: Logged in as', fbUser.email);
                auth.enforceSingleSession(fbUser.uid);
                
                if (!store.getUserByFirebaseUid(fbUser.uid)) {
                    await store.fetchUserByUid(fbUser.uid);
                }

                const user = auth.getCurrentUser();
                if (user) {
                    store.updateUserLogin(user.id);
                    this.setupActivityTracking(user.id);
                }
            }
            this.checkAuthAndRender();
        });

        // Fail-safe: Hide overlay if stuck
        setTimeout(() => this.hideGlobalLoader(), 5000);
    },

    applySystemSettings() {
        const settings = store.getSettings();
        const logoUrl = settings.logoUrl;
        const systemName = settings.systemName || 'EduHero';

        const loginSystemName = document.getElementById('login-system-name');
        if (loginSystemName) {
            loginSystemName.textContent = systemName === 'EduHero' ? 'EduHero学习重播系统' : (systemName + ' LMS');
        }
        const sidebarSystemName = document.getElementById('sidebar-system-name');
        if (sidebarSystemName) sidebarSystemName.textContent = systemName;
        const mobileSystemName = document.getElementById('mobile-system-name');
        if (mobileSystemName) mobileSystemName.textContent = systemName;
        const loaderSystemName = document.getElementById('loader-system-name');
        if (loaderSystemName) loaderSystemName.textContent = systemName + ' LMS';
        document.title = systemName + ' LMS';

        // Update Logos
        const setLogo = (wrapperId, iconId) => {
            const wrapper = document.getElementById(wrapperId);
            const icon = document.getElementById(iconId);
            if (!wrapper) return;
            
            // Remove existing image if any
            const existingImg = wrapper.querySelector('img');
            if (existingImg) existingImg.remove();

            if (logoUrl) {
                if (icon) icon.classList.add('hidden');
                const img = document.createElement('img');
                img.src = logoUrl;
                img.className = wrapperId === 'login-logo-container' || wrapperId === 'loader-logo-container' ? 'w-full h-full object-cover rounded-full' : 'h-8 max-w-[120px] object-contain';
                wrapper.appendChild(img);
            } else {
                if (icon) icon.classList.remove('hidden');
            }
        };

        setLogo('login-logo-container', 'login-logo-icon');
        setLogo('sidebar-logo-wrapper', 'sidebar-logo-icon');
        setLogo('mobile-logo-wrapper', 'mobile-logo-icon');
        setLogo('loader-logo-container', 'loader-logo-icon');

        // Apply System Theme Color
        const systemColor = settings.systemColor || '#4F46E5';
        const systemColor2 = settings.systemColor2 || '#7C3AED';
        
        const hexToRgb = (h) => {
            let r = 0, g = 0, b = 0;
            if (h.length === 4) { r = parseInt(h[1] + h[1], 16); g = parseInt(h[2] + h[2], 16); b = parseInt(h[3] + h[3], 16); }
            else if (h.length === 7) { r = parseInt(h[1] + h[2], 16); g = parseInt(h[3] + h[4], 16); b = parseInt(h[5] + h[6], 16); }
            return `${r}, ${g}, ${b}`;
        };
        const rgb = hexToRgb(systemColor);
        
        let styleEl = document.getElementById('dynamic-theme-style');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'dynamic-theme-style';
            document.head.appendChild(styleEl);
        }
        
        styleEl.textContent = `
            .text-indigo-600 { color: ${systemColor} !important; }
            .bg-indigo-600 { background-color: ${systemColor} !important; }
            .border-indigo-600 { border-color: ${systemColor} !important; }
            .hover\\:bg-indigo-700:hover { background-color: rgba(${rgb}, 0.8) !important; }
            .hover\\:text-indigo-700:hover { color: rgba(${rgb}, 0.9) !important; }
            .hover\\:text-indigo-600:hover { color: ${systemColor} !important; }
            .focus\\:ring-indigo-500:focus { --tw-ring-color: rgba(${rgb}, 0.5) !important; }
            .focus\\:border-indigo-500:focus { border-color: ${systemColor} !important; }
            .bg-indigo-50 { background-color: rgba(${rgb}, 0.1) !important; }
            .bg-indigo-50\\/50 { background-color: rgba(${rgb}, 0.05) !important; }
            .text-indigo-700 { color: rgba(${rgb}, 0.9) !important; }
            .text-indigo-500 { color: rgba(${rgb}, 0.8) !important; }
            .bg-gradient-to-br.from-indigo-600 { --tw-gradient-from: ${systemColor} !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(${rgb}, 0)); }
            .bg-gradient-to-r.from-indigo-600 { --tw-gradient-from: ${systemColor} !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(${rgb}, 0)); }
            .bg-indigo-100 { background-color: rgba(${rgb}, 0.2) !important; }
            .border-indigo-500 { border-color: rgba(${rgb}, 0.8) !important; }
            .border-indigo-200 { border-color: rgba(${rgb}, 0.3) !important; }
            .text-indigo-800 { color: rgba(${rgb}, 0.95) !important; }
            .to-purple-700 { --tw-gradient-to: ${systemColor2} !important; }
            .to-purple-600 { --tw-gradient-to: ${systemColor2} !important; }
            .to-purple-500 { --tw-gradient-to: ${systemColor2} !important; }
            .from-indigo-400 { --tw-gradient-from: ${systemColor} !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(${rgb}, 0)); }
        `;
    },

    bindEvents() {
        const loginForm = document.getElementById('login-form');
        console.log('[App] 🖇️ bindEvents: Login form found:', !!loginForm);
        
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('[App] 🚀 SUBMIT EVENT TRIGGERED!');
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;

            App.showGlobalLoader('Authenticating...');

            const res = await auth.login(email, password);
            if (res.success) {
                ui.showToast('Login successful!');
                
                // CRITICAL FIX: Ensure user data is fetched BEFORE attempting to render
                const fbUser = firebase.auth().currentUser;
                if (fbUser && !store.getUserByFirebaseUid(fbUser.uid)) {
                    App.showGlobalLoader('Fetching your profile...');
                    await store.fetchUserByUid(fbUser.uid);
                }
                
                App.showGlobalLoader('Preparing workspace...');
                this.checkAuthAndRender();
            } else {
                App.hideGlobalLoader();
                ui.showToast(res.error || 'Invalid email or password', 'error');
            }
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });

        // Password visibility toggle
        const toggleBtn = document.getElementById('toggle-password');
        const passwordInput = document.getElementById('login-password');
        const eyeIcon = document.getElementById('password-eye-icon');
        
        if (toggleBtn && passwordInput && eyeIcon) {
            toggleBtn.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                eyeIcon.classList.toggle('fa-eye');
                eyeIcon.classList.toggle('fa-eye-slash');
            });
        }

        document.getElementById('logout-btn').addEventListener('click', () => {
            store.stopSync(); // detach all Firestore listeners before logout
            auth.logout();
        });

        // Mobile menu toggle
        const mobileBtn = document.getElementById('mobile-menu-btn');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');

        const toggleMenu = () => {
            const isClosed = sidebar.classList.contains('-translate-x-full');
            if (isClosed) {
                sidebar.classList.remove('-translate-x-full');
                overlay.classList.remove('hidden');
            } else {
                sidebar.classList.add('-translate-x-full');
                overlay.classList.add('hidden');
            }
        };

        mobileBtn.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);

        // Make sidebar absolute on mobile
        const adjustSidebar = () => {
            if (window.innerWidth < 768) {
                sidebar.classList.add('absolute', '-translate-x-full', 'z-40');
            } else {
                sidebar.classList.remove('absolute', '-translate-x-full', 'z-40');
                overlay.classList.add('hidden');
            }
        };
        window.addEventListener('resize', adjustSidebar);
        adjustSidebar(); // initial call
    },

    setupActivityTracking(userId) {
        let lastUpdate = 0;
        const update = () => {
            const now = Date.now();
            if (now - lastUpdate > 60000) { // Update at most once per minute
                lastUpdate = now;
                store.updateUserActivity(userId);
            }
        };
        document.addEventListener('click', update);
        document.addEventListener('keypress', update);
    },


    showGlobalLoader(message = 'Syncing your workspace...') {
        const loader = document.getElementById('global-loader');
        if (loader) {
            const textElement = loader.querySelector('p');
            if (textElement) textElement.textContent = message;
            
            loader.classList.remove('hidden');
            // Small delay to ensure opacity transition works if just added
            setTimeout(() => loader.classList.remove('opacity-0'), 10);
        }
    },

    hideGlobalLoader() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.classList.add('opacity-0');
            setTimeout(() => loader.classList.add('hidden'), 500); // Wait for transition
        }
    },

    async checkAuthAndRender() {
        console.log('[App] 🛡️ checkAuthAndRender started. Authenticated:', auth.isAuthenticated());
        const viewLogin = document.getElementById('view-login');
        const viewApp = document.getElementById('view-app');

        if (auth.isAuthenticated()) {
            console.log('[App] 🔓 Showing App View...');
            this.showGlobalLoader();
            
            const fbUser = firebase.auth().currentUser;
            if (fbUser) {
                await auth.enforceSingleSession(fbUser.uid);
            }

            viewLogin.classList.remove('active');
            viewApp.classList.add('active');
            
            // Explicitly hide sidebar on mobile during initial render
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (window.innerWidth < 768) {
                sidebar.classList.add('-translate-x-full');
                overlay.classList.add('hidden');
            }

            this.setupAppView();
        } else {
            console.log('[App] 🔒 Showing Login View...');
            this.hideGlobalLoader();
            viewApp.classList.remove('active');
            viewLogin.classList.add('active');
        }
    },

    async setupAppView() {
        if (auth.isMigrating) {
            this.hideGlobalLoader();
            return;
        }
        
        const user = auth.getCurrentUser();
        
        if (!user) {
            const contentArea = document.getElementById('page-content');
            contentArea.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-center p-8">
                    <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                        <i class="fas fa-user-slash text-2xl"></i>
                    </div>
                    <h2 class="text-xl font-bold text-gray-800 mb-2">Account Setup Incomplete</h2>
                    <p class="text-gray-600 max-w-md mb-6">We found your login credentials, but your profile data is missing. This can happen if a migration was interrupted.</p>
                    <button onclick="auth.logout()" class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-md">
                        Return to Login
                    </button>
                </div>
            `;
            this.hideGlobalLoader();
            return;
        }

        // Set user info IMMEDIATELY so sidebar is correct
        document.getElementById('user-name').textContent = user.name;
        document.getElementById('user-role').textContent = user.role;
        
        const phoneEl = document.getElementById('user-phone');
        if (phoneEl) {
            if (user.phone) {
                phoneEl.textContent = user.phone;
                phoneEl.classList.remove('hidden');
            } else {
                phoneEl.classList.add('hidden');
            }
        }

        const initialContainer = document.getElementById('user-initial');
        const settings = store.getSettings();
        if (user.role === 'student' && settings.studentAvatarUrl) {
            initialContainer.innerHTML = `<img src="${settings.studentAvatarUrl}" class="w-full h-full object-cover rounded-full" alt="Student Avatar">`;
        } else {
            const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
            initialContainer.textContent = initial;
        }

        // Ensure we check the most up-to-date user record for the password reset flag
        const fullUser = store.getUsers().find(u => u.id === user.id) || user;

        if ((fullUser.role === 'student' || fullUser.role === 'teacher') && fullUser.mustChangePassword) {
            ui.showForceChangePasswordModal();
            this.hideGlobalLoader();
            return;
        }

        const contentArea = document.getElementById('page-content');
        
        // Set nav menu
        const navMenu = document.getElementById('nav-menu');
        
        let navItems = [];
        if (user.role === 'admin') {
            navItems = [
                { id: 'reports', icon: 'fa-chart-pie', label: 'Learning Reports' },
                { id: 'users', icon: 'fa-users', label: 'User Management' },
                { id: 'videos', icon: 'fa-play-circle', label: 'Videos Monitored' },
                { id: 'log', icon: 'fa-history', label: 'Activity Log' },
                { id: 'subjects', icon: 'fa-book', label: 'Subject Management' },
                { id: 'settings', icon: 'fa-sliders-h', label: 'System Settings' }
            ];
            contentArea.innerHTML = AdminPage.render();
            AdminPage.init();
            
            // Default view for admin should be reports
            this.switchView('reports');
        } else if (user.role === 'teacher') {
            navItems = [
                { id: 'dashboard', icon: 'fa-chalkboard-teacher', label: 'My Subjects' }
            ];
            contentArea.innerHTML = TeacherPage.render();
            TeacherPage.init();
        } else if (user.role === 'student') {
            navItems = [
                { id: 'dashboard', icon: 'fa-book-reader', label: 'My Learning' }
            ];
            contentArea.innerHTML = StudentPage.render();
            StudentPage.init();
        }

        this.renderNavMenu(navItems, user.role === 'admin' ? 'reports' : 'dashboard');

        // Start role-based Firestore listeners for this user AFTER initial render
        // so that the reactive UI updates can find the newly-rendered DOM containers.
        await store.startSync(user);
        
        // Hide global loader once sync is complete
        this.hideGlobalLoader();
    },

    renderNavMenu(navItems, activeId) {
        const navMenu = document.getElementById('nav-menu');
        navMenu.innerHTML = navItems.map(item => `
            <a href="#" onclick="App.switchView('${item.id}'); return false;" class="flex items-center px-3 py-2.5 rounded-lg ${item.id === activeId ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'} transition-colors" id="nav-item-${item.id}">
                <i class="fas ${item.icon} w-5 h-5 mr-3 text-center"></i>
                ${item.label}
            </a>
        `).join('');
    },

    switchView(viewId) {
        // Update active nav style
        document.querySelectorAll('#nav-menu a').forEach(a => {
            a.classList.remove('bg-indigo-50', 'text-indigo-700', 'font-bold');
            a.classList.add('text-gray-600', 'hover:bg-gray-50', 'font-medium');
        });
        const activeItem = document.getElementById(`nav-item-${viewId}`);
        if (activeItem) {
            activeItem.classList.remove('text-gray-600', 'hover:bg-gray-50', 'font-medium');
            activeItem.classList.add('bg-indigo-50', 'text-indigo-700', 'font-bold');
        }

        // Specific view logic
        const user = auth.getCurrentUser();
        if (user && user.role === 'admin') {
            const dashboardTabs = {
                'reports': { title: 'Learning Analytics', subtitle: 'Comprehensive study behavior and video engagement tracking.' },
                'users': { title: 'User Management', subtitle: 'Manage platform access and user profiles.' },
                'videos': { title: 'Videos Monitored', subtitle: 'Track and manage uploaded video content.' },
                'log': { title: 'Activity Log', subtitle: 'Audit trail of all administrative actions.' },
                'settings': { title: 'System Settings', subtitle: 'Configure platform branding and global options.' }
            };
            
            if (dashboardTabs[viewId]) {
                document.getElementById('admin-dashboard-wrapper').classList.remove('hidden');
                document.getElementById('admin-subjects-wrapper').classList.add('hidden');
                
                // Update titles
                const titleEl = document.getElementById('admin-page-title');
                const subtitleEl = document.getElementById('admin-page-subtitle');
                if (titleEl) titleEl.textContent = dashboardTabs[viewId].title;
                if (subtitleEl) subtitleEl.textContent = dashboardTabs[viewId].subtitle;

                // Trigger the internal tab click
                const tabBtn = document.querySelector(`#admin-tabs button[data-tab="${viewId}"]`);
                if (tabBtn) tabBtn.click();
            } else if (viewId === 'subjects') {
                document.getElementById('admin-dashboard-wrapper').classList.add('hidden');
                document.getElementById('admin-subjects-wrapper').classList.remove('hidden');
                AdminPage.renderSubjects();
            }
        }
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
