# Frontend - Mini ERP Invoicing System

## 📌 Tech Stack Used
- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, React Server Components)  
- **UI Library:** React.js  
- **Styling:** TailwindCSS  
- **State Management:** React Hooks / Context API  
- **Deployment:** Vercel  
- **API Integration:** REST API ke backend NestJS (Railway) 

## 🏗️ Brief Explanation of Architectural Decisions
- **Next.js App Router**      → dipilih untuk mendukung React Server Components dan routing modern.
- **TailwindCSS**             → styling cepat, konsisten, dan responsif.
- **Environment Variables**   → NEXT_PUBLIC_API_URL digunakan agar frontend bisa switch antara development (localhost) dan production (Railway).
- **Authentication Flow**     → login via email/password dan Google OAuth, token JWT disimpan di client.
- **Responsive UI**           → semua komponen (form, tabel, sidebar) dirancang mobile-first.

---

## ⚙️ Prerequisites and Installation Steps
1. **Prerequisites**
   - Node.js v11+
   - Git
   - Backend API sudah berjalan (Railway atau lokal)

2. **Clone Repository**
   ```bash
   git clone https://github.com/onehied/Frontend_MiniErp-SLM.git
   cd Frontend_MiniErp-SLM
   
3. **Install Dependencies**
    ```bash
      $ npm install
    ```
4. **Setup Environment Variables**
   Buat file .env.local di root project:
    ```bash
      NEXT_PUBLIC_API_URL=http://localhost:3000/api
    ```
---

## 🚀 Instructions on How to Run the Application Locally
1. **Development Mode**
    ```bash
      npm run dev
    ```
2. **Build & Production Preview**
    ```bash
      npm run build
      npm run start
    ```
Frontend akan berjalan di http://localhost:3001.
