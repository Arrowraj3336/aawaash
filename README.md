# Remix of Aawaash

hlo

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://aawaash.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e5667c43-7adf-47bd-9977-37f33e1e5b87).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Deploy to Vercel

1. Extract the source ZIP. Push its contents to the root of a Git repository so
   `package.json` and `vercel.json` are at the top level.
2. Import the repository in Vercel. Set **Root Directory** to the folder containing
   those files and use the **TanStack Start** framework preset with **Node.js 24.x**.
   Leave the Output Directory override off. The included `vercel.json` runs
   `npm run build:vercel`, which uses Nitro's Vercel preset to bundle the server
   routes and static assets together.
3. Before deploying, add the variables listed in `.env.example` in Vercel's project
   settings. Use the same Supabase project URL and publishable key for each pair.
   Keep `SUPABASE_SERVICE_ROLE_KEY` and admin passcode settings server-only.
   Redeploy after changing environment variables.
4. To keep your existing project listings, inventory and accounts, use the existing
   Supabase project. The ZIP includes the schema migrations and Edge Function source.
   If you are setting up a new Supabase project, apply and review its migrations
   there first. A source ZIP does not migrate live records, user accounts, or uploads.
5. Deploy, then open the homepage, a project detail URL such as `/projects/27th`,
   and `/auth` directly. Confirm sign-in using a test account on your backend.

The ordinary `npm run build` command remains the Cloudflare build for the existing
ChatGPT Sites deployment.
