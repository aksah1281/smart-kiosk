# Smart Kiosk Registration Website

A modern, responsive web application for user registration in the Smart Kiosk system. This website provides a beautiful interface for users to register their fingerprints and personal information.

## Features

### 🎨 Modern Design
- Beautiful gradient background with glassmorphism effects
- Responsive design that works on all devices
- Smooth animations and transitions
- Professional typography using Inter font

### 📱 User Experience
- Welcome screen with QR code for easy access
- Clean registration form with validation
- Real-time form validation
- Progress indicators and loading states
- Success/error feedback with countdown

### 🔧 Technical Features
- RESTful API integration with ESP32
- Form validation and error handling
- Local storage for session management
- Network status monitoring
- Cross-browser compatibility

## File Structure

```
smart-kiosk/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and animations
├── script.js           # JavaScript functionality
└── README.md          # This file
```

## Setup Instructions

### 1. Local Development

1. **Clone or download the files** to your local machine
2. **Open `index.html`** in a web browser
3. **For testing without ESP32**, the website will work in demo mode

### 2. ESP32 Integration

1. **Update the ESP32 IP address** in `script.js`:
   ```javascript
   const ESP32_API_URL = 'http://192.168.1.100'; // Change to your ESP32 IP
   ```

2. **Ensure your ESP32 is running** the smart kiosk firmware

3. **Make sure both devices are on the same network**

### 3. Deployment

#### Option A: Local Network Server
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

#### Option B: Web Hosting
Upload the files to any web hosting service like:
- GitHub Pages
- Netlify
- Vercel
- AWS S3

## Usage Flow

### 1. ESP32 LCD Shows QR Code
- ESP32 displays QR code on LCD screen
- QR code contains link to this website with unique registration ID
- Users scan QR code with their phone

### 2. Website Registration Form
- Users land on this website after scanning QR code
- Users enter their personal information:
  - Full Name (required)
  - Email Address (required)
  - Phone Number (optional)
- Real-time validation ensures data quality

### 3. Processing
- Form data is sent to ESP32 via API
- Progress bar shows processing status
- Network errors are handled gracefully

### 4. Success/Error
- Success: Shows user info and countdown
- Error: Shows error message with retry option
- Automatic return to kiosk after countdown

## API Integration

The website communicates with the ESP32 through these endpoints:

### POST `/api/register`
Submits user registration data to ESP32.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "registrationId": "REG_1234567890_abc123",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "userId": "user_123"
}
```

### GET `/api/status`
Checks the current status of the ESP32 system.

### GET `/api/qr`
Gets QR code URL for ESP32 to display on LCD.

## Customization

### Colors and Styling
Edit `styles.css` to customize:
- Color scheme (currently purple gradient)
- Fonts and typography
- Animations and transitions
- Button styles and hover effects

### Form Fields
Modify `index.html` to add/remove form fields:
- Add new input fields
- Change validation rules
- Update field labels and placeholders

### API Endpoints
Update `script.js` to modify:
- API URLs and endpoints
- Request/response handling
- Error messages and validation

## Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers

## Security Considerations

1. **HTTPS**: Use HTTPS in production for secure data transmission
2. **Input Validation**: All user inputs are validated client-side and server-side
3. **CORS**: Configure CORS headers on ESP32 for cross-origin requests
4. **Rate Limiting**: Implement rate limiting on ESP32 API endpoints

## Troubleshooting

### Common Issues

1. **Network Connection Error**
   - Check if ESP32 is powered on and connected to network
   - Verify IP address in `script.js`
   - Ensure both devices are on same network

2. **Form Not Submitting**
   - Check browser console for JavaScript errors
   - Verify all required fields are filled
   - Check network connectivity

3. **Styling Issues**
   - Clear browser cache
   - Check if CSS file is loading properly
   - Verify font-awesome CDN is accessible

### Debug Mode

Add this to browser console for debug information:
```javascript
localStorage.setItem('debug', 'true');
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Verify ESP32 firmware is up to date
4. Test with different browsers/devices

---

**Built with ❤️ for Smart Kiosk Systems** 