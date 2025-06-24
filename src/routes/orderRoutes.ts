import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { createOrder } from "../controllers/orderController";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order (Checkout)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tickets
 *               - customer_info
 *               - billing_address
 *               - payment_info
 *             properties:
 *               tickets:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     ticket_type_id:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: integer
 *               customer_info:
 *                 type: object
 *                 $ref: '#/components/schemas/CustomerInfo'  # Define this schema
 *               billing_address:
 *                 type: object
 *                 $ref: '#/components/schemas/BillingAddress' # Define this schema
 *               payment_info:
 *                 type: object
 *                 $ref: '#/components/schemas/PaymentInfo'    # Define this schema
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Bad Request (e.g., invalid input, insufficient stock)
 *       401:
 *         description: Unauthorized
 */
router.post("/orders", authenticateToken, createOrder);

export default router;
