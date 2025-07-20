# Project Gemini: Event Ticketing API

This document outlines the development guidelines and architectural goals for the Event Ticketing API project.

## 1. Development Guidelines

### 1.1. Coding Style
- **Naming Convention:** Use `camelCase` for all variables and function names.
- **Indentation:** Use 2 spaces for indentation.
- **Unit Tests:** All new features must be accompanied by corresponding unit tests.

### 1.2. Tech Stack
- **Backend:** Node.js with Express.js
- **Database:** PostgreSQL

### 1.3. File Structure
- Adhere to the existing file structure when creating new files.

## 2. Architectural Goal: Hexagonal Architecture

We are refactoring the application to a **Hexagonal (Ports and Adapters) Architecture**. This will decouple the core business logic from external concerns like the UI, database, and third-party APIs.

### 2.1. Core Principles

- **Application Core (The Hexagon):** Contains the business logic, entities, and use cases. It has no dependencies on outside layers.
- **Ports:** Interfaces defined in the application core that represent the application's boundaries.
    - **Inbound Ports:** Define how external actors interact with the application (e.g., APIs for the UI).
    - **Outbound Ports:** Define how the application interacts with external services (e.g., database access).
- **Adapters:** Implementations of the ports that connect the core to the outside world (e.g., persistence adapter, web adapter).

### 2.2. Key Tasks

- **Identify Application Core:** Determine the essential business logic and entities.
- **Define Ports:** Propose interfaces for inbound and outbound ports.
- **Create Adapters:** Refactor existing code into adapters that implement the ports.
- **Enforce Dependency Rule:** Dependencies must always point inward (Adapters -> Core).

When suggesting refactoring, please explain how it aligns with these hexagonal architecture principles.

## 3. General Code Assistance Style Guide

### 3.1. Overview

This document outlines the style and architectural guidelines to follow when assisting with code in this project. The primary goal is to maintain a clean, consistent, and maintainable codebase that adheres to the principles of hexagonal architecture.

### 3.2. Architecture: Hexagonal (Ports and Adapters)

-   **Controllers are Thin**: Controllers should be responsible only for handling the HTTP request and response. They should not contain business logic.
-   **Services Contain Business Logic**: All business logic should be placed in service files. This includes validation, data manipulation, and interactions with external services.
-   **Dependency Injection**: Dependencies, such as data sources, should be passed to services, not instantiated within them. This promotes loose coupling and makes testing easier.

### 3.3. Asynchronous Operations

-   **Use `async/await`**: All asynchronous operations should use the `async/await` syntax for clarity and consistency.
-   **`try...catch` Blocks**: All asynchronous operations in controllers should be wrapped in a `try...catch` block to ensure that errors are handled gracefully.

### 3.4. Naming Conventions

-   **`camelCase`**: All variables and function names should be in `camelCase`.
-   **Descriptive Names**: Use descriptive names for functions and variables that clearly indicate their purpose.

### 3.5. Error Handling

-   **Service-Level Errors**: Services should throw errors with a `statusCode` property to indicate the HTTP status code that the controller should return.
-   **Controller-Level Error Handling**: Controllers should catch errors from services and use the `statusCode` and `message` from the error to create a JSON error response. If no `statusCode` is present, default to `500`.

### 3.6. Responses

-   **Success Responses**: Successful responses should have a clear and informative JSON body.
-   **Error Responses**: Error responses should have a consistent JSON format, including a `message` property.