const User = require('../../models/userSchema')

const costomerInfo = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;

        const limit = 5
        
        const skip = (page - 1) * limit;

        let search = req.query.search||''

        const query = {
            isAdmin: false,
            $or: [
                { username: { $regex: ".*" + search + ".*", $options: 'i' } },
                { email: { $regex: ".*" + search + ".*", $options: 'i' } }
            ]
        };

        const count = await User.countDocuments(query);
        const totalPages = Math.ceil(count / limit);

        

        const userData = await User.find(query)
            .sort({createdOn:-1})
            .limit(limit)
            .skip(skip)
            .exec()

            const isFetch = req.headers.accept?.includes('application/json')

        if (isFetch) {
            
            return res.json({
                data: userData,
                currentPage: page,
                totalPages: totalPages
            });
        }
            
        res.render('customers', {
            data: userData,
            currentPage: page,
            totalUsers: count, // Use count instead of totalUsers
            totalPages: totalPages
        });
    } catch (error) {
        console.error('error from custumeInfo',error)
        res.redirect('/pageNotFound')
    }
}

const blockUser = async (req, res) => {
    try {
        console.log('flsdfjldjlj')
        const id = req.body.userId
        await User.updateOne({ _id: id }, { $set: { isBlock: true } })
        return res.status(200).json({as:'true'})
    } catch (error) {
        console.log('error from block user')
        return res.redirect('/admin/pageError')
    }
}

const unBlockUser = async (req, res) => {
    try {
        
        const id = req.body.userId
        await User.updateOne({ _id: id }, { $set: { isBlock: false } })
        return res.json({message:true})
    } catch (error) {
        console.log('error from unblock user',error)
        res.status(500).json({message:false})
    }
}


module.exports = {
    costomerInfo,
    blockUser,
    unBlockUser
}