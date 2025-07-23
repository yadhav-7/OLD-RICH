const Product = require('../../models/productSchema')
const Category = require('../../models/catagory')
const User = require('../../models/userSchema')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const { log } = require('console')

const getAddProducts = async (req, res) => {
    try {
        const category = await Category.find({ isListed: true })
        res.render('product-add', {
            category: category,
            message:null,
            success:null
        })
    } catch (error) {
        console.error('error from getAddProduct', error)
    }
}

const addProducts = async (req, res) => {
    try {
        
        const products = req.body
        let variants = []
        let tempVariantObj = {}

        function skugen(size) {
            return `sku${size}` + Math.floor(Math.random() * 1000000); // Up to 6 digits
        }

        if (!Array.isArray(products.sizes)) {
  products.sizes = [products.sizes];
}
        for (let i = 0; i < products.sizes.length; i++) {

            if (products.sizes[i] === 'S') {
                let skuval = skugen('S')
                tempVariantObj = {
                    sku: skuval,
                    size: products.sizes[i],
                    regularPrice: products.regularPriceS,
                    salePrice: products.salePriceS,
                    quantity: products.stockS
                }
            } else if (products.sizes[i] === 'M') {
                let skuval = skugen('M')
                tempVariantObj = {
                    sku: skuval,
                    size: products.sizes[i],
                    regularPrice: products.regularPriceM,
                    salePrice: products.salePriceM,
                    quantity: products.stockM
                }
            } else if (products.sizes[i] === 'L') {
                let skuval = skugen('L')
                tempVariantObj = {
                    sku: skuval,
                    size: products.sizes[i],
                    regularPrice: products.regularPriceL,
                    salePrice: products.salePriceL,
                    quantity: products.stockL
                }
            } else if (products.sizes[i] === 'XL') {
                let skuval = skugen('XL')
                tempVariantObj = {
                    sku: skuval,
                    size: products.sizes[i],
                    regularPrice: products.regularPriceXL,
                    salePrice: products.salePriceXL,
                    quantity: products.stockXL
                }
            } else if (products.sizes[i] === 'XXL') {
                let skuval = skugen('XXL')
                tempVariantObj = {
                    sku: skuval,
                    size: products.sizes[i],
                    regularPrice: products.regularPriceXXL,
                    salePrice: products.salePriceXXL,
                    quantity: products.stockXXL
                }
            }
            
            variants.push(tempVariantObj)
        }
       
const productExist = await Product.findOne({
    productName: { 
        $regex: new RegExp(`^${products.productName}$`, 'i') 
    }
});
        if (!productExist) {
            const images = []
            if (req.files && req.files.length > 0) {
                console.log(3);
                for (let i = 0; i < req.files.length; i++) {
                    const originalImagePath = req.files[i].path;
                    const ext = path.extname(req.files[i].originalname);
                    const baseName = path.basename(req.files[i].originalname, ext);
                    // Unique name to avoid overwrite
                    const resizedFileName = Date.now() + '-' + baseName + '-resized' + ext;
                    const resizedImagePath = path.join('public', 'uploads', 'product-images', resizedFileName);

                    // Ensure the 'resized' folder exists
                    fs.mkdirSync(path.join('public', 'uploads', 'product-images'), { recursive: true });


                    await sharp(originalImagePath)
                        .resize({ width: 440, height: 440 })
                        .toFile(resizedImagePath);


                    images.push(path.join('product-images', resizedFileName));

                }
            }



            const categoryId = await Category.findOne({ name: products.category })

            if (!categoryId) {
                console.warn(categoryId)
                return res.status(400).json({ error: 'Invalid category name' })
            }
            console.warn('near to save data')
            const newProduct = new Product({
                productName: products.productName,
                description: products.description,
                category: categoryId._id,


                createdOn: new Date(),

                color: products.color,
                productImage: images,
                status: 'Available',
                variants
            })


            await newProduct.save()

            const category = await Category.find({
                isListed:true
            })
          
            res.render('product-add',{
                success:'Product Add successFull',
                category:category,
                message:null
            })
        } else {
            const category = await Category.find({isListed:true})
            res.render('product-add',{message:'Product Name Already Exists Try Another name',category,success:null})
        }
    } catch (error) {
        console.error('error from add product', error)
        res.redirect('/admin/pageError')
    }
}

const getAllProducts = async (req, res) => {

    try {
        
        
        const search = req.query.search || ''
        const page = parseInt(req.query.page) || 1
      
        const limit = 6

        const productData = await Product.find({
            productName: { $regex: new RegExp('.*' + search + '.*', 'i') }
        }).sort({createdAt:-1}).skip((page - 1) * limit).limit(limit).populate('category').exec()

        const count = await Product.find({
            productName: { $regex: new RegExp('.*' + search + '.*', 'i') }
        }).countDocuments()
        
        const category = await Category.find({ isListed: true })


        const isFetch = req.headers.accept?.includes('application/json');

        const totalPage = Math.ceil(count / limit)

      for (let product of productData) {
  let productTotal = 0; // ← move inside the loop

  if (product.variants && product.variants.length > 0) {
    for (let variant of product.variants) {
      productTotal += variant.quantity;
    }
  } else {
    productTotal = product.quantity || 0;
  }

  product.totalQuantity = productTotal;
}

      

        if (isFetch) {
            
            return res.json({
                data: productData,
                currentPage: page,
                totalPages: totalPage
            });
        }

       
        if (category) {    
            res.render('getAllProducts', {
                data: productData,
                currentPage: page,
                totalPages: totalPage,
                cat: category
            })
        } else {
            res.render('pageNotFound')
        }
    } catch (error) {
        console.log('error from getallProducts', error)
        res.redirect('/admin/pageError')
    }
}

const productVarintsModal = async (req, res) => {
    try {


        const productId = req.body.id

        const findProduct = await Product.findOne({ _id: productId })
        const variants = findProduct.variants

        if (variants) {
            res.json({ status: true, data: variants })
        } else {
            res.status(500)
        }

    } catch (error) {
        console.error('error from productVarintsModal', error)
        res.status(500)
    }
}

const addProductOffer = async (req, res) => {

    try {
        const { productId, percentage } = req.body
        
        const findProduct = await Product.findOne({ _id: productId })
        const findCategory = await Category.findOne({ _id: findProduct.category })
        if (findCategory.categoryOffer > percentage) {
            return res.json({ success: false, message: 'This product category already has category offer' })
        }

        // findProduct.salePrice = findProduct.salePrice.Math.floor(findProduct.regularPrice*(percentage/100))
        findProduct.salePrice = Math.floor(findProduct.regularPrice * (1 - percentage / 100));


        findProduct.productOffer = parseInt(percentage)
        await findProduct.save()

        findCategory.categoryOffer = 0
        await findCategory.save()
        res.json({ success: true })
    } catch (error) {
        console.log('error from addProductOffer', error)
        res.redirect('/admin/pageError')
        res.status(500).json({ success: false, message: 'Internal server error' })
    }
}



const removeProductOffer = async (req, res) => {
    try {
        const { productId } = req.body
        const findProduct = await Product.findOne({ _id: productId })
        const percentage = findProduct.productOffer
        findProduct.salePrice = findProduct.salePrice + Math.floor(findProduct.regularPrice * (percentage / 100))



        await Product.updateOne({ _id: findProduct._id }, { $set: { productOffer: false } })

        res.json({ success: true })
    } catch (error) {
        res.redirect('/admin/pageError')
    }
}

const blockProduct = async (req, res) => {
    try {
        console.warn('i reach here')
        const productId = req.body.id
        await Product.updateOne({ _id: productId }, { isBlocked: true })
        console.log('1');

        const p = await Product.findOne({ _id: productId })
        console.log(p.isBlocked)
        console.log(2);

        res.json({ message: true })
    } catch (error) {
        console.log('error from blockProduct', error)
        res.status('500').json({ message: false })
    }
}

const unBlockProduct = async (req, res) => {

    try {
        const productId = req.body.id

        await Product.updateOne({ _id: productId }, { isBlocked: false })

        res.json({ message: true })
    } catch (error) {
        console.log('error from unBlockProduct', error)
        res.status(500).json({ message: false })
    }
}

const getEditProduct = async (req, res) => {
    try {
        const id = req.query.id

        const product = await Product.findOne({ _id: id })

        const category = await Category.find({})

        res.render('getEditProduct', {
            product: product,
            category: category
        })
    } catch (error) {
        console.log('error from getEditProduct', error)
        res.redirect('/admin/pageError')
    }
}



const editProduct = async (req, res) => {
    try {
        console.log('editProduct function is working');

        const id = req.params.id;
        const data = req.body;
        console.log('Form data received:', data);

        const {
            productName,
            description,
            category,
            color,
            existingImages, // This comes from the hidden input
            variants
        } = data;

        const categoryId = await Category.findOne({ name: category });

        const existingProduct = await Product.findOne({
    productName: { $regex: `^${productName}$`, $options: 'i' }, // case-insensitive exact match
    _id: { $ne: id } // exclude current product
});


        

        // Get the current product to preserve existing images if no changes
        const currentProduct = await Product.findById(id);
        if (!currentProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Handle new uploaded images
        const newImages = [];
        if (req.files && req.files.length > 0) {
            console.log('New files uploaded:', req.files.length);
            for (let i = 0; i < req.files.length; i++) {
                newImages.push(req.files[i].filename);
            }
        }

        // Handle existing images
        let finalImages = [];
        
        if (existingImages && existingImages.trim() !== '') {
            // Split existing images and filter out empty strings
            finalImages = existingImages.split(',').filter(img => img.trim() !== '');
            console.log('Existing images from form:', finalImages);
        } else if (newImages.length === 0) {
            // If no existing images data sent and no new images, keep current images
            finalImages = currentProduct.productImage || [];
            console.log('No image changes, keeping current images:', finalImages);
        }

        // Add new images to the final array
        if (newImages.length > 0) {
            finalImages = [...finalImages, ...newImages];
            console.log('Final images with new additions:', finalImages);
        }

        // Prepare update fields
        const updateFields = {
            productName,
            description,
            category: categoryId._id,
            color,
            productImage: finalImages
        };

        // Handle variants if they exist
        if (variants && Array.isArray(variants)) {
            const validVariants = variants.filter(variant => 
                variant.size && variant.regularPrice && variant.quantity
            ).map(variant => ({
                size: variant.size,
                regularPrice: parseFloat(variant.regularPrice),
                salePrice: variant.salePrice ? parseFloat(variant.salePrice) : null,
                quantity: parseInt(variant.quantity),
                _id: variant._id || undefined
            }));
            
            updateFields.variants = validVariants;
        }

        console.log('Update fields:', updateFields);

        await Product.findByIdAndUpdate(id, updateFields, { new: true });
       
        res.redirect('/admin/getAllProducts');
    } catch (error) {
        console.error('error from editProduct', error);
        res.redirect('/admin/pageError');
    }
}


const deleteSingleImage = async (req, res) => {
    try {
        const { imageNameToServer, productIdToServer } = req.body
        const product = await Product.findByIdAndUpdate(productIdToServer, { $pull: { productImage: imageNameToServer } })
        const imagePath = path.join('public', 'uploads', 're-image', imageNameToServer)
        if (fs.existsSync(imagePath)) {
            await fs.unlinkSync(imagePath)
            console.log(`Image${imageNameToServer} delete successfully`)
        } else {
            console.log(`Image ${imageNameToServer} not found`)
        }
        res.send({ status: true })
    } catch (error) {
        res.redirect('/admin/pageError')
    }
}


module.exports = {
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
    deleteSingleImage,
    
}