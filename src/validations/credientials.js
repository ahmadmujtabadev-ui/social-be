import Joi from 'joi';

export const schemas = {
  create: Joi.object({
    body: Joi.object({
      exchange: Joi.string().valid('binance', 'bybit', 'bingx').required(),
      apiKey: Joi.string().required(),
      apiSecret: Joi.string().required(),
      email: Joi.string().email().allow('', null),
      username: Joi.string().allow('', null),
      label: Joi.string().max(80).allow('', null),
    }),
  }),
  list: Joi.object({
    query: Joi.object({
      q: Joi.string().allow(''),
      exchange: Joi.string().valid('binance', 'bybit', 'bingx').allow(''),
      status: Joi.string().valid('active', 'revoked').allow(''),
      age: Joi.string().valid('any', 'gt30', 'gt90').default('any'),
      sortBy: Joi.string().valid('created', 'lastUsed').default('created'),
      sortDir: Joi.string().valid('asc', 'desc').default('desc'),
      page: Joi.number().min(1),
      limit: Joi.number().min(1).max(100),
    }),
  }),
  action: Joi.object({
    params: Joi.object({ id: Joi.string().required() }),
  }),
};
