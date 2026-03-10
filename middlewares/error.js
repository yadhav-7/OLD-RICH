import logger from "../utils/logger.js"
const errorHandler = (err, req, res, next) => {
    logger.error(`Internal Servar error: ${err}`)
    const statusCode = err.statusCode || 500
    const message = err.message || "Internal Server Error"

    if (req.xhr || req.headers.accept.includes('application/json')) {
        res.status(statusCode).json({
            success: false,
            message
        })
    } else {
        if (req.path.startsWith('/admin')) {
            return res.redirect('/admin/pageError')
        } else {

            return res.redirect('/pageNotFound')
        }
    }
}

export default errorHandler