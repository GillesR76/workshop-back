const express = require("express");
const router = express.Router();
const userCtrl = require("../controllers/user");
const auth = require("../middleware/auth");

router.post("/signup", userCtrl.signup);
router.post("/login", userCtrl.login);
router.post("/requestGrade", auth, userCtrl.requestGrade);
router.get("/gradeRequests", auth, userCtrl.getGradeRequests);
router.post("/approveGrade/:userId", auth, userCtrl.approveGrade);

module.exports = router;