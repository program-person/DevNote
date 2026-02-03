
export const SyncModule = {
    db: null,
    key: null,

    init(config, key) {
        if (!window.Firebase) {
            console.error('Firebase SDK not loaded');
            return false;
        }
        try {
            const app = window.Firebase.initializeApp(config);
            this.db = window.Firebase.getFirestore(app);
            this.key = key;
            console.log('Firebase Initialized with key:', key);
            return true;
        } catch (e) {
            console.error('Firebase Init Error:', e);
            return false;
        }
    },

    async save(data) {
        if (!this.db || !this.key) return { success: false, error: 'Not initialized' };
        try {
            await window.Firebase.setDoc(window.Firebase.doc(this.db, "devnote_users", this.key), {
                data: JSON.stringify(data),
                updatedAt: new Date().toISOString()
            });
            return { success: true };
        } catch (e) {
            console.error('Save Error:', e);
            return { success: false, error: e.message };
        }
    },

    async load() {
        if (!this.db || !this.key) return { success: false, error: 'Not initialized' };
        try {
            const docSnap = await window.Firebase.getDoc(window.Firebase.doc(this.db, "devnote_users", this.key));
            if (docSnap.exists()) {
                const content = docSnap.data();
                return { success: true, data: JSON.parse(content.data), updatedAt: content.updatedAt };
            } else {
                return { success: false, error: 'No data found' }; // New user
            }
        } catch (e) {
            console.error('Load Error:', e);
            return { success: false, error: e.message };
        }
    }
};
