import jwt from 'jsonwebtoken';
import {
  UserDetails
} from '../models';

const cookieParams = {
  httpOnly: true,
  signed: true,
  maxAge: 3000000,
};
const userCookieInfo = 'userCookieInfo';

class CheckSession {
  /**
   * @description helper function used to check if token user had admin priviledges
   *
   * @param {object} decodedToken - JSON descoded token
   *
   * @returns {promise} {resolve if admin | reject otherwise}
   */
  static checkAdmin(decodedToken) {
    return new Promise((resolve, reject) => {
      if (decodedToken) {
        UserDetails
          .findOne({
            where: {
              id: decodedToken.userId,
              isAdmin: true
            }
          })
          .then((loginDetails) => {
            if (!loginDetails) {
              reject('Not allowed');
            } else {
              resolve('Valid Token');
            }
          })
          .catch(() =>
            reject('Token Invalid'));
      } else {
        reject('Token Invalid');
      }
    });
  }
  static checkLogin(req, res, next) {
    const userInfo = req.signedCookies[userCookieInfo] ||
      req.headers['x-access-token'] || null;
    // allow token to be in header for now
    if (userInfo === null) {
      res.status(401).json({
        status: 'Unsuccessful',
        message: 'Unauthenticated',
        error: 'Token not found',
      });
    } else {
      // verify token in cookie is still valid
      jwt
        .verify(userInfo,
        req.app.get('JsonSecret'),
        (error, verifiedToken) => {
          if (error) {
            res.status(401).json({
              status: 'Unsuccessful',
              message: 'Unauthenticated',
              error: error.name,
              errortype: error.message,
            });
          } else if (verifiedToken.role) {
            req.decoded = verifiedToken;

            next();
          } else {
            res.status(401).json({
              status: 'Unsuccessful',
              message: 'Unathenticated',
              error: 'InvalidToken',
            });
          }
        });
    }
  }
  static setLogin(req, res, jwToken) {
    return res.cookie(userCookieInfo, jwToken, cookieParams);
  }
  static clearLogin(req, res) {
    res.clearCookie(userCookieInfo);
    res.status(200).json({
      status: 'Success',
      message: 'Logout Successful',
    });
  }
}
export default CheckSession;
