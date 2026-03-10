import LinkAddress from '../../models/addressSchema.js'
import logger from '../../utils/logger.js'

const addAddress = async (userId, addressData) => {
    try {
        const {
            name,
            phone,
            altPhone,
            addressType,
            country,
            state,
            city,
            street,
            pincode,
        } = addressData

        const duplicateAddress = await LinkAddress.findOne({
            userId,
            address: {
                $elemMatch: {
                    addressType: { $regex: new RegExp(`^${addressType}$`, 'i') },
                    name: { $regex: new RegExp(`^${name}$`, 'i') },
                    country: { $regex: new RegExp(`^${country}$`, 'i') },
                    state: { $regex: new RegExp(`^${state}$`, 'i') },
                    city: { $regex: new RegExp(`^${city}$`, 'i') },
                    street: { $regex: new RegExp(`^${street}$`, 'i') },
                    pincode,
                    phone,
                },
            },
        })

        if (duplicateAddress) {
            return {
                status: false,
                statusCode: 409,
                message: 'This address already exists',
            }
        }

        const newAddress = {
            name,
            phone,
            altPhone: altPhone || undefined,
            addressType,
            country,
            state,
            city,
            street,
            pincode,
            isDefault: false,
        }

        const updatedUser = await LinkAddress.findOneAndUpdate(
            { userId },
            { $push: { address: newAddress } },
            { new: true, upsert: true }
        )

        const length = updatedUser?.address.length

        return {
            status: true,
            statusCode: 201,
            message: 'Address added successfully',
            address: updatedUser.address[length - 1],
        }
    } catch (error) {
        logger.error(`Error in addAddress service: ${error}`)
        throw error
    }
}

const deleteAddress = async (userId, addressId) => {
    try {
        const userAddressDoc = await LinkAddress.findOne({ userId })
        if (!userAddressDoc) {
            return {
                status: false,
                statusCode: 404,
                message: 'No addresses found for this user',
            }
        }

        await LinkAddress.findOneAndUpdate(
            { userId },
            { $pull: { address: { _id: addressId } } },
            { new: true }
        )

        return {
            status: true,
            statusCode: 200,
            message: 'Address deleted successfully',
        }
    } catch (error) {
        logger.error(`Error in deleteAddress service: ${error}`)
        throw error
    }
}

const editAddress = async (userId, addressId, addressData) => {
    try {
        console.log(123123123)
        const {
            addressType,
            name,
            street,
            city,
            state,
            pincode,
            country,
            phone,
            altPhone,
        } = addressData
        console.log('typeof pincode', typeof pincode)

        const updateFields = {
            'address.$.addressType': addressType.trim(),
            'address.$.name': name.trim(),
            'address.$.street': street.trim(),
            'address.$.city': city.trim(),
            'address.$.state': state.trim(),
            'address.$.pincode': pincode.trim(),
            'address.$.country': country.trim(),
            'address.$.phone': phone.trim(),
        }

        if (altPhone) updateFields['address.$.altPhone'] = altPhone.trim()

        const updated = await LinkAddress.findOneAndUpdate(
            { userId, 'address._id': addressId },
            { $set: updateFields },
            { new: true }
        )

        if (!updated) {
            return {
                status: false,
                statusCode: 404,
                message: 'Address not found or not yours',
            }
        }

        const updatedDoc = updated.address.find(
            (i) => addressId === i._id.toString()
        )

        return {
            status: true,
            statusCode: 200,
            message: 'Address updated successfully',
            data: updatedDoc,
        }
    } catch (error) {
        logger.error(`Error in editAddress service: ${error.message}`)
        throw error
    }
}

export default {
    addAddress,
    deleteAddress,
    editAddress,
}
