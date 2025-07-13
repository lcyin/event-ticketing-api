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
