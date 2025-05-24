import * as yup from 'yup';

export const registerSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(20, 'Name must be at least 20 characters')
    .max(60, 'Name must not exceed 60 characters'),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(16, 'Password must not exceed 16 characters')
    .matches(
      /^(?=.*[A-Z])(?=.*[!@#$%^&*])/,
      'Password must contain at least one uppercase letter and one special character'
    ),
  address: yup
    .string()
    .required('Address is required')
    .max(400, 'Address must not exceed 400 characters'),
});

export const loginSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email'),
  password: yup.string().required('Password is required'),
});

// Add this schema to your existing validation.js file

export const updatePasswordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(16, 'Password must not exceed 16 characters')
    .matches(
      /^(?=.*[A-Z])(?=.*[!@#$%^&*])/,
      'Password must contain at least one uppercase letter and one special character'
    ),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});


export const createUserSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(20, 'Name must be at least 20 characters')
    .max(60, 'Name must not exceed 60 characters'),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(16, 'Password must not exceed 16 characters')
    .matches(
      /^(?=.*[A-Z])(?=.*[!@#$%^&*])/,
      'Password must contain at least one uppercase letter and one special character'
    ),
  address: yup
    .string()
    .required('Address is required')
    .max(400, 'Address must not exceed 400 characters'),
  role: yup
    .string()
    .required('Role is required')
    .oneOf(['system_admin', 'user', 'store_owner'], 'Invalid role'),
});

export const createStoreSchema = yup.object({
  name: yup
    .string()
    .required('Store name is required')
    .min(2, 'Store name must be at least 2 characters')
    .max(100, 'Store name must not exceed 100 characters'),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email'),
  address: yup
    .string()
    .required('Address is required')
    .max(400, 'Address must not exceed 400 characters'),
  ownerEmail: yup
    .string()
    .required('Owner email is required')
    .email('Please enter a valid owner email'),
});

export const ratingSchema = yup.object({
  rating: yup
    .number()
    .required('Rating is required')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must not exceed 5')
    .integer('Rating must be a whole number'),
});
