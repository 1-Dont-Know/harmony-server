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

# mysql database
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
```

## Calendar

The calendar features work using the Google Calendar API. The Harmony Client will talk to the Harmony Server, which contacts the Google API to request or submit calendar event data. In order for this to happen, the Harmony Server directory must contain two files: 'credentials.json' and 'token.json' in the Calendar directory.
  - credentials.json
    - This file was generated upon setting up the Google Cloud Console and enabling the Google Calendar API. It contains the client ID, client secret, and other necessary information for the Harmony Server to interact with Google APIs.
  - token.json
    - When you first attempt to use the Google Calendar API, the Harmony Server must gain authorization to access the Google Calendars stored in the associated Google account. This involves directing the user to a Google authorization URL where they can log in and grant permissions. Upon successful authorization, an access token is saved and used for subsequent API calls to authenticate the user without requiring them to log in again.

Refer to this link for further information regarding the Google Calendar API:
 - https://developers.google.com/calendar/api/quickstart/nodejs


## Future

- Team ownership transfer
- Calendar
- Team chat
  - load in sections using query params