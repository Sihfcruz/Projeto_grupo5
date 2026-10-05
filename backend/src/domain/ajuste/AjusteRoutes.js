const express = require('express');
const router = express.Router();
const AjusteController = require('./AjusteController');
router.post('/', AjusteController.ajustar.bind(AjusteController));
module.exports = router;