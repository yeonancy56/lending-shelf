const express = require ('express');
const friendController = require('../controllers/friend.controller');

const router = express.Router();

router.get('/',         friendController.list);
router.get('/:id',      friendController.getOne);
router.post('/',        friendController.create);
router.put('/:id',      friendController.update);
router.delete('/:id',   friendController.remove);

module.exports = router;