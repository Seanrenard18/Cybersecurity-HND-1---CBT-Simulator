/* ========================================
   CBT EXAM SIMULATOR - COURSE CONFIG
   Shared course catalog loader and helpers
   ======================================== */

const CourseConfig = {
  courses: [],
  isLoaded: false,

  normalizeCourseCode(rawCourseCode) {
    if (!rawCourseCode) return "";
    return String(rawCourseCode).replace(/\s+/g, "").toUpperCase().trim();
  },

  formatDisplayCode(courseCode) {
    const normalized = this.normalizeCourseCode(courseCode);
    if (!normalized) return "";
    const match = normalized.match(/^([A-Z]+)(\d+)$/);
    return match ? `${match[1]} ${match[2]}` : normalized;
  },

  buildCourseLabel(course) {
    const displayCode =
      course.displayCode || this.formatDisplayCode(course.courseCode);
    const courseName = course.courseName || course.title || "";
    if (!courseName) {
      return displayCode || course.courseCode || "";
    }
    return `${displayCode} - ${courseName}`;
  },

  async loadCatalog() {
    if (this.isLoaded && this.courses.length > 0) {
      return this.courses;
    }

    const catalogUrls = [
      new URL("data/courses.json", window.location.href).href,
      "data/courses.json",
    ];

    let response = null;
    let lastError = null;

    for (let index = 0; index < catalogUrls.length; index++) {
      try {
        response = await fetch(catalogUrls[index]);
        if (response.ok) {
          break;
        }
        lastError = new Error(
          `HTTP ${response.status} while loading ${catalogUrls[index]}`,
        );
      } catch (err) {
        lastError = err;
      }
      response = null;
    }

    if (!response) {
      throw new Error(
        `Unable to load course catalog. ${
          lastError ? lastError.message : "Unknown error"
        }`,
      );
    }

    const payload = await response.json();
    const rawCourses = Array.isArray(payload && payload.courses)
      ? payload.courses
      : Array.isArray(payload)
        ? payload
        : [];

    this.courses = rawCourses
      .map((course) => {
        const courseCode = this.normalizeCourseCode(course.courseCode);
        return {
          ...course,
          courseCode,
          displayCode:
            course.displayCode || this.formatDisplayCode(course.courseCode),
          courseName: course.courseName || course.title || courseCode,
          title:
            course.title ||
            `${this.formatDisplayCode(courseCode)} - ${
              course.courseName || ""
            }`.trim(),
          duration:
            Number.isFinite(Number(course.duration)) &&
            Number(course.duration) > 0
              ? Number(course.duration)
              : 30,
          questionFile:
            course.questionFile || `questions_${courseCode}.json`,
        };
      })
      .filter((course) => !!course.courseCode);

    this.isLoaded = true;
    return this.courses;
  },

  getCourses() {
    return this.courses.slice();
  },

  getDefaultCourseCode() {
    return this.courses.length > 0 ? this.courses[0].courseCode : "";
  },

  getCourseByCode(rawCourseCode) {
    const normalized = this.normalizeCourseCode(rawCourseCode);
    if (!normalized) return null;
    return (
      this.courses.find((course) => course.courseCode === normalized) || null
    );
  },

  async populateSelect(selectElement, config = {}) {
    if (!selectElement) return;

    await this.loadCatalog();

    const includePlaceholder = config.includePlaceholder !== false;
    const placeholderText =
      config.placeholderText || "-- Choose a course --";
    const selectedCode = this.normalizeCourseCode(config.selectedCode || "");

    selectElement.innerHTML = "";

    if (includePlaceholder) {
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = placeholderText;
      selectElement.appendChild(placeholder);
    }

    this.courses.forEach((course) => {
      const option = document.createElement("option");
      option.value = course.courseCode;
      option.textContent = this.buildCourseLabel(course);
      if (course.courseCode === selectedCode) {
        option.selected = true;
      }
      selectElement.appendChild(option);
    });
  },
};
