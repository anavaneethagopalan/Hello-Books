import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  UserDetails,
  Memberships,
} from '../models';

// email validation here
const emailRegex = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;
const validateEmail = emailAddress =>
  emailRegex.test(emailAddress); // returns true or false

class userLoginDetails {
  // validates signup info
  static validateSignup(username,
    password,
    lastname,
    firstname,
    email,
  ) {
    if (username === null) {
      return 'Username Invalid';
    } else if (password === null) {
      return 'Password Invalid';
    } else if (email === null) {
      return 'Email Address Invalid';
    } else if (firstname === null) {
      return 'First Name Invalid';
    } else if (lastname === null) {
      return 'Last Name Invalid';
    } else if (!validateEmail(email)) {
      return 'Email Address is invalid';
    } else if (username.length < 2) {
      return 'Username too short';
    } else if (password.length < 6) {
      return 'Password too short';
    } else if (lastname.length < 2) {
      return 'Last Name too short';
    } else if (firstname.length < 2) {
      return 'First Name too short';
    }
    return 0;
  }
  static validateActivationToken(verifiedToken, userName) {
    return new Promise((resolve, reject) => {
      if (verifiedToken.username !== userName) { // if username is invalid
        reject('Invalid Token');
      } else {
        resolve(verifiedToken.userId); // return the user ID from the token
      }
    });
  }
  // for sign up
  static signup(req, res) {
    // declare variables
    const password = req.body.password || null;
    const lastName = req.body.lastname || null;
    const firstName = req.body.firstname || null;
    const email = req.body.email || null;
    const phone = req.body.phone || null;
    const userName = req.body.username || null;

    const errOrValid = userLoginDetails.validateSignup(userName,
      password, lastName, firstName, email,
    );
    if (errOrValid !== 0) { // if unvalidated information
      res.status(400).json({
        status: 'unsuccessful',
        error: errOrValid,
      });
    } else {
      bcrypt
        .hash(password, 8)
        .then((hash) => {
          // using hashed password (hash)
          if (!hash) {
            res.status(400).json({
              status: 'unsuccessful',
            });
          } else {
            UserDetails
              .create({
                firstname: firstName,
                lastname: lastName,
                emailaddress: email.toLowerCase(),
                phonenumber: phone,
                username: userName.toLowerCase(),
                password: hash,
              })
              .then(userSignup =>
                Memberships
                .findById(1)
                .then(setMembershipDetails =>
                  userSignup.setMembership(setMembershipDetails),
                )
                .then((signupData) => {
                  // Add user info to token
                  const tokenInfo = {
                    username: signupData.dataValues.username,
                    userId: signupData.dataValues.id,
                    email: signupData.dataValues.emailaddress,
                  };
                  jwt.sign(tokenInfo,
                    req.app.get('JsonSecret'), {
                      expiresIn: '24h', // 24 hours
                    }, (error, signupToken) => {
                      if (error) {
                        res.status(400).send(error);
                      } else if (signupToken) {
                        // for verification things
                        res.status(202).json({
                          status: 'success',
                          message: 'User account created',
                          token: signupToken, // would be part of mail
                        });
                      }
                    });
                })
                .catch(error => res.status(400).send(error)),
              )
              .catch(error => res.status(400).json({
                status: 'unsuccessful',
                message: error.errors[0].message,
              }));
          }
        }).catch(error => res.status(400).send(error));
    }
  }
  static activateUser(req, res) {
    const activationToken = req.query.key || null;
    const userName = req.query.id || null;

    if (activationToken !== null &&
      userName !== null
    ) {
      jwt
        .verify(activationToken,
          req.app.get('JsonSecret'),
          (error, verifiedToken) => {
            if (error) {
              res.status(403).send(error);
            } else if (verifiedToken) {
              userLoginDetails.validateActivationToken(verifiedToken, userName)
                .then(userID =>
                  UserDetails.findOne({
                    where: {
                      id: userID,
                      isActive: true,
                    },
                  }),
                )
                .then((actUserDetails) => {
                  if (actUserDetails === null) {
                    res.status(403).json({
                      status: 'unsuccessful',
                      message: 'User not found',
                    });
                  } else { // if user has not been activated
                    actUserDetails
                      .update({
                        isActivated: true,
                      })
                      .then(() => {
                        const tokenInfo = {
                          username: actUserDetails.dataValues.username,
                          userId: actUserDetails.dataValues.id,
                          firstName: actUserDetails.dataValues.firstname,
                          lastName: actUserDetails.dataValues.lastname,
                          email: actUserDetails.dataValues.emailaddress,
                          userRole: 'user',
                        };
                        jwt.sign(tokenInfo,
                          req.app.get('JsonSecret'), {
                            expiresIn: '12h', // 24 hours
                          },
                          (tokenError, signIntoken) => {
                            if (tokenError) {
                              res.status(400).send(tokenError);
                            } else if (signIntoken) {
                              // for signin after activation
                              res.status(202).json({
                                status: 'success',
                                message:
                                  (actUserDetails.dataValues.isActivated === true) ? 'User already activated' : 'User Activated',
                                token: signIntoken,
                              });
                            } else {
                              res.status(405).json({
                                message: 'some error',
                              });
                            }
                          });
                      }).catch(tokenError => res.status(400).send(tokenError));
                  }
                })
                .catch(errr => res.status(403).send(errr));
            }
          });
    } else {
      res.status(400).json({
        status: 'unsuccessful',
        message: 'Link Inavlid',
      });
    }
  }
  static signin(req, res) {

  }
}
export default userLoginDetails;