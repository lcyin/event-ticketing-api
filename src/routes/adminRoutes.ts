import { Router } from "express";
import { createEvent, getAllEvents } from "../controllers/adminController";
import { authenticateToken } from "../middleware/auth";
import { authorizeAdmin } from "../middleware/adminAuth";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administration and event management
 */

/**
 * @swagger
 * /api/v1/admin/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - date
 *               - venue
 *               - location
 *               - image_url
 *               - price_range
 *               - categories
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Summer Music Festival"
 *               description:
 *                 type: string
 *                 example: "An unforgettable summer concert series."
 *               long_description:
 *                 type: string
 *                 example: "Join us for three days of amazing music..."
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2025-07-20"
 *               start_time:
 *                 type: string
 *                 example: "14:00"
 *               end_time:
 *                 type: string
 *                 example: "22:00"
 *               venue:
 *                 type: string
 *                 example: "Green Valley Amphitheater"
 *               location:
 *                 type: string
 *                 example: "Sunnydale, CA"
 *               address:
 *                 type: string
 *                 example: "123 Main St"
 *               organizer:
 *                 type: string
 *                 example: "Live Events Co."
 *               image_url:
 *                 type: string
 *                 format: url
 *                 example: "https://example.com/images/summer-fest.jpg"
 *               price_range:
 *                 type: string
 *                 example: "$75 - $200"
 *               categories:
 *                 description: A list of tags or categories that classify the event
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Music", "Festival", "Outdoor"]
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event' # Assuming you'll define an Event schema in Swagger
 *       400:
 *         description: Bad Request (e.g., missing fields, invalid data)
 *       401:
 *         description: Unauthorized (no token or invalid token)
 *       403:
 *         description: Forbidden (user is not an admin)
 *       500:
 *         description: Internal Server Error
 */
router.post("/events", authenticateToken, authorizeAdmin, createEvent);

/**
 * @swagger
 * /api/v1/admin/events:
 *   get:
 *     summary: Get all events (for Admin View)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter events by status (e.g., draft, published, archived)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of events per page
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: createdAt
 *           enum: [id, title, date, location, status, createdAt, updatedAt]
 *         description: Field to sort results by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           default: desc
 *           enum: [asc, desc]
 *         description: Sorting order (ascending or descending)
 *     responses:
 *       200:
 *         description: A paginated list of events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_events:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event' # Or a more specific AdminEventSummary schema
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */
router.get("/events", authenticateToken, authorizeAdmin, getAllEvents);

export default router;
