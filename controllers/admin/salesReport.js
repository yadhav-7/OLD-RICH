/* eslint-disable no-restricted-syntax, no-plusplus, no-loop-func, no-shadow */
import logger from '../../utils/logger.js'
import salesService from '../../services/admin/salesService.js'

const getSalesReport = async (req, res) => {
  try {
    const result = await salesService.getSalesReportData(req.query)

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json(result)
    }
    return res.render('salesReport', result)
  } catch (error) {
    logger.error(`error in getSalesReport ${error}`)
    res.redirect('/pageNotFound')
  }
}

const salesReport = async (req, res) => {
  try {
    await salesService.generateSalesPDF(req.query, res)
  } catch (error) {
    logger.error(`Error generating sales report: ${error}`)
    res.status(500).send('Error generating sales report PDF')
  }
}

const salesReportExcel = async (req, res) => {
  try {
    const result = await salesService.generateSalesExcel(req.query, res)
    if (!result.status) {
      return res.status(result.statusCode).send(result.message)
    }
  } catch (error) {
    logger.error(`Error generating Excel report: ${error}`)
    res.status(500).send('Error generating Excel report')
  }
}

export default {
  getSalesReport,
  salesReportExcel,
  salesReport,
}
