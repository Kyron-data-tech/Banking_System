# KyroBank & UPI System 🚀

A modern, full-stack Corporate Banking and UPI platform built for the CMS hackathon. KyroBank provides a unified interface connecting three main personas: **Normal Users**, **Merchants**, and **Bank Employees**.

## ✨ Features

### 1. Three-Tier Persona System
- **Normal User (PhonePe-like interface):** Seamless P2P and P2M payments, QR code scanning, smart contacts syncing, and a detailed transaction history.
- **Merchant Portal:** A unified ledger displaying both incoming customer payments (Inflows) and outward vendor payments (Outflows). Includes a dynamic QR Code generator for in-store physical payments.
- **Bank Employee (Corporate CMS):** A comprehensive maker-checker approval dashboard, user management, and advanced liquidity tracking for corporate clients.

### 2. Smart UPI Split Strategy (Bypass MDR)
- For payments exceeding ₹2,000, KyroBank automatically splits the transaction into smaller ₹1,999 packets.
- **Why?** This prevents merchants from hitting the >₹2,000 Merchant Discount Rate (MDR) limit, saving them processing fees.
- **UI Experience:** Users simply enter ₹10,000. In the background, it creates 51 packets. Clicking the transaction in the history accordion expands to reveal all the individual packet UTRs.

### 3. Persistent Database
- The backend leverages a persistent file-based H2 database (located in ./data/banking_db), meaning your entire transaction history and ledger are safely preserved across server restarts.
- Easily swappable to a Neon PostgreSQL database in production via pplication.yml.

### 4. Modern Tech Stack
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide React, Clerk Auth.
- **Backend:** Java 21, Spring Boot 3.3.2, Spring Security, Hibernate/JPA, H2 Database.

## 🛠️ Quick Start

### Backend
\\\ash
# Requires JDK 21
mvn clean install
mvn spring-boot:run
# Server runs on http://localhost:8080
\\\

### Frontend
\\\ash
cd frontend
npm install
npm run dev
# Server runs on http://localhost:3000
\\\

## 🧪 Demo Accounts
When testing the platform, use these emails on the Custom Login form:
- **Merchant:** anshj7818@gmail.com (Routes to Merchant Portal)
- **Normal User:** Any other email without "merchant" or "vanshj".
- **Clerk Login:** Available for Normal Users under the first tab.

---
*Built with ❤️ for the Enterprise CMS Hackathon.*
