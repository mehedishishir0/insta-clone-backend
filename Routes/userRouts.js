const { register, login, logOut, getProfile, updateProfile, getSugesteduser, followUnfllowUser } = require('../Controllers/userControllers')
const isAuthenticated = require('../middlewares/isAuthinticate')
const upload = require('../middlewares/multer')

const userRouter = require('express').Router()

userRouter.post('/register',register)
userRouter.post('/login',login)
userRouter.get('/logout',logOut)
userRouter.get('/profile/:id',isAuthenticated,getProfile)
userRouter.post('/profile/update',isAuthenticated,upload.single('profilepic'),updateProfile)
userRouter.get('/suggested',isAuthenticated,getSugesteduser)
userRouter.post('/followunfollow/:id',isAuthenticated,followUnfllowUser)

module.exports = userRouter