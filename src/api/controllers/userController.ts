/* eslint-disable prettier/prettier */
import {userModel} from '../models/userModel';
import CustomError from '../../classes/CustomError';
import {validationResult} from 'express-validator';
import bcrypt from 'bcryptjs';
import {User, UserOutput} from '../../types/DBTypes';
import {Request, Response, NextFunction} from 'express';

// TODO: create the following functions:
// - userGet - get user by id
// - userListGet - get all users
// - userPost - create new user. Remember to hash password
// - userPutCurrent - update current user
// - userDeleteCurrent - delete current user
// - checkToken - check if current user token is valid: return data from res.locals.user as UserOutput. No need for database query
const salt = bcrypt.genSaltSync(12);

const userGet = async (
  req: Request<{id: string}, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages: string = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      console.log('userGet validation', messages);
      next(new CustomError(messages, 400));
      return;
    }

    const user = await userModel.findById(req.params.id);
    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }
    const userOutput: UserOutput = {
      user_name: user.user_name,
      email: user.email,
      _id: user._id,
    };
    res.json(userOutput);

  } catch (error) {
    next(new CustomError('Error getting user', 500));
  }
};

const userListGet = async (
    req: Request,
    res: Response<UserOutput[]>,
    next: NextFunction
  ) => {
    try {
      const users = await userModel.find()
      .select('-password -role');
      res.json(users);
    } catch (error) {
      next(error);
    }
  };

const userPost = async (
  req: Request<{}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages: string = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      console.log('userPost validation', messages);
      next(new CustomError(messages, 400));
      return;
    }

    const user = new userModel(req.body);
    user.password = bcrypt.hashSync(user.password, salt);
    await user.save();

    // Create a new object with the user data, excluding the password and role properties
    const userData = {
      _id: user._id,
      username: user.user_name,
      email: user.email,
      // Include any other properties you want to return in the response
    };

    res.json({data: userData, message: 'User created successfully'});
  } catch (error) {
    next(new CustomError('Error creating user', 500));
  }
};

const userPutCurrent = async (
    req: Request<{}, {}, User>,
    res: Response,
    next: NextFunction
) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const messages: string = errors
                .array()
                .map((error) => `${error.msg}: ${error.param}`)
                .join(', ');
            console.log('userPutCurrent validation', messages);
            next(new CustomError(messages, 400));
            return;
        }

        const user = await userModel.findById(res.locals.user._id);
        if (!user) {
            next(new CustomError('User not found', 404));
            return;
        }
        user.set(req.body);
        await user.save();

        // Create a new object with the user data, excluding the password and role properties
        const userData = {
            _id: user._id,
            user_name: user.user_name,
            email: user.email,
            // Include any other properties you want to return in the response
        };

        res.json({ data: userData, message: 'User updated successfully' });
    } catch (error) {
        next(new CustomError('Error updating user', 500));
    }
};

const userDeleteCurrent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
    try {
        const user = await userModel.findById(res.locals.user._id);
        if (!user) {
            res.status(404);
            console.log('User not found');
            return;
        }

        const userOutput: UserOutput = {
            _id: user._id,
            user_name: user.user_name,
            email: user.email,
        };

        await userModel.findByIdAndDelete(res.locals.user._id);

        res.json({message: 'User deleted!', data: userOutput});
    } catch (error) {
        next(error);
    }
};

const checkToken = (
    req: Request,
    res: Response<UserOutput>) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.status(401);
        console.log('No token found');
        return;
    }

    const userOutput: UserOutput = {
        _id: res.locals.user._id,
        user_name: res.locals.user.user_name,
        email: res.locals.user.email,
    };

    res.json(userOutput);
};

export {
  userGet,
  userListGet,
  userPost,
  userPutCurrent,
  userDeleteCurrent,
  checkToken,
};
