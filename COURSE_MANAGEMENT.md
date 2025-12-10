# Quick Reference Guide - Course Management

## How to Add/Edit Questions

### Step 1: Open Course JSON File
Navigate to `data/` folder and open the course file you want to edit:
- `questions_CYS311.json`
- `questions_CYS312.json`
- `questions_CYS313.json`
- `questions_CYS314.json`
- `questions_GNS301.json`
- `questions_NCC311.json`

### Step 2: Locate the Questions Array
Each file has this structure:
```json
{
  "exam": {
    "title": "Course Title",
    "courseCode": "CYS311",
    "courseName": "Full Course Name",
    "department": "Cybersecurity HND 1",
    "duration": 60,
    "totalQuestions": 40,
    "passingScore": 40,
    "questions": [
      { question object 1 },
      { question object 2 },
      ...
    ]
  }
}
```

### Step 3: Add a New Question
Copy this template and add to the `questions` array:

```json
{
  "id": 41,
  "question": "Your question text here?",
  "options": [
    "Option A - wrong answer",
    "Option B - wrong answer",
    "Option C - correct answer",
    "Option D - wrong answer"
  ],
  "correctAnswer": 2,
  "explanation": "Explanation of why option C is correct and what concept it tests."
}
```

**Important Notes:**
- `id`: Must be unique within the course (starting from 1)
- `question`: The question text
- `options`: Array of exactly 4 answer choices
- `correctAnswer`: Index of correct answer (0=first, 1=second, 2=third, 3=fourth)
- `explanation`: Educational explanation for the correct answer

### Step 4: Edit Existing Question
- Find the question by its `id` number
- Edit the `question` text, `options`, or `correctAnswer`
- Update the `explanation` if needed

### Step 5: Save the File
- Save JSON file (Ctrl+S)
- Validate JSON syntax (use JSON validator if unsure)
- Changes take effect immediately when exam is loaded

## Example: Adding Question to CYS311

**Original file excerpt:**
```json
"questions": [
  {
    "id": 1,
    "question": "What is information security?",
    ...
  },
  ...
  {
    "id": 40,
    "question": "Last question...",
    ...
  }
]
```

**After adding new question (ID 41):**
```json
"questions": [
  { ... existing questions ... },
  {
    "id": 41,
    "question": "What is a security audit?",
    "options": [
      "A music performance",
      "A systematic examination of security controls",
      "A type of database",
      "A network protocol"
    ],
    "correctAnswer": 1,
    "explanation": "A security audit is a systematic examination and review of an organization's security controls to ensure they are effective and compliant."
  }
]
```

## How to Modify Course Metadata

At the top of each JSON file, you can edit:

```json
{
  "exam": {
    "title": "CYS 311 - Information Security & Policy Development",
    "courseCode": "CYS311",
    "courseName": "Information Security & Policy Development",
    "department": "Cybersecurity HND 1",
    "duration": 60,              // Exam duration in minutes
    "totalQuestions": 40,        // Total questions in this course
    "passingScore": 40           // Points needed to pass (out of 100)
  }
}
```

## Adding a Completely New Course

If you need to add a new course beyond the initial 6:

### Step 1: Create New JSON File
Create a new file: `data/questions_[COURSECODENEW].json`

Example: `data/questions_CYS315.json` for a new CYS 315 course

### Step 2: Use This Template
```json
{
  "exam": {
    "title": "CYS 315 - New Course Title",
    "courseCode": "CYS315",
    "courseName": "New Course Title",
    "department": "Cybersecurity HND 1",
    "duration": 60,
    "totalQuestions": 40,
    "passingScore": 40,
    "questions": [
      {
        "id": 1,
        "question": "First question?",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "correctAnswer": 0,
        "explanation": "Explanation here"
      },
      // ... add 39 more questions ...
    ]
  }
}
```

### Step 3: Add Course to Login Dropdown
Edit `login.html` and add new option to the course select dropdown:

Find this section:
```html
<select id="subject" name="subject" required>
  <option value="">-- Choose a course --</option>
  <option value="CYS311">CYS 311 - Information Security & Policy Development</option>
  <!-- Add new line below: -->
  <option value="CYS315">CYS 315 - New Course Title</option>
</select>
```

### Step 4: Test
- Go to login page
- Select new course from dropdown
- Enter user details and start exam
- Verify questions load correctly

## Question ID Management

Each course maintains its own ID numbering:

| Course | IDs | Count |
|--------|-----|-------|
| CYS311 | 1-40 | 40 |
| CYS312 | 1-40 | 40 |
| CYS313 | 1-40 | 40 |
| CYS314 | 1-40 | 40 |
| GNS301 | 1-40 | 40 |
| NCC311 | 1-40 | 40 |

**Rule:** Each course's question IDs start at 1 and should be sequential.

## Troubleshooting

### Questions Not Loading?
1. Check JSON file syntax (use online JSON validator)
2. Verify course code matches between login.html and JSON filename
3. Ensure questions array is not empty
4. Check browser console for errors (F12)

### Wrong Correct Answer Showing?
1. Verify `correctAnswer` index is correct (0-3)
2. Recount options: 0=first, 1=second, 2=third, 3=fourth
3. Save file and refresh browser

### Course Not Appearing in Dropdown?
1. Check login.html dropdown syntax
2. Ensure course code matches JSON filename (e.g., CYS311)
3. Verify spelling of course code

## Best Practices

1. **Backup Before Editing**
   - Keep copies of original JSON files
   - Use version control if available

2. **Test After Changes**
   - Try the exam after editing
   - Verify correct answers work
   - Check all 40 questions

3. **Consistent Formatting**
   - Use proper JSON formatting
   - Keep indentation consistent
   - Validate after each edit

4. **Question Quality**
   - Provide clear explanations
   - Ensure only one correct answer
   - Match questions to course content

5. **Keep Metadata Updated**
   - Update `totalQuestions` if you change number of questions
   - Update `passingScore` if you change grading threshold
   - Maintain accurate `courseName`

## Quick Commands

### Validate JSON Online
Visit: https://jsonlint.com/
Paste your JSON file content to check for errors

### Find & Replace in Code Editor
- Ctrl+H: Open Find & Replace
- Useful for updating multiple questions quickly

### Open Terminal/Command Line
- Windows: Right-click folder → Open in terminal
- Navigate to project folder
- Use text editor to edit files

## Support

For issues or questions:
1. Check the main README.md
2. Review CYBERSECURITY_UPDATE.md for overview
3. Verify JSON syntax first
4. Check browser console (F12) for error messages

---

**Version:** 2.0
**Last Updated:** 2024
**Department:** Cybersecurity HND 1
