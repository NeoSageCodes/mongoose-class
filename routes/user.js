const router = require("express").Router();
const {signUp, getAllUsers, getOneUser, updateUser, deleteUser, login, verifyEmail, forgotPassword, resetPassword, } = require("../controllers/user");
const { authenticate } = require("../middlewares/authorization");


router.get("/allUsers", authenticate, getAllUsers);
router.get("/oneUser/:id", getOneUser);
router.patch("/update/:id", updateUser);
router.delete("/delete/:id", deleteUser);

router.post("/signup", signUp);
router.post("/login", login);
router.post("/verify-otp", verifyEmail);
router.post("/forgotpassword", forgotPassword);
router.post("/resetpassword", resetPassword);

module.exports = router