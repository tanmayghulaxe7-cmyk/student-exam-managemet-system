/**
 * College Exam Timetable - Authentication Handlers (Login & Register)
 */

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect to respective dashboard
  const existingToken = getToken();
  const existingUser = getUser();
  if (existingToken && existingUser) {
    if (window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('register.html')) {
      if (existingUser.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
        return;
      } else if (existingUser.role === 'student') {
        window.location.href = 'student-dashboard.html';
        return;
      }
    }
  }

  initRoleToggles();
  initLoginForm();
  initRegisterForm();
  initTestAccounts();
});

// Role toggle switch in forms
function initRoleToggles() {
  const roleButtons = document.querySelectorAll('.role-toggle-btn');
  const roleInput = document.getElementById('roleInput');
  const studentFields = document.getElementById('studentFields');
  const studentYearSelect = document.getElementById('studentYear');
  const studentSectionSelect = document.getElementById('studentSection');

  roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      roleButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const selectedRole = btn.getAttribute('data-role');
      if (roleInput) {
        roleInput.value = selectedRole;
      }

      // Show/hide Year and Section depending on role in Register page
      if (studentFields) {
        if (selectedRole === 'student') {
          studentFields.style.display = 'block';
          if (studentYearSelect) studentYearSelect.required = true;
          if (studentSectionSelect) studentSectionSelect.required = true;
        } else {
          studentFields.style.display = 'none';
          if (studentYearSelect) studentYearSelect.required = false;
          if (studentSectionSelect) studentSectionSelect.required = false;
        }
      }
    });
  });

  // Check URL params (e.g. login.html?role=admin)
  const urlParams = new URLSearchParams(window.location.search);
  const paramRole = urlParams.get('role');
  if (paramRole && ['admin', 'student'].includes(paramRole)) {
    const targetBtn = document.querySelector(`.role-toggle-btn[data-role="${paramRole}"]`);
    if (targetBtn) {
      targetBtn.click();
    }
  }
}

// Login Form Submission
function initLoginForm() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert('authAlertContainer');

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const role = document.getElementById('roleInput').value;

    if (!email || !password || !role) {
      showAlert('authAlertContainer', 'Please fill in all fields and select your role', 'danger');
      return;
    }

    const submitBtn = document.getElementById('loginSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });

      const data = await response.json();

      if (!response.ok) {
        showAlert('authAlertContainer', data.error || 'Login failed. Please check your credentials.', 'danger');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
        return;
      }

      // Store JWT token and user info
      setToken(data.token);
      setUser(data.user);

      // Role-based redirect
      if (data.user.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
      } else {
        window.location.href = 'student-dashboard.html';
      }
    } catch (err) {
      console.error('Login error:', err);
      showAlert('authAlertContainer', 'Unable to connect to server. Please try again.', 'danger');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Login';
    }
  });
}

// Register Form Submission
function initRegisterForm() {
  const registerForm = document.getElementById('registerForm');
  if (!registerForm) return;

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert('authAlertContainer');

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('roleInput').value;

    if (!name || !email || !password || !confirmPassword || !role) {
      showAlert('authAlertContainer', 'Please fill in all required fields', 'danger');
      return;
    }

    if (password.length < 6) {
      showAlert('authAlertContainer', 'Password must be at least 6 characters long', 'danger');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('authAlertContainer', 'Password and Confirm Password do not match', 'danger');
      return;
    }

    const payload = {
      name,
      email,
      password,
      confirmPassword,
      role
    };

    if (role === 'student') {
      const year = document.getElementById('studentYear').value;
      const section = document.getElementById('studentSection').value;

      if (!year || !section) {
        showAlert('authAlertContainer', 'Please select both Year and Section for the student account', 'danger');
        return;
      }

      payload.year = year;
      payload.section = section;
    }

    const submitBtn = document.getElementById('registerSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        showAlert('authAlertContainer', data.error || 'Registration failed', 'danger');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
        return;
      }

      showAlert('authAlertContainer', 'Registration successful! Redirecting to login...', 'success');

      setTimeout(() => {
        window.location.href = `login.html?role=${role}`;
      }, 1200);
    } catch (err) {
      console.error('Registration error:', err);
      showAlert('authAlertContainer', 'Unable to connect to server. Please try again.', 'danger');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  });
}

// Quick Test Credential Filler Helper
function initTestAccounts() {
  window.fillLogin = function(email, password, role) {
    const emailInput = document.getElementById('email');
    const passInput = document.getElementById('password');
    if (emailInput && passInput) {
      emailInput.value = email;
      passInput.value = password;
      const roleBtn = document.querySelector(`.role-toggle-btn[data-role="${role}"]`);
      if (roleBtn) roleBtn.click();
    }
  };
}
