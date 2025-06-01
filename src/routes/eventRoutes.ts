import { Router } from 'express';
import { eventController } from '../controllers/eventController';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       required:
 *         - title
 *         - date
 *         - venue
 *         - location
 *         - image
 *         - priceRange
 *         - category
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the event
 *         title:
 *           type: string
 *           description: The title of the event
 *         description:
 *           type: string
 *           description: Short description of the event
 *         longDescription:
 *           type: string
 *           description: Detailed description of the event
 *         date:
 *           type: string
 *           format: date
 *           description: The date of the event
 *         startTime:
 *           type: string
 *           description: Start time of the event
 *         endTime:
 *           type: string
 *           description: End time of the event
 *         venue:
 *           type: string
 *           description: Name of the venue
 *         location:
 *           type: string
 *           description: Location of the event
 *         address:
 *           type: string
 *           description: Full address of the venue
 *         organizer:
 *           type: string
 *           description: Name of the event organizer
 *         image:
 *           type: string
 *           description: Image URL for the event
 *         imageUrl:
 *           type: string
 *           description: Alternative image URL
 *         priceRange:
 *           type: string
 *           description: Price range of tickets
 *         category:
 *           type: string
 *           description: Main category of the event
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *           description: Additional categories
 */

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Returns the list of all events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: The list of events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 */
router.get('/', eventController.getAllEvents);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get an event by id
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The event id
 *     responses:
 *       200:
 *         description: The event description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         description: The event was not found
 */
router.get('/:id', eventController.getEventById);

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       201:
 *         description: The event was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       500:
 *         description: Some server error
 */
router.post('/', eventController.createEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update an event by id
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The event id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       200:
 *         description: The event was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         description: The event was not found
 *       500:
 *         description: Some server error
 */
router.put('/:id', eventController.updateEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete an event by id
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The event id
 *     responses:
 *       204:
 *         description: The event was deleted
 *       404:
 *         description: The event was not found
 *       500:
 *         description: Some server error
 */
router.delete('/:id', eventController.deleteEvent);

export default router; 