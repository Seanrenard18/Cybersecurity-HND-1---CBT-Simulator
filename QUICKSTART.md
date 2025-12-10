# 🚀 Quick Start Guide - CBT Exam Simulator

## Getting Started in 3 Steps

### Step 1: Open the App

1. Navigate to your project folder
2. Double-click `login.html` or open it in your web browser
3. The green-themed login page will load

### Step 2: Login

Fill in the following information:

- **Full Name**: Your name
- **Email**: Your email address (must be valid format)
- **Registration Number**: Your student ID (e.g., REG-2024-001)
- **Subject**: Select from available subjects:
  - English Language (default)
  - Mathematics
  - Biology
  - Chemistry
  - Physics
  - Government
  - History
  - Literature in English

✅ Check "Remember my credentials" if desired
Click **"Proceed to Instructions"**

### Step 3: Read Instructions

- Review all exam rules and guidelines carefully
- Note the important rules section
- ✅ Check the acknowledgment checkbox
- Click **"Start Exam →"**

## Taking the Exam

### 🎯 Main Exam Interface

**Left Sidebar - Question Navigator**

- Shows all 40 questions
- Green = Answered, White = Unanswered
- Click any question number to jump to it
- Progress counter at top

**Top Navbar**

- ⏱️ Timer showing remaining time
- Subject name display
- Color changes: Green → Orange → Red (as time runs out)

**Center Area - Question Display**

- Question number and text
- Four multiple-choice options
- Click any option to select it
- Previous / Next / Submit buttons

### 📋 Navigation Tips

| Action           | How                                         |
| ---------------- | ------------------------------------------- |
| Select Answer    | Click any option button                     |
| Change Answer    | Click a different option                    |
| Go to Next Q     | Click "Next →" or click Q number in sidebar |
| Go to Previous Q | Click "← Previous"                          |
| Jump to Q10      | Click "10" in the left sidebar              |
| Submit Exam      | Click "Submit Exam" button                  |

### ⏱️ Time Management

**Timer Warnings:**

- **Green Light** (60+ min): All good, take your time
- **Orange Light** (5 min): Hurry up, wrap up your answers
- **Red Light** (<1 min): Critical! Submit immediately

**Auto-Save Feature:**

- Your answers save automatically every 30 seconds
- Don't worry if accidentally refreshed - answers restored

### ✅ Before Submitting

1. Check the sidebar - ensure all questions are marked as answered
2. Review difficult questions if time permits
3. Click "Submit Exam" when confident
4. Confirm submission in the modal dialog
5. System will calculate and display results

## Viewing Results

### 📊 Results Page Shows:

**Status Card (Top)**

- ✅ PASSED or ❌ FAILED
- Your score and percentage
- Motivational message

**Score Section**

- Large circular percentage display
- Correct/Total score
- Passing score requirement

**Performance Breakdown**

- ✓ Correct Answers: Green box
- ✗ Incorrect Answers: Red box
- ? Unanswered: Gray box

**User Information**

- Your name, registration, subject
- Email, exam duration
- Submission time and total time taken

**Answer Review Section**

- Click "Review All Answers" to see explanations
- Green = Correct answer with explanation
- Red = Incorrect answer with correct answer and explanation

### 🖨️ Print/Download Results

1. Click "📥 Download Result"
2. Print dialog opens
3. Choose to print to PDF or physical printer
4. Results saved with your details and answers

## Sample Login Credentials (for Testing)

**Test User 1:**

- Name: John Adekunle
- Email: john@example.com
- Reg: REG-2024-001
- Subject: English Language

**Test User 2:**

- Name: Chioma Okonkwo
- Email: chioma@example.com
- Reg: REG-2024-002
- Subject: Mathematics

## Common Questions

**Q: Can I go back to previous questions?**
A: Yes! Click "← Previous" or click any question number in the sidebar.

**Q: What if I don't answer all questions?**
A: You can submit with unanswered questions. They count as incorrect.

**Q: Can I change my answer?**
A: Yes! Select a different option anytime before submitting.

**Q: What if I run out of time?**
A: Exam auto-submits when time reaches zero.

**Q: Where are my results saved?**
A: In your browser's local storage. Click "Download Result" to save a copy.

**Q: How do I start a new exam?**
A: On results page, click "Start New Exam". You'll return to instructions.

**Q: Can I review my results later?**
A: Results are stored in your browser. Don't clear cookies/cache to keep them.

## 🎓 Exam Settings

| Setting          | Value                  |
| ---------------- | ---------------------- |
| Total Questions  | 40                     |
| Time Limit       | 60 minutes             |
| Passing Score    | 40% (16 questions)     |
| Question Type    | Multiple Choice        |
| Negative Marking | No                     |
| Review Allowed   | Yes, before submission |

## 🌟 Tips for Best Performance

✅ **DO:**

- Read each question carefully
- Consider all options before selecting
- Use the full time available
- Review answers before submitting
- Try difficult questions with fresh perspective

❌ **DON'T:**

- Rush through questions
- Leave questions unanswered if possible
- Refresh page during exam
- Use external resources (honor system)
- Close browser tab with exam active

## 🔄 After the Exam

1. **View Results**: Immediately shown after submission
2. **Review Answers**: See explanations for all questions
3. **Print Results**: Download for your records
4. **Start Over**: Take another exam or logout
5. **Track Progress**: Check saved results anytime

## ⚙️ System Requirements

✅ **Required:**

- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- LocalStorage enabled
- Stable internet connection during exam

❌ **Not Required:**

- Internet connection (offline works too!)
- Plugin or software installation
- Special hardware or accounts

## 🆘 Troubleshooting

### Issue: Questions not showing

**Solution**: Ensure `data/questions.json` file exists in the data folder

### Issue: Timer not working

**Solution**: Refresh page or restart browser

### Issue: Can't select answers

**Solution**: Ensure JavaScript is enabled in browser

### Issue: Results page blank

**Solution**: Don't refresh during results display - take exam completely

## 📞 Need Help?

1. Check this guide's FAQ section
2. Review the detailed README.md file
3. Verify all files are in correct folders
4. Try a different browser
5. Clear browser cache and try again

---

## 🎉 You're Ready!

Click on `login.html` to start your exam simulator journey. Good luck! 📚✨

**Remember:** This system helps you practice and prepare. Make the most of it!
