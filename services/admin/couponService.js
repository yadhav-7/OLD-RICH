import Coupon from '../../models/couponSchema.js'
import logger from '../../utils/logger.js'

const getCoupons = async (queryParams) => {
    try {
        const search = queryParams.search || ''
        const regex = new RegExp(search, 'i')
        const currentPage = parseInt(queryParams.page || 1, 10)
        logger.info(`currentPage ${currentPage}`)
        const limit = 3

        const query = {
            $or: [{ name: { $regex: regex } }, { code: { $regex: regex } }],
        }

        const coupons = await Coupon.find(query)
            .sort({ createdOn: -1 })
            .skip((currentPage - 1) * limit)
            .limit(limit)

        const totalCount = await Coupon.countDocuments(query)
        const totalPage = Math.ceil(totalCount / limit)
        const currentDate = new Date()

        return {
            coupons,
            totalPage,
            currentPage,
            currentDate
        }
    } catch (error) {
        logger.error(`Error in getCoupons service: ${error}`)
        throw error
    }
}

const addOrUpdateCoupon = async (formData) => {
    try {
        if (!formData) return { status: false, statusCode: 400, message: 'No coupon data received' }

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
                { new: true, runValidators: true },
            )

            if (!updatedCoupon) return { status: false, statusCode: 404, message: 'Coupon not found' }

            return {
                status: true,
                statusCode: 200,
                message: 'Coupon updated successfully',
                coupon: updatedCoupon,
            }
        }

        const newCoupon = new Coupon({
            name: formData.name,
            code: formData.code,
            amount: formData.amount,
            minimumPrice: formData.minimumPrice,
            maxUsage: formData.maxUsage,
            isList: formData.isList,
            expireOn: formData.expireOn,
        })

        await newCoupon.save()

        return {
            status: true,
            statusCode: 201,
            message: 'Coupon created successfully',
            coupon: newCoupon,
        }

    } catch (error) {
        logger.error(`Error in addOrUpdateCoupon service: ${error}`)
        if (error.code === 11000) {
            return {
                status: false,
                statusCode: 400,
                message: `Duplicate field: ${Object.keys(error.keyPattern).join(', ')} already exists`,
            }
        }
        throw error
    }
}

const toggleCouponStatus = async (code) => {
    try {
        if (!code) return { status: false, statusCode: 400, message: 'Coupon code is required' }

        const coupon = await Coupon.findOne({ code })
        if (!coupon) return { status: false, statusCode: 404, message: 'Coupon not found' }

        coupon.isList = !coupon.isList
        await coupon.save()

        return {
            status: true,
            statusCode: 200,
            message: `Coupon is now ${coupon.isList ? 'Listed' : 'Unlisted'}`, // fixed property name from controller 'isListed' to 'isList' which seems used in schema
            isList: coupon.isList,
        }
    } catch (error) {
        logger.error(`Error in toggleCouponStatus service: ${error}`)
        throw error
    }
}

const deleteCoupon = async (code) => {
    try {
        if (!code) return { status: false, statusCode: 400, message: 'Coupon code is required' }

        const deletedCoupon = await Coupon.findOneAndDelete({ code })

        if (!deletedCoupon) return { status: false, statusCode: 404, message: 'Coupon not found' }

        return { status: true, statusCode: 200, message: 'Coupon deleted successfully' }
    } catch (error) {
        logger.error(`Error in deleteCoupon service: ${error}`)
        throw error
    }
}

const editCoupon = async (id, couponData) => {
    try {
        if (!couponData) return { status: false, statusCode: 401, message: 'no data' }

        if (couponData.name === couponData.code)
            return { status: false, statusCode: 401, message: 'Coupon name and code shuold be different' }

        const checkExists = await Coupon.findOne({
            code: { $regex: new RegExp(couponData.code, 'i') },
            _id: { $ne: id },
        })

        if (checkExists)
            return { status: false, statusCode: 400, message: 'Coupon already exists use another code or name!' }

        const updatedCoupon = await Coupon.findByIdAndUpdate(
            id,
            { $set: couponData },
            { new: true },
        )

        if (!updatedCoupon) return { status: false, statusCode: 400, message: 'Something went wrong try again!' } // controller says status 200 but message something went wrong? treating as error here. controller had res.json which is 200 by default. I will use 400.

        return { status: true, statusCode: 200, message: 'Coupon Updated Succussfull', updatedCoupon }

    } catch (error) {
        logger.error(`Error in editCoupon service: ${error}`)
        throw error
    }
}

export default {
    getCoupons,
    addOrUpdateCoupon,
    toggleCouponStatus,
    deleteCoupon,
    editCoupon
}
