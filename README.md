# KyroPay: Next-Gen Enterprise Banking & CMS Platform 🚀

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.2-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple.svg)](https://vitejs.dev/)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8.svg)](https://tailwindcss.com/)

A hyper-realistic, production-grade Banking, Finance, and Content Management System (CMS) built with a strict **Domain-Driven Design (DDD)** architecture. KyroPay brings together modern payment processing, strict enterprise access controls, and AI-driven anti-fraud measures into a single ecosystem.

---

## 🌟 Key Features

### 1. 3-Tier Enterprise Portal Access
The application features a strict Role-Based Access Control (RBAC) system with distinct interfaces tailored to specific user contexts:
- **Normal User Portal:** A PhonePe/Google Pay style dashboard for everyday users to scan QRs, view contacts, and execute UPI payments.
- **Merchant Business Portal:** A vendor-centric dashboard featuring aggregated daily payment inflows, outflows, and real-time "Store Soundbox" audio-visual notifications for incoming payments.
- **Bank Employee (Admin) CMS:** A secure backend control panel for bank staff to monitor liquidity, review flagged Maker-Checker approvals, and manage system users.

### 2. Hyper-Realistic UPI NPCI Simulator
KyroPay simulates the entire National Payments Corporation of India (NPCI) transaction lifecycle:
- **Real-time VPA Verification:** Validates UPI IDs against the backend, simulating bank lookup latency and returning masked verified receiver names (e.g., `M****t`).
- **Secure MPIN Overlay:** A darkened overlay with a 6-digit NPCI MPIN pad ensures users must securely authenticate before funds leave their account.
- **Simulated Network Latency:** Built-in Java latency simulates real-world banking switch delays with realistic UI loading states.

### 3. AI-Powered Fraud Engine (LLM Risk Service)
Every transaction is intercepted by a Python-based LLM risk microservice:
- Evaluates the transaction's parameters (sender, receiver, amount, velocity).
- Returns a deterministic `riskScore` and `riskLevel`.
- Automatically blocks `HIGH` risk transfers with authentic NPCI error codes (`NPCI U16: High Risk Threshold Exceeded`).

### 4. Smart MDR Bypass Algorithm
Transactions over ₹2,000 sent to merchants traditionally incur a Merchant Discount Rate (MDR) tax. KyroPay implements a mathematical splitting engine:
- Intercepts large transactions (e.g., ₹10,000) at the backend.
- Automatically breaks the transaction into micro-packets of `₹1,999` and generating a unique 12-digit UTR reference for each.
- Bypasses the MDR limits silently while maintaining parent-child entity relationships in the database for transparent history viewing.

### 5. Enterprise 4-Eyes Maker-Checker Workflow
Critical operations (like adjusting bank liquidity or approving large transfers) are governed by a strict Maker-Checker principle.
- **Maker:** Initiates the request (e.g., a junior employee).
- **Checker:** Reviews and approves/rejects the request (e.g., a senior manager).
- Actions are not committed to the database until the Checker explicitly signs off, ensuring enterprise-grade compliance.

---

## 🛠️ Tech Stack

### Backend
- **Java 21 & Spring Boot 3.3.2:** Core server architecture built on the newest LTS release.
- **Spring Security & JWT:** Stateless, token-based authentication securing all endpoints.
- **Spring Data JPA & Hibernate:** ORM mapping to the relational database.
- **PostgreSQL / H2:** Relational database management.
- **Python:** Dedicated microservice for the local LLM Risk Analysis Engine.

### Frontend
- **React (TypeScript):** Component-driven UI development.
- **Vite:** Next-generation frontend tooling for instantaneous HMR.
- **Tailwind CSS:** Utility-first styling for rapid, responsive UI design.
- **Clerk:** Seamless OAuth and identity management integration.
- **Lucide React:** Clean, consistent iconography.

---

## ⚙️ Local Development Setup

### Prerequisites
- JDK 21+
- Node.js 18+
- Maven 3.8+
- Python 3.10+ (for LLM Risk Microservice)

### 1. Backend Setup (Spring Boot)
```bash
# Set your Java Home to JDK 21
$env:JAVA_HOME = "C:\path\to\jdk21"

# Run the Spring Boot application
mvn spring-boot:run
```

### 2. Frontend Setup (Vite + React)
```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 3. AI Risk Microservice Setup (Python)
```bash
cd domain/llm
pip install -r requirements.txt
python risk_engine_service.py
```

---

## 🏗️ Architecture Design (DDD)
The codebase strictly adheres to **Domain-Driven Design**. The structure isolates business domains into self-contained modules:
- `com.kyrodatatech.banking.domain.upi`
- `com.kyrodatatech.banking.domain.auth`
- `com.kyrodatatech.banking.domain.user`
- `com.kyrodatatech.banking.domain.transaction`
- `com.kyrodatatech.banking.domain.llm`
- `com.kyrodatatech.banking.domain.audit`

---

*Engineered for the National Hackathon by the Kyron Data Tech team.*
