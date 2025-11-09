// src/validations/user.js
import Joi from 'joi';

export const schemas = {
  register: Joi.object({
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      businessName: Joi.string().allow('', null),
      country: Joi.string().allow('', null),
      phone: Joi.string().allow('', null),
      role: Joi.string().valid('admin', 'user').default('user'),
    }),
  }),
  login: Joi.object({
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    }),
  }),
  refresh: Joi.object({
    body: Joi.object({
      refreshToken: Joi.string().required(),
    }),
  }),
  forgotPassword: Joi.object({
    body: Joi.object({
      email: Joi.string().email().required(),
    }),
  }),
  resetPassword: Joi.object({
    body: Joi.object({
      token: Joi.string().required(),
      newPassword: Joi.string().min(8).required(),
    }),
  }),
  changePassword: Joi.object({
    body: Joi.object({
      oldPassword: Joi.string().required(),
      newPassword: Joi.string().min(8).required(),
    }),
  }),
};
