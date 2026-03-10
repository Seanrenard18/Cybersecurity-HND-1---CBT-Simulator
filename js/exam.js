/* ========================================
   CBT EXAM SIMULATOR - EXAM PAGE JAVASCRIPT
   Handles course loading, exam flow, timer, and autosave
   ======================================== */

const ExamController = {
  examData: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  examStartTime: null,
  timerInterval: null,
  autosaveInterval: null,
  totalDuration: 1800,
  timeRemaining: 1800,
  examStarted: false,
  currentCourse: null,
  isSwitching: false,
  isSubmitting: false,
  modalOpen: false,
  eventsBound: false,

  normalizeCourseCode(rawCourse) {
    if (typeof CourseConfig !== "undefined") {
      return CourseConfig.normalizeCourseCode(rawCourse);
    }
    return String(rawCourse || "").replace(/\s+/g, "").toUpperCase().trim();
  },

  createSessionToken() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return AppUtils.generateId();
  },

  ensureSessionToken(userData) {
    if (!userData.sessionToken) {
      userData.sessionToken = this.createSessionToken();
      AppUtils.saveToLocalStorage("userData", userData);
    }
    return userData;
  },

  getSessionToken() {
    const userData = AppUtils.getFromLocalStorage("userData", {});
    return userData.sessionToken || "anonymous";
  },

  getExamStateKey(courseCode = this.currentCourse) {
    const normalizedCourse = this.normalizeCourseCode(courseCode || "default");
    return `examState:${this.getSessionToken()}:${normalizedCourse}`;
  },

  resolveCourseCode(rawCourse) {
    const normalized = this.normalizeCourseCode(rawCourse);
    if (CourseConfig.getCourseByCode(normalized)) {
      return normalized;
    }

    const selector = document.getElementById("courseSelector");
    const selected = selector ? this.normalizeCourseCode(selector.value) : "";
    if (CourseConfig.getCourseByCode(selected)) {
      return selected;
    }

    return CourseConfig.getDefaultCourseCode();
  },

  syncUserCourseMetadata(courseCode) {
    const userData = AppUtils.getFromLocalStorage("userData", {});
    const course = CourseConfig.getCourseByCode(courseCode);
    if (!course) {
      return;
    }

    userData.subject = course.courseCode;
    userData.courseCode = course.courseCode;
    userData.courseName = course.courseName;
    userData.courseTitle = course.title || CourseConfig.buildCourseLabel(course);
    userData.department = course.department || "";
    userData.duration = course.duration || 30;

    AppUtils.saveToLocalStorage("userData", userData);
  },

  async populateCourseSelector() {
    const selector = document.getElementById("courseSelector");
    if (!selector) {
      return;
    }

    await CourseConfig.populateSelect(selector, {
      selectedCode: this.currentCourse,
      placeholderText: "-- Select Course --",
      includePlaceholder: true,
    });

    selector.value = this.currentCourse;
  },

  async init() {
    const userData = AppUtils.getFromLocalStorage("userData");
    if (!userData) {
      AppUtils.redirect("login.html");
      return;
    }

    this.showLoadingMessage("Loading exam questions...");

    try {
      await CourseConfig.loadCatalog();

      if (CourseConfig.getCourses().length === 0) {
        throw new Error("No courses found in course catalog.");
      }

      const enrichedUserData = this.ensureSessionToken(userData);
      this.currentCourse = this.resolveCourseCode(
        enrichedUserData.subject || enrichedUserData.courseCode,
      );

      this.syncUserCourseMetadata(this.currentCourse);
      await this.populateCourseSelector();
      await this.loadExamData(this.currentCourse);
      this.restoreExamState();
      this.setupEventListeners();
      this.displayQuestionList();
      this.displayQuestion();
      this.updateProgress();
      this.updateTimerDisplay();
      this.startBackgroundAutosave();

      if (this.examStarted && this.timeRemaining > 0) {
        this.startTimerInterval();
      }
    } catch (err) {
      console.error("Failed to initialize exam:", err);
      this.showErrorMessage(
        "Unable to load exam data. Ensure your server is running and question files exist.",
      );
    } finally {
      this.hideLoadingMessage();
    }
  },

  async fetchCourseFile(fileName) {
    const urls = [
      new URL(`data/${fileName}`, window.location.href).href,
      `data/${fileName}`,
    ];

    let response = null;
    let lastError = null;

    for (let i = 0; i < urls.length; i++) {
      try {
        response = await fetch(urls[i]);
        if (response.ok) {
          break;
        }
        lastError = new Error(`HTTP ${response.status} while loading ${urls[i]}`);
      } catch (err) {
        lastError = err;
      }
      response = null;
    }

    if (!response) {
      throw new Error(
        `Unable to fetch question file. ${lastError ? lastError.message : ""}`,
      );
    }

    return response.json();
  },

  async loadExamData(courseCode) {
    const resolvedCourseCode = this.resolveCourseCode(courseCode);
    const course = CourseConfig.getCourseByCode(resolvedCourseCode);

    if (!course) {
      throw new Error(`Course not found: ${resolvedCourseCode}`);
    }

    const fileName = course.questionFile || `questions_${resolvedCourseCode}.json`;
    const payload = await this.fetchCourseFile(fileName);
    const exam = payload.exam || payload;

    const rawQuestions = Array.isArray(exam.questions)
      ? exam.questions
      : Array.isArray(payload.questions)
        ? payload.questions
        : Array.isArray(payload)
          ? payload
          : [];

    if (!rawQuestions.length) {
      throw new Error("No questions found for selected course.");
    }

    const normalizedQuestions = rawQuestions
      .map((question, index) => this.normalizeQuestion(question, index))
      .filter((question) => question !== null);

    if (!normalizedQuestions.length) {
      throw new Error("Question data is invalid.");
    }

    const systemRules = {
      randomizeQuestions: true,
      assignSessionTokenOnLogin: true,
      backgroundAutosave: true,
      ...(exam.systemRules || {}),
    };

    const shouldShuffle = systemRules.randomizeQuestions !== false;
    const shuffleSeed = `${this.getSessionToken()}-${resolvedCourseCode}`;

    this.questions = shouldShuffle
      ? this.shuffleQuestions(normalizedQuestions, shuffleSeed)
      : normalizedQuestions;

    const duration =
      Number.isFinite(Number(exam.duration)) && Number(exam.duration) > 0
        ? Number(exam.duration)
        : course.duration || 30;

    const totalQuestions = this.questions.length;

    this.examData = {
      ...exam,
      courseCode: resolvedCourseCode,
      courseName: exam.courseName || course.courseName,
      title: exam.title || course.title || CourseConfig.buildCourseLabel(course),
      department: exam.department || course.department || "",
      duration,
      totalQuestions,
      passingScore:
        Number.isFinite(Number(exam.passingScore)) && Number(exam.passingScore) > 0
          ? Number(exam.passingScore)
          : Math.ceil(totalQuestions * 0.4),
      systemRules,
    };

    this.totalDuration = duration * 60;
    this.timeRemaining = this.totalDuration;
    this.currentQuestionIndex = 0;
    this.answers = {};
    this.examStarted = false;
    this.examStartTime = null;

    const courseCodeDisplay = document.getElementById("courseCodeDisplay");
    if (courseCodeDisplay) {
      const displayCode = course.displayCode || CourseConfig.formatDisplayCode(course.courseCode);
      courseCodeDisplay.textContent = `${displayCode} - ${this.examData.courseName}`;
    }

    const totalQuestionsElement = document.getElementById("totalQuestionsNum");
    if (totalQuestionsElement) {
      totalQuestionsElement.textContent = totalQuestions;
    }
  },

  normalizeQuestion(rawQuestion, index) {
    const questionText = String(rawQuestion.question || "").trim();
    if (!questionText) {
      return null;
    }

    const optionsFromArray = Array.isArray(rawQuestion.options)
      ? rawQuestion.options
      : [];

    const optionsFromFields = [
      rawQuestion.optionA,
      rawQuestion.optionB,
      rawQuestion.optionC,
      rawQuestion.optionD,
    ];

    const optionSource = optionsFromArray.length > 0 ? optionsFromArray : optionsFromFields;

    const options = optionSource
      .map((option) => String(option || "").trim())
      .filter((option) => option.length > 0);

    if (options.length < 2) {
      return null;
    }

    const correctAnswer = this.normalizeCorrectAnswer(rawQuestion.correctAnswer, options);

    return {
      id: Number.isFinite(Number(rawQuestion.id)) ? Number(rawQuestion.id) : index + 1,
      question: questionText,
      options,
      correctAnswer,
      explanation: String(rawQuestion.explanation || "No explanation provided."),
      image: rawQuestion.image || null,
    };
  },

  normalizeCorrectAnswer(rawAnswer, options) {
    if (Number.isInteger(rawAnswer)) {
      return rawAnswer >= 0 && rawAnswer < options.length ? rawAnswer : 0;
    }

    if (typeof rawAnswer === "number" && Number.isFinite(rawAnswer)) {
      const parsed = Math.floor(rawAnswer);
      return parsed >= 0 && parsed < options.length ? parsed : 0;
    }

    const normalized = String(rawAnswer || "").trim();
    if (!normalized) {
      return 0;
    }

    const upper = normalized.toUpperCase();
    const letterMap = { A: 0, B: 1, C: 2, D: 3 };
    if (Object.prototype.hasOwnProperty.call(letterMap, upper)) {
      const mappedIndex = letterMap[upper];
      return mappedIndex < options.length ? mappedIndex : 0;
    }

    const textIndex = options.findIndex(
      (option) => option.toLowerCase() === normalized.toLowerCase(),
    );

    return textIndex >= 0 ? textIndex : 0;
  },

  hashString(input) {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash +=
        (hash << 1) +
        (hash << 4) +
        (hash << 7) +
        (hash << 8) +
        (hash << 24);
    }
    return hash >>> 0;
  },

  seededRandom(seedValue) {
    let seed = seedValue >>> 0;
    return function random() {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },

  shuffleQuestions(questions, seedSource) {
    const shuffled = questions.slice();
    const random = this.seededRandom(this.hashString(seedSource || "default-seed"));

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  },

  setupEventListeners() {
    if (this.eventsBound) {
      return;
    }

    document.getElementById("prevBtn").addEventListener("click", () => {
      this.previousQuestion();
    });

    document.getElementById("nextBtn").addEventListener("click", () => {
      this.nextQuestion();
    });

    document.getElementById("submitBtn").addEventListener("click", () => {
      this.showSubmitConfirmation();
    });

    document.getElementById("cancelBtn").addEventListener("click", () => {
      this.closeModal("confirmModal");
    });

    document.getElementById("confirmBtn").addEventListener("click", () => {
      this.submitExam();
    });

    const exitCancelBtn = document.getElementById("exitCancelBtn");
    const exitConfirmBtn = document.getElementById("exitConfirmBtn");
    const terminateBtn = document.getElementById("terminateBtn");

    if (exitCancelBtn) {
      exitCancelBtn.addEventListener("click", () => {
        this.closeModal("exitModal");
      });
    }

    if (exitConfirmBtn) {
      exitConfirmBtn.addEventListener("click", () => {
        this.confirmExit();
      });
    }

    if (terminateBtn) {
      terminateBtn.addEventListener("click", () => {
        this.showExitConfirmation();
      });
    }

    const courseSelector = document.getElementById("courseSelector");
    if (courseSelector) {
      courseSelector.addEventListener("change", (event) => {
        const selected = this.normalizeCourseCode(event.target.value);
        if (selected && selected !== this.currentCourse) {
          this.switchCourse(selected);
        }
      });
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.persistExamState();
      }
    });

    window.addEventListener("pagehide", () => {
      this.persistExamState();
    });

    this.eventsBound = true;
  },

  async switchCourse(newCourse) {
    const resolvedNewCourse = this.resolveCourseCode(newCourse);

    if (!resolvedNewCourse || resolvedNewCourse === this.currentCourse) {
      return;
    }

    if (this.isSwitching || this.modalOpen) {
      return;
    }

    if (!confirm("Switching courses will clear your current progress. Continue?")) {
      const selector = document.getElementById("courseSelector");
      if (selector) {
        selector.value = this.currentCourse;
      }
      return;
    }

    this.isSwitching = true;
    const selector = document.getElementById("courseSelector");

    if (selector) {
      selector.disabled = true;
    }

    this.stopTimer();
    this.stopBackgroundAutosave();
    this.clearSavedExamState(this.currentCourse);
    this.clearSavedExamState(resolvedNewCourse);
    this.clearLegacyExamData();

    this.currentCourse = resolvedNewCourse;
    this.currentQuestionIndex = 0;
    this.answers = {};
    this.examStartTime = null;
    this.examStarted = false;
    this.timeRemaining = 1800;

    this.syncUserCourseMetadata(resolvedNewCourse);
    this.showLoadingMessage("Switching course...");

    try {
      await this.init();
    } catch (err) {
      console.error("Error switching course:", err);
      AppUtils.showNotification("Error switching course. Please refresh.", "error");
    } finally {
      if (selector) {
        selector.disabled = false;
      }
      this.isSwitching = false;
    }
  },

  clampQuestionIndex(value) {
    if (!Number.isFinite(Number(value))) {
      return 0;
    }

    const numeric = Math.floor(Number(value));
    if (numeric < 0) {
      return 0;
    }

    if (numeric >= this.questions.length) {
      return this.questions.length - 1;
    }

    return numeric;
  },

  restoreExamState() {
    const savedState = AppUtils.getFromLocalStorage(this.getExamStateKey(), null);

    if (savedState && savedState.courseCode === this.currentCourse) {
      this.answers =
        savedState.answers && typeof savedState.answers === "object"
          ? savedState.answers
          : {};
      this.currentQuestionIndex = this.clampQuestionIndex(savedState.currentQuestionIndex);
      this.examStarted = Boolean(savedState.examStarted);

      const savedTimeRemaining = Number(savedState.timeRemaining);
      if (Number.isFinite(savedTimeRemaining)) {
        this.timeRemaining = Math.max(
          0,
          Math.min(this.totalDuration, savedTimeRemaining),
        );
      } else {
        this.timeRemaining = this.totalDuration;
      }

      this.examStartTime = savedState.examStartTime
        ? new Date(savedState.examStartTime)
        : null;

      return;
    }

    const legacyAnswers = AppUtils.getFromLocalStorage("examAnswers", {});
    const legacyExamData = AppUtils.getFromLocalStorage("examData", null);

    if (legacyExamData && legacyExamData.course === this.currentCourse) {
      this.answers = legacyAnswers && typeof legacyAnswers === "object" ? legacyAnswers : {};
      this.examStartTime = legacyExamData.startTime
        ? new Date(legacyExamData.startTime)
        : null;
      this.examStarted = Boolean(this.examStartTime);

      if (this.examStartTime) {
        const elapsed = Math.floor((Date.now() - this.examStartTime.getTime()) / 1000);
        this.timeRemaining = Math.max(this.totalDuration - elapsed, 0);
      }
    } else {
      this.answers = {};
      this.examStartTime = null;
      this.examStarted = false;
      this.timeRemaining = this.totalDuration;
    }

    this.currentQuestionIndex = 0;
  },

  persistExamState() {
    if (!this.currentCourse) {
      return;
    }

    const state = {
      courseCode: this.currentCourse,
      currentQuestionIndex: this.currentQuestionIndex,
      answers: this.answers,
      examStarted: this.examStarted,
      examStartTime: this.examStartTime ? this.examStartTime.toISOString() : null,
      timeRemaining: this.timeRemaining,
      lastSavedAt: new Date().toISOString(),
    };

    AppUtils.saveToLocalStorage(this.getExamStateKey(), state);
    if (Object.keys(this.answers).length > 0) {
      AppUtils.saveToLocalStorage("examAnswers", this.answers);
    } else {
      AppUtils.removeFromLocalStorage("examAnswers");
    }

    if (this.examStartTime) {
      AppUtils.saveToLocalStorage("examData", {
        startTime: this.examStartTime.toISOString(),
        course: this.currentCourse,
      });
    }
  },

  startBackgroundAutosave() {
    this.stopBackgroundAutosave();

    this.autosaveInterval = setInterval(() => {
      if (this.isSubmitting || this.isSwitching) {
        return;
      }
      this.persistExamState();
    }, 5000);
  },

  stopBackgroundAutosave() {
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
      this.autosaveInterval = null;
    }
  },

  clearSavedExamState(courseCode = this.currentCourse) {
    AppUtils.removeFromLocalStorage(this.getExamStateKey(courseCode));
  },

  clearLegacyExamData() {
    AppUtils.removeFromLocalStorage("examAnswers");
    AppUtils.removeFromLocalStorage("examData");
  },

  displayQuestion() {
    if (!this.questions.length) {
      return;
    }

    const question = this.questions[this.currentQuestionIndex];

    document.getElementById("questionNumber").textContent = `Question ${
      this.currentQuestionIndex + 1
    }`;
    document.getElementById("currentQuestionNum").textContent =
      this.currentQuestionIndex + 1;
    document.getElementById("questionContent").textContent = question.question;

    const imageContainer = document.getElementById("questionImageContainer");
    const imageElement = document.getElementById("questionImage");

    if (imageContainer && imageElement) {
      if (question.image) {
        imageElement.src = question.image;
        imageContainer.style.display = "block";
      } else {
        imageElement.removeAttribute("src");
        imageContainer.style.display = "none";
      }
    }

    this.displayOptions(question);
    this.updateNavigationButtons();

    const explanationBox = document.getElementById("explanationBox");
    if (explanationBox) {
      explanationBox.style.display = "none";
    }

    this.highlightCurrentQuestion();

    const examContent = document.querySelector(".exam-content");
    if (examContent) {
      examContent.scrollTop = 0;
    }
  },

  displayOptions(question) {
    const optionsContainer = document.getElementById("optionsContainer");
    optionsContainer.innerHTML = "";

    question.options.forEach((option, index) => {
      const optionDiv = document.createElement("div");
      optionDiv.className = "option";

      const isSelected = Number(this.answers[this.currentQuestionIndex]) === index;
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

      optionDiv.addEventListener("click", () => {
        this.selectAnswer(index);
      });

      optionsContainer.appendChild(optionDiv);
    });
  },

  selectAnswer(optionIndex) {
    if (!this.examStarted) {
      this.examStarted = true;
      if (!this.examStartTime) {
        this.examStartTime = new Date();
      }
      this.startTimerInterval();
      AppUtils.showNotification(
        `Exam timer started. ${Math.floor(this.totalDuration / 60)} minutes available.`,
        "info",
      );
    }

    this.answers[this.currentQuestionIndex] = optionIndex;
    this.persistExamState();

    document.querySelectorAll(".option").forEach((option) => {
      option.classList.remove("selected");
    });

    const selectedOption = document.querySelectorAll(".option")[optionIndex];
    if (selectedOption) {
      selectedOption.classList.add("selected");
    }

    const input = document.getElementById(`option${optionIndex}`);
    if (input) {
      input.checked = true;
    }

    this.updateProgress();
    this.highlightCurrentQuestion();
  },

  nextQuestion() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.displayQuestion();
      this.persistExamState();
    }
  },

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.displayQuestion();
      this.persistExamState();
    }
  },

  jumpToQuestion(questionIndex) {
    if (questionIndex >= 0 && questionIndex < this.questions.length) {
      this.currentQuestionIndex = questionIndex;
      this.displayQuestion();
      this.persistExamState();
    }
  },

  updateNavigationButtons() {
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    prevBtn.disabled = this.currentQuestionIndex === 0;
    nextBtn.disabled = this.currentQuestionIndex === this.questions.length - 1;
  },

  displayQuestionList() {
    const listContainer = document.getElementById("questionListContainer");
    listContainer.innerHTML = "";

    this.questions.forEach((_, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "question-item";
      button.textContent = `Q${index + 1}`;

      if (this.answers[index] !== undefined) {
        button.classList.add("answered");
      }

      if (index === this.currentQuestionIndex) {
        button.classList.add("active");
      }

      button.addEventListener("click", () => {
        this.jumpToQuestion(index);
      });

      listContainer.appendChild(button);
    });
  },

  highlightCurrentQuestion() {
    document.querySelectorAll(".question-item").forEach((item, index) => {
      item.classList.remove("active");

      if (index === this.currentQuestionIndex) {
        item.classList.add("active");
      }

      if (this.answers[index] !== undefined) {
        item.classList.add("answered");
      }
    });
  },

  updateProgress() {
    const answeredCount = Object.keys(this.answers).length;
    const unansweredCount = this.questions.length - answeredCount;

    document.getElementById("answeredCount").textContent = answeredCount;
    document.getElementById("unansweredCount").textContent = unansweredCount;
  },

  startTimerInterval() {
    this.stopTimer();
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      if (!this.examStarted) {
        return;
      }

      this.timeRemaining -= 1;
      this.updateTimerDisplay();

      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.updateTimerDisplay();
        this.stopTimer();
        this.persistExamState();
        AppUtils.showNotification("Time is up. Auto-submitting exam...", "warning");
        setTimeout(() => this.submitExam(), 1000);
        return;
      }

      if (this.timeRemaining === 300) {
        AppUtils.showNotification("5 minutes remaining.", "warning");
      }

      if (this.timeRemaining === 60) {
        AppUtils.showNotification("1 minute remaining.", "error");
      }

      if (this.timeRemaining % 5 === 0) {
        this.persistExamState();
      }
    }, 1000);
  },

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  updateTimerDisplay() {
    const timerText = AppUtils.formatTime(Math.max(0, this.timeRemaining));
    const timerElement = document.getElementById("timer");
    if (timerElement) {
      timerElement.textContent = timerText;
    }

    const timerDisplay = document.querySelector(".timer-display");
    if (!timerDisplay) {
      return;
    }

    if (this.timeRemaining <= 60) {
      timerDisplay.style.color = "#e74c3c";
    } else if (this.timeRemaining <= 300) {
      timerDisplay.style.color = "#f39c12";
    } else {
      timerDisplay.style.color = "white";
    }
  },

  showLoadingMessage(message) {
    let loader = document.getElementById("examLoader");

    if (!loader) {
      loader = document.createElement("div");
      loader.id = "examLoader";
      loader.className = "exam-loader";
      const container = document.querySelector(".exam-content") || document.body;
      container.prepend(loader);
    }

    loader.textContent = message || "Loading...";
    loader.style.display = "block";
  },

  hideLoadingMessage() {
    const loader = document.getElementById("examLoader");
    if (loader) {
      loader.style.display = "none";
    }
  },

  showErrorMessage(message) {
    const content = document.querySelector(".exam-content");
    if (content) {
      content.innerHTML = `
        <div class="exam-error">
          <h3>Unable to load exam</h3>
          <p>${message}</p>
          <p>Please contact your administrator or try again later.</p>
        </div>
      `;
    } else {
      alert(message);
    }
  },

  showSubmitConfirmation() {
    const answeredCount = Object.keys(this.answers).length;
    const unansweredCount = this.questions.length - answeredCount;

    let message = `You have answered ${answeredCount} out of ${this.questions.length} questions.`;

    if (unansweredCount > 0) {
      message += `\n\n${unansweredCount} question(s) remain unanswered.`;
      message += "\n\nAre you sure you want to submit?";
    } else {
      message += "\n\nAll questions answered. Ready to submit?";
    }

    document.getElementById("confirmMessage").textContent = message;
    this.openModal("confirmModal");
  },

  showExitConfirmation() {
    document.getElementById("exitMessage").textContent =
      "All your progress will be lost. Are you sure you want to exit?";
    this.openModal("exitModal");
  },

  confirmExit() {
    this.stopTimer();
    this.stopBackgroundAutosave();
    this.clearSavedExamState(this.currentCourse);
    this.clearLegacyExamData();
    AppUtils.removeFromLocalStorage("examResults");

    this.closeModal("exitModal");
    AppUtils.showNotification("Exiting exam...", "info", 800);

    setTimeout(() => {
      window.location.href = "index.html";
    }, 800);
  },

  terminateCourse() {
    this.showExitConfirmation();
  },

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

  submitExam() {
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.stopTimer();
    this.stopBackgroundAutosave();

    let correctCount = 0;
    const userAnswers = [];

    this.questions.forEach((question, index) => {
      const userAnswer = this.answers[index];
      const isCorrect = Number(userAnswer) === question.correctAnswer;

      if (isCorrect) {
        correctCount++;
      }

      userAnswers.push({
        questionIndex: index,
        question: question.question,
        userAnswerIndex: userAnswer,
        userAnswer:
          userAnswer !== undefined ? question.options[userAnswer] : "Not answered",
        correctAnswerIndex: question.correctAnswer,
        correctAnswer: question.options[question.correctAnswer],
        explanation: question.explanation || "No explanation provided.",
        isCorrect,
      });
    });

    const scoreData = AppUtils.calculateScore(correctCount, this.questions.length);
    const userData = AppUtils.getFromLocalStorage("userData", {});
    const examEndTime = new Date().toISOString();

    const startTime = this.examStartTime
      ? this.examStartTime.toISOString()
      : AppUtils.getFromLocalStorage("examData", {}).startTime || examEndTime;

    const results = {
      userData,
      examData: {
        courseCode: this.currentCourse,
        courseTitle: this.examData.title,
        courseName: this.examData.courseName,
        department: this.examData.department,
        duration: this.examData.duration,
        correctCount,
        totalQuestions: this.questions.length,
        score: scoreData.percentage,
        passed: scoreData.passed,
        status: scoreData.status,
        startTime,
        endTime: examEndTime,
        timeTaken: AppUtils.calculateDuration(startTime, examEndTime),
      },
      userAnswers,
      submitTime: examEndTime,
    };

    AppUtils.saveToLocalStorage("examResults", results);
    this.clearSavedExamState(this.currentCourse);
    this.clearLegacyExamData();

    this.closeModal("confirmModal");
    AppUtils.showNotification("Exam submitted successfully.", "success", 1200);

    setTimeout(() => {
      window.location.href = "results.html";
    }, 1200);
  },
};

document.addEventListener("DOMContentLoaded", async () => {
  await ExamController.init();
});

window.addEventListener("beforeunload", (event) => {
  if (ExamController.examStarted && ExamController.timerInterval) {
    ExamController.persistExamState();
    event.preventDefault();
    event.returnValue = "";
  }
});

window.addEventListener("unload", () => {
  ExamController.persistExamState();
  ExamController.stopTimer();
  ExamController.stopBackgroundAutosave();
});
