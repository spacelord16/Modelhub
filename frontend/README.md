# Model Hub Frontend

This is the frontend application for the Deep Learning Model Hub, built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Modern, responsive UI built with Next.js and Tailwind CSS
- Type-safe development with TypeScript
- Authentication system for user management
- Model upload and management interface
- Interactive model testing interface
- RESTful API integration with the backend

## Prerequisites

- Node.js 18.x or later
- npm 9.x or later

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file in the root directory with the following variables:

   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check for code issues

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # Reusable React components
│   ├── lib/             # Utility functions and API client
│   └── styles/          # Global styles and Tailwind config
├── public/              # Static assets
└── package.json         # Project dependencies and scripts
```

## Contributing

1. Fork the repository
2. Create a new branch for your feature
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
