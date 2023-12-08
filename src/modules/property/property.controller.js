import { AppError, asyncHandler } from "../../utils/globalError.js";
import propertyModel from "../../../DB/models/property.model.js"
import cloudinary from './../../utils/cloudinary.js';
import { nanoid } from 'nanoid';
import ApiFeatures from "../../utils/apiFeatures.js";
import { allMessages } from "../../utils/localizationHelper.js";
import countryModel from "../../../DB/models/country.model.js";
import { selectOwner, selectProperty } from "../owner/owner.controller.js";
import { selectCategory } from "../category/category.controller.js";
import { selectSubCategory } from "../subCategory/subCategory.controller.js";
import { selectCountry } from "../country/country.controller.js";
import { selectReview } from "../review/review.controller.js";

export const propertyPopulate = [{
  path: 'categoryId',
  select: selectCategory
}, {
  path: 'subcategoryId',
  select: selectSubCategory
}, {
  path: 'ownerId',
  select: 'name email rate numberOfRates soldItems phone image'
}]

//**************************createproperty******************* *//
export const createproperty = asyncHandler(async (req, res, next) => {
  const { name, country, facilities, description, features,
    type, price, rentType, discount, categoryId, subcategoryId } = req.body;
  //exist or not
  const exist = await propertyModel.findOne({ name: name.toLowerCase() });
  if (exist) {
    return next(new AppError(allMessages[req.query.ln].GENERAL_EXISTENCE, 401));
  }

  //location
  let location = JSON.parse(req.body.location)
  const newLocation = {
    type: 'Point',
    coordinates: [location.coordinates[0], location.coordinates[1]]
  }
  req.body.location = newLocation

  //country
  const isCountryExist = await countryModel.findById(country)
  if (!isCountryExist) {
    return next(new AppError(allMessages[req.query.ln].COUNTRY_NOT_FOUND, 404));
  }
  req.body.country = country

  //type
  req.body.type = type
  if (req.body.type == 'Rent') {
    if (!req.body.rentType) {
      return next(new AppError(allMessages[req.query.ln].RentType, 400));
    }
    req.body.rentType = rentType
  }

  //calc finalPrice
  req.body.finalPrice = price - price * ((discount || 0) / 100)
  //upload image
  const customId = nanoid(4)
  req.body.customId = customId
  const { secure_url, public_id } = await cloudinary.uploader.upload(req.files.mainImage[0].path, {
    folder: `Back-Go/properties/${customId}`
  })
  req.body.mainImage = { secure_url, public_id }
  let images = []
  for (const file of req.files.subImages) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      file.path,
      {
        folder: `Back-Go/properties/${customId}/subImages`,
      }
    );
    images.push({ secure_url, public_id });
  }
  req.body.subImages = images
  req.body.ownerId = req.user._id
  const property = await propertyModel.create(req.body)
  res.status(201).json({ message: allMessages[req.query.ln].SUCCESS_AddProperty })
});

//**************************updateproperty******************* *//
export const updateproperty = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { price, discount, categoryId, subcategoryId, location } = req.body
  const property = await propertyModel.findById(id);
  //propert exist
  if (!property) {
    return next(new AppError(allMessages[req.query.ln].NOT_FOUND, 404));
  }
  if (property.ownerId.toString() != req.user._id.toString()) {
    return next(new AppError(allMessages[req.query.ln].UNAUTHORIZED, 401));
  }
  if (property?.type == "Sell" && property?.available == false && property?.accepted == true) {
    return next(new AppError(allMessages[req.query.ln].NOT_FOUND, 404));
  }

  if (req.body.name) { property.name = req.body.name.toLowerCase() }

  if (req.body.country) {
    const isCountryExist = await countryModel.findById(req.body.country)
    if (!isCountryExist) {
      return next(new AppError(allMessages[req.query.ln].COUNTRY_NOT_FOUND, 404));
    }
    property.country = req.body.country
  }
  if (req.body.description) { property.description = req.body.description }
  if (req.body.facilities) { property.facilities = req.body.facilities }
  if (req.body.features) { property.features = req.body.features }

  //location
  if (location) {
    location = JSON.parse(location)
    const newLocation = {
      type: 'Point',
      coordinates: [location.coordinates[1], location.coordinates[0]]
    }
    property.location = newLocation
  }
  //price || discount
  if (price && discount) {
    property.price = price
    property.discount = discount
    property.finalPrice = price - price * (discount / 100);
  } else if (price) {
    property.price = price
    property.finalPrice = price - price * (property.discount / 100);
  } else if (discount) {
    property.discount = discount
    property.finalPrice = property.price - property.price * (discount / 100);
  }
  //>>>>check mainImage<<<<<<\\
  if (req.files?.mainImage.length) {
    await cloudinary.uploader.destroy(property.mainImage.public_id);
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.mainImage[0].path,
      {
        folder: `Back-Go/properties/${property.customId}`,
      }
    );
    property.mainImage = { secure_url, public_id };
  }
  //>>>>check subImages<<<<<<\\
  if (req.files?.subImages?.length) {
    for (const imgIds of property.subImages) {
      await cloudinary.uploader.destroy(imgIds.public_id);
      await propertyModel.updateOne({ _id: id }, { $pull: { subImages: imgIds } })
    }
    for (const file of req.files.subImages) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        {
          folder: `Back-Go/properties/${property.customId}/subImages/`,
        }
      );
      property.subImages.push({ secure_url, public_id });
    }
  }
  property.save()
  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS_UPDATED })
});

//**************************deleteproperty******************* *//
export const deleteproperty = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const property = await propertyModel.findById(id);
  //propert exist
  if (!property) {
    return next(new AppError(allMessages[req.query.ln].NOT_FOUND, 404));
  }
  if (property.ownerId.toString() != req.user._id.toString()) {
    return next(new AppError(allMessages[req.query.ln].UNAUTHORIZED, 401));
  }
  //delte from database
  await propertyModel.deleteOne({ _id: id });

  // delete from cloudinary
  await cloudinary.api.delete_resources_by_prefix(
    `Back-Go/properties/${property.customId}`
  );
  await cloudinary.api.delete_folder(
    `Back-Go/properties/${property.customId}`
  );
  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS_DELETED })
});


//**************************uploadVideo******************* *//
export const uploadVideo = asyncHandler(async (req, res, next) => {
  const { id } = req.params
  const property = await propertyModel.findById(id).populate(propertyPopulate);
  //propert exist
  if (!property) {
    return next(new AppError(allMessages[req.query.ln].NOT_FOUND, 404));
  }
  if (property.ownerId.toString() != req.user._id.toString()) {
    return next(new AppError(allMessages[req.query.ln].UNAUTHORIZED, 401));
  }
  if (property.type == "Sell" && property.available == "false") {
    return next(new AppError(allMessages[req.query.ln].NOT_FOUND, 404));
  }
  //videos
  const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
    folder: `Back-Go/properties/${property.customId}/video`,
    resource_type: "video"
  })
  property.video = { secure_url, public_id }
  await property.save()
  res.status(201).json({ message: allMessages[req.query.ln].SUCCESS_VIDEO })
});

//**************************getAllproperty******************* *//
export const getAllproperty = asyncHandler(async (req, res, next) => {
  const apiFeatures = new ApiFeatures(propertyModel.find().select(selectProperty).populate(propertyPopulate), req.query)
    .pagination()
    .sort()
    .search()
    .filter()
    .select()
  const properties = await apiFeatures.mongooseQuery
  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS, properties })
});


//**************************getAllpropertyAvailable******************* *//
export const getAllpropertyAvailable = asyncHandler(async (req, res, next) => {
  const properties = await propertyModel.find({ available: true }).select(selectProperty).populate(propertyPopulate);
  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS, properties })
});
//**************************getAllpropertyNotAvailable******************* *//
export const getAllpropertyNotAvailable = asyncHandler(async (req, res, next) => {
  const properties = await propertyModel.find({
    available: false, ownerId: req.user._id
  }).select(selectProperty).populate([{
    path: 'categoryId',
    select: selectCategory
  }, {
    path: 'subcategoryId',
    select: selectSubCategory
  }, {
    path: 'ownerId',
    select: selectOwner
  }])
  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS, properties })
});

//**************************biggestDiscount******************* *//
export const biggestDiscount = asyncHandler(async (req, res, next) => {
  const properties = await propertyModel.find({}).select(selectProperty).populate(propertyPopulate).sort("-discount");
  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS, properties })
});

//**************************getAllpropertyWithReview******************* *//
export const getAllpropertyWithReview = asyncHandler(async (req, res, next) => {
  const properties = await propertyModel.find({}).select(selectProperty).populate([
    { path: "Review", select: selectReview },
    ...propertyPopulate
  ])
  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS, properties })
});

//**************************getNearstProperty******************* *//
export const getNearstProperty = asyncHandler(async (req, res, next) => {
  const user = req.user;
  let userLatitude = user.location.coordinates[0]
  let userLongitude = user.location.coordinates[1]
  const userLocation = {
    type: 'Point',
    coordinates: [
      userLatitude,
      userLongitude
    ]
  }

  let maxDistance = 10; // max distance in km
  maxDistance = maxDistance * 1000

  const properties = await propertyModel.find({
    available: true,
    location: {
      $geoWithin: {
        $centerSphere: [userLocation.coordinates, maxDistance / 6371000]
      },
    }
  }).select(selectProperty).populate(propertyPopulate)
  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS, properties })
});

//**************************getPropertiesByCountry******************* *//
export const getPropertiesByCountry = async (req, res, next) => {
  const countryId = req.params.id
  // const properties = await propertyModel.find({
  //   country
  // }).populate(propertyPopulate)
  const country = await countryModel.findById(countryId).select(selectCountry).populate([{
    path: 'properties',
    select: selectProperty,
    populate: propertyPopulate
  }])
  res.status(200).json({ message: allMessages[req.query.ln].SUCCESS, properties: country })
}

//**************************topLocations******************* *//
export const topLocations = async (req, res, next) => {
  const allProperties = await propertyModel.find({ accepted: true }).select(selectProperty).populate([
    {
      path: "country",
      select: selectCountry

    },
    {
      path: "ownerId",
      select: selectOwner

    },
  ])//! get country
  let countryModel = {}

  const totalCountries = []
  allProperties.map(property => {
    const index = totalCountries.findIndex(ele => ele.countryId == property.country._id)

    if (index >= 0) {
      if (property.numberOfRates) {
        totalCountries[index].rateAVG = (totalCountries[index].rateAVG * totalCountries[index].noOfRates + property.rate) / ++totalCountries[index].noOfRates
      }
    }
    else {
      countryModel.countryId = property.country._id
      countryModel.name = property.country.name
      countryModel.image = { secure_url: property.country.image.secure_url }
      countryModel.subImages = { subImages: property.country.subImages }
      countryModel.rateAVG = property.rate
      countryModel.noOfRates = 1
      countryModel.properties = []
      countryModel.properties.push(property)
      totalCountries.push({ ...countryModel })
    }
  })
  totalCountries.sort((b, a) => (a.rateAVG - b.rateAVG) || (b.noOfRates - a.noOfRates));
  res.json({ message: allMessages[req.query.ln].SUCCESS, totalCountries })
}
//**************************nearest and top******************* *//
export const nearestAndTop = async (req, res, next) => {
  const user = req.user;
  let userLatitude = user.location.coordinates[0]
  let userLongitude = user.location.coordinates[1]
  const userLocation = {
    type: 'Point',
    coordinates: [
      userLatitude,
      userLongitude
    ]
  }

  let maxDistance = 10; // max distance in km
  maxDistance = maxDistance * 1000

  const allProperties = await propertyModel.find({
    location: {
      $geoWithin: {
        $centerSphere: [userLocation.coordinates, maxDistance / 6371000]
      },
    }
  }).select(selectProperty).populate('country ownerId')//! get country
  let countryModel = {}

  const totalCountries = []
  allProperties.map(property => {
    const index = totalCountries.findIndex(ele => ele.countryId == property.country._id)

    if (index >= 0) {
      if (property.numberOfRates) {
        totalCountries[index].rateAVG = (totalCountries[index].rateAVG * totalCountries[index].noOfRates + property.rate) / ++totalCountries[index].noOfRates
      }
    }
    else {
      countryModel.countryId = property.country._id
      countryModel.name = property.country.name
      countryModel.image = { secure_url: property.country.image.secure_url }
      countryModel.subImages = { subImages: property.country.subImages }
      countryModel.rateAVG = property.rate
      countryModel.noOfRates = 1
      countryModel.properties = []
      countryModel.properties.push(property)
      totalCountries.push({ ...countryModel })
    }
  })
  totalCountries.sort((b, a) => (a.rateAVG - b.rateAVG) || (b.noOfRates - a.noOfRates));
  res.json({ message: allMessages[req.query.ln].SUCCESS, totalCountries })
}