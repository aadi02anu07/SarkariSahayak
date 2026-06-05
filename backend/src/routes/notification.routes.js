import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { notificationPrefSchema } from '../validations/user.schema.js';
import * as notifController from '../controllers/notification.controller.js';

const router = Router();
router.use(protect);

router.get('/', notifController.getNotifications);
router.patch('/read-all', notifController.markAllRead);
router.patch('/:id/read', notifController.markOneRead);
router.get('/preferences', notifController.getPreferences);
router.put('/preferences', validate(notificationPrefSchema), notifController.updatePreferences);

export default router;
