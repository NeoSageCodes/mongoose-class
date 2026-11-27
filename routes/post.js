const router = require("express").Router();
const {createPost, getOnePost} = require("../controllers/post");
const {upload} = require("../middlewares/multer");

router.post("/createPost/:userId", upload.array('media', 15), createPost);
router.get("/getOnePost/:id", getOnePost)

module.exports = router