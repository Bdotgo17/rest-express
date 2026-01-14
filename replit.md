# SwapTrack - Truck Driver Swap Point Tracker

## Overview
SwapTrack is a web application for tracking and coordinating truck drivers meeting at swap points. It enables logistics teams to manage drivers, swap locations, and schedule driver handoffs efficiently.

## Current State
- **Version**: 1.0 MVP
- **Status**: Functional with in-memory storage
- **Last Updated**: January 2026

## Features
- **Dashboard**: Overview with stats (active drivers, swap points, active swaps, completed today)
- **Drivers Management**: Add, view, and track truck drivers with status indicators
- **Swap Points**: Manage meeting locations with capacity tracking and amenities
- **Swaps**: Schedule and track driver swap meetings
- **Dark Mode**: Full dark/light theme support

## Project Architecture

### Frontend (`client/`)
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with shadcn/ui components
- **State**: TanStack Query for server state management
- **Forms**: React Hook Form with Zod validation

### Backend (`server/`)
- **Framework**: Express.js
- **Storage**: In-memory storage (MemStorage class)
- **API**: RESTful endpoints under `/api/`

### Shared (`shared/`)
- **Schema**: Drizzle ORM schemas with Zod validation
- **Types**: TypeScript types exported for both frontend and backend

## API Endpoints

### Drivers
- `GET /api/drivers` - List all drivers
- `GET /api/drivers/:id` - Get single driver
- `POST /api/drivers` - Create driver
- `PATCH /api/drivers/:id` - Update driver
- `DELETE /api/drivers/:id` - Delete driver

### Swap Points
- `GET /api/swap-points` - List all swap points
- `GET /api/swap-points/:id` - Get single swap point
- `POST /api/swap-points` - Create swap point
- `PATCH /api/swap-points/:id` - Update swap point
- `DELETE /api/swap-points/:id` - Delete swap point

### Swaps
- `GET /api/swaps` - List all swaps
- `GET /api/swaps/:id` - Get single swap
- `POST /api/swaps` - Create swap
- `PATCH /api/swaps/:id` - Update swap
- `DELETE /api/swaps/:id` - Delete swap

## Data Models

### Driver
- `id`: Unique identifier
- `name`: Driver's full name
- `phone`: Contact number
- `truckId`: Vehicle identifier
- `status`: available | en-route | waiting | delayed | offline
- `currentLocation`: Optional current location

### SwapPoint
- `id`: Unique identifier
- `name`: Location name
- `address`: Full address
- `capacity`: Maximum trucks allowed
- `amenities`: Array of amenity types (parking, fuel, rest)

### Swap
- `id`: Unique identifier
- `driver1Id`: First driver
- `driver2Id`: Second driver
- `swapPointId`: Meeting location
- `scheduledTime`: Scheduled swap time
- `status`: scheduled | in-progress | completed | cancelled
- `notes`: Optional notes

## Running the Project
The application runs via the "Start application" workflow which executes `npm run dev`. This starts both the Express backend and Vite dev server on port 5000.

## Design Guidelines
See `design_guidelines.md` for detailed UI/UX specifications including typography, colors, spacing, and component guidelines.
