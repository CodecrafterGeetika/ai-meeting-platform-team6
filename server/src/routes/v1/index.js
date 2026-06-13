import express from 'express';
import authRoute from './auth.route.js';
import userRoute from './user.route.js';
import docsRoute from './docs.route.js';
import meetingRoute from './meeting.route.js';
import messageRoute from './message.route.js';
import aiRoute from './ai.route.js';
import profileRoute from './profile.route.js';
import config from '../../config/config.js';

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/meetings',
    route: meetingRoute,
  },
  {
    path: '/meetings',
    route: messageRoute,
  },
  {
    path: '/ai',
    route: aiRoute,
  },
  {
    path: '/profile',
    route: profileRoute,
  },
];

const devRoutes = [
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

export default router;