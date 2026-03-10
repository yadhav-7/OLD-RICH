import Orders from '../../models/orderSchema.js'
import logger from '../../utils/logger.js'

const getDashboardStats = async (filterDate, customStartDate, customEndDate) => {
    try {
        const filter = {}
        if (filterDate) {
            const today = new Date()
            switch (filterDate) {
                case 'daily': {
                    const startOfDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0))
                    const endOfDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999))
                    filter.createdOn = { $gte: startOfDay, $lte: endOfDay }
                    break
                }
                case 'weekly': {
                    const firstDayOfWeek = new Date(today)
                    firstDayOfWeek.setDate(today.getDate() - today.getDay())
                    firstDayOfWeek.setHours(0, 0, 0, 0)
                    const lastDayOfWeek = new Date(firstDayOfWeek)
                    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6)
                    lastDayOfWeek.setHours(23, 59, 59, 999)
                    filter.createdOn = { $gte: firstDayOfWeek, $lte: lastDayOfWeek }
                    break
                }
                case 'monthly': {
                    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
                    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
                    filter.createdOn = { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
                    break
                }
                case 'yearly': {
                    const firstDayOfYear = new Date(today.getFullYear(), 0, 1)
                    const lastDayOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999)
                    filter.createdOn = { $gte: firstDayOfYear, $lte: lastDayOfYear }
                    break
                }
                case 'custom': {
                    if (customStartDate && customEndDate) {
                        const start = new Date(customStartDate)
                        start.setHours(0, 0, 0, 0)
                        const end = new Date(customEndDate)
                        end.setHours(23, 59, 59, 999)
                        filter.createdOn = {
                            $gte: start,
                            $lte: end,
                        }
                    }
                    break
                }
                default:
                    break
            }
        }

        const topProducts = await getTopProducts(filter)
        const topCategory = await getTopSellingCategory(filter)
        const topBrands = await getTopBrands(filter)

        return {
            topProducts,
            topCategory,
            topBrands
        }
    } catch (error) {
        logger.error(`Error in getDashboardStats service: ${error}`)
        throw error
    }
}

const getTopProducts = async (filter) => {
    try {
        const topSellingProducts = await Orders.aggregate([
            {
                $match: {
                    ...filter,
                    status: { $nin: ['cancelled', 'returned'] },
                },
            },
            { $unwind: '$orderedItems' },
            {
                $match: {
                    'orderedItems.status': { $nin: ['cancelled', 'returned'] },
                },
            },
            {
                $group: {
                    _id: '$orderedItems.product',
                    totalSold: { $sum: '$orderedItems.quantity' },
                    totalRevenue: {
                        $sum: {
                            $multiply: [
                                '$orderedItems.quantity',
                                { $ifNull: ['$orderedItems.finalPrice', { $ifNull: ['$orderedItems.price', 0] }] }
                            ]
                        },
                    },
                },
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            { $unwind: '$product' },
            {
                $project: {
                    _id: 0,
                    productId: '$product._id',
                    productName: '$product.productName',
                    productImage: { $arrayElemAt: ['$product.productImage', 0] },
                    totalSold: 1,
                    salePrice: '$product.salePrice',
                    totalRevenue: 1,
                },
            },
        ])
        return topSellingProducts
    } catch (error) {
        logger.error(`Error in getTopProducts service: ${error}`)
        throw error
    }
}

const getTopSellingCategory = async (filter) => {
    try {
        const totalSold = await Orders.aggregate([
            {
                $match: {
                    ...filter,
                    status: { $nin: ['cancelled', 'returned'] },
                },
            },
            { $unwind: '$orderedItems' },
            {
                $group: {
                    _id: '$orderedItems.categoryId',
                    totalSoldCategory: { $sum: '$orderedItems.quantity' },
                    totalRevenue: {
                        $sum: {
                            $multiply: [
                                '$orderedItems.quantity',
                                { $ifNull: ['$orderedItems.finalPrice', { $ifNull: ['$orderedItems.price', 0] }] }
                            ]
                        },
                    },
                },
            },
            { $sort: { totalSoldCategory: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            { $unwind: '$category' },
            {
                $project: {
                    _id: 0,
                    categoryId: '$category._id',
                    categoryName: '$category.name',
                    totalSold: '$totalSoldCategory',
                    totalRevenue: 1,
                },
            },
        ])
        return totalSold
    } catch (error) {
        logger.error(`Error in getTopSellingCategory service: ${error}`)
        throw error
    }
}

const getTopBrands = async (filter) => {
    try {
        const topBrands = await Orders.aggregate([
            {
                $match: {
                    ...filter,
                    status: { $nin: ['cancelled', 'returned', 'Failed'] },
                },
            },
            { $unwind: '$orderedItems' },
            {
                $match: {
                    'orderedItems.status': { $nin: ['cancelled', 'returned'] },
                },
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'orderedItems.product',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            { $unwind: '$product' },
            {
                $addFields: {
                    brandName: {
                        $arrayElemAt: [{ $split: [{ $ifNull: ['$product.productName', 'Unknown'] }, ' '] }, 0]
                    }
                }
            },
            {
                $group: {
                    _id: { $toUpper: '$brandName' },
                    totalSold: { $sum: '$orderedItems.quantity' },
                    totalRevenue: {
                        $sum: {
                            $multiply: [
                                '$orderedItems.quantity',
                                { $ifNull: ['$orderedItems.finalPrice', { $ifNull: ['$orderedItems.price', 0] }] }
                            ]
                        },
                    },
                },
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 },
            {
                $project: {
                    _id: 0,
                    brandName: '$_id',
                    totalSold: 1,
                    totalRevenue: 1,
                },
            },
        ])
        return topBrands
    } catch (error) {
        logger.error(`Error in getTopBrands service: ${error}`)
        throw error
    }
}

export default {
    getDashboardStats
}
