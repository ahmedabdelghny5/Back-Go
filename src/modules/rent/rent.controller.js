import rentModel from "../../../DB/models/rent.model.js";
import propertyModel from "../../../DB/models/property.model.js";
import { AppError, asyncHandler } from "../../utils/globalError.js";
import Stripe from "stripe/cjs/stripe.cjs.node.js";
// import Stripe from "stripe";
import ownerModel from "../../../DB/models/owner.model.js";
import payment from "../../utils/payment.js";
import { allMessages } from "../../utils/localizationHelper.js";
import moment from "moment";

// *******************************createrent*********************************//
export const createrent = asyncHandler(async (req, res, next) => {
  const { propertyId, phone, note, paymentMethod, fromDate, toDate } = req.body;

  //checkProperty
  let totalPrice = 0;
  let property = {}
  const checkProperty = await propertyModel.findOne({ _id: propertyId, accepted: true, type: "Rent" })
  if (!checkProperty) {
    return next(new AppError(allMessages[req.query.ln].NOT_FOUND, 404));
  }
  if (checkProperty.available != true) {
    return next(new AppError(allMessages[req.query.ln].NOT_AVALIABLE, 404));
  }

  // Calculate the difference in days
  const momentDate1 = moment(fromDate, 'YYYY/MM/DD');
  const momentDate2 = moment(toDate, 'YYYY/MM/DD');
  const diffInDays = momentDate2.diff(momentDate1, 'days');

  property.ownerId = checkProperty.ownerId
  property.propertyId = checkProperty._id
  property.name = checkProperty.name
  property.image = checkProperty.mainImage
  property.price = checkProperty.price
  property.discount = checkProperty?.discount || 0
  property.unitPrice = checkProperty.finalPrice
  totalPrice += property.unitPrice * diffInDays

  //make rent
  const rent = await rentModel.create({
    property,
    phone, note,
    paymentMethod,
    status: paymentMethod == "cash" ? "done" : "waitPayment",
    totalPrice,
    fromDate, toDate,
    userId: req.user._id
  })

  //make property non available
  await propertyModel.updateOne({ _id: propertyId }, { available: false })
  //decrease soldItems in owner
  await ownerModel.updateOne({ _id: property.ownerId }, { $inc: { soldItems: 1 } })

  //payment
  if (paymentMethod == 'card') {
    const stripe = new Stripe(process.env.stripeKey)
    const session = await payment({
      stripe,
      customer_email: req.user.email,
      cancel_url: `${req.protocol}://${req.headers.host}/rents/cancelrent/${rent._id.toString()}`,
      metadata: { rentId: rent._id.toString() },
      line_items: [{
        price_data: {
          currency: "EGP",
          product_data: {
            name: property.name
          },
          unit_amount: property.unitPrice * 100
        },
        quantity: 1
      }
      ]
    })
    return res.status(201).json({ message: allMessages[req.query.ln].SUCCESS, rent, url: session.url });
  }
  return res.status(201).json({ message: allMessages[req.query.ln].SUCCESS, rent });
});

// *******************************cancelrent*********************************
export const cancelrent = asyncHandler(async (req, res, next) => {
  const { rentId } = req.params;
  const { reason } = req.body;
  const rent = await rentModel.findById({ _id: rentId });
  if (!rent) {
    return next(new AppError(allMessages[req.query.ln].NOT_FOUND, 404));
  }
  if ((rent.status != 'done' && rent.paymentMethod == "cash") ||
    (rent.status != 'waitPayment' && rent.paymentMethod == "card")) {
    return next(new AppError(allMessages[req.query.ln].CANNOT_CANCELED, 403));
  }

  //decrease soldItems in owner
  await ownerModel.updateOne({ _id: rent.property.ownerId }, { $inc: { soldItems: -1 } })
  //make property non available
  await propertyModel.updateOne({ _id: rent.property.propertyId }, { available: true })

  // //change status for rate
  await rentModel.updateOne({ _id: rentId }, { status: "cancel", reason })

  // await rentModel.deleteOne({ _id: rentId })
  res.status(201).json({ message: allMessages[req.query.ln].SUCCESS })
});
// *******************************webhook*********************************
export const webhook = asyncHandler(async (req, res, next) => {
  const stripe = new Stripe(process.env.stripeKey)
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.endpointSecret);
  } catch (err) {
    return next(new AppError(`Webhook Error: ${err.message}`, 400));
  }

  // Handle the event
  const { rentId } = event.data.object.metadata
  if (event.type != "checkout.session.completed") {
    await rentModel.updateOne({ _id: rentId }, { status: "rejected" })
    return res.status(400).json({ msg: "rejected" })
  }
  await rentModel.updateOne({ _id: rentId }, { status: "done" })
  return res.status(200).json({ msg: "Done" })

});


// *******************************sellProperty*********************************//
export const sellProperty = asyncHandler(async (req, res, next) => {
  const { propertyId, phone, note, paymentMethod } = req.body;

  //checkProperty
  let totalPrice = 0;
  let property = {}
  const checkProperty = await propertyModel.findOne({ _id: propertyId, accepted: true, type: "Sell" })
  if (!checkProperty) {
    return next(new AppError(allMessages[req.query.ln].NOT_FOUND, 404));
  }
  if (checkProperty.available != true) {
    return next(new AppError(allMessages[req.query.ln].NOT_AVALIABLE, 404));
  }
  property.ownerId = checkProperty.ownerId
  property.propertyId = checkProperty._id
  property.name = checkProperty.name
  property.image = checkProperty.mainImage
  property.price = checkProperty.price
  property.discount = checkProperty?.discount || 0
  property.unitPrice = checkProperty.finalPrice
  totalPrice += property.unitPrice

  //make sell
  const sell = await rentModel.create({
    property,
    phone, note,
    paymentMethod,
    status: paymentMethod == "cash" ? "done" : "waitPayment",
    totalPrice,
    userId: req.user._id
  })

  //make property non available
  await propertyModel.updateOne({ _id: propertyId }, { available: false })
  //decrease soldItems in owner
  await ownerModel.updateOne({ _id: property.ownerId }, { $inc: { soldItems: 1 } })

  //payment
  if (paymentMethod == 'card') {
    const stripe = new Stripe(process.env.stripeKey)
    const session = await payment({
      stripe,
      customer_email: req.user.email,
      cancel_url: `${req.protocol}://${req.headers.host}/rents/cancelsell/${sell._id.toString()}`,
      metadata: { rentId: sell._id.toString() },
      line_items: [{
        price_data: {
          currency: "EGP",
          product_data: {
            name: property.name
          },
          unit_amount: property.unitPrice * 100
        },
        quantity: 1
      }
      ]
    })
    return res.status(201).json({ message: allMessages[req.query.ln].SUCCESS, sell, url: session.url });
  }
  return res.status(201).json({ message: allMessages[req.query.ln].SUCCESS, sell });
});

