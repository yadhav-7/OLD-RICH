import User from "../../models/userSchema.js";
import logger from "../../utils/logger.js";
const costomerInfo = async (reqQuery) => {
    try {

        const page = parseInt(reqQuery.page, 10) || 1

        const limit = 5

        const skip = (reqQuery.page - 1) * limit

        const search = reqQuery.search || ''

        const query = {
            isAdmin: false,
            $or: [
                { username: { $regex: `.*${search}.*`, $options: 'i' } },
                { email: { $regex: `.*${search}.*`, $options: 'i' } },
            ],
        }

        const count = await User.countDocuments(query)
        const totalPages = Math.ceil(count / limit)

        const userData = await User.find(query)
            .sort({ createdOn: -1 })
            .limit(limit)
            .skip(skip)
            .exec()

        return {
            data: userData,
            currentPage: page,
            totalUsers: count,
            totalPages,
        }
    } catch (error) {
        console.error('error in customer info service ',error)
        logger.error(`error in costuomerInfo service ${error}`)
        throw error
    }
}

const blockUser = async(id)=>{
    try {
        await User.updateOne({ _id: id }, { $set: { isBlock: true } })
        return true
    } catch (error) {
        logger.error(`error in blockUseService ${error}`)
        throw new Error(error)
    }
}

const unBlockUser = async(id)=>{
    try {
        await User.updateOne({ _id: id }, { $set: { isBlock: false } })
        return true
    } catch (error) {
        logger.error(`error in unblockUser service ${error}`)
        throw new Error(error)
    }
}
export default {
    costomerInfo,
    blockUser,
    unBlockUser
}