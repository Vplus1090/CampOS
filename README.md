# Flux

The Integrated Dining & Community Ecosystem for Colleges.


📌 The Vision

CampusPulse is not just another food-ordering app. It is a Human-Centric Smart Campus Ecosystem designed to bridge the gap between high-speed digital demands and established physical campus workflows. Our goal is to solve the 12:00 PM "Canteen Chaos" while also fostering a peer-to-peer talent economy through our Skill Swap module.


🏮 The Problem & Our "Why"

We have identified two major operational gaps in our campus life:

Part A: The Dining Dilemma (Canteen & Mess)

Peak-Hour Congestion: Overwhelming human traffic at 12:00 PM causes 20+ minute wait times, sometimes even forcing some students to skip meals entirely.

Inventory Blindness: Students currently have no way of knowing if an item is "Sold Out" until they either cut into line to specifically ask for the item’s availability or spend 15 minutes in a queue, leading to wasted time and frustration.

Network Dead Zones: Mess and Canteen areas suffer from severe signal drops, making UPI payments or digital app verifications unreliable and slow.

Part B: The Collaboration Gap (Skill Swap)

Fragmented Communication: Student talent is currently scattered across disorganized WhatsApp groups.

Underutilized Human Capital: Students possess high-value skills but lack a platform to barter them.

High Barrier to Entry: Junior students hesitate to approach seniors without a formal system.


🛠 Tech Architecture

Frontend & Interface

TypeScript & React: Providing a type-safe, high-performance user experience.

Tailwind CSS: Modern, utility-first styling for a responsive mobile-first UI.

Lucide Icons: Clean, consistent iconography for intuitive navigation.

Backend & Logic

Python (Django): Managing high-integrity business logic and user states.

PostgreSQL: ACID-compliant relational database for secure financial transactions.

JWT & Auth: Secure, stateless session management for campus-wide access.

Systems & Intelligence

C++ Engine: Low-latency cryptographic logic for instant offline QR verification.

Gemini AI API: Predictive stock analytics to prevent "sold-out" surprises.

Hybrid Bridge: Digital-to-Physical thermal slip automation for staff efficiency.


🏗 System Architecture & Modules

1. Smart Canteen (Integrated Order Flow)

Real-Time Inventory: Live stock status updated via staff-side toggle.

System Integrity Protocol: ₹5 "Anti-Troll" penalty for orders placed but never picked up.

The Slip Bridge: Digital QR scan triggers an automated physical thermal slip for staff.

2. Offline Mess (Zero-Signal Entry)

Cryptographic Tokens: Secure tokens verified offline via localized C++ decryption keys.

Rapid Transit: Scanning takes <2 seconds, eliminating entry queues.

3. Skill Swap (Community Talent Marketplace)

Knowledge Barter: A dedicated tab for students to trade skills (e.g., C++ Tutoring ↔ TypeScript/Figma).


📂 Project Structure

CampusPulse/
├── core/                # C++ Logic for High-Speed QR Decryption
├── backend/             # Python/Django API & Database Models
├── src/                 # TypeScript Frontend & UI Components
├── assets/              # Figma Mockups, Logos & Brand Identity
└── docs/                # Project PPT, Architecture Diagrams & Manuals


🚀 Future Roadmap

[ ] Phase 4: AI-based personalized meal recommendations (e.g., "High Protein").

[ ] Phase 5: Expansion to Stationary Shops and Laundry services.
