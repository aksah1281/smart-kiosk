// Initialize Firebase
firebase.initializeApp(window.firebaseConfig);
const db = firebase.firestore();

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
        // Store in Firebase
        const result = await saveUserToFirebase(registrationData);
        
        if (result.success) {
            showSuccessScreen(registrationData.name, registrationData.email);
        } else {
            showErrorScreen(result.message || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showErrorScreen('Network error. Please check your connection and try again.');
    }
}

// Firebase operations
async function saveUserToFirebase(userData) {
    try {
        // Generate a unique fingerprint ID (you can modify this logic)
        const fingerprintId = Math.floor(Math.random() * 1000) + 1;
        
        const userRecord = {
            fingerprint_id: fingerprintId,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            session_id: userData.session_id,
            registered: userData.registered,
            registration_complete: userData.registration_complete,
            timestamp: userData.timestamp,
            status: userData.status
        };
        
        // Save to Firebase Firestore
        await db.collection('users').doc(fingerprintId.toString()).set(userRecord);
        
        console.log('User saved to Firebase:', userRecord);
        
        return {
            success: true,
            fingerprintId: fingerprintId,
            data: userRecord
        };
    } catch (error) {
        console.error('Firebase save error:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

// Get user by session ID
async function getUserBySessionId(sessionId) {
    try {
        const snapshot = await db.collection('users')
            .where('session_id', '==', sessionId)
            .get();
        
        if (!snapshot.empty) {
            const userData = snapshot.docs[0].data();
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

// Export functions for ESP32 integration
window.SmartKiosk = {
    getSessionId: getCurrentSessionId,
    getQRCodeUrl: getQRCodeUrl,
    getUserBySessionId: getUserBySessionId,
    saveUser: saveUserToFirebase,
    generateSessionId: generateSessionId
}; 
