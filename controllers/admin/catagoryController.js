const Category = require('../../models/catagory')
const Product = require('../../models/productSchema')
const mongoose = require('mongoose');

const categoryInfo = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const search = req.query.search?.trim() || '';
        const limit = 5;
        const skip = (page - 1) * limit;

        const query = {
            name: { $regex: new RegExp(search, 'i') }
        };

        const categoryData = await Category.find(query)
            .sort({ createdOn: -1 })
            .skip(skip)
            .limit(limit);

        const totalCategories = await Category.countDocuments(query);
        const totalPages = Math.ceil(totalCategories / limit);

        const isFetch = req.headers.accept?.includes('application/json');


        if (isFetch) {
            return res.json({
                category: categoryData,
                currentPage: page,
                totalPages: totalPages,
                totalCategories: totalCategories
            });
        }

        res.render('category', {
            cat: categoryData,
            currentPage: page,
            totalPages: totalPages,
            totalCategories: totalCategories
        });
    } catch (error) {
        console.error('error from categoryInfo', error);
        res.redirect('/admin/pageError');
    }
};



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



const addCategoryOffer = async (req, res) => {
    try {
        const { offerPercentage, categoryId } = req.body
        console.log('Request Body:', { offerPercentage, categoryId })


        if (!categoryId) {
            return res.status(400).json({ status: false, message: 'Category ID is required' })
        }
        if (!offerPercentage) {
            return res.status(400).json({ status: false, message: 'Invalid offer percentage (must be 0-100)' })
        }


        const percentage = parseFloat(offerPercentage)


        console.log('categoryId',categoryId)
        console.log('typeof categoryId',typeof categoryId)
        const category = await Category.findById(categoryId)
        console.log('category',category)

        if (!category) {
            return res.status(404).json({ status: false, message: 'Category not found' })
        }


        const products = await Product.find({ category: category._id })

        console.log('products',products)
        if(products.length>0){
            for (let p of products) {
                let productOfferRemoved=false
                if(p.productOffer>percentage)continue
            for (let variant of p.variants) {
                console.log('variant.salePrice * percentage/100', (variant.salePrice * percentage/100))
                console.log('variant.salePrice',variant.salePrice)
                if(p.productOffer>0){
                    variant.salePrice = Math.floor(variant.salePrice / (1 - p.productOffer / 100))
                    productOfferRemoved=true
                }
                variant.salePrice = variant.salePrice - (variant.salePrice * percentage / 100)
            }
            if(productOfferRemoved)p.productOffer=0
            await p.save()
        }
        }

    
        await Category.updateOne({ _id: categoryId }, { $set: { categoryOffer: percentage } })

        return res.json({ status: true, message: `Offer of ${percentage}% added to category ${categoryId}` })
    } catch (error) {
        console.error('Error in addCategoryOffer:', error);
        res.status(500).json({ status: false, message: 'Internal server error!qwq' });
    }
};



const { ObjectId } = require('mongoose').Types;

const removeCategoryOffer = async (req, res) => {
    try {
      
        const { categoryId } = req.body;
        if (!categoryId || !ObjectId.isValid(categoryId)) {
            return res.status(400).json({ status: false, message: 'Invalid or missing categoryId' });
        }

       
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ status: false, message: 'Category not found' });
        }        
        const percentage = category.categoryOffer;
        const products = await Product.find({ category: category._id });
        if (products.length > 0) {
            for (const product of products) {

                if(product.productOffer>0)continue
                for(let variant of product.variants){
                    variant.salePrice = Math.floor(variant.salePrice / (1 - percentage / 100))
                }
                await product.save();
            }
        }

      
        category.categoryOffer = 0
        await category.save()

        return res.json({ status: true, message: 'Category offer removed successfully' })
    } catch (error) {
        console.error('Error in removeCategoryOffer:', error);
        res.status(500).json({ status: false, message: 'Internal Server Error' })
    }
}

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

        res.json({ status: true })
    } catch (error) {
        console.log('error from getListCategory', error);
        res.status(500).json({ status: false })
    }
}

const getUnlistCategory = async (req, res) => {
    try {
        console.log('unListCategory')
        let id = req.body.id
        await Category.updateOne({ _id: id }, { $set: { isListed: false } })
        res.json({ status: true })
    } catch (error) {
        console.log('Error from getUnListCategory', error)
        res.status(500).json({ status: false })
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