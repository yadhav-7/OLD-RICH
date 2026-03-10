import mongoose from 'mongoose'
import logger from '../../utils/logger.js'
import addressService from '../../services/user/addressService.js'

const addAddress = async (req, res) => {
  try {
    const { user } = req.session

    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' })
    }

    const {
      name,
      phone,
      addressType,
      country,
      state,
      city,
      street,
      pincode,
    } = req.body || req.body.addressData

    if (
      !name ||
      !phone ||
      !addressType ||
      !country ||
      !state ||
      !city ||
      !street ||
      !pincode
    ) {
      return res
        .status(400)
        .json({ message: 'All required fields must be provided' })
    }

    const result = await addressService.addAddress(
      user,
      req.body || req.body.addressData
    )

    if (!result.status) {
      return res.status(result.statusCode).json({ message: result.message })
    }

    return res
      .status(result.statusCode)
      .json({ message: result.message, address: result.address })
  } catch (error) {
    logger.error(`Error from adding address: ${error}`)
    return res.status(500).json({
      message: 'An error occurred while adding the address',
      error: error.message,
    })
  }
}

const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.query
    const userId = req.session.user?._id || req.session.user

    // 1. Check login
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized access' })
    }

    // 2. Check addressId presence
    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid address ID' })
    }

    const result = await addressService.deleteAddress(userId, addressId)

    if (!result.status) {
      return res
        .status(result.statusCode)
        .json({ success: false, message: result.message })
    }

    return res
      .status(result.statusCode)
      .json({ success: true, message: result.message })
  } catch (error) {
    logger.error(` Error from deleteAddress: ${error}`)
    return res
      .status(500)
      .json({ message: 'Something went wrong', error: error.message })
  }
}

const editAddress = async (req, res) => {
  try {
    const { addressId } = req.query
    const userId = req.session.user

    if (!addressId || !userId) {
      return res.status(400).json({ error: 'Missing required identifiers' })
    }

    const {
      addressType,
      name,
      street,
      city,
      state,
      pincode,
      country,
      phone,
    } = req.body

    if (
      !addressType ||
      !name ||
      !street ||
      !city ||
      !state ||
      !pincode ||
      !country ||
      !phone
    ) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const result = await addressService.editAddress(userId, addressId, req.body)

    if (!result.status) {
      return res.status(result.statusCode).json({ error: result.message })
    }

    return res
      .status(result.statusCode)
      .json({ message: result.message, data: result.data })
  } catch (error) {
    logger.error(`Update error: ${error.message}`)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default {
  addAddress,
  deleteAddress,
  editAddress,
}
