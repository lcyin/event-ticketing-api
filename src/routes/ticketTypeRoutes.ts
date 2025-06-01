import { Router } from 'express';
import { ticketTypeController } from '../controllers/ticketTypeController';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TicketType:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - available
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the ticket type
 *         name:
 *           type: string
 *           description: The name of the ticket type
 *         price:
 *           type: number
 *           description: The price of the ticket
 *         description:
 *           type: string
 *           description: Description of the ticket type
 *         available:
 *           type: integer
 *           description: Number of tickets available
 *         maxPerOrder:
 *           type: integer
 *           description: Maximum number of tickets that can be ordered at once
 */

/**
 * @swagger
 * /api/events/{eventId}/ticket-types:
 *   get:
 *     summary: Returns the list of ticket types for an event
 *     tags: [TicketTypes]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *         required: true
 *         description: The event id
 *     responses:
 *       200:
 *         description: The list of ticket types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TicketType'
 */
router.get('/', ticketTypeController.getTicketTypesByEvent);

/**
 * @swagger
 * /api/events/{eventId}/ticket-types/{id}:
 *   get:
 *     summary: Get a ticket type by id
 *     tags: [TicketTypes]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *         required: true
 *         description: The event id
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ticket type id
 *     responses:
 *       200:
 *         description: The ticket type description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TicketType'
 *       404:
 *         description: The ticket type was not found
 */
router.get('/:id', ticketTypeController.getTicketTypeById);

/**
 * @swagger
 * /api/events/{eventId}/ticket-types:
 *   post:
 *     summary: Create a new ticket type
 *     tags: [TicketTypes]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *         required: true
 *         description: The event id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TicketType'
 *     responses:
 *       201:
 *         description: The ticket type was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TicketType'
 *       404:
 *         description: The event was not found
 *       500:
 *         description: Some server error
 */
router.post('/', ticketTypeController.createTicketType);

/**
 * @swagger
 * /api/events/{eventId}/ticket-types/{id}:
 *   put:
 *     summary: Update a ticket type by id
 *     tags: [TicketTypes]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *         required: true
 *         description: The event id
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ticket type id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TicketType'
 *     responses:
 *       200:
 *         description: The ticket type was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TicketType'
 *       404:
 *         description: The ticket type was not found
 *       500:
 *         description: Some server error
 */
router.put('/:id', ticketTypeController.updateTicketType);

/**
 * @swagger
 * /api/events/{eventId}/ticket-types/{id}:
 *   delete:
 *     summary: Delete a ticket type by id
 *     tags: [TicketTypes]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *         required: true
 *         description: The event id
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ticket type id
 *     responses:
 *       204:
 *         description: The ticket type was deleted
 *       404:
 *         description: The ticket type was not found
 *       500:
 *         description: Some server error
 */
router.delete('/:id', ticketTypeController.deleteTicketType);

export default router; 