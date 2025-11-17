const Order = require('../../models/orderSchema');
const User = require('../../models/userSchema')
const Product = require('../../models/productSchema')
const Cart = require('../../models/cartSchema')
const Wallet = require('../../models/walletSchema')
const PDFDocument = require('pdfkit')
const mongoose = require('mongoose'); // make sure you imported this
const orderDetailPage = async (req, res) => {
    try {
        const userId = req.session.user
        const user = await User.findOne({ _id: userId, isBlock: false })

        const id = req.query.orderId;
        console.log('req.query.orderId', req.query.orderId)
        console.log('id', id)
        const order = await Order.findOne({ orderId: id }).populate('orderedItems.product') // or findOne({ orderId: id }) if it's a custom ID

        const cart = await Cart.findOne({ userId: userId })

        const length = cart.items?.length

        res.render('orderDetailPages', { order, user, length });

    } catch (error) {
        console.error('error in orderDetailPages', error);
        res.redirect('/pageNotFound')
    }
}


const cencellOrder = async (req, res) => {
    try {
        const orderId = req.body.orderId;
        let refund = 0
        let productIds = [];
        let productQuantity = 0
        let newTransactionRefund = 0

        const order = await Order.findOne({ orderId });
        if (!order) return res.status(400).json({ message: 'Order not found' });

        const alreadyCancelled = [];
        for (let item of order.orderedItems) {
            if (item.status !== 'Delivered' && item.status !== 'cancelled') {
          
                if (order.paymentStatus === 'Completed') {
                    refund += item.quantity * item.finalPrice;
                    newTransactionRefund+=item.quantity * item.finalPrice
                    item.reFund = item.quantity * item.finalPrice;
                    item.reFundStatus = 'Completed';
                    productIds.push(item.product);
                    productQuantity++;
                }
                item.status = 'cancelled';
            } else if (item.status === 'cancelled') {
                alreadyCancelled.push(item._id)
                refund += item.quantity * item.finalPrice;
            }
        }

        order.status = 'cancelled';
        if (order.paymentStatus === 'Completed') {
            order.reFund = refund;
            order.reFundStatus = 'Completed';
        }


        if (refund > 0) {
            const userWallet = await Wallet.findOne({ userId: order.userId });
            userWallet.balance += refund;
            userWallet.totalCredited += refund;

            userWallet.transactions.push({
                type: 'credit',
                amount: newTransactionRefund,
                reason: 'Amount credited for cancelled order',
                orderId: order.orderId,
                productId: productIds,
                productQuantity: productQuantity,
                createdAt: new Date()
            });

            await userWallet.save();
        }

        await order.save();

        for (let item of order.orderedItems) {
            if (!alreadyCancelled.includes(item._id)) {
                let product = await Product.findById(item.product);
                if (product?.variants) {
                    const variant = product.variants.find(v => v.size === item.size);
                    if (variant) {
                        variant.quantity += item.quantity;
                        await product.save();
                    }
                }
            }
        }

        return res.status(200).json({ message: 'Order cancelled successfully' });
    } catch (error) {
        console.error('Error in cancelOrder:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}


const cancelSingleItem = async (req, res) => {
    try {
        const { orderId, itemId } = req.body;

        const order = await Order.findOne({ orderId });

        if (!order) return res.status(404).json({ message: 'Order not found' });

        let refund = 0;
        let productIds = [];
        let productQuantity = 0;

        let productId = null;
        let itemSize = null;
        let quantity = 0;

        order.orderedItems = order.orderedItems.map(item => {
            if (item._id.toString() === itemId && item.status !== 'cancelled') {
                item.status = 'cancelled'
                productId = item.product
                itemSize = item.size
                quantity = item.quantity

                if (order.paymentStatus === 'Completed') {
                    refund += item.quantity * item.finalPrice;
                    item.reFund = item.quantity * item.finalPrice;
                    item.reFundStatus = 'Completed';
                    productIds.push(item.product);
                    productQuantity++;
                }
            }
            return item
        })


        const allCancelled = order.orderedItems.every(i => i.status === 'cancelled');
        if (allCancelled) {
            order.status = 'cancelled';
            if (order.paymentStatus === 'Completed') {
                order.reFund = order.orderedItems.reduce((sum, i) => sum + (i.reFund || 0), 0);
                order.reFundStatus = 'Completed';
            }
        }

    
        if (refund > 0) {
            const userWallet = await Wallet.findOne({ userId: order.userId });
            userWallet.balance += refund;
            userWallet.totalCredited += refund;

            userWallet.transactions.push({
                type: 'credit',
                amount: refund,
                reason: 'Amount credited for cancelled product',
                orderId: order.orderId,
                productId: productIds,
                productQuantity: productQuantity,
                createdAt: new Date()
            });

            await userWallet.save();
        }

        await order.save()
        if (productId && itemSize && quantity > 0) {
            const cancelledProduct = await Product.findById(productId);
            if (cancelledProduct) {
                const variant = cancelledProduct.variants.find(v => v.size === itemSize);
                if (variant) {
                    variant.quantity += quantity;
                    await cancelledProduct.save();
                }
            }
        }

        return res.status(200).json({
            message: 'Item cancelled successfully',
            finalAmount: order.finalAmount,
            total: order.totalPrice
        });
    } catch (error) {
        console.error('Error in cancelSingleItem:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}


const returnReq = async (req, res) => {
    try {

        const { itemId, orderId, reason } = req.body;

        const order = await Order.findOne({ orderId: orderId });

        if (!order) return res.status(400).json({ message: 'Order not found' });

        if (order.status !== 'Delivered') {
            return res.status(400).json({ message: 'Order not yet delivered. Return not possible.' });
        }
        if (!reason) return res.status(500).json({ message: 'Reason required!' })

        let orderedItems = order.orderedItems



        if (itemId) {
            orderedItems = orderedItems.map((item) => {
                if (item._id.toString() === itemId) {
                    if(item.status==='returned'||item.status==='cancelled')return item

                    item.status = 'returnRequested'
                    item.returnReason = reason
                }
                return item
            })

        } else {
            orderedItems = orderedItems.map((item) => {
                if(item.status==='returned'||item.status==='cancelled')return item
                item.status = 'returnRequested'
                return item
            })
            order.status = 'returnRequested'
            order.returnReason = reason
        }

        let checkAllStatus = orderedItems.every((item) => item.status === 'returnRequested')


        if (checkAllStatus) order.status = 'returnRequested'

        if (!orderedItems) return res.status(500).json({ message: 'something went wrong' })

        order.orderedItems = orderedItems





        await order.save();

        res.status(200).json({ message: 'Return request submitted successfully' });

    } catch (error) {
        console.error('error in returnReq', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}



const generateInvoice = async (req, res) => {
    try {
        const orderId = req.query.orderId;

        const order = await Order.findOne({ orderId })
            .populate("userId")
            .populate("orderedItems.product");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const invoiceName = `invoice_${order.orderId}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${invoiceName}"`
        );

        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);

        // =========================
        // HEADER SECTION
        // =========================
        doc
            .fontSize(28)
            .fillColor("#000")
            .text("OLD RICH", { align: "center", underline: true });
        
        doc.moveDown(0.5);
        doc
            .fontSize(14)
            .fillColor("#333")
            .text("Luxury Fashion & Lifestyle", { align: "center" })
            .moveDown(1.5);

        doc.fontSize(22).fillColor("#000").text("INVOICE", { align: "center" });
        doc.moveDown();

        // =========================
        // ORDER INFORMATION
        // =========================
        doc.fontSize(12).fillColor("#000");
        doc.text(`Invoice Date: ${order.invoiceDate || new Date().toDateString()}`);
        doc.text(`Order ID: ${order.orderId}`);
        doc.text(`Payment Method: ${order.paymentMethod}`);
        doc.moveDown();

        // =========================
        // CUSTOMER INFORMATION
        // =========================
        doc.fontSize(14).text("Customer Details", { underline: true });
        doc.moveDown(0.5);

        doc.fontSize(12)
            .text(`Name: ${order.address.name}`)
            .text(`Phone: ${order.address.phone}`)
            .text(`Address: ${order.address.street}, ${order.address.city}, ${order.address.state}`)
            .moveDown();

        // =========================
        // ORDER TABLE HEADER
        // =========================
        const tableTop = doc.y + 10;

        doc.rect(50, tableTop, 500, 30).fill("#f2f2f2").stroke();
        doc.fillColor("#000").fontSize(12);

        doc.text("Item", 60, tableTop + 10);
        doc.text("Size", 220, tableTop + 10);
        doc.text("Qty", 300, tableTop + 10);
        doc.text("Price (₹)", 360, tableTop + 10);
        doc.text("Total (₹)", 450, tableTop + 10);

        doc.moveDown(2);

        let yPos = tableTop + 40;
        
        // =========================
        // ORDER TABLE ROWS
        // =========================
        order.orderedItems.forEach((item) => {
            doc.rect(50, yPos, 500, 30).stroke();

            doc.text(item.productName, 60, yPos + 10);
            doc.text(item.size, 220, yPos + 10);
            doc.text(item.quantity.toString(), 300, yPos + 10);
            doc.text(item.price.toFixed(2), 360, yPos + 10);
            doc.text(item.finalPrice.toFixed(2), 450, yPos + 10);

            yPos += 30;
        });

        doc.moveDown(2);

        // =========================
        // TOTAL SUMMARY BOX
        // =========================
        const summaryTop = yPos + 20;

        doc.rect(300, summaryTop, 250, 90).fill("#f2f2f2").stroke();
        doc.fillColor("#000").fontSize(12);

        doc.text(`Subtotal: ₹${order.totalPrice}`, 320, summaryTop + 10);
        doc.text(`Discount: ₹${order.discount}`, 320, summaryTop + 35);
        doc.fontSize(14).text(
            `Final Amount: ₹${order.finalAmount}`,
            320,
            summaryTop + 60
        );

        // =========================
        // FOOTER
        // =========================
        doc.moveDown(4);
        doc.fontSize(11).fillColor("#666").text(
            "Thank you for shopping with OLD RICH.",
            { align: "center" }
        );
        doc.text(
            "Luxury Delivered To Your Doorstep.",
            { align: "center" }
        );

        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Invoice generation failed",
            error: err.message,
        });
    }
};


module.exports = {
    orderDetailPage,
    cencellOrder,
    cancelSingleItem,
    returnReq,
    generateInvoice
}