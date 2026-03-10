import Product from "../../models/productSchema.js";
import Catagory from "../../models/catagory.js";
import sharp from 'sharp'
import { uploadToCloudinary } from '../../config/cloudinary.js'
import logger from "../../utils/logger.js";

const getAddProducts = async () => {
  try {
    const category = await Catagory.find({ isListed: true })
    return category
  } catch (error) {
    logger.error(`error in getAddProducts service ${error}`)
    throw new Error(error)
  }
}

const addProducts = async (body, files) => {
  try {
    const products = body
    const variants = []
    let tempVariantObj = {}

    function skugen(size) {
      return `sku${size}${Math.floor(Math.random() * 1000000)}`
    }

    if (!products.sizes) {
      const category = await Catagory.find({ isListed: true })
      return {
        message: 'At least one size variant and its stock/price are required',
        category,
        success: null,
      }
    }
    if (!Array.isArray(products.sizes)) {
      products.sizes = [products.sizes]
    }
    const sizeMap = {
      'S': { reg: 'regularPriceS', sale: 'salePriceS', stock: 'stockS' },
      'M': { reg: 'regularPriceM', sale: 'salePriceM', stock: 'stockM' },
      'L': { reg: 'regularPriceL', sale: 'salePriceL', stock: 'stockL' },
      'XL': { reg: 'regularPriceXL', sale: 'salePriceXL', stock: 'stockXL' },
      'XXL': { reg: 'regularPriceXXL', sale: 'salePriceXXL', stock: 'stockXXL' }
    }

    for (let i = 0; i < products.sizes.length; i++) {
      const size = products.sizes[i];
      const map = sizeMap[size];

      if (map) {
        const skuval = skugen(size);
        const quantity = parseInt(products[map.stock]);

        if (isNaN(quantity) || quantity <= 0) {
          const category = await Catagory.find({ isListed: true });
          return {
            message: `Valid stock is required for size ${size} (must be greater than 0)`,
            category,
            success: null,
          };
        }

        const regPrice = parseFloat(products[map.reg]);
        const salePrice = products[map.sale] ? parseFloat(products[map.sale]) : regPrice;

        variants.push({
          sku: skuval,
          size: size,
          regularPrice: regPrice,
          salePrice: salePrice,
          quantity: quantity,
        });
      }
    }
    let totalStock = 0
    for (const key of variants) {
      totalStock += parseInt(key.quantity)
    }

    const sts = totalStock === 0 ? 'out of stock' : 'Available'

    const productExist = await Product.findOne({
      productName: {
        $regex: new RegExp(`^${products.productName}$`, 'i'),
      },
    })

    if (!productExist) {
      const images = []

      for (const file of files) {
        const resizedBuffer = await sharp(file.buffer)
          .resize(440, 440)
          .toBuffer()

        const url = await uploadToCloudinary(resizedBuffer, 'products')

        images.push(url)
      }

      const categoryId = await Catagory.findOne({ name: products.category })

      if (!categoryId) {
        const category = await Catagory.find({ isListed: true })
        return {
          message: 'Category not found',
          category,
          success: null,
        }
      }

      const newProduct = new Product({
        productName: products.productName,
        description: products.description,
        category: categoryId._id,

        createdOn: new Date(),

        color: products.colour,
        productImage: images,
        status: sts,
        variants,
      })

      await newProduct.save()

      const category = await Catagory.find({
        isListed: true,
      })

      return {
        success: 'Product Add successFull',
        category,
        message: null,
      }
    } else {
      const category = await Catagory.find({ isListed: true })
      return {
        message: 'Product Name Already Exists Try Another name',
        category,
        success: null,
      }
    }
  } catch (error) {
    logger.error(`error in addProducts service ${error}`)
    throw new Error(error)
  }
}

const getAllProducts = async (query) => {
  try {
    const search = query.search || ''
    const page = parseInt(query.page) || 1

    const limit = 6

    const productData = await Product.find({
      productName: { $regex: new RegExp(`.*${search}.*`, 'i') },
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category', 'name')
      .exec()

    const count = await Product.find({
      productName: { $regex: new RegExp(`.*${search}.*`, 'i') },
    }).countDocuments()

    const category = await Catagory.find({ isListed: true })

    const totalPage = Math.ceil(count / limit)

    for (const product of productData) {
      let productTotal = 0

      if (product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {
          productTotal += variant.quantity
        }
      } else {
        productTotal = product.quantity || 0
      }

      product.totalQuantity = productTotal
    }

    return {
      data: productData,
      currentPage: page,
      totalPages: totalPage,
      cat: category,
    }

  } catch (error) {
    logger.error(`error in getAll product service ${error}`)
    throw new Error(error)
  }
}

const productVarintsModal = async (body) => {
  try {
    const productId = body.id

    const findProduct = await Product.findOne({ _id: productId })
    const { variants } = findProduct

    return variants
  } catch (error) {
    logger.error(`error in productVarintsModal serivce ${error}`)
  }
}

const addProductOffer = async (body) => {
  try {
    const { productId } = body
    let { percentage } = body

    const findProduct = await Product.findOne({ _id: productId })

    const findCategory = await Catagory.findOne({ _id: findProduct.category })
    const { categoryOffer } = findCategory

    percentage = parseInt(percentage)
    if (findCategory.categoryOffer > percentage)
      return {
        statusCode: 400,
        status: false,
        message: `Category already has a higher offer of ${findCategory.categoryOffer}%. Please provide a product offer greater than the category offer.`
      }

    if (categoryOffer > 0) {
      for (const variant of findProduct.variants) {
        const offer = categoryOffer
        variant.salePrice = Math.floor(
          (variant.salePrice * 100) / (100 - offer),
        )
      }
    }

    for (const variant of findProduct.variants) {
      variant.salePrice = Math.floor(variant.salePrice * (1 - percentage / 100))
    }
    findProduct.productOffer = percentage

    await findProduct.save()

    await findCategory.save()
    return { statusCode: 200, status: true }
  } catch (error) {
    logger.error(`error in addProductOffer service ${error}`)
    throw new Error(error);
  }
}


const removeProductOffer = async (body) => {
  try {
    const { productId } = body
    const findProduct = await Product.findOne({ _id: productId })
    const findCategory = await Catagory.findOne({ _id: findProduct.category })

    const { categoryOffer } = findCategory

    const percentage = findProduct.productOffer

    for (const variant of findProduct.variants) {
      variant.salePrice = Math.floor(
        variant.salePrice +
        variant.salePrice * (percentage / (100 - percentage)),
      )

      if (categoryOffer > 0) {
        variant.salePrice = Math.floor(
          (variant.salePrice = Math.floor(
            variant.salePrice * (1 - categoryOffer / 100),
          )),
        )
      }
    }

    await Product.updateOne(
      { _id: findProduct._id },
      { $set: { productOffer: false } },
    )
    await findProduct.save()

    return { statusCode: 200, status: true }

  } catch (error) {
    logger.error(`error in removeProductOffer service ${error}`)
    throw new Error(error);

  }
}


const blockProduct = async (body) => {
  try {
    const productId = body.id
    await Product.updateOne(
      { _id: productId },
      { isBlocked: true, status: 'notAvailable' },
    )

    const p = await Product.findOne({ _id: productId })

    return { statusCode: 200, status: true }

  } catch (error) {
    logger.error(`error in blockProduct service ${error}`)
    throw new Error(error)

  }
}

const unBlockProduct = async (body) => {
  try {
    const productId = body.id

    await Product.updateOne(
      { _id: productId },
      { isBlocked: false, status: 'Available' },
    )

    return { statusCode: 200, status: true }

  } catch (error) {
    logger.error(`error in unBlockProduct serivce ${error}`)
    throw new Error(error)
  }
}

const getEditProduct = async (query) => {
  try {
    const { id } = query

    const product = await Product.findOne({ _id: id }).populate(
      'category',
      'name',
    )

    const category = await Catagory.find({})

    return { statusCode: 200, status: true, product, category }

  } catch (error) {
    logger.error(`error in getEditProduct service ${error}`)
    throw new Error(error)
  }
}

const editProduct = async (params, body, files) => {
  try {
    const { id } = params
    const data = body

    let {
      productName,
      description,
      category,
      color,
      existingImages,
      variants,
    } = data

    const categoryId = await Catagory.findOne({ name: category })

    productName = productName.trim()
    const existingProduct = await Product.findOne({
      productName: { $regex: `^${productName}$`, $options: 'i' },
      _id: { $ne: id },
    })

    if (existingProduct)
      return { statusCode: 404, status: false, error: 'Product name is already exists' }

    const currentProduct = await Product.findById(id)
    if (!currentProduct) {
      return { statusCode: 404, status: false, error: 'Product not found' }
    }

    const newImages = []
    for (const file of files) {
      const resizedBuffer = await sharp(file.buffer).resize(440, 440).toBuffer()

      const url = await uploadToCloudinary(resizedBuffer, 'products')

      newImages.push(url)
    }

    let finalImages = []

    if (existingImages && existingImages.trim() !== '') {
      finalImages = existingImages.split(',').filter((img) => img.trim() !== '')
    } else if (newImages.length === 0) {
      finalImages = currentProduct.productImage || []
    }

    if (newImages.length > 0) {
      finalImages = [...finalImages, ...newImages]
    }

    const updateFields = {
      productName,
      description,
      category: categoryId._id,
      color,
      productImage: finalImages,
    }

    // Manually parse variants if they come in bracket notation (FormData via Multer)
    if (!variants || !Array.isArray(variants)) {
      variants = [];
      const variantMap = {};

      Object.keys(data).forEach(key => {
        const match = key.match(/^variants\[(\d+)\]\[(\w+)\]$/);
        if (match) {
          const index = match[1];
          const field = match[2];
          if (!variantMap[index]) variantMap[index] = {};
          variantMap[index][field] = data[key];
        }
      });

      variants = Object.keys(variantMap)
        .sort((a, b) => a - b)
        .map(index => variantMap[index]);
    }

    if (variants && Array.isArray(variants) && variants.length > 0) {
      const validVariants = variants
        .filter(
          (variant) => variant.size && variant.regularPrice && variant.quantity,
        )
        .map((variant) => ({
          size: variant.size,
          regularPrice: parseFloat(variant.regularPrice),
          salePrice: variant.salePrice ? parseFloat(variant.salePrice) : parseFloat(variant.regularPrice),
          quantity: parseInt(variant.quantity),
          _id: variant._id || undefined,
        }))

      updateFields.variants = validVariants
    }

    const productStatus = updateFields.variants?.reduce((acc, curr) => {
      return curr.quantity + acc
    }, 0)

    if (productStatus === 0) {
      updateFields.status = 'out of stock'
    } else if (productStatus > 0) {
      updateFields.status = 'Available'
    }

    await Product.findByIdAndUpdate(id, updateFields, { new: true })

    return { statusCode: 200, status: true }
  } catch (error) {
    logger.error(`error in editProduct service ${error}`)
    throw new Error(error);

  }
}


export default {
  getAddProducts,
  addProducts,
  getAllProducts,
  productVarintsModal,
  addProductOffer,
  removeProductOffer,
  blockProduct,
  unBlockProduct,
  getEditProduct,
  editProduct,
}