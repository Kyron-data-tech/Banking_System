# KyroPay: Next-Gen Enterprise Banking & CMS Platform 🚀

<div align="center">
  <img src="https://img.shields.io/badge/Status-Hackathon_Ready-success?style=for-the-badge&logo=appveyor" alt="Status" />
  <img src="https://img.shields.io/badge/Architecture-Domain_Driven_Design-blue?style=for-the-badge" alt="Architecture" />
</div>
<br>

<div align="center">
  <a href="https://spring.io/projects/spring-boot"><img src="https://img.shields.io/badge/Spring%20Boot-3.3.2-brightgreen.svg?style=flat-square&logo=springboot" /></a>
  <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-18-blue.svg?style=flat-square&logo=react" /></a>
  <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-5-purple.svg?style=flat-square&logo=vite" /></a>
  <a href="https://www.oracle.com/java/"><img src="https://img.shields.io/badge/Java-21-orange.svg?style=flat-square&logo=coffeescript" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/TailwindCSS-3-38bdf8.svg?style=flat-square&logo=tailwind-css" /></a>
</div>

A hyper-realistic, production-grade **Banking, Finance, and Content Management System (CMS)** built with a strict **Domain-Driven Design (DDD)** architecture. KyroPay brings together modern TPAP (Third Party Application Provider) payment processing, strict enterprise access controls, and AI-driven anti-fraud measures into a single ecosystem.

---

## 🔥 Hackathon Winning Features

### 1. 3-Tier Enterprise Portal Access
The application features a strict Role-Based Access Control (RBAC) system with breathtaking, fully-responsive (Mobile + Desktop) UI tailored to specific user contexts:
- 👤 **Normal User Portal (TPAP):** A premium PhonePe/Google Pay style dashboard for everyday users to scan QRs, view contacts, and execute UPI payments. Features dynamic balance calculation protected by an authentic MPIN overlay.
- 🏪 **Merchant Business Portal:** A vendor-centric dashboard featuring aggregated real-time collections, transaction analytics, Vendor Payout (Smart Split) mechanics, and live **"Store Soundbox" audio-visual toast notifications** for incoming payments.
- 🏛️ **Bank Employee (Admin) CMS:** A secure backend control panel equipped with a desktop side-navigation layout for bank staff to monitor liquidity, review flagged Maker-Checker approvals, and manage system users.

### 2. Hyper-Realistic UPI NPCI Simulator
KyroPay simulates the entire National Payments Corporation of India (NPCI) transaction lifecycle:
- 🔒 **Secure MPIN Overlay:** A darkened modal with a 6-digit NPCI MPIN pad ensures users and merchants must securely authenticate before funds leave their account or before sensitive balance information is revealed.
- ✅ **Real-time VPA Verification:** Validates UPI IDs against the backend, simulating bank lookup latency and returning masked verified receiver names (e.g., `M****t`).
- ⏳ **Simulated Network Latency:** Built-in Java latency simulates real-world banking switch delays with realistic UI loading states and success animations.

### 3. AI-Powered Fraud Engine (LLM Risk Service)
Every transaction is intercepted by a Python-based LLM risk microservice:
- Evaluates the transaction's parameters (sender, receiver, amount, velocity).
- Returns a deterministic `riskScore` and `riskLevel`.
- Automatically blocks `HIGH` risk transfers with authentic NPCI error codes (`NPCI U16: High Risk Threshold Exceeded`).

### 4. Smart MDR Bypass Algorithm (Corporate Split)
Transactions over ₹2,000 sent to merchants traditionally incur a Merchant Discount Rate (MDR) tax. KyroPay implements a mathematical splitting engine:
- Intercepts large transactions (e.g., ₹10,000) at the backend.
- Automatically breaks the transaction into micro-packets of `₹1,999`, generating a unique 12-digit UTR reference for each.
- Bypasses the MDR limits silently while maintaining parent-child entity relationships in the database for transparent history viewing.

### 5. Enterprise 4-Eyes Maker-Checker Workflow
Critical operations (like adjusting bank liquidity or approving large transfers) are governed by a strict Maker-Checker principle.
- **Maker:** Initiates the request (e.g., a junior employee).
- **Checker:** Reviews and approves/rejects the request (e.g., a senior manager).
- Actions are not committed to the database until the Checker explicitly signs off, ensuring enterprise-grade compliance.

---

## 💻 Stunning UI/UX Engineering
Built to impress judges, KyroPay features a state-of-the-art UI:
- **Glassmorphism & Gradients:** Utilizes translucent backgrounds, blur effects, and rich multi-layered gradients (via TailwindCSS) to provide a modern Web3/Fintech aesthetic.
- **Flawless Responsive Design:** Seamlessly adapts from a mobile-first column view to a sprawling, locked-viewport desktop dashboard with independent scrollable areas and fixed sidebars.
- **Micro-interactions:** Integrated loading spinners, animated toasts, and smooth layout transitions enhance the perception of a polished, production-ready product.

---

## 🛠️ Tech Stack

### Backend
- **Java 21 & Spring Boot 3.3.2:** Core server architecture built on the newest LTS release.
- **Spring Security & JWT:** Stateless, token-based authentication securing all endpoints.
- **Spring Data JPA & Hibernate:** ORM mapping to the relational database.
- **H2 / PostgreSQL:** High-performance database management.
- **Python:** Dedicated microservice for the local LLM Risk Analysis Engine.

### Frontend
- **React 18 (TypeScript):** Component-driven, statically-typed UI development.
- **Vite:** Next-generation frontend tooling for instantaneous HMR.
- **Tailwind CSS:** Utility-first styling for rapid, responsive UI design.
- **Clerk:** Seamless OAuth and identity management integration.
- **Lucide React:** Clean, consistent SVG iconography.

---

## 🚀 Local Development Setup

### Prerequisites
- JDK 21+
- Node.js 18+
- Maven 3.8+
- Python 3.10+ (for LLM Risk Microservice)

### 1. Backend Setup (Spring Boot)
```bash
# Set your Java Home to JDK 21 (Windows example)
$env:JAVA_HOME = "C:\path\to\jdk21"

# Run the Spring Boot application
mvn spring-boot:run
```

### 2. Frontend Setup (Vite + React)
```bash
cd frontend

# Install dependencies
npm install

# Start the development server (runs on localhost:3000)
npm run dev
```

### 3. AI Risk Microservice Setup (Python)
```bash
cd domain/llm
pip install -r requirements.txt
python risk_engine_service.py
```

---

## 🏛️ Architecture Design (DDD)
The codebase strictly adheres to **Domain-Driven Design**. The structure isolates business domains into self-contained modules, allowing independent scaling and robust boundaries:
- `com.kyrodatatech.banking.domain.upi`
- `com.kyrodatatech.banking.domain.auth`
- `com.kyrodatatech.banking.domain.user`
- `com.kyrodatatech.banking.domain.transaction`
- `com.kyrodatatech.banking.domain.llm`
- `com.kyrodatatech.banking.domain.audit`

---

<div align="center">
  <i>Engineered for the National Hackathon by the Kyron Data Tech team.</i>
</div>
