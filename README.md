# UNHOLY CO. — BloodThirst Website

Premium gothic website for UNHOLY CO. built with Next.js App Router, Tailwind, Framer Motion, and Lucide.
Forms are handled by Next.js API routes that log entries to Airtable, trigger Mailjet emails, and create Razorpay orders.

## Overview

This is a [Next.js](https://nextjs.org/) application styled with [Tailwind CSS](https://tailwindcss.com/) and animated with [Framer Motion](https://www.framer.com/motion/). The site is designed to be deployed on [Cloudflare Pages](https://pages.cloudflare.com/) and leverages Cloudflare Workers for backend form processing, which integrates with Airtable and Mailjet.

The build process uses `@opennextjs/cloudflare` to generate an optimized output for Cloudflare's serverless environment.

## Project Structure

The codebase is organized to separate concerns and make navigation intuitive.

-   `/public` - Static assets like images, fonts, and icons.
-   `/scripts` - Build-related scripts, including post-build steps for Cloudflare.
-   `/src/app` - The core of the Next.js application, using the App Router. Each folder represents a route.
-   `/src/components` - Reusable React components, organized by feature (`forms`, `layout`, `shared`, `ux`).
-   `/src/content` - JSON files that store content used across the site, like product drops and testimonials.
-   `/workers` - Source code for the Cloudflare Worker that handles form submissions.

## Getting Started

To get the project running locally, follow these steps:

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Set Up Environment Variables**:
    Copy the example environment file to create your local configuration:
    ```bash
    cp .env.example .env.local
    ```
    Now, open `.env.local` and fill in the required variables. For local development, you can point the `NEXT_PUBLIC_WORKER_*_ENDPOINT` variables to mock API routes if you are not running the worker locally.

3.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## Available Scripts

This project includes several scripts to help with development and deployment:

-   `npm run dev`: Starts the Next.js development server.
-   `npm run build`: Creates a production build of the Next.js application.
-   `npm run cf:bundle`: A composite script that prepares the application for Cloudflare Pages. It runs `create-opennext-config.mjs`, the OpenNext build, and `cf-postbuild.mjs`. This is the command to use in your Cloudflare build settings.
-   `npm run preview`: Starts a local preview of the production build using Wrangler, simulating the Cloudflare environment.
-   `npm run deploy`: Bundles the application and deploys it to Cloudflare Pages.

## Deployment on Cloudflare Pages

### ⚠️ IMPORTANT: Environment Variables Setup

**READ THIS FIRST**: [CLOUDFLARE_ENV_SETUP.md](./CLOUDFLARE_ENV_SETUP.md)

If you see a blank page with `ERR_HTTP_RESPONSE_CODE_FAILURE` after deployment, read [FIX_BLANK_PAGE.md](./FIX_BLANK_PAGE.md).

### Deployment Steps

1.  **Push to GitHub** - Commit and push your code to your repository.

2.  **Create a Cloudflare Pages Project**:
    -   Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
    -   Navigate to Workers & Pages → Create application → Pages → Connect to Git.
    -   Select your repository.

3.  **Configure Build Settings**:
    -   **Build command**: `npm run cf:bundle`
    -   **Build output directory**: `.open-next`
    -   **Root directory**: (leave empty)

4.  **Set Environment Variables** (CRITICAL!):
    -   Go to Settings → Environment variables.
    -   Add these variables for the **Production** environment:
        ```
        NEXT_PUBLIC_WORKER_ENDPOINT=https://your-domain.pages.dev/api/contact
        NEXT_PUBLIC_WORKER_SUBSCRIBE_ENDPOINT=https://your-domain.pages.dev/api/subscribe
        NEXT_PUBLIC_WORKER_ORDER_ENDPOINT=https://your-domain.pages.dev/api/order
        NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_public_key
        ```
    -   Add the **server-side secrets** (not prefixed with `NEXT_PUBLIC_`) so the APIs can talk to Airtable/Mailjet/Razorpay:
        ```
        AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
        AIRTABLE_TABLE_NAME=signups
        AIRTABLE_TOKEN=patXXXXXXXXXXXXXX

        MAILJET_API_KEY=your_mailjet_api_key
        MAILJET_SECRET=your_mailjet_secret
        MAILJET_FROM_EMAIL=noreply@theunholy.co
        MAILJET_FROM_NAME=UNHOLY CO.
        MAILJET_WELCOME_SUBJECT=Your Damnation Is Served
        MAILJET_UNSUB_URL=https://theunholy.co/unsubscribe

        CONTACT_FORWARD_EMAIL=team@theunholy.co

        RAZORPAY_KEY_ID=rzp_live_xxxxx
        RAZORPAY_KEY_SECRET=your_secret
        ```
    -   **DO NOT set these in `wrangler.toml`** - use the Pages dashboard or Wrangler secrets
    -   See [CLOUDFLARE_ENV_SETUP.md](./CLOUDFLARE_ENV_SETUP.md) for detailed instructions.

5.  **Deploy**:
    -   Save and deploy.
    -   Cloudflare will automatically build and deploy your site.

## Worker

The production site now uses the built-in Next.js API routes, but `workers/submit.ts` is still included as a reference Cloudflare Worker if you want to deploy the integrations separately.

## Troubleshooting

-   **Blank page after deployment?** → [FIX_BLANK_PAGE.md](./FIX_BLANK_PAGE.md)
-   **Environment variables not working?** → [CLOUDFLARE_ENV_SETUP.md](./CLOUDFLARE_ENV_SETUP.md)
-   **Forms not submitting?** → Check that the environment variables are set correctly in the Cloudflare Pages Dashboard.

## Key Technologies

-   [Next.js](https://nextjs.org/) (App Router)
-   [React](https://reactjs.org/)
-   [Tailwind CSS](https://tailwindcss.com/)
-   [Framer Motion](https://www.framer.com/motion/)
-   [Lucide React](https://lucide.dev/) (Icons)
-   [Cloudflare Pages](https://pages.cloudflare.com/) & [Workers](https://workers.cloudflare.com/)
-   [OpenNext](https://opennext.js.org/)
-   [Airtable](https://www.airtable.com/)
-   [Mailjet](https://www.mailjet.com/)
