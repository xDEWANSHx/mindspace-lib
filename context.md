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

## 4. Food & Beverage Policy
- **Pantry Area:** Dedicated clean space for snacks and refreshment breaks.
- **Desk Policy:** Drinks in sealed containers allowed at study desks.

---
*Note: This file will be updated as more project scope and architecture details are provided.*
