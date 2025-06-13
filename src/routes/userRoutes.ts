import { Router } from "express";
import { getCurrentUser, updateProfile } from "../controllers/userController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The user profile
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get("/me", authenticateToken, getCurrentUser);

/**
 * @swagger
 * /api/v1/users/me:
 *   patch:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       200:
 *         description: The updated user profile
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.patch("/me", authenticateToken, updateProfile);

export default router;
