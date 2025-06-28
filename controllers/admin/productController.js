const Product = require('../../models/productSchema')
const Category = require('../../models/catagory')
const User = require('../../models/userSchema')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const getAddProducts = async (req, res) => {
    try {
        const category = await Category.find({ isListed: true })
        res.render('product-add', {
            cat: category
        })
    } catch (error) {
        console.error('error from getAddProduct', error)
    }
}

const addProducts = async (req, res) => {
    try {
        
        const products = req.body

        const productExist = await Product.findOne({
            productName: products.productName
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
                    fs.mkdirSync(path.join('public', 'uploads', 'product-images' ), { recursive: true });

                   
                    await sharp(originalImagePath)
                        .resize({ width: 440, height: 440 })
                        .toFile(resizedImagePath);

                    
                    images.push(path.join('product-images', resizedFileName));
                    
                }
            }



            const categoryId = await Category.findOne({ name: products.category })
            
            if (!categoryId) {
                return res.status(400).json({ error: 'Invalid category name' })
            }

            const newProduct = new Product({
                productName: products.productName,
                description: products.description,
                category: categoryId._id,
                regularPrice: products.regularPrice,
                salePrice: products.salePrice,
                createdOn: new Date(),
                quantity: products.quantity,
                color: products.color,
                productImage: images,
                status: 'Available'
            })

        
            await newProduct.save()

            

            res.redirect('/admin/getAddProduct')
        } else {
           
            return res.status(400).json({ error: 'Product already exists, Please try with another name' })
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
        const limit = 4
        const productData = await Product.find({
            productName: { $regex: new RegExp('.*' + search + '.*', 'i') }
        }).skip((page - 1) * limit).limit(limit).populate('category').exec()

        const count = await Product.find({
            productName: { $regex: new RegExp('.*' + search + '.*', 'i') }
        }).countDocuments()
        const category = await Category.find({ isListed: true })


        const isFetch = req.headers.accept?.includes('application/json');

        const totalPage= Math.ceil(count / limit)



        if (isFetch) {
            return res.json({
                data: productData,
                currentPage: page,
                totalPages: totalPage
            });
        }

        console.log('pageNumber',page)

        if (category) {
            res.render('getAllProducts', {
                data: productData,
                currentPage: page,
                totalPages:totalPage,
                cat: category
            })
        } else {
            res.render('page-404')
        }
    } catch (error) {
        console.log('error from getallProducts', error)
        res.redirect('/admin/pageError')
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
        const productId = req.body.id
        await Product.updateOne({ _id: productId }, { isBlocked: true })

        const p = await Product.findOne({ _id: productId })
        console.log(p.isBlocked)

        res.json({message:true})
    } catch (error) {
        console.log('error from blockProduct', error)
        res.status('500').json({message:false})
    }
}

const unBlockProduct = async (req, res) => {

    try {
        const productId = req.body.id

        await Product.updateOne({ _id: productId }, { isBlocked: false })

        res.json({message:true})
    } catch (error) {
        console.log('error from unBlockProduct', error)
        res.status(500).json({message:false})
    }
}

const getEditProduct = async(req,res)=>{
    try {
        const id = req.query.id

        const product = await Product.findOne({_id:id})

        const category = await Category.find({})

        res.render('getEditProduct',{
            product:product,
            category:category
        })
    } catch (error) {
        console.log('error from getEditProduct',error)
        res.redirect('/admin/pageError')
    }
}

const editProduct = async (req, res) => {
  try {
    console.log('editProduct function is working');

    const id = req.params.id;
    const data = req.body;
    console.log('id:',id)
    console.log(typeof id)

    const {
      productName,
      description,
      category,
      regularPrice,
      salePrice,
      quantity,
      color,
      productImage:image
    } = data;

    const categoryId = await Category.findOne({name:category})

    const existingProduct = await Product.findOne({
      productName: productName,
      _id: { $ne: id }
    });

    if (existingProduct) {
      return res.status(400).json({ error: 'Product with this name already exists. Please try with another name' });
    }

    const images = [];

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        images.push(req.files[i].filename);
      }
    }

    const updateFields = {
  $set: {
    productName,
    description,
    category: categoryId._id,
    regularPrice,
    salePrice,
    quantity,
    color
  }
};

if (images.length > 0) {
  updateFields.$push = { productImage: { $each: images } };
}


    // 👉 Either append to images...
    if (images.length > 0) {
      updateFields.$push = { productImage: { $each: images } };
    }

    await Product.findByIdAndUpdate(id, updateFields, { new: true });

    res.redirect('/admin/getAllProducts');
  } catch (error) {
    console.error('error from editProduct', error);
    res.redirect('/admin/pageError');
  }
}

const deleteSingleImage = async (req,res)=>{
    try {
        const {imageNameToServer,productIdToServer} = req.body
        const product = await Product.findByIdAndUpdate(productIdToServer,{$pull:{productImage:imageNameToServer}})
        const imagePath = path.join('public','uploads','re-image',imageNameToServer)
        if(fs.existsSync(imagePath)){
            await fs.unlinkSync(imagePath)
            console.log(`Image${imageNameToServer} delete successfully`)
        }else{
            console.log(`Image ${imageNameToServer} not found`)
        }
        res.send({status:true})
    } catch (error) {
        res.redirect('/admin/pageError')
    }
}

 
    module.exports = {
        getAddProducts,
        addProducts,
        getAllProducts,
        addProductOffer,
        removeProductOffer,
        blockProduct,
        unBlockProduct,
        getEditProduct,
        editProduct,
        deleteSingleImage
    }