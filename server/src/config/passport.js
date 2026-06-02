import _import1 from 'passport-jwt';
const { Strategy: JwtStrategy, ExtractJwt } = _import1;
import config from './config.js';
import _import2 from './tokens.js';
const { tokenTypes } = _import2;
import _import3 from '../models/index.js';
const { User } = _import3;

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (payload, done) => {
  try {
    if (payload.type !== tokenTypes.ACCESS) {
      throw new Error('Invalid token type');
    }
    const user = await User.findById(payload.sub);
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

export default {
  jwtStrategy,
};
