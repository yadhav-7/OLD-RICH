const Coupon = require('../../models/couponSchema')

const getCouponPage = async (req, res) => {
    try {

        
        let search = req.query.search || ''
          

        const regex = new RegExp(search, 'i')
        
        let currentPage = parseInt(req.query.page || 1);
        console.log('currentPage',currentPage)
        let limit = 3;

 
        const query = {
            $or: [
                { name: { $regex: regex } },
                { code: { $regex: regex } }
            ]
        }

        const coupons = await Coupon.find(query)
            .sort({ createdOn: -1 })
            .skip((currentPage - 1) * limit)
            .limit(limit);

        let totalCount = await Coupon.countDocuments(query)
        let totalPage = Math.ceil(totalCount / limit)
        const currentDate = new Date();

    

        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(200).json({ coupons, currentDate, currentPage, totalPage });
        } else {
            return res.render('couponManagement', { coupons, currentDate, currentPage, totalPage });
        }
    } catch (error) {
        console.error('error in getCouponPage', error);
        res.redirect('/pageNotFound');
    }
}

const addCoupons = async (req, res) => {
    try {
       
        const { formData } = req.body;

        if (!formData) {
            return res.status(400).json({ message: 'No coupon data received' });
        }

        //  If editing an existing coupon
        if (formData.id) {
            const updatedCoupon = await Coupon.findByIdAndUpdate(
                formData.id,
                {
                    $set: {
                        name: formData.name,
                        code: formData.code,
                        amount: formData.amount,
                        minimumPrice: formData.minimumPrice,
                        maxUsage: formData.maxUsage,
                        isList: formData.isList,
                        expireOn: formData.expireOn,
                    },
                },
                { new: true, runValidators: true }
            );

            if (!updatedCoupon) {
                return res.status(404).json({ message: 'Coupon not found' });
            }

            return res.status(200).json({
                message: 'Coupon updated successfully',
                coupon: updatedCoupon,
            });
        }

        // ✅ If creating a new coupon
        const newCoupon = new Coupon({
            name: formData.name,
            code: formData.code,
            amount: formData.amount,
            minimumPrice: formData.minimumPrice,
            maxUsage: formData.maxUsage,
            isList: formData.isList,
            expireOn: formData.expireOn,
        });

        await newCoupon.save();

        res.status(201).json({
            message: 'Coupon created successfully',
            coupon: newCoupon,
        });
    } catch (error) {
        console.error('Error in addCoupons:', error);

        // Handle duplicate key error (name/code already exists)
        if (error.code === 11000) {
            return res.status(400).json({
                message: `Duplicate field: ${Object.keys(error.keyPattern).join(', ')} already exists`,
            });
        }

        res.status(500).json({
            message: 'Internal Server Error',
            error: error.message,
        });
    }
};


const listUnlistCoupon = async (req, res) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.status(400).json({ success: false, message: "Coupon code is required" });
        }

        // Find and update in one step
        const coupon = await Coupon.findOne({ code });
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        // Toggle the isListed field
        coupon.isList = !coupon.isList;
        await coupon.save();

        return res.status(200).json({
            success: true,
            message: `Coupon is now ${coupon.isListed ? "Listed" : "Unlisted"}`,
            isListed: coupon.isListed
        });

    } catch (error) {
        console.error("Error toggling coupon:", error);
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

const deleteCoupon = async (req, res) => {
    try {
        console.log('yes im reached hear')
        const { code } = req.query;

        if (!code) {
            return res.status(400).json({ success: false, message: "Coupon code is required" });
        }

        const deletedCoupon = await Coupon.findOneAndDelete({ code });

        if (!deletedCoupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        return res.status(200).json({ success: true, message: "Coupon deleted successfully" });
    } catch (error) {
        console.error("Error deleting coupon:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

const editCoupon = async (req, res) => {
    try {

        const id = req.query.id
 
        const {couponData} = req.body
      
        if (!couponData) return res.status(401).json({ message: 'no data' })
        const checkExists = await Coupon.find({
            $or: [
                { name: { $regex: new RegExp(couponData.name, "i") } },
                { code: { $regex: new RegExp(couponData.code, "i") } }
            ],
            _id:{$ne:id}
        });

        if (checkExists.length>0) return res.status(400).json({ message: 'Coupon already exists use another code or name!' })

            const updatedCoupon = await Coupon.findByIdAndUpdate(
                id,
                {$set:couponData},
                {new:true}
            )

            if(!updatedCoupon){
                return res.json({message:'Something went wrong try again!'})
            }

            return res.status(200).json({message:'Coupon Updated Succussfull'})

    } catch (error) {
        console.error('error in editCoupon', error)
    }
}


module.exports = {
    getCouponPage,
    addCoupons,
    listUnlistCoupon,
    deleteCoupon,
    editCoupon
}