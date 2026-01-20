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
  totalDuration: 1800, // 30 minutes in seconds (fixed)
  timeRemaining: 1800,
  examStarted: false, // Track if exam has actually begun
  currentCourse: null,
  isSwitching: false, // Prevent double course switches
  isSubmitting: false, // Prevent double submissions
  modalOpen: false, // Track if any modal is open

  /**
   * Initialize the exam page
   */
  async init() {
    console.log("Initializing exam...");

    // Check authentication
    const userData = AppUtils.getFromLocalStorage("userData");
    if (!userData) {
      AppUtils.redirect("login.html");
      return;
    }

    // Initialize with the course from userData
    this.currentCourse = userData.subject;

    // Show a minimal loading state
    this.showLoadingMessage("Loading exam questions...");

    try {
      // Load exam data
      await this.loadExamData(this.currentCourse);

      // Initialize UI and restore previous answers if any
      this.restoreAnswers();
      this.setupEventListeners();
      this.displayQuestionList();
      this.displayQuestion();

      // Update timer display to 30:00 but DON'T start timer yet
      this.totalDuration = 1800; // 30 minutes
      this.timeRemaining = 1800;
      this.updateTimerDisplay();

      console.log("Exam initialized successfully");
    } catch (err) {
      console.error("Failed to initialize exam:", err);
      this.showErrorMessage(
        "Unable to load exam. Please ensure your Live Server is running and the selected course file exists.",
      );
    } finally {
      this.hideLoadingMessage();
    }
  },

  /**
   * Load exam questions from course-specific JSON file
   * @param {string} courseCode - The course code (e.g., "CYS311")
   */
  async loadExamData(courseCode) {
    console.log("Loading exam data for course:", courseCode);

    // Check if running on file:// protocol (not allowed for fetch)
    if (location.protocol === "file:") {
      throw new Error(
        "Cannot load exam from file:// protocol. Please use a web server (Live Server). " +
          "See TESTING_GUIDE.md for setup instructions.",
      );
    }

    // Construct path to course-specific JSON file
    const basePath = location.pathname.substring(
      0,
      location.pathname.lastIndexOf("/"),
    );
    const jsonPath = `${location.origin}${basePath}/data/questions_${courseCode}.json`;
    console.log("Trying to load from:", jsonPath);

    // Fallback: if above produces issues, try relative path
    let response;
    try {
      response = await fetch(jsonPath);

      if (!response.ok) {
        // Try with relative path as fallback
        const relPath = `data/questions_${courseCode}.json`;
        console.log("Absolute path failed, trying relative path:", relPath);
        response = await fetch(relPath);

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
      data = await response.json();
      console.log(
        "JSON parsed successfully. Questions loaded:",
        data.exam.questions.length,
      );
    } catch (parseErr) {
      console.error("Failed to parse JSON:", parseErr);
      throw new Error("Invalid JSON format in question file.");
    }

    // Validate structure
    if (!data || !data.exam || !Array.isArray(data.exam.questions)) {
      throw new Error(
        "Question file structure invalid: missing exam.questions array.",
      );
    }

    // Handle edge case: empty questions array
    if (data.exam.questions.length === 0) {
      throw new Error("No questions found in the selected course.");
    }

    // Assign to controller state
    this.examData = data.exam;
    this.questions = data.exam.questions || [];
    console.log(`Loaded ${this.questions.length} questions`);

    // Validate we have questions
    if (this.questions.length === 0) {
      throw new Error("Failed to load questions properly.");
    }

    // Update UI with course info and question count
    const courseCodeDisplay = document.getElementById("courseCodeDisplay");
    if (courseCodeDisplay) courseCodeDisplay.textContent = courseCode;

    const totalQuestionsNum = document.getElementById("totalQuestionsNum");
    if (totalQuestionsNum)
      totalQuestionsNum.textContent = this.questions.length;
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

    // Submit confirmation modal buttons
    document
      .getElementById("cancelBtn")
      .addEventListener("click", () => this.closeModal("confirmModal"));
    document
      .getElementById("confirmBtn")
      .addEventListener("click", () => this.submitExam());

    // Exit confirmation modal buttons
    const exitCancelBtn = document.getElementById("exitCancelBtn");
    const exitConfirmBtn = document.getElementById("exitConfirmBtn");
    if (exitCancelBtn) {
      exitCancelBtn.addEventListener("click", () =>
        this.closeModal("exitModal"),
      );
    }
    if (exitConfirmBtn) {
      exitConfirmBtn.addEventListener("click", () => this.confirmExit());
    }

    // Terminate/Exit button - show confirmation modal
    const terminateBtn = document.getElementById("terminateBtn");
    if (terminateBtn) {
      terminateBtn.addEventListener("click", () => this.showExitConfirmation());
    }

    // Course selector change
    const courseSelector = document.getElementById("courseSelector");
    if (courseSelector) {
      courseSelector.value = this.currentCourse; // Set to current course
      courseSelector.addEventListener("change", (e) => {
        if (e.target.value && e.target.value !== this.currentCourse) {
          this.switchCourse(e.target.value);
        }
      });
    }
  },

  /**
   * Switch to a different course - resets exam state
   * @param {string} newCourse - The new course code
   */
  switchCourse(newCourse) {
    // Prevent double course switches
    if (this.isSwitching) {
      return;
    }

    // Prevent switching while modal is open
    if (this.modalOpen) {
      return;
    }

    if (
      !confirm("Switching courses will clear your current progress. Continue?")
    ) {
      // Reset the selector to current course
      document.getElementById("courseSelector").value = this.currentCourse;
      return;
    }

    // Set switching flag to prevent double action
    this.isSwitching = true;
    const courseSelector = document.getElementById("courseSelector");
    if (courseSelector) {
      courseSelector.disabled = true;
    }

    console.log("Switching course from", this.currentCourse, "to", newCourse);

    // Stop timer and clean up
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Reset exam state completely
    this.currentCourse = newCourse;
    this.currentQuestionIndex = 0;
    this.answers = {};
    this.examStartTime = null;
    this.examStarted = false;
    this.timeRemaining = 1800;

    // Clear localStorage exam data
    AppUtils.removeFromLocalStorage("examAnswers");
    AppUtils.removeFromLocalStorage("examData");

    // Update userData with new course
    const userData = AppUtils.getFromLocalStorage("userData");
    userData.subject = newCourse;
    AppUtils.saveToLocalStorage("userData", userData);

    // Show loading state
    this.showLoadingMessage("Switching course...");

    // Reload the exam with short delay to ensure clean state
    setTimeout(() => {
      this.isSwitching = false;
      if (courseSelector) {
        courseSelector.disabled = false;
      }
      this.init().catch((err) => {
        console.error("Error switching courses:", err);
        this.isSwitching = false;
        if (courseSelector) {
          courseSelector.disabled = false;
        }
        AppUtils.showNotification(
          "Error switching courses. Please refresh.",
          "error",
        );
      });
    }, 300);
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
    const explanationBox = document.getElementById("explanationBox");
    if (explanationBox) explanationBox.style.display = "none";

    // Highlight current question in sidebar
    this.highlightCurrentQuestion();

    // Scroll to top
    const examContent = document.querySelector(".exam-content");
    if (examContent) examContent.scrollTop = 0;

    // Start timer if this is the first question being viewed
    if (!this.examStarted && this.currentQuestionIndex === 0) {
      // Timer will start when user selects their first answer
    }
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
   * Handle answer selection - also starts the timer on first answer
   */
  selectAnswer(optionIndex) {
    // Start timer on first answer if not started
    if (!this.examStarted) {
      this.examStarted = true;
      console.log("Exam started - timer beginning now");
      this.startTimer();
      AppUtils.showNotification(
        "Exam timer started! 30 minutes.",
        "info",
        3000,
      );
    }

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
      }: ${optionIndex}`,
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
    const unansweredCount = this.questions.length - answeredCount;
    document.getElementById("answeredCount").textContent = answeredCount;
    document.getElementById("unansweredCount").textContent = unansweredCount;
  },

  /**
   * Start countdown timer (30 minutes fixed)
   */
  startTimer() {
    this.examStartTime = new Date();
    this.timeRemaining = 1800; // Always 30 minutes

    // Save exam start time
    AppUtils.saveToLocalStorage("examData", {
      startTime: this.examStartTime.toISOString(),
      course: this.currentCourse,
    });

    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      this.updateTimerDisplay();

      // Auto-submit when time expires
      if (this.timeRemaining <= 0) {
        clearInterval(this.timerInterval);
        AppUtils.showNotification(
          "Time is up! Auto-submitting exam...",
          "warning",
        );
        setTimeout(() => this.submitExam(), 1500);
      }

      // Warning at 5 minutes
      if (this.timeRemaining === 300) {
        AppUtils.showNotification("⏰ 5 minutes remaining!", "warning");
      }

      // Critical warning at 1 minute
      if (this.timeRemaining === 60) {
        AppUtils.showNotification("🔴 1 minute remaining! Hurry up!", "error");
      }
    }, 1000);
  },

  /**
   * Update timer display with color coding
   */
  updateTimerDisplay() {
    const timerText = AppUtils.formatTime(this.timeRemaining);
    document.getElementById("timer").textContent = timerText;

    // Change color based on time remaining
    const timerElement = document.querySelector(".timer-display");
    if (timerElement) {
      if (this.timeRemaining <= 60) {
        timerElement.style.color = "#e74c3c"; // Red
      } else if (this.timeRemaining <= 300) {
        timerElement.style.color = "#f39c12"; // Orange
      } else {
        timerElement.style.color = "white"; // White
      }
    }
  },

  /**
   * Show a loading message
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

  /**
   * Hide loading message
   */
  hideLoadingMessage() {
    const loader = document.getElementById("examLoader");
    if (loader) loader.style.display = "none";
  },

  /**
   * Show error message
   */
  showErrorMessage(msg) {
    const content = document.querySelector(".exam-content");
    if (content) {
      content.innerHTML = `
        <div class="exam-error">
          <h3>Unable to load exam</h3>
          <p>${msg}</p>
          <p>Please contact your administrator or try again later.</p>
        </div>`;
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
      message += "\n\n✓ All questions answered! Ready to submit?";
    }

    document.getElementById("confirmMessage").textContent = message;
    this.openModal();
  },

  /**
   * Show exit confirmation modal with warning
   */
  showExitConfirmation() {
    document.getElementById("exitMessage").textContent =
      "All your progress will be lost. Are you sure you want to exit?";
    this.openModal("exitModal");
  },

  /**
   * Confirm exit and return home
   */
  confirmExit() {
    // Stop timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Clear exam state
    try {
      AppUtils.removeFromLocalStorage("examAnswers");
      AppUtils.removeFromLocalStorage("examData");
      AppUtils.removeFromLocalStorage("examResults");
    } catch (err) {
      console.error("Error clearing exam state:", err);
    }

    this.closeModal("exitModal");
    AppUtils.showNotification("Exiting exam...", "info", 1000);
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  },

  /**
   * Terminate the current exam and return home (legacy method)
   */
  terminateCourse() {
    const confirmTerminate = confirm(
      "Are you sure you want to exit the exam? Your progress will be lost.",
    );
    if (!confirmTerminate) return;

    // Stop timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Clear exam state
    try {
      AppUtils.removeFromLocalStorage("examAnswers");
      AppUtils.removeFromLocalStorage("examData");
      AppUtils.removeFromLocalStorage("examResults");
    } catch (err) {
      console.error("Error clearing exam state:", err);
    }

    AppUtils.showNotification("Exiting exam...", "info", 1000);
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  },

  /**
   * Open confirmation modal - supports multiple modals
   * @param {string} modalId - The ID of the modal to open (default: confirmModal)
   */
  openModal(modalId = "confirmModal") {
    const modal = document.getElementById(modalId);
    const backdrop = document.getElementById("modalBackdrop");
    if (modal) {
      modal.classList.add("active");
    }
    if (backdrop) {
      backdrop.classList.add("active");
    }
    this.modalOpen = true;
  },

  /**
   * Close confirmation modal - supports multiple modals
   * @param {string} modalId - The ID of the modal to close (default: confirmModal)
   */
  closeModal(modalId = "confirmModal") {
    const modal = document.getElementById(modalId);
    const backdrop = document.getElementById("modalBackdrop");
    if (modal) {
      modal.classList.remove("active");
    }
    if (backdrop) {
      backdrop.classList.remove("active");
    }
    this.modalOpen = false;
  },

  /**
   * Submit exam and calculate results
   */
  submitExam() {
    console.log("Submitting exam...");

    // Stop timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

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
      this.questions.length,
    );

    // Prepare exam results
    const userData = AppUtils.getFromLocalStorage("userData");
    const examEndTime = new Date().toISOString();
    const examStartData = AppUtils.getFromLocalStorage("examData");

    const results = {
      userData,
      examData: {
        course: this.currentCourse,
        correctCount,
        totalQuestions: this.questions.length,
        score: scoreData.percentage,
        passed: scoreData.passed,
        status: scoreData.status,
        startTime: examStartData ? examStartData.startTime : examEndTime,
        endTime: examEndTime,
        timeTaken: examStartData
          ? AppUtils.calculateDuration(examStartData.startTime, examEndTime)
          : "00:00",
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
    this.updateProgress();
  },
};

/**
 * Initialize exam when DOM is ready
 */
document.addEventListener("DOMContentLoaded", async function () {
  try {
    await ExamController.init();
  } catch (err) {
    console.error("Initialization error:", err);
  }
});

/**
 * Prevent accidental navigation away during exam
 */
window.addEventListener("beforeunload", function (e) {
  if (ExamController.examStarted && ExamController.timerInterval) {
    e.preventDefault();
    e.returnValue = "";
    return "Are you sure? Your exam is in progress.";
  }
});

// Cleanup on page unload to prevent memory leaks
window.addEventListener("unload", () => {
  // Clear timer
  if (ExamController && ExamController.timerInterval) {
    clearInterval(ExamController.timerInterval);
    ExamController.timerInterval = null;
  }

  // Remove all event listeners by cloning elements
  const buttons = document.querySelectorAll("button");
  buttons.forEach((button) => {
    const clone = button.cloneNode(true);
    button.parentNode.replaceChild(clone, button);
  });

  // Clear local references
  if (ExamController) {
    ExamController.questions = [];
    ExamController.answers = {};
  }
});

// Additional cleanup on page visibility change
document.addEventListener("visibilitychange", () => {
  if (document.hidden && ExamController && ExamController.timerInterval) {
    // Page is hidden - timer continues to run (expected behavior)
    console.log("Exam is running in background");
  } else if (!document.hidden && ExamController && ExamController.examStarted) {
    // Page is visible again - exam continues normally
    console.log("Exam resumed from background");
  }
});
