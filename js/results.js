/* ========================================
   CBT EXAM SIMULATOR - RESULTS PAGE JAVASCRIPT
   Display Results & Answer Review
   ======================================== */

/**
 * Results Controller Object
 */
const ResultsController = {
  results: null,
  reviewExpanded: false,

  /**
   * Initialize results page
   */
  init() {
    console.log("Initializing results page...");

    // Load results
    this.loadResults();

    if (!this.results) {
      window.location.href = "exam.html";
      return;
    }

    // Display results
    this.displayStatusCard();
    this.displayScoreSection();
    this.displayPerformanceBreakdown();
    this.displayUserInfo();
    this.setupEventListeners();

    console.log("Results page initialized successfully");
  },

  /**
   * Load exam results from localStorage
   */
  loadResults() {
    this.results = AppUtils.getFromLocalStorage("examResults");

    if (!this.results) {
      console.error("No exam results found");
      AppUtils.showNotification("No exam results found", "error");
    }
  },

  /**
   * Display status card (pass/fail)
   */
  displayStatusCard() {
    const card = document.getElementById("statusCard");
    const statusIcon = document.getElementById("statusIcon");
    const statusMessage = document.getElementById("statusMessage");
    const statusDescription = document.getElementById("statusDescription");

    const isPassed = this.results.examData.passed;
    const score = this.results.examData.score;

    if (isPassed) {
      card.classList.remove("failed");
      statusIcon.textContent = "✅";
      statusMessage.textContent = "Congratulations!";
      statusDescription.textContent = `You have passed the examination with ${score}%`;
    } else {
      card.classList.add("failed");
      statusIcon.textContent = "❌";
      statusMessage.textContent = "Exam Failed";
      statusDescription.textContent = `Your score is ${score}%. Passing score is 40%.`;
    }
  },

  /**
   * Display score section
   */
  displayScoreSection() {
    const scorePercentage = this.results.examData.score;
    const correctCount = this.results.examData.correctCount;
    const totalQuestions = this.results.examData.totalQuestions;
    const passingScore = Math.round((40 / 100) * totalQuestions);

    // Update score display
    document.getElementById("scorePercentage").textContent = scorePercentage;
    document.getElementById(
      "scoreValue"
    ).textContent = `${correctCount}/${totalQuestions}`;
    document.getElementById(
      "passingScoreValue"
    ).textContent = `${passingScore}/${totalQuestions}`;
    document.getElementById("statusValue").textContent =
      this.results.examData.status;

    // Update score circle gradient based on percentage
    const scoreCircle = document.querySelector(".score-circle");
    const degree = (scorePercentage / 100) * 360;
    scoreCircle.style.background = `conic-gradient(
            ${this.getScoreColor(scorePercentage)} 0deg,
            ${this.getScoreColor(scorePercentage)} ${degree}deg,
            #ecf0f1 ${degree}deg
        )`;
  },

  /**
   * Get color based on score
   */
  getScoreColor(percentage) {
    if (percentage >= 80) return "#2ecc71"; // Green - Excellent
    if (percentage >= 60) return "#27ae60"; // Dark Green - Good
    if (percentage >= 40) return "#f39c12"; // Orange - Pass
    return "#e74c3c"; // Red - Fail
  },

  /**
   * Display performance breakdown
   */
  displayPerformanceBreakdown() {
    const totalQuestions = this.results.examData.totalQuestions;
    const correctCount = this.results.examData.correctCount;
    const incorrectCount = totalQuestions - correctCount;

    // Count unanswered
    let unansweredCount = 0;
    this.results.userAnswers.forEach((answer) => {
      if (answer.userAnswerIndex === undefined) {
        unansweredCount++;
      }
    });

    // Update display
    document.getElementById("correctCount").textContent = correctCount;
    document.getElementById("incorrectCount").textContent = incorrectCount;
    document.getElementById("unansweredCount").textContent = unansweredCount;
  },

  /**
   * Display user and exam information
   */
  displayUserInfo() {
    const userData = this.results.userData;
    const examData = this.results.examData;

    document.getElementById("resultUserName").textContent = userData.fullName;
    document.getElementById("resultRegNumber").textContent = userData.regNumber;
    document.getElementById("resultSubject").textContent = userData.subject;
    document.getElementById("resultDuration").textContent = "60 minutes";
    document.getElementById("submissionTime").textContent = AppUtils.formatDate(
      examData.endTime
    );
    document.getElementById("timeTaken").textContent = examData.timeTaken;
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    document
      .getElementById("reviewBtn")
      .addEventListener("click", () => this.toggleReview());
    document
      .getElementById("downloadBtn")
      .addEventListener("click", () => this.downloadResults());
    document
      .getElementById("newExamBtn")
      .addEventListener("click", () => this.startNewExam());
    document
      .getElementById("logoutResultBtn")
      .addEventListener("click", () => this.logout());
  },

  /**
   * Toggle answer review section
   */
  toggleReview() {
    const container = document.getElementById("answerReviewContainer");
    const btn = document.getElementById("reviewBtn");

    if (!this.reviewExpanded) {
      this.displayAnswerReview();
      container.style.display = "block";
      btn.textContent = "✕ Hide All Answers";
      this.reviewExpanded = true;
    } else {
      container.style.display = "none";
      btn.textContent = "✓ Review All Answers";
      this.reviewExpanded = false;
    }
  },

  /**
   * Display detailed answer review
   */
  displayAnswerReview() {
    const reviewContent = document.getElementById("reviewContent");
    reviewContent.innerHTML = "";

    this.results.userAnswers.forEach((answer, index) => {
      const reviewItem = document.createElement("div");
      reviewItem.className = `review-item ${
        answer.isCorrect ? "correct" : "incorrect"
      }`;

      const statusIcon = answer.isCorrect ? "✓" : "✗";
      const statusText = answer.isCorrect ? "Correct" : "Incorrect";

      reviewItem.innerHTML = `
                <div class="review-question">
                    <strong>Q${index + 1}.</strong> ${this.sanitizeText(
        answer.question
      )}
                </div>
                <div class="review-options">
                    <p>
                        <strong>Your Answer:</strong> 
                        ${
                          answer.userAnswer !== "Not answered"
                            ? this.sanitizeText(answer.userAnswer)
                            : "<em>Not answered</em>"
                        }
                    </p>
                    ${
                      !answer.isCorrect
                        ? `
                        <p>
                            <strong>Correct Answer:</strong> 
                            ${this.sanitizeText(answer.correctAnswer)}
                        </p>
                    `
                        : ""
                    }
                    <p><strong>Explanation:</strong> ${this.sanitizeText(
                      answer.explanation
                    )}</p>
                </div>
                <div class="review-status ${
                  answer.isCorrect ? "correct" : "incorrect"
                }">
                    <span>${statusIcon}</span> ${statusText}
                </div>
            `;

      reviewContent.appendChild(reviewItem);
    });
  },

  /**
   * Download results as PDF/Print
   */
  downloadResults() {
    const userData = this.results.userData;
    const examData = this.results.examData;

    // Prepare print content
    let printContent = `
            <html>
            <head>
                <title>Exam Results - ${userData.fullName}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; border-bottom: 2px solid #2ecc71; margin-bottom: 20px; }
                    .section { margin: 20px 0; page-break-inside: avoid; }
                    .section h3 { color: #2ecc71; border-bottom: 1px solid #ecf0f1; padding-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ecf0f1; }
                    th { background-color: #f8f9fa; font-weight: bold; }
                    .passed { color: #2ecc71; }
                    .failed { color: #e74c3c; }
                    .answer-item { margin: 15px 0; padding: 10px; border-left: 4px solid #ecf0f1; }
                    .correct { border-left-color: #2ecc71; background-color: #f0fdf4; }
                    .incorrect { border-left-color: #e74c3c; background-color: #fef2f2; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>CBT Exam Results</h1>
                    <p>Submitted on: ${AppUtils.formatDate(
                      examData.endTime
                    )}</p>
                </div>
                
                <div class="section">
                    <h3>Candidate Information</h3>
                    <table>
                        <tr>
                            <td><strong>Full Name:</strong></td>
                            <td>${userData.fullName}</td>
                        </tr>
                        <tr>
                            <td><strong>Registration Number:</strong></td>
                            <td>${userData.regNumber}</td>
                        </tr>
                        <tr>
                            <td><strong>Subject:</strong></td>
                            <td>${userData.subject}</td>
                        </tr>
                        <tr>
                            <td><strong>Email:</strong></td>
                            <td>${userData.email}</td>
                        </tr>
                    </table>
                </div>
                
                <div class="section">
                    <h3>Exam Performance</h3>
                    <table>
                        <tr>
                            <td><strong>Score:</strong></td>
                            <td><strong>${examData.correctCount}/${
      examData.totalQuestions
    }</strong></td>
                        </tr>
                        <tr>
                            <td><strong>Percentage:</strong></td>
                            <td><strong>${examData.score}%</strong></td>
                        </tr>
                        <tr>
                            <td><strong>Status:</strong></td>
                            <td class="${
                              examData.passed ? "passed" : "failed"
                            }">
                                <strong>${examData.status}</strong>
                            </td>
                        </tr>
                        <tr>
                            <td><strong>Time Taken:</strong></td>
                            <td>${examData.timeTaken}</td>
                        </tr>
                    </table>
                </div>
                
                <div class="section">
                    <h3>Answer Summary</h3>
        `;

    // Add detailed answers
    this.results.userAnswers.forEach((answer, index) => {
      const className = answer.isCorrect ? "correct" : "incorrect";
      printContent += `
                <div class="answer-item ${className}">
                    <strong>Q${index + 1}.</strong> ${answer.question}<br>
                    <strong>Your Answer:</strong> ${
                      answer.userAnswer !== "Not answered"
                        ? answer.userAnswer
                        : "<em>Not answered</em>"
                    }<br>
                    ${
                      !answer.isCorrect
                        ? `<strong>Correct Answer:</strong> ${answer.correctAnswer}<br>`
                        : ""
                    }
                    <strong>Explanation:</strong> ${answer.explanation}
                </div>
            `;
    });

    printContent += `
                </div>
            </body>
            </html>
        `;

    // Open print dialog
    const printWindow = window.open("", "", "height=600,width=800");
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  },

  /**
   * Start new exam
   */
  startNewExam() {
    if (
      confirm(
        "Are you sure you want to start a new exam? Your current results will remain saved."
      )
    ) {
      AppUtils.removeFromLocalStorage("examAnswers");
      AppUtils.removeFromLocalStorage("examData");
      AppUtils.removeFromLocalStorage("examResults");
      window.location.href = "instructions.html";
    }
  },

  /**
   * Logout user
   */
  logout() {
    if (confirm("Are you sure you want to logout?")) {
      AppUtils.logout();
    }
  },

  /**
   * Sanitize text to prevent XSS
   */
  sanitizeText(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  },
};

/**
 * Initialize results page when DOM is ready
 */
document.addEventListener("DOMContentLoaded", function () {
  ResultsController.init();
});
