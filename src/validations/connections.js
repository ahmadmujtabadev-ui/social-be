import Joi from 'joi';

export const schemas = {
  create: Joi.object({
    body: Joi.object({
      credentialId: Joi.string().required(),
      label: Joi.string().max(80).allow('', null),
      scope: Joi.string().valid('read', 'trade').required(),
      account: Joi.string().allow('', null),
    }),
  }),
  list: Joi.object({
    query: Joi.object({
      q: Joi.string().allow(''),
      exchange: Joi.string().valid('binance', 'bybit', 'bingx').allow(''),
      status: Joi.string().valid('connected', 'verifying', 'failed', 'paused').allow(''),
      scope: Joi.string().valid('read', 'trade').allow(''),
      issuesOnly: Joi.boolean().default(false),
      page: Joi.number().min(1),
      limit: Joi.number().min(1).max(100),
    }),
  }),
  idParam: Joi.object({
    params: Joi.object({ id: Joi.string().required() }),
  }),
};
