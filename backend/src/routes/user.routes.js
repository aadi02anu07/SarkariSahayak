import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { upload } from '../middlewares/upload.js';
import { updateProfileSchema, updateUserSchema, savedSchemeStatusSchema } from '../validations/user.schema.js';
import * as userController from '../controllers/user.controller.js';

const router = Router();
router.use(protect); // All user routes require auth

router.get('/me', userController.getMe);
router.patch('/me', validate(updateUserSchema), userController.updateMe);
router.delete('/me', userController.deleteAccount);

router.get('/me/profile', userController.getProfile);
router.put('/me/profile', validate(updateProfileSchema), userController.updateProfile);

router.get('/me/saved-schemes', userController.getSavedSchemes);
router.post('/me/saved-schemes/:schemeId', userController.saveScheme);
router.patch('/me/saved-schemes/:schemeId', validate(savedSchemeStatusSchema), userController.updateSavedScheme);
router.delete('/me/saved-schemes/:schemeId', userController.removeSavedScheme);

router.get('/me/documents', userController.getDocuments);
router.post('/me/documents', upload.single('file'), userController.uploadDocument);
router.delete('/me/documents/:id', userController.deleteDocument);

export default router;
