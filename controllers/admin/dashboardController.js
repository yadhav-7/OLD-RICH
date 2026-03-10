import logger from '../../utils/logger.js'
import dashboardService from '../../services/admin/dashboardService.js'

const loadDashboard = async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query

    const result = await dashboardService.getDashboardStats(date, startDate, endDate)

    return res.render('dashboard', {
      topProducts: result.topProducts,
      topCategory: result.topCategory,
      topBrands: result.topBrands,
    })
  } catch (error) {
    logger.error(`Load Dashboard function error ${error}`)
    return res.redirect('/admin/pageNotFound')
  }
}

export default {
  loadDashboard,
}
