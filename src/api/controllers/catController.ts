// TODO: create following functions:
// - catGetByUser - get all cats by current user id
// - catGetByBoundingBox - get all cats by bounding box coordinates (getJSON)
// - catPutAdmin - only admin can change cat owner
// - catDeleteAdmin - only admin can delete cat
// - catDelete - only owner can delete cat
// - catPut - only owner can update cat
// - catGet - get cat by id
// - catListGet - get all cats
// - catPost - create new cat

import {catModel} from '../models/catModel';
import CustomError from '../../classes/CustomError';
import {validationResult} from 'express-validator';
import {Cat, CatTest} from '../../types/DBTypes';
import {Request, Response, NextFunction} from 'express';

const catGetByUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cats = await catModel.find({owner: res.locals.user._id});
    res.json(cats);
  } catch (error) {
    next(new CustomError('Error getting cats', 500));
  }
};

const catGetByBoundingBox = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {lon1, lat1, lon2, lat2} = req.query;
    const cats = await catModel.find({
      location: {
        $geoWithin: {
          $box: [
            [lon1, lat1],
            [lon2, lat2],
          ],
        },
      },
    });
    res.json(cats);
  } catch (error) {
    next(new CustomError('Error getting cats', 500));
  }
};

const catPutAdmin = async (
  req: Request<{id: string}, {}, {owner: string}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const cat = await catModel.findById(req.params.id);
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }
    //cat.owner = req.body.owner;
    await cat.save();
    res.json(cat);
  } catch (error) {
    next(new CustomError('Error updating cat', 500));
  }
};

const catDeleteAdmin = async (
  req: Request<{id: string}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const cat = await catModel.findById(req.params.id);
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }
    //await cat.remove();
    res.json(cat);
  } catch (error) {
    next(new CustomError('Error deleting cat', 500));
  }
};

const catDelete = async (
  req: Request<{id: string}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const cat = await catModel.findById(req.params.id);
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }
    if (cat.owner !== res.locals.user._id) {
      next(new CustomError('Not authorized', 403));
      return;
    }
    //await cat.remove();
    res.json(cat);
  } catch (error) {
    next(new CustomError('Error deleting cat', 500));
  }
};

const catPut = async (
  req: Request<{id: string}, {}, Cat>,
  res: Response,
  next: NextFunction
) => {
  try {
    const cat = await catModel.findById(req.params.id);
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }
    if (cat.owner !== res.locals.user._id) {
      next(new CustomError('Not authorized', 403));
      return;
    }
    cat.set(req.body);
    await cat.save();
    res.json(cat);
  } catch (error) {
    next(new CustomError('Error updating cat', 500));
  }
};

const catGet = async (
  req: Request<{id: string}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const cat = await catModel.findById(req.params.id).select('-__v').populate({
      path: 'owner',
      select: '-password -role -__v',
    });
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }
    res.json(cat);
  } catch (error) {
    next(new CustomError('Error getting cat', 500));
  }
};

const catListGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cats = await catModel.find().select('-__v').populate({
      path: 'owner',
      select: '-password -role -__v',
    });

    if (!cats) {
      res.status(404);
      console.log('No cats found!');
      return;
    }
    res.json(cats);
  } catch (error) {
    next(new CustomError('Error getting cats', 500));
  }
};

const catPost = async (
  req: Request<{}, {}, Cat>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!res.locals.user) {
      res.status(401).json({message: 'Not authenticated'});
      return;
    }

    const catInput = {
      cat_name: req.body.cat_name,
      weight: req.body.weight,
      birthdate: req.body.birthdate,
      owner: res.locals.user,
      filename: req.file ? req.file.filename : '',
      location: res.locals.coords || {
        type: 'Point',
        coordinates: [0, 0],
      },
    };

    const cat = await catModel.create(catInput);
    console.log(cat);

    res.json({message: 'Cat created', data: cat});
  } catch (error) {
    next(error);
  }
};

export {
  catGetByUser,
  catGetByBoundingBox,
  catPutAdmin,
  catDeleteAdmin,
  catDelete,
  catPut,
  catGet,
  catListGet,
  catPost,
};
