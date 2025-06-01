# Event Ticketing API

A comprehensive backend API service for an event ticketing platform that allows users to browse events, select tickets, and complete purchases while providing administrators tools to manage ticket inventory and analyze sales data.

## Features

- Event management (CRUD operations)
- Ticket type management
- Order processing
- FAQ management
- Swagger API documentation
- PostgreSQL database with TypeORM
- TypeScript support

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup

1. Clone the repository:
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