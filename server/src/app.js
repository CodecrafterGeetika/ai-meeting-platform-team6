import express from 'express';
import helmet from 'helmet';
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import cors from 'cors';
import passport from 'passport';
import httpStatus from 'http-status';
import config from './config/config.js';
import morgan from './config/morgan.js';
import _import1 from './config/passport.js';
const { jwtStrategy } = _import1;
import _import2 from './middlewares/rateLimiter.js';
const { authLimiter } = _import2;
import routes from './routes/v1/index.js';
import _import3 from './middlewares/error.js';
const { errorConverter, errorHandler } = _import3;
import ApiError from './utils/ApiError.js';

const app = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// enable cors
app.use(cors());
app.options('*', cors());

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/api/auth', authLimiter);
}

// ping endpoints for health checks / keep-alive
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});
app.get('/api/ping', (req, res) => {
  res.status(200).send('pong');
});

// api routes
app.use('/api', routes);

app.use('/api', (req, res, next) => {
  console.log('ROUTE HIT:', req.method, req.url);
  next();
}, routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
