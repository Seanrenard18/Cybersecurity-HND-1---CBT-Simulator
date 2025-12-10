/* ========================================
   CBT EXAM SIMULATOR - EXAM PAGE JAVASCRIPT
   Handles Exam Logic, Timer, Navigation & Submission
   ======================================== */

/**
 * Main Exam Controller Object
 */
const ExamController = {
  // State variables
  examData: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {}, // Object to store user answers
  examStartTime: null,
  timerInterval: null,
  totalDuration: 3600, // 60 minutes in seconds
  timeRemaining: 3600,

  /**
   * Initialize the exam page
   */
  /**
   * Initialize the exam page. This is async so we wait for questions
   * to be loaded before rendering UI and starting the timer.
   */
  async init() {
    console.log("Initializing exam...");

    // Check authentication
    const userData = AppUtils.getFromLocalStorage("userData");
    if (!userData) {
      AppUtils.redirect("login.html");
      return;
    }

    // Show a minimal loading state
    this.showLoadingMessage("Loading exam questions...");

    try {
      // Load exam data (await so subsequent steps run after data is ready)
      await this.loadExamData();

      // Initialize answers, UI and timer after questions are available
      this.restoreAnswers();
      this.setupEventListeners();
      this.displayQuestionList();
      this.displayQuestion();

      // Initialize timer based on exam metadata (duration minutes -> seconds)
      if (this.examData && this.examData.duration) {
        this.totalDuration = parseInt(this.examData.duration, 10) * 60;
      }
      this.startTimer();

      console.log("Exam initialized successfully");
    } catch (err) {
      console.error("Failed to initialize exam:", err);
      this.showErrorMessage(
        "Unable to load exam. Please ensure your Live Server is running and the selected course file exists."
      );
    } finally {
      this.hideLoadingMessage();
    }
  },

  /**
   * Load exam questions from course-specific JSON file
   */
  /**
   * Load exam questions from a course-specific JSON file.
   * Returns a Promise that resolves when questions are loaded.
   */
  async loadExamData() {
    // Get user data and course code
    const userData = AppUtils.getFromLocalStorage("userData");
    console.log("userData from localStorage:", userData);

    if (!userData || !userData.subject) {
      throw new Error(
        "No course selected. Please select a course on the login page."
      );
    }

    const courseCode = userData.subject; // e.g. "CYS311"
    console.log("Course code:", courseCode);
    console.log("Current URL protocol:", location.protocol);

    // Check if running on file:// protocol (not allowed for fetch)
    if (location.protocol === "file:") {
      throw new Error(
        "Cannot load exam from file:// protocol. Please use a web server (Live Server or http-server). " +
          "See TESTING_GUIDE.md for setup instructions."
      );
    }

    // Construct path to course-specific JSON file.
    // Compute base path (document directory) and build path relative to it so Live Server works.
    const basePath = location.pathname.substring(
      0,
      location.pathname.lastIndexOf("/")
    );
    const jsonPath = `${location.origin}${basePath}/data/questions_${courseCode}.json`;
    console.log("Computed basePath:", basePath);
    console.log("Trying absolute path:", jsonPath);

    // Fallback: if above produces duplicate segments (when served at root), try relative path
    let response;
    try {
      console.log("Attempting fetch from absolute path...");
      response = await fetch(jsonPath);
      console.log("Absolute path response status:", response.status);

      if (!response.ok) {
        // Try with relative path as fallback
        const relPath = `data/questions_${courseCode}.json`;
        console.log("Absolute path failed, trying relative path:", relPath);
        response = await fetch(relPath);
        console.log("Relative path response status:", response.status);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        }
      }
    } catch (fetchErr) {
      console.error("Fetch error for exam JSON:", fetchErr);
      throw new Error("Failed to fetch question file. " + fetchErr.message);
    }

    // Parse JSON
    let data;
    try {
      console.log("Parsing JSON response...");
      data = await response.json();
      console.log("JSON parsed successfully. Data:", data);
    } catch (parseErr) {
      console.error("Failed to parse JSON:", parseErr);
      throw new Error("Invalid JSON format in question file.");
    }

    // Validate structure
    if (!data || !data.exam || !Array.isArray(data.exam.questions)) {
      throw new Error(
        "Question file structure invalid: missing exam.questions array."
      );
    }

    // Assign to controller state
    this.examData = data.exam;
    this.questions = data.exam.questions || [];
    console.log(
      "Assigned questions to state. Question count:",
      this.questions.length
    );
    console.log("First question sample:", this.questions[0]);

    // Update UI with exam info
    const subjectEl = document.getElementById("subjectDisplay");
    if (subjectEl)
      subjectEl.textContent = this.examData.courseName || courseCode;

    const totalQuestionsNum = document.getElementById("totalQuestionsNum");
    const totalCount = document.getElementById("totalCount");
    if (totalQuestionsNum)
      totalQuestionsNum.textContent = this.questions.length;
    if (totalCount) totalCount.textContent = this.questions.length;

    console.log(
      `Loaded ${this.questions.length} questions from ${
        this.examData.courseName || courseCode
      }`
    );
  },

  /**
   * Setup event listeners for buttons
   */
  setupEventListeners() {
    // Navigation buttons
    document
      .getElementById("prevBtn")
      .addEventListener("click", () => this.previousQuestion());
    document
      .getElementById("nextBtn")
      .addEventListener("click", () => this.nextQuestion());
    document
      .getElementById("submitBtn")
      .addEventListener("click", () => this.showSubmitConfirmation());

    // Modal buttons
    document
      .getElementById("cancelBtn")
      .addEventListener("click", () => this.closeModal());
    document
      .getElementById("confirmBtn")
      .addEventListener("click", () => this.submitExam());
    // Terminate course button (if present)
    const terminateBtn = document.getElementById("terminateBtn");
    if (terminateBtn) {
      terminateBtn.addEventListener("click", () => this.terminateCourse());
    }
  },

  /**
   * Display current question
   */
  displayQuestion() {
    if (this.questions.length === 0) {
      console.error("No questions loaded");
      return;
    }

    const question = this.questions[this.currentQuestionIndex];

    // Update question number and text
    document.getElementById("questionNumber").textContent = `Question ${
      this.currentQuestionIndex + 1
    }`;
    document.getElementById("currentQuestionNum").textContent =
      this.currentQuestionIndex + 1;
    document.getElementById("questionContent").textContent = question.question;

    // Display options
    this.displayOptions(question);

    // Update navigation buttons
    this.updateNavigationButtons();

    // Hide explanation box
    document.getElementById("explanationBox").style.display = "none";

    // Highlight current question in sidebar
    this.highlightCurrentQuestion();

    // Scroll to top
    document.querySelector(".exam-content").scrollTop = 0;
  },

  /**
   * Display multiple choice options
   */
  displayOptions(question) {
    const optionsContainer = document.getElementById("optionsContainer");
    optionsContainer.innerHTML = "";

    question.options.forEach((option, index) => {
      const optionDiv = document.createElement("div");
      optionDiv.className = "option";

      // Check if this option was previously selected
      const isSelected = this.answers[this.currentQuestionIndex] === index;
      if (isSelected) {
        optionDiv.classList.add("selected");
      }

      optionDiv.innerHTML = `
                <input 
                    type="radio" 
                    id="option${index}" 
                    name="answer" 
                    value="${index}"
                    ${isSelected ? "checked" : ""}
                >
                <label for="option${index}" class="option-text">${option}</label>
            `;

      // Add click handler
      optionDiv.addEventListener("click", () => {
        this.selectAnswer(index);
      });

      optionsContainer.appendChild(optionDiv);
    });
  },

  /**
   * Handle answer selection
   */
  selectAnswer(optionIndex) {
    // Save answer
    this.answers[this.currentQuestionIndex] = optionIndex;
    AppUtils.saveToLocalStorage("examAnswers", this.answers);

    // Update UI
    document.querySelectorAll(".option").forEach((option) => {
      option.classList.remove("selected");
    });
    document.querySelectorAll(".option")[optionIndex].classList.add("selected");

    // Check the radio button
    document.getElementById(`option${optionIndex}`).checked = true;

    // Update progress
    this.updateProgress();
    this.highlightCurrentQuestion();

    console.log(
      `Answer selected for question ${
        this.currentQuestionIndex + 1
      }: ${optionIndex}`
    );
  },

  /**
   * Navigate to next question
   */
  nextQuestion() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.displayQuestion();
    }
  },

  /**
   * Navigate to previous question
   */
  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.displayQuestion();
    }
  },

  /**
   * Jump to specific question
   */
  jumpToQuestion(questionIndex) {
    if (questionIndex >= 0 && questionIndex < this.questions.length) {
      this.currentQuestionIndex = questionIndex;
      this.displayQuestion();
    }
  },

  /**
   * Update navigation button states
   */
  updateNavigationButtons() {
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    prevBtn.disabled = this.currentQuestionIndex === 0;
    nextBtn.disabled = this.currentQuestionIndex === this.questions.length - 1;
  },

  /**
   * Display question list in sidebar
   */
  displayQuestionList() {
    const listContainer = document.getElementById("questionListContainer");
    listContainer.innerHTML = "";

    this.questions.forEach((question, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "question-item";
      button.textContent = `Q${index + 1}`;

      // Add answered class if question has an answer
      if (this.answers[index] !== undefined) {
        button.classList.add("answered");
      }

      // Add active class for current question
      if (index === this.currentQuestionIndex) {
        button.classList.add("active");
      }

      button.addEventListener("click", () => {
        this.jumpToQuestion(index);
      });

      listContainer.appendChild(button);
    });
  },

  /**
   * Highlight current question in sidebar
   */
  highlightCurrentQuestion() {
    document.querySelectorAll(".question-item").forEach((item, index) => {
      item.classList.remove("active");
      if (index === this.currentQuestionIndex) {
        item.classList.add("active");
      }

      // Update answered status
      if (this.answers[index] !== undefined) {
        item.classList.add("answered");
      }
    });
  },

  /**
   * Update progress count
   */
  updateProgress() {
    const answeredCount = Object.keys(this.answers).length;
    document.getElementById("answeredCount").textContent = answeredCount;
  },

  /**
   * Start countdown timer
   */
  startTimer() {
    this.examStartTime = new Date();

    // Restore time from localStorage if exam was interrupted
    const savedExamData = AppUtils.getFromLocalStorage("examData");
    if (savedExamData && savedExamData.startTime) {
      const elapsedSeconds = Math.floor(
        (new Date().getTime() - new Date(savedExamData.startTime).getTime()) /
          1000
      );
      this.timeRemaining = this.totalDuration - elapsedSeconds;
    } else {
      this.timeRemaining = this.totalDuration;
      AppUtils.saveToLocalStorage("examData", {
        startTime: this.examStartTime.toISOString(),
      });
    }

    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      this.updateTimerDisplay();

      // Auto-submit when time expires
      if (this.timeRemaining <= 0) {
        clearInterval(this.timerInterval);
        AppUtils.showNotification("Time is up! Submitting exam...", "warning");
        setTimeout(() => this.submitExam(), 2000);
      }

      // Warning at 5 minutes
      if (this.timeRemaining === 300) {
        AppUtils.showNotification("5 minutes remaining!", "warning");
      }

      // Critical warning at 1 minute
      if (this.timeRemaining === 60) {
        AppUtils.showNotification("1 minute remaining! Hurry up!", "error");
      }
    }, 1000);
  },

  /**
   * Update timer display
   */
  updateTimerDisplay() {
    const timerText = AppUtils.formatTime(this.timeRemaining);
    document.getElementById("timer").textContent = timerText;

    // Change color based on time remaining
    const timerElement = document.querySelector(".timer-display");
    if (this.timeRemaining <= 60) {
      timerElement.style.color = "#e74c3c"; // Red
    } else if (this.timeRemaining <= 300) {
      timerElement.style.color = "#f39c12"; // Orange
    } else {
      timerElement.style.color = "white"; // White
    }
  },

  /**
   * Show a small loading message in the exam content area
   */
  showLoadingMessage(message) {
    let loader = document.getElementById("examLoader");
    if (!loader) {
      loader = document.createElement("div");
      loader.id = "examLoader";
      loader.className = "exam-loader";
      const container =
        document.querySelector(".exam-content") || document.body;
      container.prepend(loader);
    }
    loader.textContent = message || "Loading...";
    loader.style.display = "block";
  },

  hideLoadingMessage() {
    const loader = document.getElementById("examLoader");
    if (loader) loader.style.display = "none";
  },

  /**
   * Show an inline error message and disable exam controls
   */
  showErrorMessage(msg) {
    // Clear main content and show friendly error
    const content = document.querySelector(".exam-content");
    if (content) {
      content.innerHTML = `\n        <div class="exam-error">\n          <h3>Unable to load exam</h3>\n          <p>${msg}</p>\n          <p>Please contact your administrator or try again later.</p>\n        </div>`;
    } else {
      alert(msg);
    }
  },

  /**
   * Show submit confirmation modal
   */
  showSubmitConfirmation() {
    const answeredCount = Object.keys(this.answers).length;
    const unansweredCount = this.questions.length - answeredCount;

    let message = `You have answered ${answeredCount} out of ${this.questions.length} questions.`;

    if (unansweredCount > 0) {
      message += `\n\n⚠️ ${unansweredCount} question(s) remain unanswered.`;
      message += "\n\nAre you sure you want to submit?";
    } else {
      message += "\n\nAll questions answered! Ready to submit?";
    }

    document.getElementById("confirmMessage").textContent = message;
    this.openModal();
  },

  /**
   * Terminate the current course/exam instantly.
   * Clears exam state, stops timer and redirects to index.
   */
  terminateCourse() {
    const confirmTerminate = confirm(
      "Are you sure you want to terminate the current course? This will clear your current progress."
    );
    if (!confirmTerminate) return;

    // Stop timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Clear saved exam state but keep userData so they can re-login if needed
    try {
      AppUtils.removeFromLocalStorage("examAnswers");
      AppUtils.removeFromLocalStorage("examData");
      AppUtils.removeFromLocalStorage("examResults");
    } catch (err) {
      console.error("Error clearing exam state:", err);
    }

    AppUtils.showNotification("Course terminated. Redirecting...", "warning", 2000);
    setTimeout(() => {
      window.location.href = "index.html";
    }, 800);
  },

  /**
   * Open confirmation modal
   */
  openModal() {
    const modal = document.getElementById("confirmModal");
    const backdrop = document.getElementById("modalBackdrop");
    modal.classList.add("active");
    backdrop.classList.add("active");
  },

  /**
   * Close confirmation modal
   */
  closeModal() {
    const modal = document.getElementById("confirmModal");
    const backdrop = document.getElementById("modalBackdrop");
    modal.classList.remove("active");
    backdrop.classList.remove("active");
  },

  /**
   * Submit exam and calculate results
   */
  submitExam() {
    console.log("Submitting exam...");

    // Stop timer
    clearInterval(this.timerInterval);

    // Calculate results
    let correctCount = 0;
    const userAnswers = [];

    this.questions.forEach((question, index) => {
      const userAnswer = this.answers[index];
      const isCorrect = userAnswer === question.correctAnswer;

      if (isCorrect) {
        correctCount++;
      }

      userAnswers.push({
        questionIndex: index,
        question: question.question,
        userAnswerIndex: userAnswer,
        userAnswer:
          userAnswer !== undefined
            ? question.options[userAnswer]
            : "Not answered",
        correctAnswerIndex: question.correctAnswer,
        correctAnswer: question.options[question.correctAnswer],
        explanation: question.explanation,
        isCorrect,
      });
    });

    // Calculate score
    const scoreData = AppUtils.calculateScore(
      correctCount,
      this.questions.length
    );

    // Prepare exam results
    const userData = AppUtils.getFromLocalStorage("userData");
    const examEndTime = new Date().toISOString();

    const results = {
      userData,
      examData: {
        correctCount,
        totalQuestions: this.questions.length,
        score: scoreData.percentage,
        passed: scoreData.passed,
        status: scoreData.status,
        startTime: AppUtils.getFromLocalStorage("examData").startTime,
        endTime: examEndTime,
        timeTaken: AppUtils.calculateDuration(
          AppUtils.getFromLocalStorage("examData").startTime,
          examEndTime
        ),
      },
      userAnswers,
      submitTime: examEndTime,
    };

    // Save results
    AppUtils.saveToLocalStorage("examResults", results);

    // Clear exam data
    AppUtils.removeFromLocalStorage("examAnswers");
    AppUtils.removeFromLocalStorage("examData");

    // Close modal and redirect
    this.closeModal();
    AppUtils.showNotification("Exam submitted successfully!", "success", 2000);

    setTimeout(() => {
      window.location.href = "results.html";
    }, 2000);
  },

  /**
   * Restore previously saved answers
   */
  restoreAnswers() {
    const savedAnswers = AppUtils.getFromLocalStorage("examAnswers", {});
    this.answers = savedAnswers;
    console.log("Restored answers:", this.answers);
  },

  /**
   * Save answers periodically (auto-save)
   */
  autoSave() {
    AppUtils.saveToLocalStorage("examAnswers", this.answers);
    console.log("Auto-saved answers");
  },
};

/**
 * Initialize exam when DOM is ready
 */
document.addEventListener("DOMContentLoaded", async function () {
  try {
    await ExamController.init();

    // Auto-save every 30 seconds (start only after init)
    setInterval(() => {
      ExamController.autoSave();
    }, 30000);
  } catch (err) {
    console.error("Initialization error:", err);
  }
});

/**
 * Prevent accidental navigation away
 */
window.addEventListener("beforeunload", function (e) {
  e.preventDefault();
  e.returnValue = "";
  return "Are you sure? Your progress might not be saved.";
});
