import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { protect, optionalAuth } from '../middlewares/auth.js';
import { schemeListQuerySchema, eligibilityMatchSchema } from '../validations/scheme.schema.js';
import * as schemeController from '../controllers/scheme.controller.js';

const router = Router();

router.get('/', validate(schemeListQuerySchema, 'query'), schemeController.listSchemes);
router.get('/search', schemeController.searchSchemes);
router.get('/trending', schemeController.getTrending);
router.get('/by-event/:eventSlug', schemeController.getByLifeEvent);
router.post('/match', optionalAuth, validate(eligibilityMatchSchema), schemeController.matchSchemes);
router.get('/:slug', schemeController.getSchemeBySlug);

export default router;
