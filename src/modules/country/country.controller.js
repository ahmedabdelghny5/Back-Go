import { nanoid } from "nanoid";
import countryModel from "../../../DB/models/country.model.js";
import { AppError } from "../../utils/globalError.js";

import { allMessages } from "../../utils/localizationHelper.js";
import cloudinary from './../../utils/cloudinary.js';
import { selectOwner, selectProperty } from "../owner/owner.controller.js";


export const selectCountry = "_id name image.secure_url subImages.secure_url"


export const addCountry = async (req, res, next) => {
    const { name } = req.body;
    const isNameExist = await countryModel.findOne({ name })
    if (isNameExist) {
        return next(new AppError(allMessages[req.query.ln].GENERAL_EXISTENCE, 400))
    }
    if (!req.files) {
        return next(new AppError(allMessages[req.query.ln].FILE_IS_REQUIRED, 400))
    }
    const customId = nanoid(4)
    req.body.customId = customId
    const { secure_url, public_id } = await cloudinary.uploader.upload(req.files.image[0].path, {
        folder: `Back-Go/countries/${customId}/image`
    })
    req.body.image = { secure_url, public_id }
    let images = []
    for (const file of req.files.subImages) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(
            file.path,
            {
                folder: `Back-Go/countries/${customId}/subImages`,
            }
        );
        images.push({ secure_url, public_id });
    }
    req.body.subImages = images

    const country = await countryModel.create(req.body)
    res.json({ message: allMessages[req.query.ln].SUCCESS })
}

export const getCountries = async (req, res, next) => {
    const allCountries = await countryModel.find().select(selectCountry).populate([{
        path: "properties",
        select: selectProperty,
        populate: [{
            path: 'ownerId',
            select: selectOwner
        }]
    }])
    res.json({ message: allMessages[req.query.ln].SUCCESS, countries: allCountries });
}