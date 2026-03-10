import Catagory from "../../models/catagory.js";
import logger from "../../utils/logger.js";
import Product from "../../models/productSchema.js";
import mongoose from "mongoose";
const { ObjectId } = mongoose.Types

const categoryInfo = async (reqQuery) => {
    try {
        const page = parseInt(reqQuery.page, 10) || 1
        const search = reqQuery.search?.trim() || ''
        const limit = 5
        const skip = (page - 1) * limit

        const query = {
            name: { $regex: new RegExp(search, 'i') },
        }

        const categoryData = await Catagory.find(query)
            .sort({ createdOn: -1 })
            .skip(skip)
            .limit(limit)

        const totalCategories = await Catagory.countDocuments(query)
        const totalPages = Math.ceil(totalCategories / limit)
        return {
            category: categoryData,
            currentPage: page,
            totalPages,
            totalCategories
        }
    } catch (error) {
        logger.error(`error in categoryInfo service ${error}`)
        throw new Error(error)
    }
}

const addCategory = async (body) => {
    try {
        const { categoryName, categoryDescription } = body

        const existingCategory = await Catagory.findOne({
            name: { $regex: `^${categoryName}$`, $options: 'i' },
        })

        if (existingCategory) {
            return {statusCode:400,status:false, message: 'Category already exists' }
        }

        const newCategory = new Catagory({
            name: categoryName,
            description: categoryDescription,
        })

        await newCategory.save()
        return {statusCode:200, status: true,message:'Category adding successfull' }
    } catch (error) {
        logger.error(`error in addCategory service ${error}`)
        throw new Error(error)
    }
}

const addCategoryOffer = async (body) => {
    try {
        const { offerPercentage, categoryId } = body

        if (!categoryId) {
            return { statusCode: 400, status: false, message: 'Category ID is required' }
        }
        if (!offerPercentage) {
            return { statusCode: 400, status: false, message: 'Invalid offer percentage (must be 0-100)' }
        }

        const percentage = parseFloat(offerPercentage)


        const category = await Catagory.findById(categoryId)


        if (!category) {
            return { statusCode: 404, status: false, message: 'Category not found' }
        }

        const products = await Product.find({ category: category._id })

        if (products.length > 0) {
            for (const p of products) {
                let productOfferRemoved = false
                if (p.productOffer > percentage) continue
                for (const variant of p.variants) {
                    if (p.productOffer > 0) {
                        variant.salePrice = Math.floor(
                            variant.salePrice / (1 - p.productOffer / 100),
                        )
                        productOfferRemoved = true
                    }
                    variant.salePrice -= (variant.salePrice * percentage) / 100
                }
                if (productOfferRemoved) p.productOffer = 0
                await p.save()
            }
        }

        await Catagory.updateOne(
            { _id: categoryId },
            { $set: { categoryOffer: percentage } },
        )

        return ({ statusCode: 200, status: true, message: `Offer of ${percentage}% added to category ${categoryId}`, })
    } catch (error) {
        logger.error(`error in addCategoryOffer serivce ${error}`)
        throw new Error(error)
    }
}

const removeCategoryOffer = async (body) => {
    try {
        const { categoryId } = body
        if (!categoryId || !ObjectId.isValid(categoryId)) {
            return ({ statusCode: 400, status: false, message: 'Invalid or missing categoryId' })
        }

        const category = await Catagory.findById(categoryId)
        if (!category) {
            return ({ statusCode: 404, status: false, message: 'Category not found' })
        }
        const percentage = category.categoryOffer
        const products = await Product.find({ category: category._id })
        if (products.length > 0) {
            for (const product of products) {
                if (product.productOffer > 0) continue
                for (const variant of product.variants) {
                    variant.salePrice = Math.floor(
                        variant.salePrice / (1 - percentage / 100),
                    )
                }
                await product.save()
            }
        }

        category.categoryOffer = 0
        await category.save()
        return ({
            statusCode: 200,
            status: true,
            message: 'Category offer removed successfully',
        })
    } catch (error) {
        logger.error(`errror in removeCategoryOffer serivce ${error}`)
        throw new Error(error)
    }
}

const ListCategory = async (body) => {
    try {
        const { id } = body

        await Catagory.updateOne({ _id: id }, { $set: { isListed: true } })

        const products = await Product.find({ category: id })

        for (const product of products) {
            product.status = 'Available'
            await product.save()
        }

        await Catagory.findById(id)
        return { statusCode: 200, status: true, message: '' }
    } catch (error) {
        logger.error(`error in ListCategory serivce ${error}`)
        throw new Error(error)
    }
}

const unListCategory = async (body) => {
    try {
        const { id } = body
        await Catagory.updateOne({ _id: id }, { $set: { isListed: false } })
        const products = await Product.find({ category: id })

        for (const product of products) {
            product.status = 'notAvailable'

            await product.save()
        }
        return { statusCode: 200, status: true, message: 'Unlisted successfull' }
    } catch (error) {
        logger.error(`error in unListCategory service ${error}`)
        throw new Error(error)
    }
}

const getEditCategory = async (query) => {
    try {
        const { id } = query

        const category = await Catagory.findOne({ _id: id })

        return { status: true,  category }

    } catch (error) {
        console.log('error',error)
        logger.error(`error in getEditCategory service ${error}`)
        throw new Error(error)
    }
}

const editCategory = async (params,body) => {
    try {
        const { id } = params

        const { name, description } = body

        const existsCategory = await Catagory.findOne({
            name: { $regex: `^${name}$`, $options: 'i' },
            _id: { $ne: new mongoose.Types.ObjectId(id) },
        })

        if (existsCategory) {
            return { statusCode: 400, status: false, message: 'Category already exists, choose a different name' }
        }

        const updatedCategory = await Catagory.findByIdAndUpdate(id, {
            name,
            description,
        })

        if (updatedCategory) {
            return {statusCode: 200, status: true, message: 'Category updated successfully'}
            } else {
                return { statusCode: 404, status: false, message: 'Category not found' }
            }
        } catch (error) {
            logger.error(`error in editCategory service ${error}`)
            throw new Error(error)
        }
    }


export default {
        categoryInfo,
        addCategory,
        addCategoryOffer,
        removeCategoryOffer,
        ListCategory,
        unListCategory,
        getEditCategory,
        editCategory
    }