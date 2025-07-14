// Global variables
let currentScreen = 'welcome';
let registrationData = {};
let countdownInterval;

// ESP32 API Configuration
const ESP32_API_URL = 'http://192.168.1.100'; // Change to your ESP32 IP
const API_ENDPOINTS = {
    submitRegistration: '/api/register',
    checkStatus: '/api/status',
    getQRCode: '/api/qr'
};

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
    
    // Check if we're coming from QR code
    const urlParams = new URLSearchParams(window.location.search);
    const registrationId = urlParams.get('id');
    
    if (registrationId) {
        // Store the registration ID from QR code
        localStorage.setItem('registrationId', registrationId);
        updateStatus('Registration Mode');
    } else {
        // Generate a new registration ID if none provided
        const newId = generateRegistrationId();
        localStorage.setItem('registrationId', newId);
        updateStatus('Ready');
    }
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

// QR Code generation (for ESP32 to use)
function generateQRCode() {
    const registrationId = localStorage.getItem('registrationId') || generateRegistrationId();
    const qrUrl = `${window.location.origin}${window.location.pathname}?id=${registrationId}`;
    return qrUrl;
}

function generateRegistrationId() {
    return 'REG_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Form handling
async function handleFormSubmission(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    registrationData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone') || '',
        registrationId: localStorage.getItem('registrationId') || generateRegistrationId(),
        timestamp: new Date().toISOString()
    };
    
    // Validate form data
    if (!registrationData.name || !registrationData.email) {
        showErrorScreen('Please fill in all required fields.');
        return;
    }
    
    // Show processing screen
    showProcessingScreen();
    
    try {
        // Submit to ESP32
        const response = await submitToESP32(registrationData);
        
        if (response.success) {
            showSuccessScreen(registrationData.name, registrationData.email);
        } else {
            showErrorScreen(response.message || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showErrorScreen('Network error. Please check your connection and try again.');
    }
}

// API communication with ESP32
async function submitToESP32(data) {
    try {
        const response = await fetch(`${ESP32_API_URL}${API_ENDPOINTS.submitRegistration}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
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
            // Redirect or close window
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
                default:
                    statusIcon.style.color = '#666';
            }
        }
    }
}

// Utility functions
function getCurrentRegistrationId() {
    return localStorage.getItem('registrationId') || generateRegistrationId();
}

function getWebsiteUrl() {
    return window.location.origin + window.location.pathname;
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
    if (!phone) return true; // Optional field
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Add real-time validation
document.addEventListener('DOMContentLoaded', function() {
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            if (this.value && !validateEmail(this.value)) {
                this.style.borderColor = '#f44336';
                this.setCustomValidity('Please enter a valid email address');
            } else {
                this.style.borderColor = '#e1e5e9';
                this.setCustomValidity('');
            }
        });
    }
    
    if (phoneInput) {
        phoneInput.addEventListener('blur', function() {
            if (this.value && !validatePhone(this.value)) {
                this.style.borderColor = '#f44336';
                this.setCustomValidity('Please enter a valid phone number');
            } else {
                this.style.borderColor = '#e1e5e9';
                this.setCustomValidity('');
            }
        });
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
});

// Export functions for global access
window.getCurrentRegistrationId = getCurrentRegistrationId;
window.getWebsiteUrl = getWebsiteUrl;
window.generateQRCode = generateQRCode; 