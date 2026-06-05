import * as userService from '../services/user.service.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getMe = async (req, res, next) => {
  try {
    const user = await userService.getMe(req.user.id);
    return successResponse(res, user, 'Profile fetched');
  } catch (err) { next(err); }
};

export const updateMe = async (req, res, next) => {
  try {
    const user = await userService.updateMe(req.user.id, req.body);
    return successResponse(res, user, 'Profile updated');
  } catch (err) { next(err); }
};

export const getProfile = async (req, res, next) => {
  try {
    const profile = await userService.getProfile(req.user.id);
    return successResponse(res, profile, 'Eligibility profile fetched');
  } catch (err) { next(err); }
};

export const updateProfile = async (req, res, next) => {
  try {
    const profile = await userService.updateProfile(req.user.id, req.body);
    return successResponse(res, profile, 'Eligibility profile updated');
  } catch (err) { next(err); }
};

export const getSavedSchemes = async (req, res, next) => {
  try {
    const saved = await userService.getSavedSchemes(req.user.id);
    return successResponse(res, saved, 'Saved schemes fetched');
  } catch (err) { next(err); }
};

export const saveScheme = async (req, res, next) => {
  try {
    const saved = await userService.saveScheme(req.user.id, req.params.schemeId);
    return successResponse(res, saved, 'Scheme saved', 201);
  } catch (err) { next(err); }
};

export const updateSavedScheme = async (req, res, next) => {
  try {
    const saved = await userService.updateSavedScheme(req.user.id, req.params.schemeId, req.body);
    return successResponse(res, saved, 'Application status updated');
  } catch (err) { next(err); }
};

export const removeSavedScheme = async (req, res, next) => {
  try {
    await userService.removeSavedScheme(req.user.id, req.params.schemeId);
    return successResponse(res, null, 'Scheme removed from saved');
  } catch (err) { next(err); }
};

export const getDocuments = async (req, res, next) => {
  try {
    const docs = await userService.getDocuments(req.user.id);
    return successResponse(res, docs, 'Documents fetched');
  } catch (err) { next(err); }
};

export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 'No file uploaded', 400);
    const { type } = req.body;
    if (!type) return errorResponse(res, 'Document type is required', 400);
    const doc = await userService.uploadDocument(req.user.id, req.file, type);
    return successResponse(res, doc, 'Document uploaded', 201);
  } catch (err) { next(err); }
};

export const deleteDocument = async (req, res, next) => {
  try {
    await userService.deleteDocument(req.user.id, req.params.id);
    return successResponse(res, null, 'Document deleted');
  } catch (err) { next(err); }
};

export const deleteAccount = async (req, res, next) => {
  try {
    await userService.deleteAccount(req.user.id);
    return successResponse(res, null, 'Account deleted');
  } catch (err) { next(err); }
};
