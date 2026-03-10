/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue */
import mongoose from 'mongoose'
import Category from '../../models/catagory.js'
import Product from '../../models/productSchema.js'
import logger from '../../utils/logger.js'
import categoryService from '../../services/admin/categoryService.js'


const categoryInfo = async (req, res) => {
  try {

    const result = await categoryService.categoryInfo(req.query)
    if (!result) throw new Error('something went wrong try again')

    const isFetch = req.headers.accept?.includes('application/json')

    if (isFetch) {
      return res.json({
        category: result.category,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalCategories: result.totalCategories,
      })
    }

    return res.render('category', {
      cat: result.category,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalCategories: result.totalCategories
    })
  } catch (error) {
    logger.error(`error from categoryInfo ${error}`)
    res.redirect('/admin/pageError')
  }
}

const addCategory = async (req, res) => {
  try {

    const result = await categoryService.addCategory(req.body)
    if (!result) return res.status(401).json({ message: 'Something went wrong try again later...' })
    return res.status(result.statusCode).json({ status:result.status, message: result.message })
  } catch (error) {
    logger.error(`error from addCategory function ${error}`)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

const addCategoryOffer = async (req, res) => {
  try {
    const result = await categoryService.addCategoryOffer(req.body)
    return res.status(result.statusCode).json({ status: result.status, message: result.message })
  } catch (error) {
    logger.error(`Error in addCategoryOffer: ${error}`)
    return res
      .status(500)
      .json({ status: false, message: 'Internal server error!qwq' })
  }
}


const removeCategoryOffer = async (req, res) => {
  try {
    const result = await categoryService.removeCategoryOffer(req.body)
    return res.status(result.statusCode).json({ status: result.status, message: result.message })
  } catch (error) {
    logger.error(`Error in removeCategoryOffer: ${error}`)
    res.status(500).json({ status: false, message: 'Internal Server Error' })
  }
}

const ListCategory = async (req, res) => {
  try {
    const result = await categoryService.ListCategory(req.body)
    return res.status(result.statusCode).json({ status: result.status, message: result.message })
  } catch (error) {
    logger.error(`error from tListCategory ${error}`)
    return res.status(500).json({ status: false })
  }
}

const unListCategory = async (req, res) => {
  try {
    const result = await categoryService.unListCategory(req.body)

    return res.status(result.statusCode).json({ status: result.status, message: result.message })
  } catch (error) {
    logger.error(`Error from unListCategory ${error}`)
    return res.status(500).json({ status: false })
  }
}

const getEditCategory = async (req, res) => {
  try {
    const result = await categoryService.getEditCategory(req.query)
    if (!result) return res.redirect('/admin/pageError')
    return res.render('editCategory', { category : result.category })
  } catch (error) {
    logger.error(`Error from getEditCategory ${error}`)
    return res.redirect('/admin/pageError')
  }
}

const editCategory = async (req, res) => {
  try {
    const result = await categoryService.editCategory(req.params, req.body)
    if (!result) return res.status(404).json({ status: false, message: 'Something went wrong!' })
      return res.status(result.statusCode).json({ status: result.status, message: result.message })
  } catch (error) {
    logger.error(`Error in editCategory: ${error}`)
    return res.status(500).json({ status: true, message: 'Internal Server error' })
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
  editCategory,
}
