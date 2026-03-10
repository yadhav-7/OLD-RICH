import logger from '../../utils/logger.js'
import customerService from '../../services/admin/customerService.js'

const costomerInfo = async (req, res) => {
  try {
    const result = await customerService.costomerInfo(req.query)

    const isFetch = req.headers.accept?.includes('application/json')

    if (isFetch) {
      return res.json({
        ...result
      })
    }

   return res.render('customers', {
      ...result
    })
  } catch (error) {
    logger.error(`error from custumeInfo ${error}`)
    const isFetch = req.headers.accept?.includes('application/json')

    if (isFetch) {
      return res.status(500).json({
        message:'Internal server error',
        error
      })
    }
    return res.redirect('/admin/pageError')
  }
}

const blockUser = async (req, res) => {
  try {
    const result = await customerService.blockUser(req.body.userId)
    
   if(result===true) return res.status(200).json({ message: true })

  } catch (error) {
    logger.error(`error from block user ${error}`)
    return res.redirect('/admin/pageError')
  }
}

const unBlockUser = async (req, res) => {
  try {
    const result = await customerService.unBlockUser(req.body.userId)
   if(result===true) return res.json({ message: true })
  } catch (error) {
    logger.error(`error from unblock user ${error}`)
    res.status(500).json({ message: false })
  }
}

export default {
  costomerInfo,
  blockUser,
  unBlockUser,
}
