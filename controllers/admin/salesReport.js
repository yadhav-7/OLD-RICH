const Order = require("../../models/orderSchema")
const ExcelJS = require('exceljs');

const fs = require('fs')

const PDFDocument = require('pdfkit');

const getSalesReport = async (req, res) => {
    try {

        const date = req.query.date || null
        const page = parseInt(req.query.page) || 1
        console.log('req.query.page', req.query.page)
        console.log('page', typeof page)
        let limit = 5
        let skip = (page - 1) * limit

        let filter = {}

        if (date) {

            const today = new Date()
            today.setHours(0, 0, 0, 0)

            switch (date) {
                case 'Today': {
                    const start = new Date(today);
                    const end = new Date(today);
                    end.setHours(23, 59, 59, 999);
                    filter.createdOn = { $gte: start, $lte: end };
                    break;
                }

                case 'Last 7 Days': {
                    const end = new Date(today);
                    end.setHours(23, 59, 59, 999);

                    const start = new Date(today);
                    start.setDate(start.getDate() - 6)
                    start.setHours(0, 0, 0, 0);

                    filter.createdOn = { $gte: start, $lte: end };
                    break;
                }

                case 'Last 30 Days': {
                    const end = new Date(today);
                    end.setHours(23, 59, 59, 999);

                    const start = new Date(today);
                    start.setDate(start.getDate() - 29)
                    start.setHours(0, 0, 0, 0);

                    filter.createdOn = { $gte: start, $lte: end };
                    break;
                }

                case 'Last Year': {
                    const end = new Date();
                    end.setHours(23, 59, 59, 999);

                    const start = new Date(end);
                    start.setFullYear(end.getFullYear() - 1);
                    start.setHours(0, 0, 0, 0);

                    filter.createdOn = { $gte: start, $lte: end };
                    break;
                }

                case 'custom': {
                    const { startDate, endDate } = req.query;
                    if (startDate && endDate) {
                        const start = new Date(startDate);
                        start.setHours(0, 0, 0, 0);

                        const end = new Date(endDate);
                        end.setHours(23, 59, 59, 999);

                        filter.createdOn = { $gte: start, $lte: end };
                    }
                    break;
                }
            }

        }

        const orders = await Order.find({
            ...filter,
            status: { $nin: ['returned', 'cancelled'] }
        })
            .populate('userId', 'username')
            .sort({ createdOn: -1 })
            .skip(skip)
            .limit(limit)

        let totalDoc = await Order.countDocuments({
            ...filter,
            status: { $nin: ['returned', 'cancelled'] }
        })

        let totalPage = Math.ceil(totalDoc / limit);


        //let totalPage = totalDoc/limit
        let totalSalesCount = 0;
        let OverallOrderAmount = 0;
        let OverallDiscount = 0;
        let CouponUsage = 0;
        let CouponDisCount = 0;
        let returnedAmount = 0;
        let returnCount = 0;
        let cancelledAmount = 0;
        let cancelledCount = 0;

        for (let order of orders) {
            let discountPerItem = order.couponApplied?.applied
                ? order.couponApplied.amount / order.orderedItems.length
                : 0

            if (order.status !== 'returned' && order.status !== 'cancelled') {
                order.orderedItems?.forEach(item => {
                    if (item.status !== 'returned' && item.status !== 'cancelled') {
                        totalSalesCount += item.quantity;
                        OverallOrderAmount += item.quantity * item.finalPrice;
                        OverallDiscount += (item.regularPrice - item.finalPrice) * item.quantity;
                        CouponDisCount += discountPerItem;
                    } else if (item.status === 'returned') {
                        returnedAmount += item.reFund || 0;
                        returnCount++;
                    } else if (item.status === 'cancelled') {
                        cancelledAmount += item.reFund || 0;
                        cancelledCount++;
                    }
                });
                if (order.couponApplied?.applied) CouponUsage++;
            }
        }

        const summary = {
            totalSalesCount,
            OverallOrderAmount,
            OverallDiscount,
            CouponUsage,
            CouponDisCount,
            returnedAmount,
            returnCount,
            cancelledAmount,
            cancelledCount,
            orders,
            currentPage: page,
            totalPage

        };

        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json(summary);
        } else {
            return res.render('salesReport', summary);
        }
    } catch (error) {
        console.error('error in getSalesReport', error);
        res.redirect('/pageNotFound');
    }
};


const salesReport = async (req, res) => {
    try {
        console.log('reach at salesReport')
        const date = req.query.date || null;
        let filter = {};
        if (date) {

            const today = new Date()
            today.setHours(0, 0, 0, 0)

            switch (date) {
                case 'Today': {
                    const start = new Date(today);
                    const end = new Date(today);
                    end.setHours(23, 59, 59, 999);
                    filter.createdOn = { $gte: start, $lte: end };
                    break;
                }

                case 'Last 7 Days': {
                    const end = new Date(today);
                    end.setHours(23, 59, 59, 999);

                    const start = new Date(today);
                    start.setDate(start.getDate() - 6)
                    start.setHours(0, 0, 0, 0);

                    filter.createdOn = { $gte: start, $lte: end };
                    break;
                }

                case 'Last 30 Days': {
                    const end = new Date(today);
                    end.setHours(23, 59, 59, 999);

                    const start = new Date(today);
                    start.setDate(start.getDate() - 29)
                    start.setHours(0, 0, 0, 0);

                    filter.createdOn = { $gte: start, $lte: end };
                    break;
                }

                case 'Last Year': {
                    const end = new Date();
                    end.setHours(23, 59, 59, 999);

                    const start = new Date(end);
                    start.setFullYear(end.getFullYear() - 1);
                    start.setHours(0, 0, 0, 0);

                    filter.createdOn = { $gte: start, $lte: end };
                    break;
                }

                case 'custom': {
                    const { startDate, endDate } = req.query;
                    if (startDate && endDate) {
                        const start = new Date(startDate);
                        start.setHours(0, 0, 0, 0);

                        const end = new Date(endDate);
                        end.setHours(23, 59, 59, 999);

                        filter.createdOn = { $gte: start, $lte: end };
                    }
                    break;
                }
            }

        }


        const orders = await Order.find({
            ...filter,
            status: { $nin: ["cancelled", "returned"] }
        }).populate('userId', 'username email');

        if (!orders || orders.length === 0) {
            return res.status(404).send('No orders found');
        }


        const overallSalesCount = orders.length;
        const overallOrderAmount = orders.reduce((acc, o) => acc + (o.finalAmount || 0), 0);
        const overallDiscount = orders.reduce((acc, o) => acc + (o.couponApplied?.amount || 0), 0);


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


        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');

        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        doc.pipe(res);


        doc.fontSize(22).text('Old Rich', { align: 'center' });
        doc.fontSize(16).text('Sales Report', { align: 'center' });
        doc.moveDown(0.5);

        const generatedDate = new Date().toLocaleDateString('en-GB');
        doc.fontSize(12)
            .text(`Report Generated: ${generatedDate}`, { align: 'left' })
            .text(`Period: Yearly`, { align: 'left' });
        doc.moveDown(1);

        doc.font('Helvetica-Bold').fontSize(14).text('Sales Summary', { underline: true })
        doc.moveDown(0.3)
        doc.font('Helvetica').fontSize(12)
        doc.text(`Overall Sales Count: ${overallSalesCount}`);
        doc.text(`Overall Order Amount: ₹${overallOrderAmount.toLocaleString('en-IN')}`)
        doc.text(`Overall Discount: ₹${overallDiscount.toLocaleString('en-IN')}`)
        doc.moveDown(1)

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

        doc.font('Helvetica-Bold').fontSize(12)
        doc.text('Order ID', startX, tableTop, { width: colWidths.orderId, align: 'left' })
        doc.text('Date', startX + colWidths.orderId, tableTop, { width: colWidths.date, align: 'left' })
        doc.text('Customer', startX + colWidths.orderId + colWidths.date, tableTop, { width: colWidths.customer, align: 'left' })
        doc.text('Total', startX + colWidths.orderId + colWidths.date + colWidths.customer, tableTop, { width: colWidths.total, align: 'right' })
        doc.text('Discount', startX + colWidths.orderId + colWidths.date + colWidths.customer + colWidths.total, tableTop, { width: colWidths.discount, align: 'right' })
        doc.text('Coupon', startX + colWidths.orderId + colWidths.date + colWidths.customer + colWidths.total + colWidths.discount, tableTop, { width: colWidths.coupon, align: 'center' })
        let y = tableTop + rowHeight
        doc.moveTo(startX, y - 5).lineTo(550, y - 5).stroke() // header bottom line

        doc.font('Helvetica').fontSize(11)
        salesData.forEach((s, index) => {

            if (index % 2 === 0) {
                doc.save();
                doc.fillColor('#f0f0f0', 0.5)
                doc.rect(startX, y - 2, 500, rowHeight).fill()
                doc.restore()
            }

            doc.fillColor('black')

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

        if (date) {

            const today = new Date()
            today.setHours(0, 0, 0, 0)

            switch (date) {
                case 'Today': {
                    const start = new Date(today);
                    const end = new Date(today);
                    end.setHours(23, 59, 59, 999);
                    filter.createdOn = { $gte: start, $lte: end };
                    break;
                }

                case 'Last 7 Days': {
                    const end = new Date(today);
                    end.setHours(23, 59, 59, 999);

                    const start = new Date(today);
                    start.setDate(start.getDate() - 6)
                    start.setHours(0, 0, 0, 0);

                    filter.createdOn = { $gte: start, $lte: end };
                    break;
                }

                case 'Last 30 Days': {
                    const end = new Date(today);
                    end.setHours(23, 59, 59, 999);

                    const start = new Date(today);
                    start.setDate(start.getDate() - 29)
                    start.setHours(0, 0, 0, 0);

                    filter.createdOn = { $gte: start, $lte: end };
                    break;
                }

                case 'Last Year': {
                    const end = new Date();
                    end.setHours(23, 59, 59, 999);

                    const start = new Date(end);
                    start.setFullYear(end.getFullYear() - 1);
                    start.setHours(0, 0, 0, 0);

                    filter.createdOn = { $gte: start, $lte: end };
                    break;
                }

                case 'custom': {
                    const { startDate, endDate } = req.query;
                    if (startDate && endDate) {
                        const start = new Date(startDate);
                        start.setHours(0, 0, 0, 0);

                        const end = new Date(endDate);
                        end.setHours(23, 59, 59, 999);

                        filter.createdOn = { $gte: start, $lte: end };
                    }
                    break;
                }
            }

        }

        const orders = await Order.find({
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
        sheet.getCell('A1').value = 'Old Rich';
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


module.exports = {
    getSalesReport,
    salesReportExcel,
    salesReport
}