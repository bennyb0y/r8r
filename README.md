# 🌯 Burrito Rater

A web application for rating and discovering burritos, built with Next.js and deployed on Cloudflare Pages and Cloudflare D1.

## 🚀 Features

- **🗺️ Interactive Map**: View burrito ratings on a Google Map
- **⭐ Rating Submission**: Submit ratings for burritos with details like price, taste, and ingredients
- **📋 Rating List**: Browse all submitted ratings in a sortable list
- **🔐 Admin Interface**: 
  - Manage and confirm ratings through an admin portal
  - Real-time updates with 30-second refresh
  - Event-driven updates for new submissions
  - Bulk actions for rating management
- **📱 Responsive Design**: Works on desktop and mobile devices
- **🔒 Security Features**:
  - USA-only submissions with location validation
  - CAPTCHA protection for submissions
  - Session-based admin authentication

## 💻 Tech Stack

- **Frontend**:
  - Next.js 15.2+
  - React
  - TypeScript
  - Tailwind CSS
  - Google Maps API
  - Tremor UI Components

- **Backend**:
  - Cloudflare Workers
  - Cloudflare D1 (Edge Database)
  - Cloudflare Pages for hosting

## 🏁 Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm (v10 or later)
- Google Maps API key
- Cloudflare account with Workers and D1 enabled

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/bennyb0y/burrito-rater.git
   cd burrito-rater
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. **Set up Google Maps API**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable these APIs in "APIs & Services" > "Library":
     - Maps JavaScript API
     - Places API
   - Create credentials:
     - Go to "APIs & Services" > "Credentials"
     - Click "Create Credentials" > "API Key"
     - Copy your API key
   - Configure API key restrictions:
     - Click on your API key to edit
     - Under "Application restrictions", select "HTTP referrers (websites)"
     - Add your domains (localhost, your production domain, etc.)
     - Under "API restrictions", select "Restrict key"
     - Select the APIs you enabled (Maps JavaScript API and Places API)
     - Click "Save"

4. Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   NEXT_PUBLIC_API_BASE_URL=https://your-worker-name.your-account.workers.dev
   NEXT_PUBLIC_ADMIN_PASSWORD=your_admin_password
   ```

   > **Important**: 
   > - The `.env.local` file is automatically ignored by Git (see `.gitignore`)
   > - All environment variables must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser
   > - Never commit API keys or sensitive information to version control
   > - For production, set environment variables in your hosting platform

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000.

### Code Quality

Run ESLint to maintain code quality:
```bash
npm run lint
```

### Deployment

For detailed deployment instructions, see the [Administration and DevOps Guide](./docs/ADMIN_DEVOPS.md).

Quick deployment commands:
```bash
# Deploy frontend only (recommended for frontend changes)
npm run deploy:app

# Deploy API worker only (for API changes)
npm run deploy:worker
```

> **Note**: Always deploy the API worker and frontend separately to avoid Edge Runtime errors.

## 📁 Project Structure

```
burrito-rater/
├── app/                  # Next.js app directory
│   ├── admin/           # Admin interface
│   │   ├── dashboard/   # Admin dashboard
│   │   ├── monitoring/  # System monitoring
│   │   └── ratings/     # Ratings management
│   ├── components/      # React components
│   ├── list/           # Public rating list page
│   └── page.tsx        # Home page (map view)
├── api/                 # Cloudflare Worker code
├── public/             # Static assets
├── docs/               # Documentation
│   ├── ADMIN_DEVOPS.md # Deployment and admin guide
│   ├── API_WORKER.md   # API documentation
│   └── PRODUCT_MGMT/   # Product management docs
└── package.json        # Project dependencies
```

## 📚 Documentation

For detailed documentation, please refer to:
- [Administration and DevOps Guide](./docs/ADMIN_DEVOPS.md)
- [API Documentation](./docs/API_WORKER.md)
- [Project Roadmap](./docs/PRODUCT_MGMT/ROADMAP.md)
- [Sprint Priorities](./docs/PRODUCT_MGMT/SPRINT_PRIORITIES.md)
- [Bug Tracking](./docs/PRODUCT_MGMT/BUGS.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run lint checks (`npm run lint`)
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Google Maps API](https://developers.google.com/maps)
- [Tailwind CSS](https://tailwindcss.com/)
- [Tremor](https://www.tremor.so/)
