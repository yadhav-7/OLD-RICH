const User = require('../../models/userSchema')
const Wallet = require('../../models/walletSchema')
const refferalCodeEnterPage = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const userId = req.session.user
    const user = await User.findOne({ _id: userId })
    if (user.refferalCodeApplied === 'notUsed' || user.refferalCodeApplied === 'used') return res.redirect('/home')
    res.render('refferalCodeEnterPage')
  } catch (error) {
    console.error('error in refferalCodeEnterPage', error)
    return res.redirect('/pageNotFound')
  }
}

const applyRefferalCode = async (req, res) => {
  try {
    console.log('reached at apply Refferalcode')
    const newUserId = req.session.user
    const newUser = await User.findOne({ _id: newUserId })

    if (newUser.refferalCodeApplied === 'used') return res.status(401).json({ message: 'You already applied refferal code!' })
    const code = req.query.code

    if (!code) return res.status(401).json({ message: 'Please enter code!' })
    if (code.length !== 6) return res.status(401).json({ message: 'Please enter 6 digit code!' })

    if (code === newUser.referCode) return res.status(401).json({ message: 'You cant use your own refferal code' })

    const findUser = await User.findOne({ referralCode: code })

    if (!findUser) return res.status(401).json({ message: 'Invalid Referral Code!' })

    const userId = findUser._id

    const wallet = await Wallet.findOne({ userId: userId })

    if (!wallet) return res.status(401).json({ message: 'Wallet not found! Please contact support.' })

    const newTransaction = {
      type: 'credit',
      amount: 100,
      reason: 'New user registered by your reference'
    };

    wallet.transactions.push(newTransaction)
    wallet.balance += 100

    wallet.totalCredited += 100
    newUser.refferalCodeApplied = 'used'

    await newUser.save()

    await wallet.save()

    return res.status(200).json({
      message: 'Referral applied successfully!',
      wallet
    });

  } catch (error) {
    console.error('Error in applyReferralCode:', error)
    return res.status(500).json({ message: 'Something went wrong!' })
  }
}

const skipRefferal = async (req, res) => {
  try {
    const userId = req.session.user
    const user = await User.findOne({ _id: userId })
    user.refferalCodeApplied = 'notUsed'
    await user.save()
    return res.redirect('/home')
  } catch (error) {
    console.error('error in skipRefferal', error)
    return res.redirect('/pageNotFound')
  }
}


module.exports = {
  refferalCodeEnterPage,
  applyRefferalCode,
  skipRefferal
}