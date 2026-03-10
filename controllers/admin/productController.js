/* eslint-disable no-await-in-loop, no-restricted-syntax, no-plusplus, radix, prefer-const, no-inner-declarations */
import fs from 'fs'
import path from 'path'

import Product from '../../models/productSchema.js'
import Category from '../../models/catagory.js'

import logger from '../../utils/logger.js'
import productService from '../../services/admin/productService.js'

const getAddProducts = async (req, res) => {
  try {

    const result = await productService.getAddProducts()
    return res.render('product-add', {
      category: result,
      message: null,
      success: null,
    })
  } catch (error) {
    logger.error(`error from getAddProduct ${error}`)
    return res.redirect('/admin/pageError')
  }
}

const addProducts = async (req, res) => {
  try {
    const result = await productService.addProducts(req.body, req.files)
    return res.render('product-add', {
      message: result.message,
      category: result.category,
      success: result.success
    })
  } catch (error) {
    logger.error(`error from add product ${error}`)
    res.redirect('/admin/pageError')
  }
}

const getAllProducts = async (req, res) => {
  try {
    const result = await productService.getAllProducts(req.query)

    const isFetch = req.headers.accept?.includes('application/json')

    if (isFetch) {
      return res.json({
        ...result
      })
    }

    res.render('getAllProducts', {
      ...result
    })

  } catch (error) {
    logger.error(`error from getallProducts ${error}`)
    res.redirect('/admin/pageError')
  }
}

const productVarintsModal = async (req, res) => {
  try {
    const result = await productService.productVarintsModal(req.body)

    if (result) {
      return res.json({ status: true, data: result })
    } else {
      return res.status(500)
    }
  } catch (error) {
    logger.error(`error from productVarintsModal ${error}`)
    return res.status(500)
  }
}

const addProductOffer = async (req, res) => {
  try {
    const result = await productService.addProductOffer(req.body)

    return res.status(result.statusCode).json({ success: result.status, message: result.message })
  } catch (error) {
    logger.error(`error from addProductOffer ${error}`)
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' })
  }
}

const removeProductOffer = async (req, res) => {
  try {

    const result = await productService.removeProductOffer(req.body)

    return res.status(result.statusCode).json({ success: result.status, message: result.message })
  } catch (error) {
    return res.status(500).json({ status: false, message: 'Internal server error' })
  }
}

const blockProduct = async (req, res) => {
  try {

    const result = await productService.blockProduct(req.body)

    return res.status(result.statusCode).json({ message: true })
  } catch (error) {
    logger.error(`error from blockProduct ${error}`)
    return res.status('500').json({ message: false })
  }
}

const unBlockProduct = async (req, res) => {
  try {

    const result = await productService.unBlockProduct(req.body)

    return res.status(result.statusCode).json({ message: true })
  } catch (error) {
    logger.error(`error from unBlockProduct ${error}`)
    return res.status(500).json({ message: false })
  }
}

const getEditProduct = async (req, res) => {
  try {

    const result = await productService.getEditProduct(req.query)

    return res.render('getEditProduct', {
      product: result.product,
      category: result.category,
    })
  } catch (error) {
    logger.error(`error from getEditProduct ${error}`)
    return res.redirect('/admin/pageError')
  }
}

const editProduct = async (req, res) => {
  try {
    const result = await productService.editProduct(req.params, req.body, req.files)

    if (result.status) {
      return res.redirect('/admin/allProducts')
    } else {
      return res.status(result.statusCode).json({ status: result.status, error: result.error })
    }

  } catch (error) {
    logger.error(`error from editProduct ${error}`)
    res.redirect('/admin/pageError')
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
