# CBT Exam Simulator Web App

A complete Computer-Based Test (CBT) exam simulator web application with a modern green theme inspired by school CBT systems and structured like JAMB CBT layout.

## 📋 Project Structure

```
Simulator Exam App/
├── login.html              # User login page
├── instructions.html       # Exam instructions & guidelines
├── exam.html              # Main exam page with questions
├── results.html           # Results & performance review
├── css/
│   └── style.css          # Main stylesheet (comprehensive theme)
├── js/
│   ├── app.js             # Utility functions & general features
│   ├── exam.js            # Exam logic, timer, navigation
│   └── results.js         # Results display & review
├── data/
│   └── questions.json     # 40 sample exam questions (English Language)
└── README.md              # This file
```

## ✨ Features

### 1. **User Authentication**

- Full name registration
- Email validation
- Registration number
- Subject selection (8 subjects available)
- Credentials remembering option

### 2. **Exam Instructions Page**

- Comprehensive exam details and rules
- Total questions, duration, and passing score display
- Important rules and guidelines
- User acknowledgment checkbox
- Exam preparation guidance

### 3. **Exam Interface**

- **Question Navigator Sidebar**: Quick access to all questions
- **Responsive Timer**: Real-time countdown with color-coded warnings
- **Progress Tracking**: Shows answered vs unanswered questions
- **Auto-save**: Answers saved every 30 seconds
- **Navigation Controls**: Previous, Next, and Submit buttons
- **Visual Feedback**: Color-coded status for each question
- **Multiple Choice Interface**: Easy option selection

### 4. **Results & Analytics**

- Score display with percentage and conic gradient visualization
- Performance breakdown (Correct, Incorrect, Unanswered)
- User information summary
- Detailed answer review with explanations
- Print/Download results functionality
- Time taken calculation
- Pass/Fail status with appropriate feedback

### 5. **Design Features**

- **Green Theme**: School-inspired professional green color scheme
- **Clean UI**: Modern, minimalist design
- **JAMB Layout**: Structured similarly to JAMB CBT systems
- **Responsive**: Fully responsive on all devices
- **Animations**: Smooth transitions and interactive elements
- **Accessibility**: WCAG compliance considerations

## 🎨 Color Scheme

- **Primary Green**: #2ecc71 (Main accent color)
- **Dark Green**: #27ae60 (Darker variant)
- **Light Green**: #52be80 (Lighter variant)
- **Secondary Blue**: #3498db (Secondary accent)
- **Success**: #2ecc71 (Green)
- **Error**: #e74c3c (Red)
- **Warning**: #f39c12 (Orange)

## 🚀 How to Use

### 1. **Start the App**

- Open `login.html` in your web browser
- Fill in your details (name, email, registration number, subject)

### 2. **Review Instructions**

- Read through all exam rules and guidelines on the instructions page
- Check the acknowledgment checkbox
- Click "Start Exam"

### 3. **Take the Exam**

- Answer all questions (40 questions total)
- Use the question navigator to jump between questions
- Monitor the timer for remaining time
- Review and change answers as needed
- Click "Submit Exam" when ready

### 4. **View Results**

- See your score and percentage
- Review performance breakdown
- Click "Review All Answers" to see detailed explanations
- Download or print your results
- Start a new exam or logout

## 📝 Question Format

Each question contains:

- Question text
- Four multiple-choice options (A, B, C, D)
- Correct answer index
- Detailed explanation for learning

### Sample Question Structure (questions.json):

```json
{
  "id": 1,
  "question": "Question text here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 1,
  "explanation": "Detailed explanation"
}
```

## 💾 Data Storage

The application uses **localStorage** to store:

- `userData`: User login information
- `examAnswers`: User's exam responses (auto-saved)
- `examData`: Exam timing information
- `examResults`: Final exam results and scores

## ⏱️ Exam Settings

- **Duration**: 60 minutes
- **Total Questions**: 40
- **Passing Score**: 40% (16 questions)
- **Question Type**: Multiple Choice

## 🔔 Timer Features

- Real-time countdown display
- Color-coded warnings:
  - **Green**: More than 5 minutes remaining
  - **Orange**: 5 minutes remaining (warning)
  - **Red**: Less than 1 minute remaining (critical)
- Auto-submit when time expires

## 📊 Score Calculation

- **Excellent**: 80% and above
- **Good**: 60-79%
- **Pass**: 40-59%
- **Fail**: Below 40%

## 🛡️ Security Features

- HTML sanitization to prevent XSS attacks
- Input validation for email and form data
- Session management via localStorage
- Warning before page unload during exam
- Automatic authentication checks

## 📱 Responsive Breakpoints

- **Desktop**: 1024px and above
- **Tablet**: 768px - 1023px
- **Mobile**: Below 768px
- **Small Mobile**: Below 480px

## 🔧 Customization

### Change Exam Duration

Open `js/exam.js` and modify:

```javascript
totalDuration: 3600, // Change this value (in seconds)
```

### Add More Questions

Edit `data/questions.json` and follow the structure above.

### Change Color Theme

Edit CSS variables in `css/style.css`:

```css
:root {
  --primary-color: #2ecc71; /* Change primary color */
  --primary-dark: #27ae60; /* Change dark variant */
  /* ... more variables ... */
}
```

### Modify Passing Score

Open `js/app.js` and update `calculateScore()` function:

```javascript
const passingPercentage = 40; // Change this value
```

## 🧪 Testing

1. **Login Test**: Try logging in with sample data
2. **Navigation**: Test question navigation using sidebar and buttons
3. **Timer**: Verify timer counts down correctly
4. **Answer Selection**: Select different options and verify they're saved
5. **Submission**: Complete all questions and submit
6. **Results**: Verify correct/incorrect count and score calculation
7. **Review**: Check answer review displays explanations correctly
8. **Print**: Test print/download functionality

## 💡 Tips for Users

- **Manage Time**: Don't spend too much time on difficult questions
- **Review Before Submit**: Always review your answers before final submission
- **Read Carefully**: Read each question and all options thoroughly
- **No Penalties**: There are no negative marks, attempt all questions
- **Auto-Save**: Your answers are saved automatically, but submit to finalize
- **Stable Connection**: Ensure good internet connection throughout the exam

## 🐛 Troubleshooting

### Questions not loading?

- Check if `data/questions.json` is in the correct folder
- Ensure the JSON file has valid format
- Check browser console for errors

### Timer not showing?

- Refresh the page
- Clear browser cache
- Check if JavaScript is enabled

### Answers not saving?

- Ensure localStorage is enabled in your browser
- Check browser console for storage errors
- Try using a different browser

## 📄 Browser Compatibility

- ✅ Chrome/Chromium (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ⚠️ IE 11 (limited support)

## 📞 Support

For issues or suggestions:

1. Check the troubleshooting section
2. Review browser console for error messages
3. Verify all files are in correct folders
4. Ensure JavaScript is enabled

## 📚 Additional Resources

- [Sample Question Bank](#) - Additional questions available
- [User Guide](#) - Detailed usage documentation
- [Admin Guide](#) - For educators managing the system

## 📄 License

This CBT Exam Simulator is created for educational purposes. Modify and use as needed for your institution.

## 👨‍💼 Author

Created as a complete educational examination system with professional-grade features for student assessment.

---

**Version**: 1.0
**Last Updated**: 2024
**Status**: Production Ready

Enjoy your CBT Exam Experience! ✨
