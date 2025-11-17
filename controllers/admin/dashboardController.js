const Orders = require('../../models/orderSchema')
const loadDashboard = async (req, res) => {
    try {
        const date = req.query.date || null;
        let filter = {}

        if (date !== null) {
            const today = new Date();

            switch (date) {
                case 'daily': {
                    const startOfDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0));
                    const endOfDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999));

                    filter.createdOn = {
                        $gte: startOfDay,
                        $lte: endOfDay
                    };
                    break;
                }



                case 'weekly': {
                    const firstDayOfWeek = new Date(today);
                    firstDayOfWeek.setDate(today.getDate() - today.getDay());
                    firstDayOfWeek.setHours(0, 0, 0, 0);

                    const lastDayOfWeek = new Date(firstDayOfWeek);
                    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
                    lastDayOfWeek.setHours(23, 59, 59, 999);

                    filter.createdOn = { $gte: firstDayOfWeek, $lte: lastDayOfWeek };
                    break;
                }

                case 'monthly': {
                    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

                    filter.createdOn = { $gte: firstDayOfMonth, $lte: lastDayOfMonth };
                    break;
                }

                case 'yearly': {
                    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
                    const lastDayOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);

                    filter.createdOn = { $gte: firstDayOfYear, $lte: lastDayOfYear };
                    break;
                }

                case 'custom': {
                    const { startDate, endDate } = req.query;

                    if (startDate && endDate) {
                        filter.createdOn = {
                            $gte: new Date(startDate),
                            $lte: new Date(endDate)
                        };
                    }
                    break;
                }

                default:
                    break;
            }
        }
        const topProducts = await getTopProducts(filter)

        const topCategory = await topSellingCategory(filter)

        console.log('topProducts',topProducts)
        console.log('topCategory',topCategory)

        return res.render('dashboard', {
            topProducts,
            topCategory,
        })
    } catch (error) {
        console.log('Load Dashboard function error', error)
        return res.redirect('/admin/pageNotFound')
    }
}

const getTopProducts = async (filter) => {
    try {

        console.log('fileter',filter)


        console.log('i reach hear...................... getTopProducts')
        const topSellingProducts = await Orders.aggregate([
            {
                $match: {
                    ...filter,
                    status: { $nin: ["cancelled", "returned"] }
                }
            },
            {
                $unwind: "$orderedItems"
            },
            {
                $match: {
                    "orderedItems.status": { $nin: ["cancelled", "returned"] }
                }
            },
            {
                $group: {
                    _id: "$orderedItems.product",
                    totalSold: { $sum: "$orderedItems.quantity" },
                    totalRevenue: {
                        $sum: {
                            $multiply: ["$orderedItems.quantity", "$orderedItems.finalPrice"]
                        }
                    }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            {
                $project: {
                    _id: 0,
                    productId: "$product._id",
                    productName: "$product.productName",
                    productImage: { $arrayElemAt: ["$product.productImage", 0] },
                    totalSold: 1,
                    salePrice: "$product.salePrice",
                    totalRevenue: 1,
                }
            }
        ])


        console.log('topSellingProducts', topSellingProducts)
        return topSellingProducts

    } catch (error) {
        console.error('error in getTopProducts', error)
        return res.redirect('/pageNotFound')
    }
}

const topSellingCategory = async (filter) => {
    try {
        console.log('i reach hear...................... topSellingCategory')
        const totalSold = await Orders.aggregate([
            {
                $match: {
                    ...filter,
                    status: { $nin: ["cancelled", "returned"] }
                }
            },
            {
                $unwind: "$orderedItems"
            },
            {
                $group: {
                    _id: "$orderedItems.categoryId",
                    totalSoldCategory: { $sum: "$orderedItems.quantity" },
                    totalRevenue: {
                        $sum: {
                            $multiply: ["$orderedItems.quantity", "$orderedItems.finalPrice"]
                        }
                    }
                }
            },
            { $sort: { totalSoldCategory: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "categories",
                    localField: "_id",
                    foreignField: "_id",
                    as: "category"
                }
            },
            { $unwind: "$category" },
            {
                $project: {
                    _id: 0,
                    categoryId: "$category._id",
                    categoryName: "$category.name",
                    totalSold: "$totalSoldCategory",
                    totalRevenue: 1,
                }
            }
        ])

        console.log('totalSold', totalSold)
        return totalSold

    } catch (error) {
        console.error('error in topSellingCategory', error)
    }
}

module.exports = {
    loadDashboard,
}