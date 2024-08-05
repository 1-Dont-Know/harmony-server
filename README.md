# Harmony

This is the server repo for the Harmony app built for Bay Valley Tech.

## Installation

1. Clone the repo
2. Run `npm install`
3. Run `npm start`
4. Setup [client](https://github.com/Sillor/harmony-client)

## Environment Variables

- If maintaining this project, copy contents of `.env.example` to a new file named `.env`. Don't delete `.env.example`

- Otherwise, you can rename `.env.example` to `.env` or follow the previous option.

```py
# The key used to sign the JWT
# 256 bit random string
JWT_KEY=

# The port you want the server to run on
SERVER_PORT=
# The port the client is running on
CLIENT_PORT=

# vercel postgres database
POSTGRES_URL=
```

## Vercel

### Database
1. Navigate to "Storage" on your [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new Postgres database (or use an existing one)
3. Save `POSTGRES_URL` to `.env`
4. Run `npm run migrate`


## Future

- Team ownership transfer
- Calendar
- Team chat
  - load in sections using query params