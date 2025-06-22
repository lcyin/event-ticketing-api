import { Router } from "express";
import {
  getPublicEvents,
  getPublicEventById,
} from "../controllers/publicEventController";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Public event listing and details
 */

/**
 * @swagger
 * /api/v1/events:
 *   get:
 *     summary: List, Search, and Filter Events
 *     tags: [Events]
 *     description: Retrieves a paginated list of events. This endpoint is public.
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: A search term to match against titles and descriptions.
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filters events that have this category in their categories array.
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filters for events on a specific date (YYYY-MM-DD).
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: The number of results per page.
 *     responses:
 *       200:
 *         description: A JSON object containing pagination details and an array of Event objects.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object # Define a specific PublicEvent schema if needed
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       title:
 *                         type: string
 *                       imageUrl:
 *                         type: string
 *                         format: url
 *                       categories:
 *                         type: array
 *                         items:
 *                           type: string
 *                       startTime:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       endTime:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       venue:
 *                         type: string
 *                       location:
 *                         type: string
 *       400:
 *         description: Bad Request (e.g., invalid date format, non-integer page/limit).
 *       500:
 *         description: Internal Server Error.
 */
router.get("/events", getPublicEvents);

/**
 * @swagger
 * /api/v1/events/{eventId}:
 *   get:
 *     summary: Get a Single Event's Details
 *     tags: [Events]
 *     description: Retrieves all details for a single event, including its ticket types. This endpoint is public.
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the event.
 *     responses:
 *       200:
 *         description: The full Event object, including the nested ticketTypes array.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Event'
 *                 - type: object
 *                   properties:
 *                     ticketTypes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TicketType'
 *       400:
 *         description: Invalid event ID format.
 *       404:
 *         description: No event with the specified eventId was found.
 *       500:
 *         description: Internal Server Error.
 */
router.get("/events/:eventId", getPublicEventById);

export default router;
