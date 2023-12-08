import moment from "moment";
import { asyncHandler } from "../../utils/globalError.js";
import userModel from '../../../DB/models/user.model.js';
import rentModel from '../../../DB/models/rent.model.js';
import ownerModel from '../../../DB/models/owner.model.js';
import { allMessages } from "../../utils/localizationHelper.js";
import propertyModel from "../../../DB/models/property.model.js";


export const dashboard = asyncHandler(async (req, res, next) => {
    //* total owners

    const owners = await ownerModel.find() // owners
    const totalOwners = owners.length     // number of owners
    const todayOwnerNumber = await ownerModel.count({
        createdAt: {
            $gte: moment().subtract(1, 'days').format()
        }
    }) // number of owners which signed up today
    const ownerIncreasePercentage = ((todayOwnerNumber / Math.abs(totalOwners - todayOwnerNumber)) * 100).toFixed(2) + "%"

    //* total users
    const users = await userModel.find() // users
    const totalUsers = users.length // number of users
    const todayUserNumber = await userModel.count({
        createdAt: {
            $gte: moment().subtract(1, 'days').format()
        }
    }) // number of users which signed up today
    const userIncreasePercentage = ((todayUserNumber / Math.abs(totalUsers - todayUserNumber)) * 100).toFixed(2) + "%"

    //* total rents
    const rents = await rentModel.find().populate([
        { path: "property.propertyId" },
        { path: "property.ownerId" },
    ]) // rents

    const totalRents = rents.length     // number of rents
    const todayRentNumber = await rentModel.count({
        createdAt: {
            $gte: moment().subtract(1, 'days').format()
        }
    }) // number of rents which done today
    const rentIncreasePercentage = (todayRentNumber / Math.abs(totalRents - todayRentNumber) * 100).toFixed(2) + "%"

    // sort owners by best soldItems ||rent
    const topOwners = await ownerModel.find({}).sort("-soldItems")
    const topPorperties = await propertyModel.find({}).sort("-numberOfRates")

    let lastRevenue = 0
    let todayRevenue = 0;
    
    rents.map((rent)=>{
        if(rent.property.ownerId){
            if (rent.createdAt >= moment().subtract(1, 'days')) {
                todayRevenue += rent.totalPrice
            } else {
                lastRevenue += rent.totalPrice
            }
        }
    })
    const totalRevenue = todayRevenue + lastRevenue
    const RevenueIncreasePercentage = (todayRevenue / Math.abs(totalRevenue - todayRevenue) * 100).toFixed(2) + "%"

    const ownersCharts = getChart(owners)
    const rentCharts = getChart(rents)
    const userCharts = getChart(users)
    const revenueCharts = getChart(rents, true)
    res.status(200).json({
        message: allMessages[req.query.ln].SUCCESS,
        // bestSelling: numberOfMeals,
        revenueCharts,
        userCharts,
        rentCharts,
        ownersCharts,
        owner: {
            totalOwners,
            todayOwnerNumber,
            ownerIncreasePercentage,
        },
        user: {
            totalUsers,
            todayUserNumber,
            userIncreasePercentage,

        },
        order: {
            totalRents,
            todayRentNumber,
            rentIncreasePercentage
        },
        revenue: {
            totalRevenue,
            todayRevenue,
            RevenueIncreasePercentage
        },
        topOwners,
        topPorperties
        // bestSellers: chefOrders,

    })
})



const getChart = (data, revenue = false) => {
    const year = {
        Jan: 0,
        Feb: 0,
        Mar: 0,
        Apr: 0,
        May: 0,
        Jun: 0,
        Jul: 0,
        Aug: 0,
        Sep: 0,
        Oct: 0,
        Nov: 0,
        Dec: 0
    };
    const month = {
        week1: 0,
        week2: 0,
        week3: 0,
        week4: 0,
    }
    const week = {
        Sat: 0,
        Sun: 0,
        Mon: 0,
        Tue: 0,
        Wed: 0,
        Thu: 0,
        Fri: 0
    };

    let monthDate = moment().subtract(1, 'month')
    let dataMonth = []
    let dataWeek = []

    for (const ele of data) {
        year[ele.createdAt.toString().split(' ')[1]] += revenue == true ? ele.totalPrice : 1;
        if (ele.createdAt > monthDate) {
            dataMonth.push(ele)
        }
    }

    for (const ele of dataMonth) {
        if (ele.createdAt > moment().subtract(1, 'week')) {
            month.week4 += revenue == true ? ele.totalPrice : 1
            dataWeek.push(ele)
        }
        else if (ele.createdAt > moment().subtract(2, 'week') && ele.createdAt < moment().subtract(1, 'week')) {
            month.week3 += revenue == true ? ele.totalPrice : 1
        }
        else if (ele.createdAt > moment().subtract(3, 'week') && ele.createdAt < moment().subtract(2, 'week')) {
            month.week2 += revenue == true ? ele.totalPrice : 1

        }
        else if (ele.createdAt > moment().subtract(4, 'week') && ele.createdAt < moment().subtract(3, 'week')) {
            month.week1 += revenue == true ? ele.totalPrice : 1
        }

    }
    for (const ele of dataWeek) {
        week[ele.createdAt.toString().split(' ')[0]] += revenue == true ? ele.totalPrice : 1;
    }


    return {
        year,
        month,
        week
    }
}
