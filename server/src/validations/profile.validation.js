import Joi from 'joi';

const createProfile = {
  body: Joi.object().keys({
    fullName: Joi.string().required(),
    bio: Joi.string().allow('', null),
    designation: Joi.string().allow('', null),
    company: Joi.string().allow('', null),
    location: Joi.string().allow('', null),
    skills: Joi.string().allow('', null), // skills can come as a comma-separated string
  }),
};

const updateProfile = {
  body: Joi.object().keys({
    fullName: Joi.string(),
    bio: Joi.string().allow('', null),
    designation: Joi.string().allow('', null),
    company: Joi.string().allow('', null),
    location: Joi.string().allow('', null),
    skills: Joi.string().allow('', null),
  }),
};

export default {
  createProfile,
  updateProfile,
};
