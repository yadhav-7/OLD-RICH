const Category = require('../../models/catagory')
const Product = require('../../models/productSchema')
const mongoose = require('mongoose');

const categoryInfo = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1
        const search = req.query.search || ''
        const limit = 4
        const skip = (page - 1) * limit;

        

        const query = {
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: 'i' } }
            ]
        };


        const categoryData = await Category.find(query)
            .sort({ createdOn: -1 })
            .skip(skip)
            .limit(limit)

            const isFetch = req.headers.accept?.includes('application/json');

           
        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / limit)


        if(isFetch){
                return res.json({
                    category:categoryData
                })
            }
        res.render('category', {
            cat: categoryData,
            currentPage: page,
            totalPages: totalPages,
            totalCategories: totalCategories
        })
    } catch (error) {
        console.error('error from categoryInfo', error)
        res.redirect('/admin/pageError')
    }
}

const addCategory = async (req, res) => {

    try {
        console.log('addCategory')
        const { categoryName, categoryDescription } = req.body
        console.log(categoryName)
        

        const existingCategory = await Category.findOne({
                name: { $regex: categoryName, $options: 'i' }
        });

        if (existingCategory) {
            return res.status(400).json({ error: 'Category already exists' })
        }

        const newCategory = new Category({
            name: categoryName,
            description: categoryDescription
        })



        await newCategory.save()

        return res.json({ message: 'Category added successfully...' })

    } catch (error) {
        console.log('error from addCategory function', error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}

// const addCategoryOffer = async(req,res)=>{
//     try {

//         const {offerPercentage,categoryId}=req.body
//         // const percentage = parseInt(req.body.percentage)
//         // const catagoryId = req.body.categoryId
//         console.log(offerPercentage)
//         console.log(categoryId)
//         const category = await Category.findById(categoryId)
//         console.log('2')
//         if(!category){
//             return res.status(404).json({status:false, message:'Category not found'})
//         }
//         const products =  await Product.find({category:category._id})
//         console.log('3')
//         const hasProductOffer = products.some((product)=>product.productOffer>offerPercentage)
//         if(hasProductOffer){
//             return res.json({status:false , message:'Products withis this category already have prodect offers'})

//         }
//         console.log('/////////////////')
//         await Category.updateOne({_id:categoryId},{$set:{categoryOffer:offerPercentage}})
//         console.log('4')
//         for(const product of products){
//             product.productOffer = 0
//             product.salesPrice = product.regularPrice
//             await product.save();
//         }
//         console.log('5')
//         res.json({status:true})
//     } catch (error) {
//         res.status(500).json({status:false,message:'Internal sever error'})
//         console.log('error from add category offer',error)
//     }
// }

const addCategoryOffer = async (req, res) => {
    try {
        const { offerPercentage, categoryId } = req.body;
        console.log('Request Body:', { offerPercentage, categoryId }); // Debug

        // Validate inputs
        if (!categoryId) {
            return res.status(400).json({ status: false, message: 'Category ID is required' });
        }
        if (!offerPercentage) {
            return res.status(400).json({ status: false, message: 'Invalid offer percentage (must be 0-100)' });
        }

        // Convert offerPercentage to number
        const percentage = parseFloat(offerPercentage);

        // Check if category exists
        const category = await Category.findById(categoryId);
        console.log('Category:', category ? category.name : 'Not found');
        if (!category) {
            return res.status(404).json({ status: false, message: 'Category not found' });
        }

        // Find products in this category
        const products = await Product.find({ category: category._id });
        console.log('Products:', products.length);

        // Check if any product has a higher offer
        const hasProductOffer = products.some((product) => (product.productOffer || 0) > percentage);
        if (hasProductOffer) {
            return res.json({ status: false, message: 'Products within this category already have higher product offers' });
        }

        // Update category offer
        console.log('Updating category offer...');
        await Category.updateOne({ _id: categoryId }, { $set: { categoryOffer: percentage } });
        console.log('Category offer updated');

        // Reset product offers and prices
        for (const product of products) {
            product.productOffer = 0;
            product.salesPrice = product.regularPrice;
            await product.save();
        }
        console.log('Product offers reset');

        res.json({ status: true, message: `Offer of ${percentage}% added to category ${categoryId}` });
    } catch (error) {
        console.error('Error in addCategoryOffer:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

// const removeCategoryOffer = async(req,res)=>{

//     try {
//         console.log('dldl')
//         const categoryId =req.body
//         console.log(categoryId)
//         console.log('1')
//         const category = await Category.findById({_id:categoryId})
//         console.log('2')
//         if(!category){
//             return res.status(404).json({status:false, message:'Category not found'})
//         }

//         const percentage = category.categoryOffer
//         const products = await Product.find({category:category._id})
// console.log(3)
//         if(products.length > 0){
//             for(const product of products){
//                 product.salePrice += Math.floor(product.regularPrice*(percentage/100))
//                 product.productOffer = 0
//                 await product.save()
//             }
//         }
//         console.log(4)

//         category.categoryOffer = 0
//         await category.save()
//         res.json({status:true})
// console.log(5)
//     } catch (error) {
//         console.log('error from removeCategoryOffer',error)
//         res.status(500).json({status:false,message:'Internal Server Error'})
//     }
// }

const { ObjectId } = require('mongoose').Types;

const removeCategoryOffer = async (req, res) => {
    try {
        // Extract and validate categoryId
        const { categoryId } = req.body;
        if (!categoryId || !ObjectId.isValid(categoryId)) {
            return res.status(400).json({ status: false, message: 'Invalid or missing categoryId' });
        }

        // Find the category
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ status: false, message: 'Category not found' });
        }

        // Store the offer percentage
        const percentage = category.categoryOffer;

        // Update products
        const products = await Product.find({ category: category._id });
        if (products.length > 0) {
            for (const product of products) {
                product.salePrice += Math.floor(product.regularPrice * (percentage / 100));
                product.productOffer = 0;
                await product.save();
            }
        }

        // Remove category offer
        category.categoryOffer = 0;
        await category.save();

        res.json({ status: true, message: 'Category offer removed successfully' });
    } catch (error) {
        console.error('Error in removeCategoryOffer:', error);
        res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
};

// const getListCategory = async(req,res)=>{
//     try {
//         console.log('ListCategory')
//         let id = req.query.id;
//         await Category.updateOne({_id:id},{$set:{isListed:false}})
//         console.log(id)
//         console.log(Category.isListed)
//         res.redirect('/admin/category')
//     } catch (error) {
//         console.log('error from getListCategory',error)
//         res.redirect('/admin/pageError')
//     }
// }

const getListCategory = async (req, res) => {
    try {
        console.log('ListCategory');
        let id = req.body.id;

        // Update the category document
        await Category.updateOne({ _id: id }, { $set: { isListed: true } });

        // Fetch the updated document to check the isListed value
        const updatedCategory = await Category.findById(id);
        console.log(id);
        console.log(updatedCategory.isListed); // This will log the isListed value of the document

        res.json({status:true})
    } catch (error) {
        console.log('error from getListCategory', error);
        res.status(500).json({status:false})
    }
};

const getUnlistCategory = async (req, res) => {
    try {
        console.log('unListCategory')
        let id = req.body.id
        await Category.updateOne({ _id: id }, { $set: { isListed: false } })
        res.json({status:true})
    } catch (error) {
        console.log('Error from getUnListCategory', error)
        res.status(500).json({status:false})
    }
}

const getEditCategory = async (req, res) => {
    try {
        const id = req.query.id
        console.log(id.name)
        const category = await Category.findOne({ _id: id })
        res.render('editCategory', { category: category })
    } catch (error) {

    }
}

const editCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, description } = req.body;

        // Check for existing category with same name (case-insensitive), excluding current one
        const existsCategory = await Category.findOne({
            name: { $regex: `^${name}$`, $options: 'i' },
            _id: { $ne: id }
        });

        if (existsCategory) {
            return res.status(400).json({ message: 'Category already exists, choose a different name' });
        }

        const updatedCategory = await Category.findByIdAndUpdate(id, {
            name,
            description
        });

        if (updatedCategory) {
            res.json({ message: 'Category updated successfully' });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        console.error('Error in editCategory:', error);
        res.redirect('/admin/pageError');
    }
};


module.exports = {
    categoryInfo,
    addCategory,
    addCategoryOffer,
    removeCategoryOffer,
    getListCategory,
    getUnlistCategory,
    getEditCategory,
    editCategory
}