# Ecommerce Native App

This is a full-stack native ecommerce application featuring a mobile app frontend built with Expo and React Native, alongside a robust backend API built with Node.js, Express, and MongoDB.

## 🏗 Project Structure

The repository is structured as a monorepo containing two main packages:

- `client/`: The React Native mobile application built using Expo.
- `server/`: The backend REST API built with Node.js, Express, and TypeScript.

### Client (Mobile Application)

The frontend is a modern mobile applications utilizing Expo and React Native. Key features include file-based routing and a fully customized styling system.

**Tech Stack:**

- **Framework:** Expo & React Native (`expo`, `react-native`)
- **Navigation:** Expo Router (`expo-router`) with file-based routing
- **UI & Styling:** NativeWind (Tailwind CSS for React Native)
- **Authentication:** Clerk (`@clerk/expo`) for seamless mobile authentication
- **Animation & Gestures:** `react-native-reanimated`, `react-native-gesture-handler`

**Core Features:**

- **Authentication:** Complete Sign-up/Sign-in flows.
- **Product Browsing:** Explore products dynamically in the shop ecosystem.
- **Checkout & Orders:** Cart, order processing, and address management.
- **Admin Tools:** Built-in admin interfaces for managing the store functionalities.

### Server (Backend API)

The backend is built to serve the ecommerce platform data reliably and securely.

**Tech Stack:**

- **Runtime:** Node.js
- **Framework:** Express (`express`)
- **Language:** TypeScript (`ts-node`, `tsx`, `typescript`)
- **Database:** MongoDB via Mongoose (`mongoose`)
- **Authentication/Security:** Clerk Express (`@clerk/express`) for matching authenticated sessions with the frontend, `cors`
- **Environment config:** `dotenv`

---

## 🚀 Getting Started

To run the application locally, you will need to start both the `client` and `server` environments.

### Prerequisites

- Node.js installed on your machine.
- Expo CLI or Expo Go app for testing on a physical device.
- MongoDB cluster URI (Local or MongoDB Atlas).
- Clerk application keys (Publishable and Secret keys).

### Setup the Server

1. Navigate to the server folder:

   ```bash
   cd server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

- Create a `.env` file in the `server` directory with the following variables:

   ```env
   MONGODB_URI=your_mongodb_connection_string
   CLERK_SECRET_KEY=your_clerk_secret_key
   PORT=3000
   ```

4. Start the development server:

   ```bash
   npm run server
   ```

   *(The server utilizes `nodemon` to reload on code changes automatically).*

### Setup the Client

1. Navigate to the client folder:

   ```bash
   cd client
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the `client` directory and configure your the Clerk publishable key.
4. Start the Expo development server:

   ```bash
   npx expo start
   ```

   *(If you encounter network errors fetching versions related to Expo, you can run `npx expo start --offline`)*

---

## 🎨 Design & Navigation

The mobile application utilizes a sophisticated tab-navigated architecture (under `client/app/(taps)`) paired with dynamic stack navigations for specific flows such as `product/[id]`, `checkout`, and `orders`.

All aesthetic parameters are governed by NativeWind, marrying the speed of Tailwind CSS utilities with native performance expectations.

## 🔐 Authentication

Authentication is deeply integrated across both stacks using **Clerk**. The client handles secure token generation and session tracking while the backend Express middlewares validate these tokens to grant access to protected routes seamlessly.
