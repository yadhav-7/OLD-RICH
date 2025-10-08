const Orders = require('../../models/orderSchema')
const Users = require('../../models/userSchema')
const ExcelJS = require('exceljs');

const fs = require('fs')

const PDFDocument = require('pdfkit');

const loadDashboard = async (req, res) => {
    try {
        const date = req.query.date || null;
        let filter = {};

        if (date !== null) {
            const today = new Date();

            switch (date) {
                case 'daily':
                    filter.createdOn = {
                        $gte: new Date(today.setHours(0, 0, 0, 0)),
                        $lte: new Date(today.setHours(23, 59, 59, 999))
                    };
                    break;

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

        console.log('date', date)
        console.log('filter',filter)
        const orders = await Orders.find(filter)

        const usersCount = await Users.countDocuments()

        const totalOrders = await Orders.countDocuments()

        console.log('totalOrders', totalOrders)
        let totalAmount = 0
        console.log(4)
        let totalDiscound = 0
        console.log(5)

        for (let doc of orders) {
            totalAmount += doc.finalAmount
            totalDiscound += doc.discount
        }

        console.log(6)

        const rawDailySales = await Orders.aggregate([
  {
    $match: {
      ...filter,
      status: { $nin: ["cancelled", "returned"] }
    }
  },
  {
    $group: {
      _id: {
        $dateToString: {
          format: "%Y-%m-%d",
          date: "$createdOn",
          timezone: "+05:30" // 🇮🇳 Important for IST
        }
      },
      totalSales: { $sum: "$finalAmount" },
      totalDiscount: { $sum: "$discount" },
      orderCount: { $sum: 1 },

      totalCouponAmount: {
        $sum: {
          $cond: [
            { $eq: ["$couponApplied.applied", true] },
            "$couponApplied.amount",
            0
          ]
        }
      },

      totalCouponCount: {
        $sum: {
          $cond: [
            { $eq: ["$couponApplied.applied", true] },
            1,
            0
          ]
        }
      }
    }
  },
  { $sort: { "_id": 1 } }
]);





        
let start, end;

const now = new Date();

switch (date) {
  case 'daily': {
    start = new Date(now.setHours(0, 0, 0, 0));              // Start of today
    end = new Date(now.setHours(23, 59, 59, 999));            // End of today
    break;
  }

  case 'weekly': {
    const dayOfWeek = now.getDay();                           // 0 (Sun) to 6 (Sat)
    start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);                 // Start of the week (Sunday)
    start.setHours(0, 0, 0, 0);

    end = new Date(start);
    end.setDate(start.getDate() + 6);                         // End of the week (Saturday)
    end.setHours(23, 59, 59, 999);
    break;
  }

  case 'monthly': {
    start = new Date(now.getFullYear(), now.getMonth(), 1);   // 1st of this month
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of this month
    end.setHours(23, 59, 59, 999);
    break;
  }

  case 'yearly': {
    start = new Date(now.getFullYear(), 0, 1);                // Jan 1 of current year
    end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999); // Dec 31 of current year
    break;
  }

  case 'custom': {
    const { startDate, endDate } = req.query;
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      throw new Error('Custom filter requires startDate and endDate');
    }
    break;
  }

  default: {
    // Default fallback: this month
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  }
}

console.log('🗓️ Filter range:', start.toISOString(), '→', end.toISOString());


        console.log('rawDailySales',rawDailySales)
        const dailySales = [];
        for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const dayData = rawDailySales.find(ds => ds._id === dateStr);
            dailySales.push({
                _id: dateStr,
                totalSales: dayData ? dayData.totalSales : 0,
                totalDiscount: dayData ? dayData.totalDiscount : 0,
                totalOrders: dayData ? dayData.orderCount : 0,
                totalCouponCount: dayData ? dayData.totalCouponCount : 0
            });
        }
        

        console.log(11)

        console.log('dailySales', dailySales)

        const topProducts = await getTopProducts(filter)

        console.log(12)

        console.log('topProducts', topProducts)

        const topCategory = await topSellingCategory(filter)

        console.log(13)
        console.log('topCategory', topCategory)

        console.log('date',date)
        console.log('filter',filter)
        

        return res.render('dashboard', {
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
        return res.redirect('/admin/pageNotFound')
    }
}

const salesReport = async (req, res) => {
    try {

         const date = req.query.date || null;
        let filter = {};

        if (date !== null) {
            const today = new Date();

            switch (date) {
                case 'daily': {
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

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

        const orders = await Orders.find({
            ...filter,
            status: { $nin: ["cancelled", "returned"] }
        }).populate('userId', 'username email');

        if (!orders || orders.length === 0) {
            return res.status(404).send('No orders found');
        }

        // SUMMARY
        const overallSalesCount = orders.length;
        const overallOrderAmount = orders.reduce((acc, o) => acc + (o.finalAmount || 0), 0);
        const overallDiscount = orders.reduce((acc, o) => acc + (o.couponApplied?.amount || 0), 0);

        // FLATTEN DATA
        const salesData = orders.map(order => {
            const date = new Date(order.createdOn).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric'
            });

            return {
                orderId: order.orderId.slice(-6).toUpperCase(),
                date,
                customer: order.userId?.username || 'Unknown',
                total: order.finalAmount || 0,
                discount: order.couponApplied?.amount || 0,
                coupon: order.couponApplied?.applied ? 'Yes' : 'None'
            };
        });

        // PDF SETUP
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');

        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        doc.pipe(res);

        // HEADER
        doc.fontSize(22).text('VORAODI', { align: 'center' });
        doc.fontSize(16).text('Sales Report', { align: 'center' });
        doc.moveDown(0.5);

        const generatedDate = new Date().toLocaleDateString('en-GB');
        doc.fontSize(12)
            .text(`Report Generated: ${generatedDate}`, { align: 'left' })
            .text(`Period: Yearly`, { align: 'left' });
        doc.moveDown(1);

        // SALES SUMMARY
        doc.font('Helvetica-Bold').fontSize(14).text('Sales Summary', { underline: true })
        doc.moveDown(0.3)
        doc.font('Helvetica').fontSize(12)
        doc.text(`Overall Sales Count: ${overallSalesCount}`);
        doc.text(`Overall Order Amount: ₹${overallOrderAmount.toLocaleString('en-IN')}`)
        doc.text(`Overall Discount: ₹${overallDiscount.toLocaleString('en-IN')}`)
        doc.moveDown(1)

        // SALES DETAILS TABLE
        const tableTop = doc.y
        const rowHeight = 20
        const colWidths = {
            orderId: 60,
            date: 80,
            customer: 140,
            total: 80,
            discount: 60,
            coupon: 60
        };
        const startX = 50;

        // Table Header
        doc.font('Helvetica-Bold').fontSize(12)
        doc.text('Order ID', startX, tableTop, { width: colWidths.orderId, align: 'left' })
        doc.text('Date', startX + colWidths.orderId, tableTop, { width: colWidths.date, align: 'left' })
        doc.text('Customer', startX + colWidths.orderId + colWidths.date, tableTop, { width: colWidths.customer, align: 'left' })
        doc.text('Total', startX + colWidths.orderId + colWidths.date + colWidths.customer, tableTop, { width: colWidths.total, align: 'right' })
        doc.text('Discount', startX + colWidths.orderId + colWidths.date + colWidths.customer + colWidths.total, tableTop, { width: colWidths.discount, align: 'right' })
        doc.text('Coupon', startX + colWidths.orderId + colWidths.date + colWidths.customer + colWidths.total + colWidths.discount, tableTop, { width: colWidths.coupon, align: 'center' })

        let y = tableTop + rowHeight
        doc.moveTo(startX, y - 5).lineTo(550, y - 5).stroke() // header bottom line

        // Table Rows
        doc.font('Helvetica').fontSize(11)
        salesData.forEach((s, index) => {
            // Alternate row background
            if (index % 2 === 0) {
                doc.save(); // Save current state
                doc.fillColor('#f0f0f0', 0.5) // Light gray
                doc.rect(startX, y - 2, 500, rowHeight).fill() // Draw rectangle
                doc.restore() // Restore to default color
            }

            doc.fillColor('black') // Reset text color

            doc.text(s.orderId, startX, y, { width: colWidths.orderId });
            doc.text(s.date, startX + colWidths.orderId, y, { width: colWidths.date });
            doc.text(s.customer, startX + colWidths.orderId + colWidths.date, y, { width: colWidths.customer });
            doc.text(`₹${s.total.toLocaleString('en-IN')}`, startX + colWidths.orderId + colWidths.date + colWidths.customer, y, { width: colWidths.total, align: 'right' });
            doc.text(s.discount.toLocaleString('en-IN'), startX + colWidths.orderId + colWidths.date + colWidths.customer + colWidths.total, y, { width: colWidths.discount, align: 'right' });
            doc.text(s.coupon, startX + colWidths.orderId + colWidths.date + colWidths.customer + colWidths.total + colWidths.discount, y, { width: colWidths.coupon, align: 'center' });

            y += rowHeight;
            if (y > 750) {
                doc.addPage();
                y = 50;
            }
        });


        doc.moveDown(1);
        doc.fontSize(10).fillColor('gray').text('--- End of Report ---', { align: 'center', opacity: 0.6 });

        doc.end();

    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).send('Error generating sales report PDF');
    }
}

const salesReportExcel = async (req, res) => {
    try {
        console.log('Generating Excel report...');

        const date = req.query.date || null;
        let filter = {};

        if (date !== null) {
            const today = new Date();

            switch (date) {
                case 'daily':
                    filter.createdOn = {
                        $gte: new Date(today.setHours(0, 0, 0, 0)),
                        $lte: new Date(today.setHours(23, 59, 59, 999))
                    };
                    break;

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

        const orders = await Orders.find({
            ...filter,
            status: { $nin: ["cancelled", "returned"] }
        }).populate('userId', 'username email');

        if (!orders || orders.length === 0) {
            return res.status(404).send('No orders found');
        }

        // Prepare sales data
        const salesData = orders.map(order => {
            const date = new Date(order.createdOn).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric'
            });

            return {
                orderId: order.orderId.slice(-6).toUpperCase(),
                date,
                customer: order.userId?.username || 'Unknown',
                total: order.finalAmount || 0,
                discount: order.couponApplied?.amount || 0,
                coupon: order.couponApplied?.applied ? 'Yes' : 'None'
            };
        });

        const overallSalesCount = orders.length;
        const overallOrderAmount = orders.reduce((acc, o) => acc + (o.finalAmount || 0), 0);
        const overallDiscount = orders.reduce((acc, o) => acc + (o.couponApplied?.amount || 0), 0);

        // ======================
        // EXCEL SETUP
        // ======================
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Sales Report');

        // Set column widths
        sheet.columns = [
            { width: 12 }, // Order ID
            { width: 15 }, // Date
            { width: 25 }, // Customer
            { width: 15 }, // Total
            { width: 12 }, // Discount
            { width: 10 }  // Coupon
        ];

        // Header styling
        sheet.mergeCells('A1:F1');
        sheet.getCell('A1').value = 'VORAODI';
        sheet.getCell('A1').alignment = { horizontal: 'center' };
        sheet.getCell('A1').font = { size: 16, bold: true };

        sheet.mergeCells('A2:F2');
        sheet.getCell('A2').value = 'Sales Report';
        sheet.getCell('A2').alignment = { horizontal: 'center' };
        sheet.getCell('A2').font = { size: 14, bold: true };

        sheet.addRow([]);
        sheet.addRow([`Report Generated: ${new Date().toLocaleDateString('en-GB')}`]);
        sheet.addRow([`Period: Yearly`]);
        sheet.addRow([]);

        // Summary
        sheet.addRow(['Sales Summary']);
        sheet.getRow(sheet.lastRow.number).font = { bold: true };
        sheet.addRow([`Overall Sales Count: ${overallSalesCount}`]);
        sheet.addRow([`Overall Order Amount: ₹${overallOrderAmount.toLocaleString('en-IN')}`]);
        sheet.addRow([`Overall Discount: ₹${overallDiscount.toLocaleString('en-IN')}`]);
        sheet.addRow([]);

        // Table Header
        sheet.addRow(['Order ID', 'Date', 'Customer', 'Total', 'Discount', 'Coupon']);
        const headerRow = sheet.lastRow;
        headerRow.font = { bold: true };
        headerRow.alignment = { horizontal: 'center' };
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD3D3D3' } // Light gray header
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Table Rows
        salesData.forEach((s, index) => {
            const row = sheet.addRow([
                s.orderId,
                s.date,
                s.customer,
                s.total,
                s.discount,
                s.coupon
            ]);

            row.alignment = { horizontal: 'center' };
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });

            // Alternate row color
            if (index % 2 === 0) {
                row.eachCell((cell) => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF2F2F2' } // subtle light gray
                    };
                });
            }
        });

        // ======================
        // SEND EXCEL FILE
        // ======================
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename="sales_report.xlsx"'
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error generating Excel report:', error);
        res.status(500).send('Error generating Excel report');
    }
}

const getTopProducts = async (filter) => {
    try {

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
    salesReport,
    salesReportExcel
}