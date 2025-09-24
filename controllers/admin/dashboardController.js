const Orders = require('../../models/orderSchema')
const Users = require('../../models/userSchema')
const PDFDocument = require('pdfkit')
const fs = require('fs')

const loadDashboard = async (req, res) => {
    try {
        const orders = await Orders.find()
        const usersCount = await Users.countDocuments()
        const totalOrders = await Orders.countDocuments()
        console.log('totalOrders', totalOrders)
        let totalAmount = 0
        let totalDiscound = 0

        for (let doc of orders) {
            totalAmount += doc.finalAmount
            totalDiscound += doc.discount
        }

        const rawDailySales = await Orders.aggregate([
            { $match: { status: { $nin: ["cancelled", "returned"] } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdOn" } },
                    totalSales: { $sum: "$finalAmount" },
                    totalDiscount: { $sum: "$discount" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);


        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const dailySales = [];
        for (let d = startOfMonth; d <= endOfMonth; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const dayData = rawDailySales.find(ds => ds._id === dateStr);
            dailySales.push({
                _id: dateStr,
                totalSales: dayData ? dayData.totalSales : 0,
                totalDiscount: dayData ? dayData.totalDiscount : 0
            });
        }

        console.log('dailySales', dailySales)

        const topProducts = await getTopProducts()

        const topCategory = await topSellingCategory()

        res.render('dashboard', {
            orders,
            totalOrders,
            totalAmount,
            totalDiscound,
            usersCount,
            topProducts,
            topCategory,
            dailySales
        })
    } catch (error) {
        console.log('Load Dashboard function error', error)
        return res.redirect('/admin/pageError')
    }
}


const salesReport = async (req, res) => {
    console.log('i reach hear!')
  try {
    // Fetch all orders from database
    const orders = await Orders.find();

    if (!orders || orders.length === 0) {
      return res.status(404).send('No orders found');
    }

    // Flatten all ordered items with human-readable date
    const sales = orders.flatMap(order =>
      order.orderedItems.map(item => {
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        const humanDate = new Date(order.createdOn).toLocaleDateString('en-US', options);

        return {
          date: humanDate,
          product: item.productName,
          quantity: item.quantity,
          amount: item.finalPrice
        };
      })
    );

    // Calculate total sales
    const totalSales = orders.reduce((acc, order) => acc + order.finalAmount, 0);

    // Set headers to trigger download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');

    // Generate PDF
    const doc = new PDFDocument({ margin: 30 });
    doc.pipe(res);

    // PDF Header
    doc.fontSize(18).text('Sales Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Total Sales: ₹${totalSales}`);
    doc.moveDown();

    // Table Header
    doc.text('Date       Product     Quantity     Amount');
    doc.moveDown(0.5);

    // Table rows
    sales.forEach(s => {
      doc.text(`${s.date}   ${s.product}   ${s.quantity}   ₹${s.amount}`);
    });

    doc.end();

  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating sales report PDF');
  }
};

module.exports = salesReport;

const getTopProducts = async () => {
    try {

        console.log('i reach hear...................... getTopProducts')
        const topSellingProducts = await Orders.aggregate([
            {
                $match: {
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

const topSellingCategory = async () => {
    try {
        console.log('i reach hear...................... topSellingCategory')
        const totalSold = await Orders.aggregate([
            {
                $match: {
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
    salesReport
}