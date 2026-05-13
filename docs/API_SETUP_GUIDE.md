# SocioCipher: API & Integration Setup Guide

This document is your personal checklist. Follow these steps to generate the required keys and configurations for the production-level free tier of SocioCipher.

---

## 1. Firebase (Database & Real-time WebSockets)
**Why we need it:** We are replacing the local SQLite database with Firebase Firestore. This gives us a highly scalable NoSQL database with built-in WebSockets, meaning chats update instantly without refreshing or polling. We will also use Firebase Phone Auth to send real SMS verification codes for free (up to 10k/month).

**Step-by-step:**
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **Create a project** and name it `SocioCipher`.
3. In the left sidebar, click **Build > Authentication**. Click **Get Started**, select **Phone** as the provider, and enable it.
4. In the left sidebar, click **Build > Firestore Database**. Click **Create database** and start in **Test mode** (we will update security rules later).
5. Go to the **Project Overview** (gear icon top left) > **Project settings**.
6. Under "Your apps" (bottom of the page), click the **Web `</>`** icon to register a web app. Name it `SocioCipher-Web`.
7. **What to give me:** Copy the `firebaseConfig` object (it contains `apiKey`, `authDomain`, `projectId`, etc.) and provide it to me.

---

## 2. Pinecone (Vector Database for RAG)
**Why we need it:** Pinecone is a vector database. It allows us to store the "meaning" of public channels. When a user searches for a channel, we use Pinecone to instantly find the most semantically relevant channels, even if they don't type the exact name.

**Step-by-step:**
1. Go to [Pinecone](https://www.pinecone.io/) and create a free account.
2. In the dashboard, click **Create Index**.
3. Name it `sociocipher-channels`.
4. Set **Dimensions** to `1536` (this matches OpenAI's embedding size).
5. Set **Metric** to `cosine`.
6. Click **Create Index**.
7. In the left sidebar, go to **API Keys**.
8. **What to give me:** Copy the **API Key** and the **Environment/Host URL** and provide them to me.

---

## 3. OpenAI or Gemini (Embeddings & Moderation)
**Why we need it:** We need an AI API to do two things: 1) Convert channel descriptions into vectors (embeddings) to store in Pinecone, and 2) Automatically scan posts for illegal/toxic content using their moderation endpoints to keep you legally safe.

**Step-by-step:**
1. Go to [OpenAI Platform](https://platform.openai.com/).
2. Create an account and add a payment method (you will only spend a few cents for embeddings and moderation).
3. Go to **API Keys** in the dashboard.
4. Click **Create new secret key**.
5. **What to give me:** Copy the **API Key** starting with `sk-...` and provide it to me.

---

## 4. NewsAPI (Global News Integration)
**Why we need it:** To populate the `NEWS` tab in the application with real, live news feeds from around the world.

**Step-by-step:**
1. Go to [NewsAPI.org](https://newsapi.org/).
2. Click **Get API Key** and sign up for a free account.
3. **What to give me:** Copy the **API Key** displayed on your screen and provide it to me.

---

### 📝 Summary Checklist for You
Paste these to me when you are ready:
- [ ] `firebaseConfig` Object
- [ ] Pinecone API Key
- [ ] OpenAI API Key
- [ ] NewsAPI Key
