# Playwright Test Runner Dashboard

A modern, futuristic SaaS-style frontend for a Playwright Test Runner Dashboard. This application provides a sleek interface for running, monitoring, and analyzing Playwright tests across different environments.

## Features

- **Dark Theme UI**: Sleek gradients, glassmorphism UI elements, and clean typography
- **Animated Components**: Subtle animations using Framer Motion
- **Multiple Test Environments**: Run tests in QA, Staging, or Production
- **Test Type Selection**: Choose from Smoke, Regression, E2E, and Performance tests
- **Dashboard View**: Monitor test runs with status indicators and detailed metrics
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js with React
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Typography**: Custom gradient text effects
- **UI Components**: Custom glassmorphism cards, buttons, and inputs

## Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the project directory:

```bash
cd newfrontend
```

3. Install dependencies:

```bash
npm install
# or
yarn install
```

4. Start the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
newfrontend/
├── src/
│   ├── app/                # Next.js App Router pages
│   ├── components/         # Reusable UI components
│   │   ├── layout/         # Layout components
│   │   └── ui/             # UI components (Button, Card, etc.)
│   ├── styles/             # Global styles
│   └── utils/              # Utility functions
├── public/                 # Static assets
├── package.json            # Dependencies and scripts
└── tailwind.config.js      # Tailwind CSS configuration
```

## API Integration

This frontend is designed to connect to a backend API for triggering Playwright tests. The API endpoints are not implemented in this project but would typically include:

- `/api/environments` - Get available test environments
- `/api/test-types` - Get available test types
- `/api/runs` - Start a new test run
- `/api/runs/:id` - Get test run details
- `/api/runs/:id/logs` - Get test run logs

## License

This project is licensed under the MIT License.
