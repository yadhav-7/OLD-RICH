const Address = require('../../models/addressSchema')
const mongoose = require('mongoose');

const addAddress = async (req, res) => {
    try {
        console.log('req.body.addressData',req.body.addressData)
        console.log('req.body-----------',req.body)
        const user = req.session.user;
        console.log(1)
        if (!user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        console.log(2)

        const {
            name,
            phone,
            altPhone,
            addressType,
            country,
            state,
            city,
            street,
            pincode
        } =req.body || req.body.addressData

        console.log(3)
        console.log('name',name)
        console.log('phone',phone)
        console.log('addressType',addressType)
        console.log('country',country)
        console.log('state',state)
        console.log('city',city)
         console.log('street',street)
         console.log('pincode',pincode)

        if (!name || !phone || !addressType || !country || !state || !city || !street || !pincode) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }
        console.log(4)

        // Check for duplicate
        const duplicateAddress = await Address.findOne({
            userId: user,
            address: {
                $elemMatch: {
                    addressType: { $regex: new RegExp(`^${addressType}$`, 'i') },
                    name: { $regex: new RegExp(`^${name}$`, 'i') },
                    country: { $regex: new RegExp(`^${country}$`, 'i') },
                    state: { $regex: new RegExp(`^${state}$`, 'i') },
                    city: { $regex: new RegExp(`^${city}$`, 'i') },
                    street: { $regex: new RegExp(`^${street}$`, 'i') },
                    pincode: Number(pincode),
                    phone: phone
                }
            }
        });

        console.log(5)

        if (duplicateAddress) {
            return res.status(409).json({ message: 'This address already exists' });
        }
console.log(6)
        const newAddress = {
            name,
            phone,
            altPhone: altPhone || undefined,
            addressType,
            country,
            state,
            city,
            street,
            pincode: Number(pincode),
            isDefault: false
        };
console.log(7)
        const updatedUser = await Address.findOneAndUpdate(
            { userId: user },
            { $push: { address: newAddress } },
            { new: true, upsert: true }
        );
console.log(8)
        return res.status(201).json({
            message: 'Address added successfully',
            address: newAddress
        });

    } catch (error) {
        console.error('Error from adding address:', error);
        return res.status(500).json({
            message: 'An error occurred while adding the address',
            error: error.message
        });
    }
};



const deleteAddress = async (req, res) => {
  try {
    const addressId = req.query.addressId;
    console.log('addressId ',addressId)
    const userId = req.session.user?._id || req.session.user;
console.log('addressId',addressId)
    // 1. Check login
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    // 2. Check addressId presence
    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ success: false, message: 'Invalid address ID' });
    }

    // 3. Find user address doc
    const userAddressDoc = await Address.findOne({ userId });
    if (!userAddressDoc) {
      return res.status(404).json({ success: false, message: 'No addresses found for this user' });
    }

    // 4. Try to pull the address from array
    const updated = await Address.findOneAndUpdate(
      { userId },
      { $pull: { address: { _id: addressId } } },
      { new: true }
    );

    // 5. Check if deletion actually happened
    // const stillExists = updated.address.some(addr => addr._id.toString() === addressId);
    // if (stillExists) {
    //   return res.status(404).json({ success: false, message: 'Address not found or already deleted' });
    // }

    // 6. Cleanup session if needed
    // delete req.session.addressId;

    // 7. Return success
    return res.status(200).json({ success: true, message: 'Address deleted successfully' });

  } catch (error) {
    console.error(' Error from deleteAddress:', error);
    return res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

const editAddress = async (req, res) => {
    try {
        console.log(1)
        const addressId = req.query.addressId;
        console.log(2)
        const userId = req.session.user;
console.log(3)
        if (!addressId || !userId) {
            return res.status(400).json({ error: 'Missing required identifiers' });
        }
console.log(4)
        const {
            addressType,
            name,
            street,
            city,
            state,
            pincode,
            country,
            phone,
            altPhone
        } = req.body;
console.log(5)
        if (!addressType || !name || !street || !city || !state || !pincode || !country || !phone) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
console.log(6)
        const updateFields = {
            'address.$.addressType': addressType.trim(),
            'address.$.name': name.trim(),
            'address.$.street': street.trim(),
            'address.$.city': city.trim(),
            'address.$.state': state.trim(),
            'address.$.pincode': pincode.trim(),
            'address.$.country': country.trim(),
            'address.$.phone': phone.trim()
        };
console.log(7)
        if (altPhone) updateFields['address.$.altPhone'] = altPhone.trim();
console.log(8)
        const updated = await Address.findOneAndUpdate(
            { userId, "address._id": addressId },
            { $set: updateFields },
            { new: true }
        );
console.log(9)
        if (!updated) {
            return res.status(404).json({ error: 'Address not found or not yours' });
        }
console.log(10)
        return res.status(200).json({ message: 'Address updated successfully', data: updated });

    } catch (error) {
        console.error("Update error:", error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


module.exports = {
    addAddress,
    deleteAddress,
    editAddress
}