/**
 * Validate registration data
 */
const validateRegister = (data) => {
  const errors = {};

  if (!data.full_name || data.full_name.trim() === '') {
    errors.full_name = 'Full name is required';
  }

  if (!data.email || data.email.trim() === '') {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email format';
  }

  if (!data.password || data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (!data.phone || data.phone.trim() === '') {
    errors.phone = 'Phone number is required';
  }

  if (data.role && !['owner', 'finder', 'admin'].includes(data.role)) {
    errors.role = 'Role must be owner, finder, or admin';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate login data
 */
const validateLogin = (data) => {
  const errors = {};

  if (!data.email || data.email.trim() === '') {
    errors.email = 'Email is required';
  }

  if (!data.password || data.password.trim() === '') {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

module.exports = {
  validateRegister,
  validateLogin,
};
