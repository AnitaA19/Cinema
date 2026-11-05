# CinemaGo

A Next.js front end for the [CinemaGo](https://github.com/AnitaA19/CinemaGo) ASP.NET API. Guests browse films, pick seats, and keep their passes. Admins run movies, genres, halls, seats, sessions, bookings, sales, and ticket lookup. The screen you see follows the signed-in role.

## Run it with your API

1. Start CinemaGo (it listens on `http://localhost:5005` in the project launch settings) with SQL Server, migrations, and a JWT signing key, as described in that repository.
2. In this folder:

```bash
npm install
cp .env.example .env.local
npm run dev
```

3. Open [http://127.0.0.1:47219](http://127.0.0.1:47219).

The app calls your API through `/cinema-api`, so the browser does not need CORS on the ASP.NET host. Point `CINEMA_API_URL` at the API if it is not on port 5005.

Registration always creates a customer. The first admin comes from CinemaGo’s `InitialAdmin` settings, then signs in here.

## If the API is not running

When `http://127.0.0.1:5005` does not answer, the same screens run against a local programme that follows the CinemaGo routes, validation, and roles. A banner says so. Preview sign-in:

| Role | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `CinemaAdmin!12` |
| Customer | `lea` | `tickets123` |

Set `CINEMA_API_MODE=live` to refuse that fallback, or `CINEMA_API_MODE=demo` to force it.

## What is covered

| Area | What you can do |
| --- | --- |
| Films and schedule | Search, genre filter, pagination, session times in Tbilisi (UTC+4) |
| Booking | Seat map, VIP pricing, batch reserve of 1–20 seats, QR pass |
| Customer panel | Upcoming, past, and cancelled tickets, cancel your own booking |
| Admin desk | Sales, movies (with poster upload), genres, halls, seats, sessions (including cancel), all bookings, ticket lookup by id |

Film posters: in the admin film form, choose a JPEG, PNG or WebP image (up to 5 MB) or paste an image URL. Uploads are sent to the API (POST /api/movies/{id}/poster) and shown through the /uploads/* rewrite in 
ext.config.ts; without the API, demo mode keeps uploaded posters in memory only. Films without a poster show a gradient with their initials.

Prices are shown in lari. Times are labeled Tbilisi.
