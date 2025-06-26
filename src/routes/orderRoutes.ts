import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  createOrder,
  getUserOrderHistory,
  getOrderById,
} from "../controllers/orderController";

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

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get User's Order History
 *     description: Retrieves a list of all orders placed by the currently authenticated user.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of orders to return per page.
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of orders to skip for pagination.
 *     responses:
 *       200:
 *         description: A paginated list of orders.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'  # Assuming you have an Order schema defined
 */
router.get("/orders", authenticateToken, getUserOrderHistory);

/**
 * @swagger
 * /api/orders/{orderId}:
 *   get:
 *     summary: Get Order Details
 *     description: Retrieves the details for a single, specific order. User must be the owner of the order or an admin.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the order.
 *     responses:
 *       200:
 *         description: OK (Success). Returns the full order object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Not Found. The orderId does not exist or the user is not authorized to view it.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Order not found."
 */
router.get("/orders/:orderId", authenticateToken, getOrderById);

export default router;
