/**
 * College Exam Timetable - Admin Dashboard Logic
 */

let allExams = [];
let examToDeleteId = null;

document.addEventListener('DOMContentLoaded', () => {
  // 1. Guard route: Admin role required
  const user = requireAuth('admin');
  if (!user) return;

  // 2. Set user details in UI
  const welcomeEl = document.getElementById('welcomeUserName');
  if (welcomeEl) {
    welcomeEl.textContent = user.name;
  }

  // 3. Initialize components
  initProfileModal();
  initAddExamForm();
  initDeleteModal();
  initLogout();
  initSearch();

  // 4. Fetch all exams
  loadAllExams();
});

// Load All Exams from /api/exams
async function loadAllExams() {
  const tableBody = document.getElementById('examTableBody');
  const emptyState = document.getElementById('emptyState');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const countBadge = document.getElementById('totalExamsBadge');

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
      showAlert('adminAlertContainer', 'Unauthorized access: Admin role required.', 'danger');
      return;
    }

    const data = await res.json();
    allExams = data.exams || [];

    if (countBadge) {
      countBadge.textContent = `${allExams.length} Total`;
    }

    renderExamTable(allExams);
  } catch (err) {
    console.error('Error fetching exams:', err);
    showAlert('adminAlertContainer', 'Failed to load timetable. Please refresh.', 'danger');
  } finally {
    if (loadingIndicator) loadingIndicator.style.display = 'none';
  }
}

// Render Table Rows
function renderExamTable(examsToRender) {
  const tableBody = document.getElementById('examTableBody');
  const emptyState = document.getElementById('emptyState');
  const tableContainer = document.getElementById('tableContainer');

  if (!tableBody) return;

  tableBody.innerHTML = '';

  if (!examsToRender || examsToRender.length === 0) {
    if (tableContainer) tableContainer.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (tableContainer) tableContainer.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';

  examsToRender.forEach(exam => {
    const tr = document.createElement('tr');
    tr.id = `exam-row-${exam._id}`;

    // Format display date
    let formattedDate = exam.examDate;
    try {
      const d = new Date(exam.examDate);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch {
      formattedDate = exam.examDate;
    }

    tr.innerHTML = `
      <td><strong>${escapeHtml(exam.subject)}</strong></td>
      <td><span class="badge badge-blue">${escapeHtml(exam.year)}</span></td>
      <td><span class="badge badge-purple">Section ${escapeHtml(exam.section)}</span></td>
      <td>${escapeHtml(formattedDate)}</td>
      <td>${escapeHtml(exam.examTime)}</td>
      <td>
        <button class="btn-delete-exam" onclick="confirmDeleteExam('${exam._id}', '${escapeHtml(exam.subject)}')">
          Delete
        </button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// Add Exam Form Handling
function initAddExamForm() {
  const form = document.getElementById('addExamForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert('addExamAlertContainer');

    const subject = document.getElementById('subject').value.trim();
    const year = document.getElementById('examYear').value;
    const section = document.getElementById('examSection').value;
    const examDate = document.getElementById('examDate').value;
    const examTime = document.getElementById('examTime').value.trim();

    if (!subject || !year || !section || !examDate || !examTime) {
      showAlert('addExamAlertContainer', 'Please fill in all exam fields', 'danger');
      return;
    }

    const submitBtn = document.getElementById('addExamBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding Exam...';

    try {
      const token = getToken();
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subject, year, section, examDate, examTime })
      });

      const data = await res.json();

      if (!res.ok) {
        showAlert('addExamAlertContainer', data.error || 'Failed to add exam', 'danger');
        return;
      }

      showAlert('addExamAlertContainer', 'Exam added successfully.', 'success');
      form.reset();

      // Reload exam table
      loadAllExams();
    } catch (err) {
      console.error('Add exam error:', err);
      showAlert('addExamAlertContainer', 'Server connection error', 'danger');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add Exam';
    }
  });
}

// Delete Confirmation Modal Handling (custom modal, no window.confirm)
function initDeleteModal() {
  const deleteModal = document.getElementById('deleteConfirmModal');
  const cancelBtn = document.getElementById('cancelDeleteBtn');
  const confirmBtn = document.getElementById('confirmDeleteBtn');

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      examToDeleteId = null;
      if (deleteModal) deleteModal.classList.remove('active');
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      if (!examToDeleteId) return;

      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Deleting...';

      try {
        const token = getToken();
        const res = await fetch(`/api/exams/${examToDeleteId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await res.json();

        if (!res.ok) {
          showAlert('adminAlertContainer', data.error || 'Failed to delete exam', 'danger');
        } else {
          showAlert('adminAlertContainer', 'Exam deleted successfully.', 'success');
          loadAllExams();
        }
      } catch (err) {
        console.error('Delete error:', err);
        showAlert('adminAlertContainer', 'Server error while deleting exam', 'danger');
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Delete Exam';
        examToDeleteId = null;
        if (deleteModal) deleteModal.classList.remove('active');
      }
    });
  }

  window.confirmDeleteExam = function(id, subjectName) {
    examToDeleteId = id;
    const label = document.getElementById('deleteExamSubjectLabel');
    if (label) {
      label.textContent = subjectName;
    }
    if (deleteModal) {
      deleteModal.classList.add('active');
    }
  };
}

// Quick Search on table
function initSearch() {
  const searchInput = document.getElementById('tableSearchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (!term) {
      renderExamTable(allExams);
      return;
    }

    const filtered = allExams.filter(exam =>
      exam.subject.toLowerCase().includes(term) ||
      exam.year.toLowerCase().includes(term) ||
      exam.section.toLowerCase().includes(term) ||
      exam.examDate.toLowerCase().includes(term)
    );
    renderExamTable(filtered);
  });
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
