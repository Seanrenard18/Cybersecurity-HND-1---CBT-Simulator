# Admin Panel Refactor - Setup Guide

## ✅ What Has Been Done

### Part 1: API & Auth Fix
- ✅ Created `js/admin.js` with centralized API configuration
- ✅ Defined `API_BASE` pointing to your Render backend
- ✅ Created `apiRequest()` helper function to handle all API calls
- ✅ All requests now include `X-Admin-Token` header for authentication
- ✅ Proper error handling with status checking

### Part 2: Admin UI Structure
- ✅ Created `admin.html` with responsive CSS Grid layout
- ✅ Dashboard organized in 3 rows:
  - **Row 1**: Upload Questions + Academic Management
  - **Row 2**: Live Students + Login Control
  - **Row 3**: Export Results (full width)
- ✅ Responsive design (2 columns on desktop, 1 on mobile)
- ✅ Consistent styling with padding, border-radius, and box-shadow
- ✅ Uses existing green theme colors

### Part 3: Academic Management Tabs
- ✅ Added tab buttons for Departments, Levels, and Courses
- ✅ Implemented `switchTab()` function to toggle between forms
- ✅ Only one form shows at a time
- ✅ Active tab has visual indicator

### Part 4: UI Polish
- ✅ Consistent 20px padding
- ✅ 10px border-radius on cards
- ✅ Box-shadow on cards with hover effects
- ✅ Clean form styling with focus states
- ✅ Button states (hover, disabled)
- ✅ Mobile responsive design

### Part 5: Navigation
- ✅ Added "Admin Panel" link to `index.html` footer
- ✅ Added "Admin Panel" link to `login.html` footer

---

## 🔧 Setup Instructions

### Step 1: Replace Admin Token

**File**: `js/admin.js` (Line 13)

```javascript
const ADMIN_TOKEN = "REPLACE_WITH_RENDER_ADMIN_TOKEN";
```

**TODO**: Replace `REPLACE_WITH_RENDER_ADMIN_TOKEN` with your actual Render backend admin token.

### Step 2: Verify Backend Integration

Ensure your Render backend:
1. Has CORS enabled for your frontend domain
2. Validates the `X-Admin-Token` header
3. Has these API endpoints:
   - `POST /api/upload-questions` - File upload
   - `POST /api/departments` - Create department
   - `POST /api/levels` - Create level
   - `POST /api/courses` - Create course
   - `GET /api/live-students` - Get active students
   - `POST /api/login-control` - Update login settings
   - `GET /api/export-results` - Export all results

### Step 3: Test the Admin Panel

1. Open your application in browser
2. Go to `index.html` or `login.html`
3. Click the "Admin Panel" link in footer
4. The following should work:
   - Upload questions from dropdown
   - Create departments/levels/courses
   - See live students (updates every 5 seconds)
   - Export results as JSON
   - Update login control settings

### Step 4: 401 Error Troubleshooting

If you get 401 Unauthorized errors:

1. **Check token**: Ensure `ADMIN_TOKEN` is correct in `js/admin.js`
2. **Check header**: Browser console should show `X-Admin-Token` header
3. **Check CORS**: Ensure backend CORS headers allow your frontend
4. **Check endpoint**: Verify endpoint matches backend routes

**Debug in Browser Console**:
```javascript
// Test API call
apiRequest('/api/live-students', 'GET')
  .then(data => console.log('Success:', data))
  .catch(err => console.error('Error:', err));
```

---

## 📁 File Structure

```
admin.html          - Admin dashboard UI (NEW)
js/admin.js         - Admin panel JavaScript (NEW)
index.html          - Updated with Admin link
login.html          - Updated with Admin link
css/style.css       - No changes needed
```

---

## 🎯 How It Works

### API Request Flow

```
Admin Form Submit
    ↓
apiRequest() function
    ↓
Add headers (including X-Admin-Token)
    ↓
Fetch to API_BASE + endpoint
    ↓
Check response.ok
    ↓
Return JSON or throw error
    ↓
Catch block shows alert
```

### Tab Switching Flow

```
Click Tab Button
    ↓
switchTab('tabName')
    ↓
Hide all forms
    ↓
Show selected form
    ↓
Update active tab styling
```

### Live Students Update

```
Page loads
    ↓
loadLiveStudents() called
    ↓
Fetch /api/live-students
    ↓
Render student list
    ↓
Repeat every 5 seconds via setInterval
```

---

## 📋 Form Endpoints Reference

| Form | Endpoint | Method | Body |
|------|----------|--------|------|
| Upload Questions | `/api/upload-questions` | POST | FormData with course, file |
| Add Department | `/api/departments` | POST | {name, code} |
| Add Level | `/api/levels` | POST | {name, code} |
| Add Course | `/api/courses` | POST | {name, code, department} |
| Login Control | `/api/login-control` | POST | {status, maxConcurrent} |
| Export Results | `/api/export-results` | GET | (none) |
| Live Students | `/api/live-students` | GET | (none) |

---

## ✨ Features Implemented

### Upload Questions
- Course selector dropdown
- JSON file input
- Validates inputs before upload
- Shows loading state
- Success/error messages

### Academic Management Tabs
- **Departments**: Name + Code
- **Levels**: Name + Code
- **Courses**: Name + Code + Department
- Tab switching with visual feedback

### Live Students
- Real-time student list
- Shows name, course, status, elapsed time
- Auto-refreshes every 5 seconds
- Handles no active students gracefully

### Login Control
- System status selector
- Max concurrent students input
- Settings update

### Export Results
- Click to download all exam results
- Automatic JSON file download
- Timestamped filename

---

## 🔒 Security Notes

- Admin token is sent in `X-Admin-Token` header for each request
- Token should be kept secret (don't commit to public repos)
- Consider adding token expiration on backend
- All requests check for 401 status and handle auth errors
- Backend validation should verify token before processing

---

## 🐛 Troubleshooting

### Issue: 401 Unauthorized on all requests
**Solution**: Check that `ADMIN_TOKEN` in `js/admin.js` is correct and matches backend

### Issue: File upload fails
**Solution**: Ensure course is selected and file is .json format

### Issue: Forms don't switch tabs
**Solution**: Check browser console for JavaScript errors

### Issue: Live students not updating
**Solution**: Check network tab for `/api/live-students` endpoint, ensure backend is responding

### Issue: CORS errors
**Solution**: Backend must include `Access-Control-Allow-Origin` header

---

## 📝 Next Steps

1. ✅ Replace `ADMIN_TOKEN` in `js/admin.js`
2. ✅ Test each form in admin panel
3. ✅ Verify backend endpoints are working
4. ✅ Test file uploads with sample JSON
5. ✅ Verify live student updates
6. ✅ Test logout functionality
7. ✅ Check responsive design on mobile

---

## 📚 Documentation

For more information:
- Check `/admin.html` - HTML structure and form elements
- Check `/js/admin.js` - JavaScript logic and API requests
- Check `/css/style.css` - Existing theme colors and variables

---

**Created**: February 12, 2026
**Status**: Ready for deployment after token replacement
