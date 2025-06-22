import { Router } from "express";
import { addItemToCart, getCartContents } from "../controllers/cartController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: User shopping cart management
 */

/**
 * @swagger
 * /api/v1/cart/items:
 *   post:
 *     summary: Add an item to the cart
 *     tags: [Cart]
 *     description: Adds a specified quantity of a ticket type to the user's current cart. If the item already exists, its quantity is updated.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticket_type_id
 *               - quantity
 *             properties:
 *               ticket_type_id:
 *                 type: string
 *                 format: uuid
 *                 example: "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6"
 *               quantity:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Success. Returns the entire updated cart.
 *       400:
 *         description: Bad Request (e.g., invalid input, insufficient quantity).
 *       401:
 *         description: Unauthorized (user not logged in).
 *       404:
 *         description: Not Found (ticket type does not exist).
 */
router.post("/items", authenticateToken, addItemToCart);

/**
 * @swagger
 * /api/v1/cart:
 *   get:
 *     summary: Get cart contents
 *     tags: [Cart]
 *     description: Fetches all items currently in the user's cart, including item details and a subtotal.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success. Returns the current cart contents.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ticket_type_id:
 *                         type: string
 *                         format: uuid
 *                       quantity:
 *                         type: integer
 *                       details:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           price:
 *                             type: string
 *                 totalItems:
 *                   type: integer
 *                 subtotal:
 *                   type: string
 *       401:
 *         description: Unauthorized (user not logged in).
 */
router.get("/", authenticateToken, getCartContents);

export default router;
