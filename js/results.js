/* ========================================
   CBT EXAM SIMULATOR - RESULTS PAGE JAVASCRIPT
   Display score summary and review
   ======================================== */

const ResultsController = {
  results: null,
  reviewExpanded: false,

  init() {
    this.loadResults();

    if (!this.results) {
      window.location.href = "exam.html";
      return;
    }

    this.displayStatusCard();
    this.displayScoreSection();
    this.displayPerformanceBreakdown();
    this.displayUserInfo();
    this.setupEventListeners();
  },

  loadResults() {
    this.results = AppUtils.getFromLocalStorage("examResults");

    if (!this.results) {
      console.error("No exam results found.");
      AppUtils.showNotification("No exam results found.", "error");
    }
  },

  displayStatusCard() {
    const card = document.getElementById("statusCard");
    const statusIcon = document.getElementById("statusIcon");
    const statusMessage = document.getElementById("statusMessage");
    const statusDescription = document.getElementById("statusDescription");

    const isPassed = Boolean(this.results.examData.passed);
    const score = this.results.examData.score;

    if (isPassed) {
      card.classList.remove("failed");
      statusIcon.textContent = "PASS";
      statusMessage.textContent = "Congratulations";
      statusDescription.textContent = `You passed with ${score}%.`;
    } else {
      card.classList.add("failed");
      statusIcon.textContent = "FAIL";
      statusMessage.textContent = "Exam Failed";
      statusDescription.textContent = `You scored ${score}%. Passing score is 40%.`;
    }
  },

  displayScoreSection() {
    const scorePercentage = Number(this.results.examData.score) || 0;
    const correctCount = Number(this.results.examData.correctCount) || 0;
    const totalQuestions = Number(this.results.examData.totalQuestions) || 0;
    const passingScoreCount = Math.ceil(totalQuestions * 0.4);

    document.getElementById("scorePercentage").textContent = scorePercentage;
    document.getElementById("scoreValue").textContent = `${correctCount}/${totalQuestions}`;
    document.getElementById("passingScoreValue").textContent = `${passingScoreCount}/${totalQuestions}`;
    document.getElementById("statusValue").textContent = this.results.examData.status;

    const scoreCircle = document.querySelector(".score-circle");
    const degree = (scorePercentage / 100) * 360;

    scoreCircle.style.background = `conic-gradient(
      ${this.getScoreColor(scorePercentage)} 0deg,
      ${this.getScoreColor(scorePercentage)} ${degree}deg,
      #ecf0f1 ${degree}deg
    )`;
  },

  getScoreColor(percentage) {
    if (percentage >= 80) return "#2ecc71";
    if (percentage >= 60) return "#27ae60";
    if (percentage >= 40) return "#f39c12";
    return "#e74c3c";
  },

  displayPerformanceBreakdown() {
    const totalQuestions = Number(this.results.examData.totalQuestions) || 0;
    const correctCount = Number(this.results.examData.correctCount) || 0;
    const incorrectCount = Math.max(totalQuestions - correctCount, 0);

    let unansweredCount = 0;
    this.results.userAnswers.forEach((answer) => {
      if (answer.userAnswerIndex === undefined) {
        unansweredCount++;
      }
    });

    document.getElementById("correctCount").textContent = correctCount;
    document.getElementById("incorrectCount").textContent = incorrectCount;
    document.getElementById("unansweredCount").textContent = unansweredCount;
  },

  displayUserInfo() {
    const userData = this.results.userData || {};
    const examData = this.results.examData || {};

    const courseLabel =
      examData.courseTitle ||
      userData.courseTitle ||
      userData.subject ||
      examData.courseCode ||
      "-";

    const examDuration = Number(examData.duration) || Number(userData.duration) || 30;

    document.getElementById("resultUserName").textContent = userData.fullName || "-";
    document.getElementById("resultRegNumber").textContent = userData.regNumber || "N/A";
    document.getElementById("resultSubject").textContent = courseLabel;
    document.getElementById("resultDuration").textContent = `${examDuration} minutes`;
    document.getElementById("submissionTime").textContent = examData.endTime
      ? AppUtils.formatDate(examData.endTime)
      : "-";
    document.getElementById("timeTaken").textContent = examData.timeTaken || "-";
  },

  setupEventListeners() {
    document.getElementById("reviewBtn").addEventListener("click", () => {
      this.toggleReview();
    });

    document.getElementById("downloadBtn").addEventListener("click", () => {
      this.downloadResults();
    });

    document.getElementById("newExamBtn").addEventListener("click", () => {
      this.startNewExam();
    });

    document.getElementById("logoutResultBtn").addEventListener("click", () => {
      this.logout();
    });
  },

  toggleReview() {
    const container = document.getElementById("answerReviewContainer");
    const button = document.getElementById("reviewBtn");

    if (!this.reviewExpanded) {
      this.displayAnswerReview();
      container.style.display = "block";
      button.textContent = "Hide All Answers";
      this.reviewExpanded = true;
    } else {
      container.style.display = "none";
      button.textContent = "Review All Answers";
      this.reviewExpanded = false;
    }
  },

  displayAnswerReview() {
    const reviewContent = document.getElementById("reviewContent");
    reviewContent.innerHTML = "";

    this.results.userAnswers.forEach((answer, index) => {
      const reviewItem = document.createElement("div");
      reviewItem.className = `review-item ${answer.isCorrect ? "correct" : "incorrect"}`;

      const statusText = answer.isCorrect ? "Correct" : "Incorrect";

      reviewItem.innerHTML = `
        <div class="review-question">
          <strong>Q${index + 1}.</strong> ${this.sanitizeText(answer.question || "")}
        </div>
        <div class="review-options">
          <p>
            <strong>Your Answer:</strong>
            ${
              answer.userAnswer !== "Not answered"
                ? this.sanitizeText(answer.userAnswer || "")
                : "<em>Not answered</em>"
            }
          </p>
          ${
            !answer.isCorrect
              ? `<p><strong>Correct Answer:</strong> ${this.sanitizeText(
                  answer.correctAnswer || "",
                )}</p>`
              : ""
          }
          <p><strong>Explanation:</strong> ${this.sanitizeText(
            answer.explanation || "No explanation provided.",
          )}</p>
        </div>
        <div class="review-status ${answer.isCorrect ? "correct" : "incorrect"}">
          ${statusText}
        </div>
      `;

      reviewContent.appendChild(reviewItem);
    });
  },

  downloadResults() {
    const userData = this.results.userData || {};
    const examData = this.results.examData || {};

    let printContent = `
      <html>
      <head>
        <title>Exam Results - ${this.sanitizeText(userData.fullName || "Candidate")}</title>
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
          <p>Submitted on: ${
            examData.endTime ? AppUtils.formatDate(examData.endTime) : "-"
          }</p>
        </div>

        <div class="section">
          <h3>Candidate Information</h3>
          <table>
            <tr><td><strong>Full Name:</strong></td><td>${this.sanitizeText(
              userData.fullName || "-",
            )}</td></tr>
            <tr><td><strong>Registration Number:</strong></td><td>${this.sanitizeText(
              userData.regNumber || "N/A",
            )}</td></tr>
            <tr><td><strong>Course:</strong></td><td>${this.sanitizeText(
              examData.courseTitle || userData.courseTitle || userData.subject || "-",
            )}</td></tr>
            <tr><td><strong>Email:</strong></td><td>${this.sanitizeText(
              userData.email || "-",
            )}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>Exam Performance</h3>
          <table>
            <tr><td><strong>Score:</strong></td><td><strong>${
              examData.correctCount
            }/${examData.totalQuestions}</strong></td></tr>
            <tr><td><strong>Percentage:</strong></td><td><strong>${
              examData.score
            }%</strong></td></tr>
            <tr><td><strong>Status:</strong></td><td class="${
              examData.passed ? "passed" : "failed"
            }"><strong>${this.sanitizeText(examData.status || "-")}</strong></td></tr>
            <tr><td><strong>Time Taken:</strong></td><td>${this.sanitizeText(
              examData.timeTaken || "-",
            )}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>Answer Summary</h3>
    `;

    (this.results.userAnswers || []).forEach((answer, index) => {
      const className = answer.isCorrect ? "correct" : "incorrect";
      printContent += `
        <div class="answer-item ${className}">
          <strong>Q${index + 1}.</strong> ${this.sanitizeText(answer.question || "")}<br>
          <strong>Your Answer:</strong> ${
            answer.userAnswer !== "Not answered"
              ? this.sanitizeText(answer.userAnswer || "")
              : "<em>Not answered</em>"
          }<br>
          ${
            !answer.isCorrect
              ? `<strong>Correct Answer:</strong> ${this.sanitizeText(
                  answer.correctAnswer || "",
                )}<br>`
              : ""
          }
          <strong>Explanation:</strong> ${this.sanitizeText(
            answer.explanation || "No explanation provided.",
          )}
        </div>
      `;
    });

    printContent += `
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "", "height=600,width=900");
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  },

  startNewExam() {
    if (
      confirm(
        "Are you sure you want to start a new exam? Current result will be cleared from this view.",
      )
    ) {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith("examState:")) {
          localStorage.removeItem(key);
        }
      }
      AppUtils.removeFromLocalStorage("examAnswers");
      AppUtils.removeFromLocalStorage("examData");
      AppUtils.removeFromLocalStorage("examResults");
      window.location.href = "instructions.html";
    }
  },

  logout() {
    if (confirm("Are you sure you want to logout?")) {
      AppUtils.logout();
    }
  },

  sanitizeText(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  },
};

document.addEventListener("DOMContentLoaded", () => {
  ResultsController.init();
});
