---
layout: home
title: Hustle
---

# Hustle - Soccer Player Statistics Tracking

![Version](https://img.shields.io/badge/version-00.00.00-blue)
![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Overview

Hustle is a complete soccer player statistics tracking platform built for parents of high school athletes (grades 8-12). Track your athlete's journey from local competition to college recruitment with comprehensive game logging, performance analytics, and verified statistics.

---

## 🏆 Gate A Milestone - COMPLETE

We've successfully reached our foundational milestone:

- ✅ **Landing Page** - Professional, responsive landing with clear CTAs
- ✅ **NextAuth v5** - Secure authentication with JWT and bcrypt
- ✅ **Dashboard** - Clean Kiranism-based interface for parents
- ✅ **Cloud Run Deployment** - Production-ready infrastructure on GCP
- ✅ **PostgreSQL Database** - Fully operational with Prisma ORM

**This marks our foundation.** Auth works, users can log in, infrastructure is solid. Ready to build features on this base.

---

## 📚 Documentation

### Core Documentation

- [Architecture](./ARCHITECTURE.html) - System design and technical decisions
- [Roadmap](./ROADMAP.html) - Product vision and feature timeline
- [Contributing](./CONTRIBUTING.html) - How to contribute to Hustle
- [Changelog](./CHANGELOG.html) - Version history and release notes

### Getting Started

- [Quick Start Guide](#quick-start)
- [Local Development](#development-setup)
- [Deployment Guide](#deployment)

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 15.5.4 with App Router & Turbopack
- **UI:** React 19.1.0 + TypeScript (strict mode)
- **Components:** shadcn/ui + Tailwind CSS + Radix UI primitives
- **Dashboard:** Kiranism next-shadcn-dashboard-starter

### Backend
- **API:** Next.js API Routes with NextAuth v5
- **Authentication:** JWT strategy with bcrypt (10 rounds)
- **Database:** PostgreSQL 15 with Prisma ORM
- **Session:** Server-side session protection

### Infrastructure
- **Cloud:** Google Cloud Platform
- **Compute:** Cloud Run (containerized, serverless)
- **Database:** Cloud SQL PostgreSQL
- **Networking:** VPC with private connector
- **IaC:** Terraform for all infrastructure

---

## 🚀 Quick Start

### Prerequisites

- Node.js 22+
- PostgreSQL 15
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/hustle.git
cd hustle

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database credentials

# Initialize database
npx prisma generate
npx prisma db push

# Start development server
npm run dev -- -p 4000

# Visit http://localhost:4000
```

---

## 📖 Versioning

Hustle uses **sequential versioning**: `v00.00.00` → `v00.00.01` → `v00.00.02`

Every release increments by exactly `0.00.01` - no exceptions, no skipping versions.

See [VERSION.md](./VERSION.html) for complete versioning rules.

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.html) for:

- Development workflow
- Coding standards
- Pull request process
- Testing requirements

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE.html) file for details.

---

## 📞 Contact

- **GitHub Issues:** [Report bugs or request features](https://github.com/your-org/hustle/issues)
- **GitHub Discussions:** [Ask questions or share ideas](https://github.com/your-org/hustle/discussions)

---

**Built with ❤️ for parents and young athletes pursuing their dreams.**

---

*Last Updated: 2025-10-05*
