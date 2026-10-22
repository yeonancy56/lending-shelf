const express = require('express')
const bookController = require('../controllers/book.controller');

const router = express.Router();

router.get ('/',                            bookController.list);
router.get('/:id',                          bookController.getOne);
router.post('/',                            bookController.create  );
router.put('/:id',                          bookController.update);
router.delete('/:id',                       bookController.remove);

module.exports = router; 
   