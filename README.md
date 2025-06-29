# Event Ticketing API

[![Build Status](https://img.shields.io/travis/com/your-username/event-ticketing-api.svg?style=flat-square)](https://travis-ci.com/your-username/event-ticketing-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg?style=flat-square)](http://www.typescriptlang.org/)

A comprehensive backend API service for an event ticketing platform. It allows users to browse events, select tickets, and complete purchases, while providing administrators with tools to manage ticket inventory and analyze sales data.

## Features

- **User Authentication**: Secure user registration and login using JWT.
- **Event Management**: Full CRUD operations for events.
- **Ticket Management**: Manage different ticket types and inventory for each event.
- **Order Processing**: Handle ticket purchases and order history for users.
- **FAQ Management**: Simple CRUD for frequently asked questions.
- **Database**: Uses PostgreSQL with TypeORM for robust data management.
- **API Documentation**: Auto-generated and interactive API documentation with Swagger (OpenAPI).

## Project Structure

The project follows a standard structure for a Node.js API service:

```
src/
├── config/         # Environment variables and other configurations.
├── controllers/    # Express route handlers that orchestrate responses.
├── entities/       # TypeORM entities representing database tables.
├── middlewares/    # Custom Express middlewares (e.g., authentication, error handling).
├── routes/         # API route definitions.
├── services/       # Business logic, separated from controllers.
├── types/          # Custom TypeScript type definitions.
└── index.ts        # Application entry point.
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v12 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd event-ticketing-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add the following environment variables:
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=event_ticketing

JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=24h
```

4. Create the database:
```bash
createdb event_ticketing
```

5. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## API Documentation

Swagger documentation is available at `http://localhost:3000/api-docs`

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── entities/       # Database entities
├── middlewares/    # Custom middlewares
├── routes/         # API routes
├── services/       # Business logic
├── types/          # TypeScript type definitions
└── index.ts        # Application entry point
```

## Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project
- `npm start` - Start production server
- `npm test` - Run tests

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 