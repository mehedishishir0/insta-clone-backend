const { newPost, getPosts, commentPost, getPostById, likePost, disLikePost, getCommentPost, deletePost, bookmarkPost } = require("../Controllers/postControllers")
const isAuthenticated = require("../middlewares/isAuthinticate")
const upload = require("../middlewares/multer")

const postRouter = require("express").Router()


postRouter.post("/addnew",isAuthenticated,upload.single('image'),newPost)
postRouter.get("/userpost/all",isAuthenticated,getPostById)
postRouter.get("/allpost",isAuthenticated,getPosts)
postRouter.get('/like/:id',isAuthenticated,likePost)
postRouter.get('/dislike/:id',isAuthenticated,disLikePost)
postRouter.post("/sendcomment/:id",isAuthenticated,commentPost)
postRouter.post("/allcomments/:id",isAuthenticated,getCommentPost)
postRouter.post("/deletepost/:id",isAuthenticated,deletePost)
postRouter.post("/bookmark/:id",isAuthenticated,bookmarkPost)


module.exports = postRouter