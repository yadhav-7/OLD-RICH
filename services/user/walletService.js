import User from '../../models/userSchema.js'
import Wallet from '../../models/walletSchema.js'
import logger from '../../utils/logger.js'
import Cart from '../../models/cartSchema.js'

const getWallet = async (userId) => {
    try {
        const user = await User.findById({ _id: userId })
        const cart = await Cart.findOne({ userId: userId })
        const length = cart?.items?.length || 0
        const wallet = await Wallet.findOne({ userId }).sort({
            createdAt: -1,
        })
        if (wallet && wallet.transactions) {
            wallet.transactions?.sort((a, b) => b.createdAt - a.createdAt)
        }

        return {
            status: true,
            render: 'wallet',
            data: { user, wallet, length }
        }
    } catch (error) {
        logger.error(`Error in getWallet service: ${error}`)
        throw error
    }
}

const applyReferralCode = async (userId, code) => {
    try {
        const newUser = await User.findOne({ _id: userId })

        if (newUser.refferalCodeApplied === 'used')
            return { status: false, statusCode: 401, message: 'You already applied refferal code!' }

        if (!code) return { status: false, statusCode: 401, message: 'Please enter code!' }
        if (code.length !== 6)
            return { status: false, statusCode: 401, message: 'Please enter 6 digit code!' }

        if (code === newUser.referCode)
            return { status: false, statusCode: 401, message: 'You cant use your own refferal code' }

        const findUser = await User.findOne({ referralCode: code })

        if (!findUser)
            return { status: false, statusCode: 401, message: 'Invalid Referral Code!' }

        const existingUserId = findUser._id
        const wallet = await Wallet.findOne({ userId: existingUserId })

        if (!wallet)
            return { status: false, statusCode: 401, message: 'Wallet not found! Please contact support.' }

        const newTransaction = {
            type: 'credit',
            amount: 100,
            reason: 'New user registered by your reference',
        }

        wallet.transactions.push(newTransaction)
        wallet.balance += 100
        wallet.totalCredited += 100

        newUser.refferalCodeApplied = 'used'

        await newUser.save()
        await wallet.save()

        return {
            status: true,
            statusCode: 200,
            message: 'Referral applied successfully!',
            wallet,
        }
    } catch (error) {
        logger.error(`Error in applyReferralCode service: ${error}`)
        throw error
    }
}

const skipReferral = async (userId) => {
    try {
        const user = await User.findOne({ _id: userId })
        user.refferalCodeApplied = 'notUsed'
        await user.save()
        return { status: true, statusCode: 200, redirectUrl: '/' }
    } catch (error) {
        logger.error(`Error in skipReferral service: ${error}`)
        throw error
    }
}

const checkReferralStatus = async (userId) => {
    try {
        const user = await User.findOne({ _id: userId })
        if (
            user.refferalCodeApplied === 'notUsed' ||
            user.refferalCodeApplied === 'used'
        ) {
            return { redirect: true, url: '/' }
        }
        return { redirect: false, render: 'refferalCodeEnterPage' }
    } catch (error) {
        logger.error(`Error in checkReferralStatus service: ${error}`)
        throw error
    }
}

export default {
    getWallet,
    applyReferralCode,
    skipReferral,
    checkReferralStatus
}
