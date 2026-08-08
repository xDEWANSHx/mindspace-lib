# Project Context: Mindspace Library (Study Hall)

## 1. Business Concept & Target Audience
- **Location Context:** Operating in a Tier-3 city where the term "Library" is colloquially used to refer to a "Study Hall" or "Reading Room".
- **Facility Type:** The business does NOT deal with issuing books. Instead, it provides a peaceful study environment.
- **Physical Setup:** Features rows of numbered study cubicles/desks, chairs, individual desk lighting, AC/Wi-Fi, and small personal lockers above the desks.
- **Branding:** Will be referred to as a "Library" (e.g., Mindspace Library) on the frontend to match local terminology, but the backend and system logic will be tailored for a study space.

## 2. Core Management System Requirements (Upcoming)
Since this is a study space, the management system will focus on:
- **Seat Management:** Tracking and allocating specific numbered desks/cubicles.
- **Shift Management:** Handling different time slots (e.g., Morning, Evening, Night, Full Day).
- **Subscription & Billing:** Managing monthly passes, fee collection, and renewal reminders.
- **Locker Allocation:** Tracking which student has been assigned which locker.
- **Attendance/Access:** Logging entry and exit times of students.

## 3. Security Architecture & Commitments
The management system will be used on the same local Wi-Fi network by the Admin, Receptionist, and Members. To prevent unauthorized access (e.g., via browser DevTools or network sniffing), the following security protocols are mandatory:
- **Server-Side Security:** Complete reliance on Backend Role-Based Access Control (RBAC). Frontend "inspect element" modifications must be powerless.
- **Secure Sessions:** Usage of `HttpOnly` cookies for storing authentication tokens (e.g., JWTs) to prevent theft via XSS or browser console.
- **Network Encryption:** Mandatory use of HTTPS/SSL to encrypt traffic and prevent packet sniffing on the shared Wi-Fi network.

## 4. Noric Cafe Integration (Food & Beverage)
- **Partnership:** The library is partnered with "NORIC CAFE", located next door.
- **QR Code Ordering System:** Each study desk will have a unique QR code. Scanning it opens the Noric Cafe ordering portal.
- **Table Validation & Strict Operational Policy (Ultimate Anti-Loophole Fix):** 
  - The QR code URL pre-fills the desk number securely so it cannot be manually changed. 
  - **The Rule:** Cafe staff will **ONLY** deliver QR-code orders to the physical desk inside the library. No counter pickups allowed. This single operational rule neutralizes almost all technical loopholes (VPNs, Wi-Fi range bleeding, bulk ordering for friends) because the discounted food must physically end up at a study hall desk.
- **Authentication:** Users log in on the cafe portal using their `member_id`, mobile number, and OTP.
- **Discount & IP-Based Security (Anti-Sharing):**
  - The system checks if the `member_id` is currently active.
  - The 10% discount is ONLY applied if the order request originates from the **Library's Wi-Fi IP address**, further preventing OTP sharing with outsiders.
  - Active members receive the discount with a celebratory "hurray" popup on first use.
- **Session Expiry Strategy (Simplicity):** The login session on the cafe portal will have a strict 24-hour expiration to effortlessly re-verify membership status daily without complex syncing.

---
*Note: This file will be updated as more project scope and architecture details are provided.*
