/**
 * College Exam Timetable - Student Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Guard route: Student role required
  const user = requireAuth('student');
  if (!user) return;

  // 2. Set student details in UI
  populateStudentHeader(user);

  // 3. Initialize components
  initProfileModal();
  initLogout();
  initPrintAndExport();

  // 4. Fetch student timetable
  loadStudentTimetable();
});

function populateStudentHeader(user) {
  const nameEl = document.getElementById('welcomeUserName');
  const yearEl = document.getElementById('studentYearDisplay');
  const sectionEl = document.getElementById('studentSectionDisplay');
  const emailEl = document.getElementById('studentEmailDisplay');

  if (nameEl) nameEl.textContent = user.name;
  if (yearEl) yearEl.textContent = user.year || 'N/A';
  if (sectionEl) sectionEl.textContent = user.section || 'N/A';
  if (emailEl) emailEl.textContent = user.email || '';
}

async function loadStudentTimetable() {
  const tableBody = document.getElementById('studentExamTableBody');
  const emptyState = document.getElementById('studentEmptyState');
  const loadingIndicator = document.getElementById('studentLoading');
  const tableContainer = document.getElementById('studentTableContainer');
  const countBadge = document.getElementById('studentExamsBadge');

  if (loadingIndicator) loadingIndicator.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';
  if (tableBody) tableBody.innerHTML = '';

  try {
    const token = getToken();
    const res = await fetch('/api/exams', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.status === 401) {
      logout();
      return;
    }

    if (res.status === 403) {
      showAlert('studentAlertContainer', 'Unauthorized access', 'danger');
      return;
    }

    const data = await res.json();
    const exams = data.exams || [];

    if (countBadge) {
      countBadge.textContent = `${exams.length} Exam${exams.length === 1 ? '' : 's'}`;
    }

    if (exams.length === 0) {
      if (tableContainer) tableContainer.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (tableContainer) tableContainer.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';

    exams.forEach((exam, index) => {
      const tr = document.createElement('tr');

      // Date formatting
      let formattedDate = exam.examDate;
      try {
        const d = new Date(exam.examDate);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      } catch {
        formattedDate = exam.examDate;
      }

      tr.innerHTML = `
        <td><span style="color: var(--text-muted); font-size: 0.85rem; margin-right: 0.5rem;">#${index + 1}</span> <strong>${escapeHtml(exam.subject)}</strong></td>
        <td><span class="badge badge-blue">${escapeHtml(exam.year)}</span></td>
        <td><span class="badge badge-purple">Section ${escapeHtml(exam.section)}</span></td>
        <td>${escapeHtml(formattedDate)}</td>
        <td><span class="badge badge-amber">${escapeHtml(exam.examTime)}</span></td>
      `;
      tableBody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error fetching timetable:', err);
    showAlert('studentAlertContainer', 'Failed to load timetable. Please refresh.', 'danger');
  } finally {
    if (loadingIndicator) loadingIndicator.style.display = 'none';
  }
}

// Print / Export Timetable
function initPrintAndExport() {
  const printBtn = document.getElementById('printTimetableBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

// Logout button
function initLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
}
