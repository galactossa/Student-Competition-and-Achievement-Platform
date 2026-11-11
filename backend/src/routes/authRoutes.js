const express = require('express');
const authController = require('../controllers/authController');
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const validate = require('../middlewares/validate');
const { loginSchema, refreshSchema, registerSchema } = require('../validators/authValidator');

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.me);
router.get('/ping/mahasiswa', auth, role('mahasiswa'), authController.mahasiswaPing);
router.get('/ping/admin', auth, role('admin_pka', 'super_admin'), authController.adminPing);

module.exports = router;
