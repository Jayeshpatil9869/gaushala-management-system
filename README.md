# Gaushala Cow Management System

A web-based application for managing cows in a Gaushala (cow shelter). This system helps track cow information, health status, and maintain records efficiently.

## Features

- User authentication and authorization
- Cow registration with image upload
- Detailed cow profiles with health tracking
- Dashboard with statistics and recent activities
- Search functionality for quick access to cow records
- Reports generation

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage for image uploads
- **Authentication**: Supabase Auth

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
   ```
   git clone https://github.com/Mahendra111111/Gaushala.git
   cd Gaushala
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. Run the development server
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

The application is configured for deployment on Vercel or Firebase Hosting.

## License

This project is licensed under the MIT License.
