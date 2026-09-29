/**
 * College Exam Timetable - Common Utilities & Helpers
 */

const TOKEN_KEY = 'exam_timetable_jwt';
const USER_KEY = 'exam_timetable_user';

// Token Management
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// User Profile Cache Management
function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

function removeUser() {
  localStorage.removeItem(USER_KEY);
}

// Logout functionality
function logout() {
  removeToken();
  removeUser();
  window.location.href = 'login.html';
}

// Global Alert Banner
function showAlert(containerId, message, type = 'danger') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const alertClass = type === 'success' ? 'alert-success' : type === 'info' ? 'alert-info' : 'alert-danger';
  container.innerHTML = `
    <div class="alert ${alertClass}">
      <span>${escapeHtml(message)}</span>
      <button type="button" class="modal-close-btn" style="font-size: 1.1rem; line-height: 1;" onclick="this.parentElement.remove()">&times;</button>
    </div>
  `;
}

function clearAlert(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
  }
}

// HTML escape helper
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Auth Guard for Protected Pages
function requireAuth(allowedRole) {
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    removeToken();
    removeUser();
    window.location.href = 'login.html';
    return null;
  }

  // Cross-role protection
  if (allowedRole && user.role !== allowedRole) {
    if (user.role === 'admin') {
      window.location.href = 'admin-dashboard.html';
    } else {
      window.location.href = 'student-dashboard.html';
    }
    return null;
  }

  return user;
}

// User Profile Modal Controller
async function initProfileModal() {
  const modalEl = document.getElementById('profileModal');
  if (!modalEl) return;

  const openBtn = document.getElementById('openProfileBtn');
  const closeBtn = document.getElementById('closeProfileBtn');
  const form = document.getElementById('profileUpdateForm');

  if (openBtn) {
    openBtn.addEventListener('click', openProfileModal);
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', closeProfileModal);
  }

  // Close on outside click
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) {
      closeProfileModal();
    }
  });

  if (form) {
    form.addEventListener('submit', handleProfileUpdate);
  }
}

async function openProfileModal() {
  const modalEl = document.getElementById('profileModal');
  if (!modalEl) return;

  clearAlert('profileAlertContainer');

  // Fetch latest data from /api/users/me
  try {
    const token = getToken();
    const res = await fetch('/api/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.status === 401) {
      logout();
      return;
    }

    const data = await res.json();
    if (res.ok && data.user) {
      const u = data.user;
      setUser(u);

      // Populate view elements
      const nameView = document.getElementById('profileViewName');
      const emailView = document.getElementById('profileViewEmail');
      const roleView = document.getElementById('profileViewRole');
      const studentClassView = document.getElementById('profileViewClass');
      const classRow = document.getElementById('profileClassRow');

      if (nameView) nameView.textContent = u.name;
      if (emailView) emailView.textContent = u.email;
      if (roleView) roleView.textContent = u.role.toUpperCase();

      if (u.role === 'student' && classRow && studentClassView) {
        classRow.style.display = 'flex';
        studentClassView.textContent = `${u.year || 'N/A'} - Section ${u.section || 'N/A'}`;
      } else if (classRow) {
        classRow.style.display = 'none';
      }

      // Populate edit input
      const editNameInput = document.getElementById('profileEditName');
      if (editNameInput) editNameInput.value = u.name;

      // Clear password fields
      const currPass = document.getElementById('profileCurrentPassword');
      const newPass = document.getElementById('profileNewPassword');
      const confPass = document.getElementById('profileConfirmNewPassword');
      if (currPass) currPass.value = '';
      if (newPass) newPass.value = '';
      if (confPass) confPass.value = '';
    }
  } catch (err) {
    console.error('Error fetching profile:', err);
  }

  modalEl.classList.add('active');
}

function closeProfileModal() {
  const modalEl = document.getElementById('profileModal');
  if (modalEl) {
    modalEl.classList.remove('active');
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  clearAlert('profileAlertContainer');

  const name = document.getElementById('profileEditName')?.value.trim();
  const currentPassword = document.getElementById('profileCurrentPassword')?.value;
  const newPassword = document.getElementById('profileNewPassword')?.value;
  const confirmNewPassword = document.getElementById('profileConfirmNewPassword')?.value;

  if (!name) {
    showAlert('profileAlertContainer', 'Name cannot be empty', 'danger');
    return;
  }

  const payload = { name };

  if (newPassword || currentPassword) {
    if (!currentPassword) {
      showAlert('profileAlertContainer', 'Please enter your current password to set a new password', 'danger');
      return;
    }
    if (newPassword.length < 6) {
      showAlert('profileAlertContainer', 'New password must be at least 6 characters long', 'danger');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showAlert('profileAlertContainer', 'New passwords do not match', 'danger');
      return;
    }
    payload.currentPassword = currentPassword;
    payload.newPassword = newPassword;
    payload.confirmNewPassword = confirmNewPassword;
  }

  const submitBtn = document.getElementById('saveProfileBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
  }

  try {
    const token = getToken();
    const res = await fetch('/api/users/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      showAlert('profileAlertContainer', data.error || 'Failed to update profile', 'danger');
      return;
    }

    // Update refreshed token and user cache
    if (data.token) {
      setToken(data.token);
    }
    if (data.user) {
      setUser(data.user);
      // Update welcome banner on dashboard if present
      const welcomeName = document.getElementById('welcomeUserName');
      if (welcomeName) welcomeName.textContent = data.user.name;

      const profileViewName = document.getElementById('profileViewName');
      if (profileViewName) profileViewName.textContent = data.user.name;
    }

    showAlert('profileAlertContainer', 'Profile updated successfully!', 'success');

    // Clear password inputs
    const currPass = document.getElementById('profileCurrentPassword');
    const newPass = document.getElementById('profileNewPassword');
    const confPass = document.getElementById('profileConfirmNewPassword');
    if (currPass) currPass.value = '';
    if (newPass) newPass.value = '';
    if (confPass) confPass.value = '';
  } catch (err) {
    showAlert('profileAlertContainer', 'Network error while updating profile', 'danger');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Changes';
    }
  }
}
