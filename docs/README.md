# Burrito Rater Documentation

This directory contains documentation for the Burrito Rater application.

## Available Documentation

### Administration and Development

- [Administration and DevOps Guide](./ADMIN_DEVOPS.md) - Comprehensive guide for deploying, administering, and maintaining the application, including:
  - Centralized admin interface under `/app/admin/`
  - Authentication and security setup
  - Monitoring and system health
  - Rating management and moderation
- [Database Schema](./DATABASE_SCHEMA.md) - Details about the database schema and structure
- [Cloudflare Migration Guide](./CLOUDFLARE_MIGRATION.md) - Details about the migration from SQLite to Cloudflare D1
- [Custom Domain Setup Guide](./CUSTOM_DOMAIN.md) - Step-by-step guide for configuring a custom domain
- [Development Guidelines](../.cursorrules) - Coding standards and development guidelines
- [CAPTCHA Implementation Guide](./CAPTCHA_IMPLEMENTATION.md) - Detailed documentation on the Cloudflare Turnstile CAPTCHA integration
- [API Worker Documentation](./API_WORKER.md) - Information about the Cloudflare Worker API and its endpoints

### Product Management

- [Project Roadmap](./PRODUCT_MGMT/ROADMAP.md) - Comprehensive long-term vision and feature planning document that outlines all planned features, improvements, and milestones for future versions. This document serves as the single source of truth for what we want to accomplish over time.
- [Sprint Priorities](./PRODUCT_MGMT/SPRINT_PRIORITIES.md) - Focused, short-term planning document (2-4 weeks) that tracks immediate tasks, bugs, and features currently in development. This document is updated frequently and serves as the primary reference for what needs to be done next.
- [Bug Tracking](./PRODUCT_MGMT/BUGS.md) - Known issues and their status

## Project Overview

Burrito Rater is a web application for discovering and rating burritos. Users can submit ratings for burritos they've tried, view ratings on a map, and browse a list of all ratings. It is built with:

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS (deployed to Cloudflare Pages)
- **Backend**: Cloudflare Workers
- **Database**: Cloudflare D1
- **Maps**: Google Maps API
- **Security**: Cloudflare Turnstile CAPTCHA

For more information, see the [main README](../README.md) file. 