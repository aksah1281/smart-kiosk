// Initialize Firebase
let db;
try {
    firebase.initializeApp(window.firebaseConfig);
    db = firebase.database();
    console.log('Firebase Realtime Database initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
    alert('Firebase initialization failed. Please check the console for details.');
}

// Global variables
let currentScreen = 'registration';
let registrationData = {};
let countdownInterval;
let sessionId = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set up form submission
    const registrationForm = document.getElementById('registration-form');
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleFormSubmission);
    }
    
    // Check if we have a session ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const sessionFromUrl = urlParams.get('session');
    
    if (sessionFromUrl) {
        sessionId = sessionFromUrl;
        updateStatus('Session Active');
        console.log('Session ID from URL:', sessionId);
    } else {
        // Generate a new session ID if none provided
        sessionId = generateSessionId();
        updateStatus('New Session');
        console.log('Generated Session ID:', sessionId);
    }
    
    // Test Firebase connection
    testFirebaseConnection();
}

// Test Firebase connection
async function testFirebaseConnection() {
    try {
        console.log('Testing Firebase Realtime Database connection...');
        if (!db) {
            throw new Error('Firebase database not initialized');
        }
        const testRef = await db.ref('test/connection').once('value');
        console.log('Firebase Realtime Database connection successful');
    } catch (error) {
        console.error('Firebase connection test failed:', error);
        // Don't show alert for connection test, just log the error
    }
}

// Generate unique session ID (13 digits as per notes)
function generateSessionId() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return timestamp + random;
}

// Screen management functions
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Show target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        currentScreen = screenId;
    }
}

function showRegistrationScreen() {
    showScreen('registration-screen');
    updateStatus('Registration Mode');
}

function showProcessingScreen() {
    showScreen('processing-screen');
    updateStatus('Processing');
    startProgressAnimation();
}

function showSuccessScreen(name, email) {
    showScreen('success-screen');
    updateStatus('Success');
    
    // Update success screen with user info
    document.getElementById('success-name').textContent = name;
    document.getElementById('success-email').textContent = email;
    
    // Start countdown
    startCountdown();
}

function showErrorScreen(message) {
    showScreen('error-screen');
    updateStatus('Error');
    document.getElementById('error-message').textContent = message;
}

// Form handling
async function handleFormSubmission(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    registrationData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone') || '',
        session_id: sessionId,
        timestamp: Date.now(),
        registered: true,
        registration_complete: true,
        status: 'active'
    };
    
    // Validate form data
    if (!registrationData.name || !registrationData.email) {
        showErrorScreen('Please fill in all required fields.');
        return;
    }
    
    // Show processing screen
    showProcessingScreen();
    
    try {
        console.log('Attempting to save user data:', registrationData);
        
        // Store in Firebase
        const result = await saveUserToFirebase(registrationData);
        
        console.log('Save result:', result);
        
        if (result.success) {
            showSuccessScreen(registrationData.name, registrationData.email);
        } else {
            showErrorScreen(result.message || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showErrorScreen('Firebase error: ' + error.message);
    }
}

// Firebase operations
async function saveUserToFirebase(userData) {
    try {
        console.log('Starting Firebase save operation...');
        
        // Check if Firebase is initialized
        if (!firebase.apps.length) {
            throw new Error('Firebase not initialized');
        }
        
        const userRecord = {
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            session_id: userData.session_id,
            registered: true,
            registration_complete: false, // Will be true after ESP32 adds fingerprint
            timestamp: userData.timestamp,
            status: 'waiting_for_fingerprint' // ESP32 will change this to 'active'
        };
        
        console.log('User record to save:', userRecord);
        
        // Save to Firebase Realtime Database using session ID as key
        const userRef = db.ref('users/' + userData.session_id);
        await userRef.set(userRecord);
        
        console.log('User saved to Firebase Realtime Database successfully:', userRecord);
        
        return {
            success: true,
            sessionId: userData.session_id,
            data: userRecord
        };
    } catch (error) {
        console.error('Firebase save error:', error);
        return {
            success: false,
            message: 'Firebase error: ' + error.message
        };
    }
}

// Get user by session ID
async function getUserBySessionId(sessionId) {
    try {
        const snapshot = await db.ref('users/' + sessionId).once('value');
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            return {
                success: true,
                data: userData
            };
        } else {
            return {
                success: false,
                message: 'User not found'
            };
        }
    } catch (error) {
        console.error('Firebase query error:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

// Generate QR code URL for ESP32
function generateQRCodeUrl() {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?session=${sessionId}`;
}

// Progress animation
function startProgressAnimation() {
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            progressFill.style.width = progress + '%';
        }, 200);
    }
}

// Countdown functionality
function startCountdown() {
    let countdown = 15;
    const countdownElement = document.getElementById('countdown');
    
    countdownInterval = setInterval(() => {
        countdown--;
        if (countdownElement) {
            countdownElement.textContent = countdown;
        }
        
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            // Close window or redirect
            window.close();
        }
    }, 1000);
}

// Status updates
function updateStatus(status) {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        const statusText = statusElement.querySelector('span');
        const statusIcon = statusElement.querySelector('i');
        
        if (statusText) statusText.textContent = status;
        
        // Update icon color based on status
        if (statusIcon) {
            statusIcon.className = 'fas fa-circle';
            switch (status.toLowerCase()) {
                case 'ready':
                case 'session active':
                    statusIcon.style.color = '#4CAF50';
                    break;
                case 'processing':
                    statusIcon.style.color = '#FF9800';
                    break;
                case 'success':
                    statusIcon.style.color = '#4CAF50';
                    break;
                case 'error':
                    statusIcon.style.color = '#f44336';
                    break;
                case 'new session':
                    statusIcon.style.color = '#2196F3';
                    break;
                default:
                    statusIcon.style.color = '#666';
            }
        }
    }
}

// Utility functions
function getCurrentSessionId() {
    return sessionId;
}

function getQRCodeUrl() {
    return generateQRCodeUrl();
}

// Error handling
function handleError(error) {
    console.error('Application error:', error);
    showErrorScreen('An unexpected error occurred. Please try again.');
}

// Network status checking
function checkNetworkStatus() {
    if (!navigator.onLine) {
        showErrorScreen('No internet connection. Please check your network.');
        return false;
    }
    return true;
}

// Form validation
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    if (!phone) return true; // Phone is optional
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Update user with fingerprint ID (for ESP32 to call)
async function updateUserWithFingerprint(sessionId, fingerprintId) {
    try {
        const userRef = db.ref('users/' + sessionId);
        await userRef.update({
            fingerprint_id: fingerprintId,
            registration_complete: true,
            status: 'active',
            fingerprint_timestamp: Date.now()
        });
        
        console.log('User updated with fingerprint ID:', fingerprintId);
        return {
            success: true,
            message: 'Fingerprint linked successfully'
        };
    } catch (error) {
        console.error('Error updating user with fingerprint:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

// Get users waiting for fingerprint (for ESP32 to poll)
async function getUsersWaitingForFingerprint() {
    try {
        const snapshot = await db.ref('users').orderByChild('status').equalTo('waiting_for_fingerprint').once('value');
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            return {
                success: true,
                users: users
            };
        } else {
            return {
                success: false,
                message: 'No users waiting for fingerprint'
            };
        }
    } catch (error) {
        console.error('Error getting users waiting for fingerprint:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

// Export functions for ESP32 integration
window.SmartKiosk = {
    getSessionId: getCurrentSessionId,
    getQRCodeUrl: getQRCodeUrl,
    getUserBySessionId: getUserBySessionId,
    saveUser: saveUserToFirebase,
    generateSessionId: generateSessionId,
    updateUserWithFingerprint: updateUserWithFingerprint,
    getUsersWaitingForFingerprint: getUsersWaitingForFingerprint
}; 
