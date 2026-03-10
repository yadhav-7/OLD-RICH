import Order from '../../models/orderSchema.js'
import logger from '../../utils/logger.js'
import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'

const getSalesReportData = async (queryParams) => {
    try {
        const date = queryParams.date || null
        const page = parseInt(queryParams.page, 10) || 1
        const limit = 5
        const skip = (page - 1) * limit

        const filter = {}

        if (date) {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            switch (date) {
                case 'Today': {
                    const start = new Date(today)
                    const end = new Date(today)
                    end.setHours(23, 59, 59, 999)
                    filter.createdOn = { $gte: start, $lte: end }
                    break
                }

                case 'Last 7 Days': {
                    const end = new Date(today)
                    end.setHours(23, 59, 59, 999)

                    const start = new Date(today)
                    start.setDate(start.getDate() - 6)
                    start.setHours(0, 0, 0, 0)

                    filter.createdOn = { $gte: start, $lte: end }
                    break
                }

                case 'Last 30 Days': {
                    const end = new Date(today)
                    end.setHours(23, 59, 59, 999)

                    const start = new Date(today)
                    start.setDate(start.getDate() - 29)
                    start.setHours(0, 0, 0, 0)

                    filter.createdOn = { $gte: start, $lte: end }
                    break
                }

                case 'Last Year': {
                    const end = new Date()
                    end.setHours(23, 59, 59, 999)

                    const start = new Date(end)
                    start.setFullYear(end.getFullYear() - 1)
                    start.setHours(0, 0, 0, 0)

                    filter.createdOn = { $gte: start, $lte: end }
                    break
                }

                case 'custom': {
                    const { startDate, endDate } = queryParams
                    if (startDate && endDate) {
                        const start = new Date(startDate)
                        start.setHours(0, 0, 0, 0)

                        const end = new Date(endDate)
                        end.setHours(23, 59, 59, 999)

                        filter.createdOn = { $gte: start, $lte: end }
                    }
                    break
                }

                default:
                    break
            }
        }

        const orders = await Order.find(filter)
            .populate('userId', 'username')
            .sort({ createdOn: -1 })

        const totalDoc = await Order.countDocuments(filter)
        const totalPage = Math.ceil(totalDoc / limit)

        let totalSalesCount = 0
        let OverallOrderAmount = 0
        let OverallDiscount = 0
        let CouponUsage = 0
        let CouponDisCount = 0
        let returnedAmount = 0
        let returnCount = 0
        let cancelledAmount = 0
        let cancelledCount = 0

        for (const order of orders) {
            if (order.status !== 'returned' && order.status !== 'cancelled' && order.status !== 'Failed') {
                totalSalesCount++
                OverallOrderAmount += order.finalAmount || 0
                // order.discount already includes both product/offer and coupon discounts
                OverallDiscount += order.discount || 0
                if (order.couponApplied?.applied) {
                    CouponUsage++
                    CouponDisCount += order.couponApplied.amount || 0
                }
            } else if (order.status === 'returned') {
                returnedAmount += order.finalAmount || 0
                returnCount++
            } else if (order.status === 'cancelled') {
                cancelledAmount += order.finalAmount || 0
                cancelledCount++
            }
        }

        const paginatedOrders = orders.slice(skip, limit + skip)

        return {
            totalSalesCount,
            OverallOrderAmount,
            OverallDiscount,
            CouponUsage,
            CouponDisCount,
            returnedAmount,
            returnCount,
            cancelledAmount,
            cancelledCount,
            orders: paginatedOrders,
            currentPage: page,
            totalPage,
        }
    } catch (error) {
        logger.error(`Error in getSalesReportData service: ${error}`)
        throw error
    }
}

const generateSalesPDF = async (queryParams, res) => {
    try {
        const date = queryParams.date || null
        const filter = {}

        if (date) {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            switch (date) {
                case 'Today': {
                    const start = new Date(today)
                    const end = new Date(today)
                    end.setHours(23, 59, 59, 999)
                    filter.createdOn = { $gte: start, $lte: end }
                    break
                }
                case 'Last 7 Days': {
                    const end = new Date(today)
                    end.setHours(23, 59, 59, 999)
                    const start = new Date(today)
                    start.setDate(start.getDate() - 6)
                    start.setHours(0, 0, 0, 0)
                    filter.createdOn = { $gte: start, $lte: end }
                    break
                }
                case 'Last 30 Days': {
                    const end = new Date(today)
                    end.setHours(23, 59, 59, 999)
                    const start = new Date(today)
                    start.setDate(start.getDate() - 29)
                    start.setHours(0, 0, 0, 0)
                    filter.createdOn = { $gte: start, $lte: end }
                    break
                }
                case 'Last Year': {
                    const end = new Date()
                    end.setHours(23, 59, 59, 999)
                    const start = new Date(end)
                    start.setFullYear(end.getFullYear() - 1)
                    start.setHours(0, 0, 0, 0)
                    filter.createdOn = { $gte: start, $lte: end }
                    break
                }
                case 'custom': {
                    const { startDate, endDate } = queryParams
                    if (startDate && endDate) {
                        const start = new Date(startDate)
                        start.setHours(0, 0, 0, 0)
                        const end = new Date(endDate)
                        end.setHours(23, 59, 59, 999)
                        filter.createdOn = { $gte: start, $lte: end }
                    }
                    break
                }
                default:
                    break
            }
        }

        const orders = await Order.find(filter).populate('userId', 'username email').sort({ createdOn: -1 })

        const overallSalesCount = orders.filter(o => o.status !== 'cancelled' && o.status !== 'returned' && o.status !== 'Failed').length
        const overallOrderAmount = orders.filter(o => o.status !== 'cancelled' && o.status !== 'returned' && o.status !== 'Failed').reduce(
            (acc, o) => acc + (o.finalAmount || 0),
            0,
        )
        const overallDiscount = orders.filter(o => o.status !== 'cancelled' && o.status !== 'returned' && o.status !== 'Failed').reduce(
            (acc, o) => acc + (o.discount || 0),
            0,
        )

        const salesData = orders.map((order) => {
            const orderDate = new Date(order.createdOn).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            })

            return {
                orderId: order.orderId.slice(-6).toUpperCase(),
                date: orderDate,
                customer: order.userId?.username || 'Unknown',
                total: order.finalAmount || 0,
                discount: order.discount || 0,
                coupon: order.couponApplied?.applied ? 'Yes' : 'None',
                status: order.status || 'N/A'
            }
        })

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader(
            'Content-Disposition',
            'attachment; filename="sales_report.pdf"',
        )

        const doc = new PDFDocument({ margin: 40, size: 'A4' })
        doc.pipe(res)

        doc.fontSize(22).text('Old Rich', { align: 'center' })
        doc.fontSize(16).text('Sales Report', { align: 'center' })
        doc.moveDown(0.5)

        const generatedDate = new Date().toLocaleDateString('en-GB')
        doc
            .fontSize(12)
            .text(`Report Generated: ${generatedDate}`, { align: 'left' })
            .text(`Period: ${date || 'All Time'}`, { align: 'left' })
        doc.moveDown(1)

        doc
            .font('Helvetica-Bold')
            .fontSize(14)
            .text('Sales Summary', { underline: true })
        doc.moveDown(0.3)
        doc.font('Helvetica').fontSize(12)
        doc.text(`Overall Sales Count: ${overallSalesCount}`)
        doc.text(
            `Overall Order Amount: ₹${overallOrderAmount.toLocaleString('en-IN')}`,
        )
        doc.text(`Overall Discount: ₹${overallDiscount.toLocaleString('en-IN')}`)
        doc.moveDown(1)

        const tableTop = doc.y
        const rowHeight = 20
        const colWidths = {
            orderId: 60,
            date: 80,
            customer: 120,
            total: 70,
            discount: 60,
            coupon: 60,
            status: 70
        }
        const startX = 50

        doc.font('Helvetica-Bold').fontSize(12)
        doc.text('Order ID', startX, tableTop, { width: colWidths.orderId })
        doc.text('Date', startX + colWidths.orderId, tableTop, {
            width: colWidths.date,
        })
        doc.text(
            'Customer',
            startX + colWidths.orderId + colWidths.date,
            tableTop,
            { width: colWidths.customer },
        )
        doc.text(
            'Total',
            startX + colWidths.orderId + colWidths.date + colWidths.customer,
            tableTop,
            { width: colWidths.total, align: 'right' },
        )
        doc.text(
            'Discount',
            startX +
            colWidths.orderId +
            colWidths.date +
            colWidths.customer +
            colWidths.total,
            tableTop,
            { width: colWidths.discount, align: 'right' },
        )
        doc.text(
            'Coupon',
            startX +
            colWidths.orderId +
            colWidths.date +
            colWidths.customer +
            colWidths.total +
            colWidths.discount,
            tableTop,
            { width: colWidths.coupon, align: 'center' },
        )
        doc.text(
            'Status',
            startX +
            colWidths.orderId +
            colWidths.date +
            colWidths.customer +
            colWidths.total +
            colWidths.discount +
            colWidths.coupon,
            tableTop,
            { width: colWidths.status, align: 'center' },
        )

        let y = tableTop + rowHeight
        doc
            .moveTo(startX, y - 5)
            .lineTo(550, y - 5)
            .stroke()

        doc.font('Helvetica').fontSize(11)

        salesData.forEach((s, index) => {
            if (index % 2 === 0) {
                doc.save()
                doc.fillColor('#f0f0f0', 0.5)
                doc.rect(startX, y - 2, 500, rowHeight).fill()
                doc.restore()
            }

            doc.fillColor('black')
            doc.text(s.orderId, startX, y, { width: colWidths.orderId })
            doc.text(s.date, startX + colWidths.orderId, y, { width: colWidths.date })
            doc.text(s.customer, startX + colWidths.orderId + colWidths.date, y, {
                width: colWidths.customer,
            })
            doc.text(
                `₹${s.total.toLocaleString('en-IN')}`,
                startX + colWidths.orderId + colWidths.date + colWidths.customer,
                y,
                { width: colWidths.total, align: 'right' },
            )
            doc.text(
                s.discount.toLocaleString('en-IN'),
                startX +
                colWidths.orderId +
                colWidths.date +
                colWidths.customer +
                colWidths.total,
                y,
                { width: colWidths.discount, align: 'right' },
            )
            doc.text(
                s.coupon,
                startX +
                colWidths.orderId +
                colWidths.date +
                colWidths.customer +
                colWidths.total +
                colWidths.discount,
                y,
                { width: colWidths.coupon, align: 'center' },
            )
            doc.text(
                s.status,
                startX +
                colWidths.orderId +
                colWidths.date +
                colWidths.customer +
                colWidths.total +
                colWidths.discount +
                colWidths.coupon,
                y,
                { width: colWidths.status, align: 'center' },
            )

            y += rowHeight

            if (y > 750) {
                doc.addPage()
                y = 50
            }
        })

        doc.moveDown(1)
        doc
            .fontSize(10)
            .fillColor('gray')
            .text('--- End of Report ---', { align: 'center', opacity: 0.6 })

        doc.end()
        return { status: true }
    } catch (error) {
        logger.error(`Error in generateSalesPDF service: ${error}`)
        throw error
    }
}

const generateSalesExcel = async (queryParams, res) => {
    try {
        const date = queryParams.date || null
        const filter = {}

        if (date) {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            switch (date) {
                case 'Today': {
                    const start = new Date(today)
                    const end = new Date(today)
                    end.setHours(23, 59, 59, 999)
                    filter.createdOn = { $gte: start, $lte: end }
                    break
                }
                case 'Last 7 Days': {
                    const end = new Date(today)
                    end.setHours(23, 59, 59, 999)
                    const start = new Date(today)
                    start.setDate(start.getDate() - 6)
                    start.setHours(0, 0, 0, 0)
                    filter.createdOn = { $gte: start, $lte: end }
                    break
                }
                case 'Last 30 Days': {
                    const end = new Date(today)
                    end.setHours(23, 59, 59, 999)
                    const start = new Date(today)
                    start.setDate(start.getDate() - 29)
                    start.setHours(0, 0, 0, 0)
                    filter.createdOn = { $gte: start, $lte: end }
                    break
                }
                case 'Last Year': {
                    const end = new Date()
                    end.setHours(23, 59, 59, 999)
                    const start = new Date(end)
                    start.setFullYear(end.getFullYear() - 1)
                    start.setHours(0, 0, 0, 0)
                    filter.createdOn = { $gte: start, $lte: end }
                    break
                }
                case 'custom': {
                    const { startDate, endDate } = queryParams
                    if (startDate && endDate) {
                        const start = new Date(startDate)
                        start.setHours(0, 0, 0, 0)
                        const end = new Date(endDate)
                        end.setHours(23, 59, 59, 999)
                        filter.createdOn = { $gte: start, $lte: end }
                    }
                    break
                }
                default: {
                    filter.createdOn = { $exists: true }
                    break
                }
            }
        }

        const orders = await Order.find(filter).populate('userId', 'username email').sort({ createdOn: -1 })

        if (!orders || orders.length === 0) {
            return { status: false, statusCode: 404, message: 'No orders found' }
        }

        const salesData = orders.map((order) => {
            const orderDate = new Date(order.createdOn).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            })

            return {
                orderId: order.orderId.slice(-6).toUpperCase(),
                date: orderDate,
                customer: order.userId?.username || 'Unknown',
                total: order.finalAmount || 0,
                discount: order.discount || 0,
                coupon: order.couponApplied?.applied ? 'Yes' : 'None',
                status: order.status || 'N/A'
            }
        })

        const validOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'returned' && o.status !== 'Failed')
        const overallSalesCount = validOrders.length
        const overallOrderAmount = validOrders.reduce(
            (acc, o) => acc + (o.finalAmount || 0),
            0,
        )
        const overallDiscount = validOrders.reduce(
            (acc, o) => acc + (o.discount || 0),
            0,
        )

        const workbook = new ExcelJS.Workbook()
        const sheet = workbook.addWorksheet('Sales Report')

        sheet.columns = [
            { width: 12 },
            { width: 15 },
            { width: 25 },
            { width: 15 },
            { width: 12 },
            { width: 10 },
            { width: 15 },
        ]

        sheet.mergeCells('A1:G1')
        sheet.getCell('A1').value = 'Old Rich'
        sheet.getCell('A1').alignment = { horizontal: 'center' }
        sheet.getCell('A1').font = { size: 16, bold: true }

        sheet.mergeCells('A2:G2')
        sheet.getCell('A2').value = 'Sales Report'
        sheet.getCell('A2').alignment = { horizontal: 'center' }
        sheet.getCell('A2').font = { size: 14, bold: true }

        sheet.addRow([])
        sheet.addRow([
            `Report Generated: ${new Date().toLocaleDateString('en-GB')}`,
        ])
        sheet.addRow([`Period: ${date || 'All Time'}`])
        sheet.addRow([])

        sheet.addRow(['Sales Summary'])
        sheet.getRow(sheet.lastRow.number).font = { bold: true }
        sheet.addRow([`Overall Sales Count: ${overallSalesCount}`])
        sheet.addRow([
            `Overall Order Amount: ₹${overallOrderAmount.toLocaleString('en-IN')}`,
        ])
        sheet.addRow([
            `Overall Discount: ₹${overallDiscount.toLocaleString('en-IN')}`,
        ])
        sheet.addRow([])

        sheet.addRow([
            'Order ID',
            'Date',
            'Customer',
            'Total',
            'Discount',
            'Coupon',
            'Status',
        ])
        const headerRow = sheet.lastRow
        headerRow.font = { bold: true }
        headerRow.alignment = { horizontal: 'center' }
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD3D3D3' },
            }
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            }
        })

        salesData.forEach((s, index) => {
            const row = sheet.addRow([
                s.orderId,
                s.date,
                s.customer,
                s.total,
                s.discount,
                s.coupon,
                s.status,
            ])

            row.alignment = { horizontal: 'center' }
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                }
            })

            if (index % 2 === 0) {
                row.eachCell((cell) => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF2F2F2' },
                    }
                })
            }
        })

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        res.setHeader(
            'Content-Disposition',
            'attachment; filename="sales_report.xlsx"',
        )

        await workbook.xlsx.write(res)
        res.end()
        return { status: true }
    } catch (error) {
        logger.error(`Error in generateSalesExcel service: ${error}`)
        throw error
    }
}

export default {
    getSalesReportData,
    generateSalesPDF,
    generateSalesExcel
}
