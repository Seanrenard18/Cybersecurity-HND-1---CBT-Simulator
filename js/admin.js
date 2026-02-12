/* ========================================
   ADMIN PANEL - API & AUTH
   ======================================== */

/**
 * SETUP INSTRUCTIONS:
 * 1. Replace ADMIN_TOKEN below with your actual Render admin token
 * 2. Keep the API_BASE unchanged (it's the backend Render URL)
 * 3. Make sure CORS is enabled on the backend
 * 4. Test with a simple API call in browser console
 */

const API_BASE = "https://operating-system-cys-312-cbt-backend.onrender.com";
const ADMIN_TOKEN = "REPLACE_WITH_RENDER_ADMIN_TOKEN"; // TODO: Replace with actual token

/**
 * Make authenticated API requests to backend
 * @param {string} endpoint - API endpoint with leading slash
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {*} body - Request body (optional)
 * @param {boolean} isFormData - Whether body is FormData (for file uploads)
 * @returns {Promise} Response JSON or error
 */
async function apiRequest(endpoint, method = "GET", body = null, isFormData = false) {
    const options = {
        method,
        headers: {
            "X-Admin-Token": ADMIN_TOKEN
        }
    };

    // Add Content-Type header only for JSON requests
    if (!isFormData) {
        options.headers["Content-Type"] = "application/json";
    }

    // Add body if provided
    if (body) {
        options.body = isFormData ? body : JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`API Error ${response.status}: ${text}`);
        }

        return response.json();
    } catch (error) {
        console.error(`API Request Failed: ${endpoint}`, error);
        throw error;
    }
}

/* ========================================
   TAB SWITCHING - ACADEMIC MANAGEMENT
   ======================================== */

/**
 * Switch between academic management tabs
 * @param {string} tabName - Name of tab to show (departments, levels, courses)
 */
function switchTab(tabName) {
    // Hide all sections
    document.getElementById("departmentsForm").classList.add("hidden");
    document.getElementById("levelsForm").classList.add("hidden");
    document.getElementById("coursesForm").classList.add("hidden");

    // Remove active class from all buttons
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    // Show selected section
    if (tabName === "departments") {
        document.getElementById("departmentsForm").classList.remove("hidden");
        document.querySelector("[data-tab='departments']").classList.add("active");
    } else if (tabName === "levels") {
        document.getElementById("levelsForm").classList.remove("hidden");
        document.querySelector("[data-tab='levels']").classList.add("active");
    } else if (tabName === "courses") {
        document.getElementById("coursesForm").classList.remove("hidden");
        document.querySelector("[data-tab='courses']").classList.add("active");
    }
}

/* ========================================
   UPLOAD QUESTIONS
   ======================================== */

document.addEventListener("DOMContentLoaded", function () {
    // Upload Questions Form
    const uploadForm = document.getElementById("uploadForm");
    if (uploadForm) {
        uploadForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const courseSelect = document.getElementById("courseSelect");
            const fileInput = document.getElementById("questionFile");
            const uploadBtn = uploadForm.querySelector("button");

            if (!courseSelect.value) {
                alert("Please select a course");
                return;
            }

            if (!fileInput.files.length) {
                alert("Please select a file");
                return;
            }

            const formData = new FormData();
            formData.append("course", courseSelect.value);
            formData.append("file", fileInput.files[0]);

            try {
                uploadBtn.disabled = true;
                uploadBtn.textContent = "Uploading...";

                const result = await apiRequest(
                    "/api/upload-questions",
                    "POST",
                    formData,
                    true
                );

                alert("Questions uploaded successfully!");
                uploadForm.reset();
            } catch (error) {
                alert("Error uploading questions: " + error.message);
            } finally {
                uploadBtn.disabled = false;
                uploadBtn.textContent = "Upload Questions";
            }
        });
    }

    // Departments Form
    const departmentsForm = document.getElementById("departmentsForm");
    if (departmentsForm) {
        const deptForm = departmentsForm.querySelector("form");
        if (deptForm) {
            deptForm.addEventListener("submit", async function (e) {
                e.preventDefault();

                const deptName = document.getElementById("deptName").value;
                const deptCode = document.getElementById("deptCode").value;
                const submitBtn = deptForm.querySelector("button");

                try {
                    submitBtn.disabled = true;
                    submitBtn.textContent = "Saving...";

                    const result = await apiRequest(
                        "/api/departments",
                        "POST",
                        {
                            name: deptName,
                            code: deptCode
                        }
                    );

                    alert("Department saved successfully!");
                    deptForm.reset();
                } catch (error) {
                    alert("Error saving department: " + error.message);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Save Department";
                }
            });
        }
    }

    // Levels Form
    const levelsForm = document.getElementById("levelsForm");
    if (levelsForm) {
        const lvlForm = levelsForm.querySelector("form");
        if (lvlForm) {
            lvlForm.addEventListener("submit", async function (e) {
                e.preventDefault();

                const levelName = document.getElementById("levelName").value;
                const levelCode = document.getElementById("levelCode").value;
                const submitBtn = lvlForm.querySelector("button");

                try {
                    submitBtn.disabled = true;
                    submitBtn.textContent = "Saving...";

                    const result = await apiRequest(
                        "/api/levels",
                        "POST",
                        {
                            name: levelName,
                            code: levelCode
                        }
                    );

                    alert("Level saved successfully!");
                    lvlForm.reset();
                } catch (error) {
                    alert("Error saving level: " + error.message);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Save Level";
                }
            });
        }
    }

    // Courses Form
    const coursesForm = document.getElementById("coursesForm");
    if (coursesForm) {
        const crsForm = coursesForm.querySelector("form");
        if (crsForm) {
            crsForm.addEventListener("submit", async function (e) {
                e.preventDefault();

                const courseName = document.getElementById("courseName").value;
                const courseCode = document.getElementById("courseCode").value;
                const courseDept = document.getElementById("courseDept").value;
                const submitBtn = crsForm.querySelector("button");

                try {
                    submitBtn.disabled = true;
                    submitBtn.textContent = "Saving...";

                    const result = await apiRequest(
                        "/api/courses",
                        "POST",
                        {
                            name: courseName,
                            code: courseCode,
                            department: courseDept
                        }
                    );

                    alert("Course saved successfully!");
                    crsForm.reset();
                } catch (error) {
                    alert("Error saving course: " + error.message);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Save Course";
                }
            });
        }
    }

    // Export Results Form
    const exportForm = document.getElementById("exportForm");
    if (exportForm) {
        exportForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const exportBtn = exportForm.querySelector("button");

            try {
                exportBtn.disabled = true;
                exportBtn.textContent = "Exporting...";

                const result = await apiRequest("/api/export-results", "GET");

                // Create download link
                const dataStr = JSON.stringify(result, null, 2);
                const dataBlob = new Blob([dataStr], { type: "application/json" });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `results_${new Date().getTime()}.json`;
                link.click();
                URL.revokeObjectURL(url);

                alert("Results exported successfully!");
            } catch (error) {
                alert("Error exporting results: " + error.message);
            } finally {
                exportBtn.disabled = false;
                exportBtn.textContent = "Export Results";
            }
        });
    }

    // Load and display live students
    loadLiveStudents();
});

/**
 * Load and display live students
 */
async function loadLiveStudents() {
    const studentsList = document.getElementById("studentsList");
    if (!studentsList) return;

    try {
        const students = await apiRequest("/api/live-students", "GET");

        if (students && students.length > 0) {
            studentsList.innerHTML = students
                .map(
                    student => `
                <div class="student-item">
                    <div class="student-info">
                        <p><strong>${student.name}</strong></p>
                        <p class="gray">${student.course} - ${student.status}</p>
                    </div>
                    <div class="student-time">${student.timeElapsed}s</div>
                </div>
            `
                )
                .join("");
        } else {
            studentsList.innerHTML = "<p class='gray'>No active students</p>";
        }
    } catch (error) {
        studentsList.innerHTML = `<p class='error'>Error loading students: ${error.message}</p>`;
    }
}

/**
 * Refresh live students periodically
 */
setInterval(loadLiveStudents, 5000); // Refresh every 5 seconds
