type Role = "SuperAdmin" | "Admin" | "Customer"

type User = {
  id: number
  username: string
  email: string
  password: string
  role: Role
}

type Genre = { id: number; name: string }
type Movie = { id: number; title: string; durationMinutes: number; ageRating: number; posterUrl?: string | null; genreIds: number[] }
type Hall = { id: number; name: string; capacity: number }
type Seat = { id: number; hallId: number; rowNumber: number; seatNumber: number; isVip: boolean }
type Session = {
  id: number
  movieId: number
  hallId: number
  startsAt: string
  standardPrice: number
  vipPrice: number
  status: 1 | 2 | 3
}
type Booking = {
  id: number
  userId: number
  sessionId: number
  seatId: number
  status: "Active" | "Cancelled"
  createdAt: string
  ticketId: number
}
type Ticket = { id: number; bookingId: number; ticketCode: string; finalPrice: number }

type Store = {
  users: User[]
  genres: Genre[]
  movies: Movie[]
  halls: Hall[]
  seats: Seat[]
  sessions: Session[]
  bookings: Booking[]
  tickets: Ticket[]
  ids: { user: number; genre: number; movie: number; hall: number; seat: number; session: number; booking: number; ticket: number }
}

type RefreshToken = { userId: number; expiresAt: number; revoked: boolean }

const globalStore = globalThis as unknown as {
  __cinemaDemo?: Store
  __cinemaDemoRefresh?: Map<string, RefreshToken>
  __cinemaDemoInvitations?: Map<string, { id: number; code: string; expiresAt: number; attempts: number }>
}

const SUPER_ADMIN: Omit<User, "id"> = { username: "owner", email: "owner@cinemago.local", password: "CinemaOwner!12", role: "SuperAdmin" }

function atTbilisi(dayOffset: number, hour: number, minute = 0) {
  const shifted = new Date(Date.now() + 4 * 60 * 60 * 1000)
  const stamp = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate() + dayOffset,
    hour,
    minute,
    0,
  )
  return new Date(stamp - 4 * 60 * 60 * 1000).toISOString()
}

function seed(): Store {
  const genres = ["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Thriller", "Animation"].map(
    (name, index) => ({ id: index + 1, name }),
  )
  const movies: Movie[] = [
    { id: 1, title: "Dune", posterUrl: "https://en.wikipedia.org/wiki/Special:FilePath/Dune_(2021_film).jpg?width=500", durationMinutes: 155, ageRating: 12, genreIds: [5, 3] },
    { id: 2, title: "Inception", posterUrl: "https://en.wikipedia.org/wiki/Special:FilePath/Inception_(2010)_theatrical_poster.jpg?width=500", durationMinutes: 148, ageRating: 12, genreIds: [5, 6, 1] },
    { id: 3, title: "The Dark Knight", posterUrl: "https://en.wikipedia.org/wiki/Special:FilePath/The_Dark_Knight_(2008_film).jpg?width=500", durationMinutes: 152, ageRating: 16, genreIds: [1, 6, 3] },
    { id: 4, title: "Toy Story", posterUrl: "https://en.wikipedia.org/wiki/Special:FilePath/Toy_Story.jpg?width=500", durationMinutes: 81, ageRating: 0, genreIds: [7, 2] },
    { id: 5, title: "The Conjuring", posterUrl: "https://en.wikipedia.org/wiki/Special:FilePath/The_Conjuring_poster.jpg?width=500", durationMinutes: 112, ageRating: 18, genreIds: [4, 6] },
  ]
  const halls: Hall[] = [
    { id: 1, name: "Hall 1", capacity: 40 },
    { id: 2, name: "Hall 2", capacity: 60 },
    { id: 3, name: "Hall 3", capacity: 24 },
  ]
  const layouts = [
    { hallId: 1, rows: 5, seats: 8 },
    { hallId: 2, rows: 6, seats: 10 },
    { hallId: 3, rows: 4, seats: 6 },
  ]
  const seats: Seat[] = []
  let seatId = 1
  for (const layout of layouts) {
    for (let row = 1; row <= layout.rows; row++) {
      for (let number = 1; number <= layout.seats; number++) {
        seats.push({
          id: seatId++,
          hallId: layout.hallId,
          rowNumber: row,
          seatNumber: number,
          isVip: row === layout.rows,
        })
      }
    }
  }
  const sessions: Session[] = [
    { id: 1, movieId: 1, hallId: 1, startsAt: atTbilisi(-1, 18), standardPrice: 18, vipPrice: 28, status: 3 },
    { id: 2, movieId: 2, hallId: 2, startsAt: atTbilisi(1, 20), standardPrice: 16, vipPrice: 26, status: 1 },
    { id: 3, movieId: 4, hallId: 3, startsAt: atTbilisi(1, 12), standardPrice: 12, vipPrice: 18, status: 1 },
    { id: 4, movieId: 1, hallId: 1, startsAt: atTbilisi(2, 18), standardPrice: 18, vipPrice: 28, status: 1 },
    { id: 5, movieId: 3, hallId: 1, startsAt: atTbilisi(3, 21), standardPrice: 18, vipPrice: 30, status: 1 },
    { id: 6, movieId: 5, hallId: 3, startsAt: atTbilisi(4, 22), standardPrice: 15, vipPrice: 24, status: 1 },
    { id: 7, movieId: 2, hallId: 2, startsAt: atTbilisi(2, 16), standardPrice: 16, vipPrice: 26, status: 2 },
  ]
  const tickets: Ticket[] = [
    { id: 1, bookingId: 1, ticketCode: "a1b2c3d4e5f64789a0b1c2d3e4f50617", finalPrice: 16 },
    { id: 2, bookingId: 2, ticketCode: "b2c3d4e5f64789a0b1c2d3e4f5061718", finalPrice: 26 },
  ]
  const bookings: Booking[] = [
    { id: 1, userId: 2, sessionId: 2, seatId: 45, status: "Active", createdAt: new Date().toISOString(), ticketId: 1 },
    { id: 2, userId: 2, sessionId: 2, seatId: 91, status: "Active", createdAt: new Date().toISOString(), ticketId: 2 },
  ]
  return {
    users: [
      { id: 1, username: "admin", email: "admin@cinemago.local", password: "CinemaAdmin!12", role: "Admin" },
      { id: 2, username: "lea", email: "lea@cinemago.local", password: "tickets123", role: "Customer" },
    ],
    genres,
    movies,
    halls,
    seats,
    sessions,
    bookings,
    tickets,
    ids: { user: 3, genre: 8, movie: 6, hall: 4, seat: seatId, session: 8, booking: 3, ticket: 3 },
  }
}

function store() {
  if (!globalStore.__cinemaDemo) globalStore.__cinemaDemo = seed()
  const data = globalStore.__cinemaDemo
  if (!data.users.some((user) => user.role === "SuperAdmin")) {
    data.users.unshift({ ...SUPER_ADMIN, id: data.ids.user++ })
  }
  return data
}

function refreshTokens() {
  globalStore.__cinemaDemoRefresh ??= new Map()
  return globalStore.__cinemaDemoRefresh
}

function invitations() {
  globalStore.__cinemaDemoInvitations ??= new Map()
  return globalStore.__cinemaDemoInvitations
}

function problem(status: number, detail: string, instance: string, errors?: Record<string, string[]>) {
  const titles: Record<number, string> = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
    503: "Service Unavailable",
  }
  return Response.json(
    { type: "about:blank", title: titles[status] ?? "Error", status, detail, instance, ...(errors ? { errors } : {}) },
    { status, headers: { "content-type": "application/problem+json", "x-cinema-mode": "demo" } },
  )
}

function ok(data: unknown, status = 200) {
  return Response.json(
    { success: true, message: "Request completed successfully.", data, errors: null },
    { status, headers: { "x-cinema-mode": "demo" } },
  )
}

function noContent() {
  return new Response(null, { status: 204, headers: { "x-cinema-mode": "demo" } })
}

type AuthUser = { userId: number; username: string; email: string; role: Role }

function readUser(request: Request, instance: string): AuthUser | Response {
  const header = request.headers.get("authorization") ?? ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : ""
  if (!token.startsWith("demo.")) return problem(401, "Invalid user identity.", instance)
  try {
    const payload = JSON.parse(Buffer.from(token.slice(5), "base64url").toString()) as AuthUser & { exp: number }
    if (!payload.exp || payload.exp * 1000 <= Date.now()) return problem(401, "Invalid user identity.", instance)
    const user = store().users.find((item) => item.id === payload.userId)
    if (!user) return problem(401, "Invalid user identity.", instance)
    return { userId: user.id, username: user.username, email: user.email, role: user.role }
  } catch {
    return problem(401, "Invalid user identity.", instance)
  }
}

function sign(user: User) {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60
  const token = `demo.${Buffer.from(
    JSON.stringify({ userId: user.id, username: user.username, email: user.email, role: user.role, exp }),
  ).toString("base64url")}`
  const refreshToken = Buffer.from(crypto.getRandomValues(new Uint8Array(48))).toString("base64url")
  const refreshExpiresAt = Date.now() + 7 * 24 * 60 * 60_000
  refreshTokens().set(refreshToken, { userId: user.id, expiresAt: refreshExpiresAt, revoked: false })
  return {
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    token,
    expiresAtUtc: new Date(exp * 1000).toISOString(),
    refreshToken,
    refreshTokenExpiresAtUtc: new Date(refreshExpiresAt).toISOString(),
  }
}

function isAdminRole(role: Role) {
  return role === "Admin" || role === "SuperAdmin"
}

function validateAccount(body: Record<string, unknown>) {
  const username = String(body.username ?? "").trim()
  const email = String(body.email ?? "").trim()
  const password = String(body.password ?? "")
  const errors: Record<string, string[]> = {}
  if (!/^[A-Za-z0-9_.-]{3,100}$/.test(username)) {
    errors.Username = ["Username may contain only letters, digits, '_', '.' and '-'."]
  }
  if (!email || !email.includes("@") || email.length > 256) errors.Email = ["A valid email is required."]
  if (password.length < 8 || password.length > 128) errors.Password = ["Password must be at least 8 characters."]
  const data = store()
  const conflict = data.users.some((user) => user.username.toLowerCase() === username.toLowerCase())
    ? "Username is already taken."
    : data.users.some((user) => user.email.toLowerCase() === email.toLowerCase())
      ? "Email is already registered."
      : null
  return { username, email, password, errors: Object.keys(errors).length ? errors : null, conflict }
}

function isResponse(value: AuthUser | Response): value is Response {
  return value instanceof Response
}

function genreDto(genre: Genre) {
  return { id: genre.id, name: genre.name }
}

function movieDto(movie: Movie) {
  const data = store()
  return {
    id: movie.id,
    title: movie.title,
    durationMinutes: movie.durationMinutes,
    ageRating: movie.ageRating,
    posterUrl: movie.posterUrl ?? null,
    genres: movie.genreIds
      .map((id) => data.genres.find((genre) => genre.id === id))
      .filter((genre): genre is Genre => Boolean(genre))
      .map(genreDto),
  }
}

function sessionDto(session: Session) {
  const data = store()
  const movie = data.movies.find((item) => item.id === session.movieId)
  const hall = data.halls.find((item) => item.id === session.hallId)
  const starts = new Date(session.startsAt)
  return {
    id: session.id,
    movieId: session.movieId,
    movieTitle: movie?.title ?? "",
    durationMinutes: movie?.durationMinutes ?? 0,
    hallId: session.hallId,
    hallName: hall?.name ?? "",
    startsAt: session.startsAt,
    endsAt: new Date(starts.getTime() + (movie?.durationMinutes ?? 0) * 60_000).toISOString(),
    standardPrice: session.standardPrice,
    vipPrice: session.vipPrice,
    status: session.status,
  }
}

function bookingDto(booking: Booking) {
  const data = store()
  const session = data.sessions.find((item) => item.id === booking.sessionId)
  const seat = data.seats.find((item) => item.id === booking.seatId)
  const movie = data.movies.find((item) => item.id === session?.movieId)
  const ticket = data.tickets.find((item) => item.id === booking.ticketId)
  return {
    id: booking.id,
    userId: booking.userId,
    sessionId: booking.sessionId,
    seatId: booking.seatId,
    movieTitle: movie?.title ?? "",
    sessionStartsAt: session?.startsAt ?? "",
    rowNumber: seat?.rowNumber ?? 0,
    seatNumber: seat?.seatNumber ?? 0,
    isVip: seat?.isVip ?? false,
    status: booking.status,
    createdAt: booking.createdAt,
    ticketCode: ticket?.ticketCode ?? null,
    finalPrice: ticket?.finalPrice ?? null,
  }
}

function ticketDto(ticket: Ticket) {
  const data = store()
  const booking = data.bookings.find((item) => item.id === ticket.bookingId)
  const session = data.sessions.find((item) => item.id === booking?.sessionId)
  const seat = data.seats.find((item) => item.id === booking?.seatId)
  const movie = data.movies.find((item) => item.id === session?.movieId)
  const hall = data.halls.find((item) => item.id === session?.hallId)
  return {
    id: ticket.id,
    bookingId: ticket.bookingId,
    ticketCode: ticket.ticketCode,
    finalPrice: ticket.finalPrice,
    movieTitle: movie?.title ?? "",
    sessionStartsAt: session?.startsAt ?? "",
    hallName: hall?.name ?? "",
    rowNumber: seat?.rowNumber ?? 0,
    seatNumber: seat?.seatNumber ?? 0,
    isVip: seat?.isVip ?? false,
  }
}

async function bodyOf(request: Request) {
  const text = await request.text()
  if (!text) return {}
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    return null
  }
}

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : Number.NaN
}

function moneyOk(value: number) {
  return value >= 0 && value <= 100000 && Math.abs(value * 100 - Math.round(value * 100)) < 1e-6
}

function parseStart(value: unknown): Date | string {
  if (typeof value !== "string" || !value.trim()) return "Session start time must be specified."
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return "Session start time must include a UTC offset (e.g. 2030-01-01T18:00:00Z)."
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Session start time must be specified."
  if (date.getTime() <= Date.now()) return "Session start time must be in the future."
  return date
}

function requireAdmin(user: AuthUser, instance: string) {
  if (!isAdminRole(user.role)) return problem(403, "Forbidden", instance)
  return null
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && aEnd > bStart
}

function ensureNoOverlap(hallId: number, startsAt: Date, duration: number, excludeId?: number) {
  const data = store()
  const start = startsAt.getTime()
  const end = start + duration * 60_000
  for (const session of data.sessions) {
    if (session.hallId !== hallId || session.id === excludeId || session.status === 2) continue
    const movie = data.movies.find((item) => item.id === session.movieId)
    const existingStart = new Date(session.startsAt).getTime()
    const existingEnd = existingStart + (movie?.durationMinutes ?? 0) * 60_000
    if (overlaps(start, end, existingStart, existingEnd)) {
      return "The session overlaps with another session in this hall."
    }
  }
  return null
}

function bookOne(userId: number, session: Session, seat: Seat) {
  const data = store()
  const ticketId = data.ids.ticket++
  const bookingId = data.ids.booking++
  const price = seat.isVip ? session.vipPrice : session.standardPrice
  const ticket: Ticket = {
    id: ticketId,
    bookingId,
    ticketCode: crypto.randomUUID().replaceAll("-", ""),
    finalPrice: price,
  }
  const booking: Booking = {
    id: bookingId,
    userId,
    sessionId: session.id,
    seatId: seat.id,
    status: "Active",
    createdAt: new Date().toISOString(),
    ticketId,
  }
  data.tickets.push(ticket)
  data.bookings.push(booking)
  return bookingDto(booking)
}

export async function handleDemo(request: Request, pathname: string) {
  const url = new URL(request.url)
  const data = store()
  const method = request.method.toUpperCase()
  const parts = pathname.split("/").filter(Boolean)

  if (parts[0] !== "api") return problem(404, "Not Found", pathname)

  if (parts[1] === "auth" && method === "POST") {
    const body = await bodyOf(request)
    if (!body) return problem(400, "The request contains invalid values.", pathname)
    if (parts[2] === "register") {
      const { username, email, password, errors, conflict } = validateAccount(body)
      if (errors) return problem(400, "The request contains invalid values.", pathname, errors)
      if (conflict) return problem(409, conflict, pathname)
      const user: User = { id: data.ids.user++, username, email, password, role: "Customer" }
      data.users.push(user)
      return ok(sign(user))
    }
    if (parts[2] === "admin-invitations" && parts.length === 3) {
      const user = readUser(request, pathname)
      if (isResponse(user)) return user
      if (user.role !== "SuperAdmin") return problem(403, "Forbidden", pathname)
      const email = String(body.email ?? "").trim().toLowerCase()
      if (!email.includes("@")) return problem(400, "A valid email is required.", pathname)
      if (data.users.some((item) => item.email.toLowerCase() === email)) {
        return problem(409, "Email is already registered.", pathname)
      }
      const code = String(Math.floor(Math.random() * 100_000_000)).padStart(8, "0")
      const invitation = { id: Date.now(), code, expiresAt: Date.now() + 10 * 60_000, attempts: 0 }
      invitations().set(email, invitation)
      return ok({ invitationId: invitation.id, email, expiresAtUtc: new Date(invitation.expiresAt).toISOString(), code }, 201)
    }
    if (parts[2] === "admin-invitations" && parts[3] === "accept") {
      const email = String(body.email ?? "").trim().toLowerCase()
      const invitation = invitations().get(email)
      if (!invitation || invitation.expiresAt <= Date.now() || invitation.attempts >= 5) {
        return problem(401, "Invalid or expired invitation code.", pathname)
      }
      if (String(body.code ?? "").trim() !== invitation.code) {
        invitation.attempts++
        return problem(401, "Invalid or expired invitation code.", pathname)
      }
      const { username, password, errors, conflict } = validateAccount({ ...body, email })
      if (errors) return problem(400, "The request contains invalid values.", pathname, errors)
      if (conflict) return problem(409, conflict, pathname)
      invitations().delete(email)
      const user: User = { id: data.ids.user++, username, email, password, role: "Admin" }
      data.users.push(user)
      return ok(sign(user))
    }
    if (parts[2] === "refresh" || parts[2] === "logout") {
      const token = String(body.refreshToken ?? "")
      const stored = refreshTokens().get(token)
      if (parts[2] === "logout") {
        if (stored) stored.revoked = true
        return noContent()
      }
      const user = stored && data.users.find((item) => item.id === stored.userId)
      if (!stored || stored.revoked || stored.expiresAt <= Date.now() || !user) {
        return problem(401, "Invalid refresh token.", pathname)
      }
      stored.revoked = true
      return ok(sign(user))
    }
    if (parts[2] === "login") {
      const login = String(body.usernameOrEmail ?? "").trim()
      const password = String(body.password ?? "")
      if (!login || !password) return problem(400, "The request contains invalid values.", pathname)
      const user = login.includes("@")
        ? data.users.find((item) => item.email.toLowerCase() === login.toLowerCase())
        : data.users.find((item) => item.username.toLowerCase() === login.toLowerCase())
      if (!user || user.password !== password) {
        return problem(401, "Invalid username/email or password.", pathname)
      }
      return ok(sign(user))
    }
  }

  if (parts[1] === "movies") {
    if (parts.length === 2 && method === "GET") {
      const page = Number(url.searchParams.get("page") ?? 1)
      const pageSize = Number(url.searchParams.get("pageSize") ?? 10)
      const title = url.searchParams.get("title") ?? ""
      const genreRaw = url.searchParams.get("genreId")
      if (page < 1) return problem(400, "Page must be greater than or equal to 1.", pathname)
      if (pageSize < 1 || pageSize > 100) return problem(400, "Page size must be between 1 and 100.", pathname)
      if (genreRaw && Number(genreRaw) <= 0) return problem(400, "Genre id must be greater than zero.", pathname)
      let movies = [...data.movies]
      if (title.trim()) {
        const needle = title.trim().toLowerCase()
        movies = movies.filter((movie) => movie.title.toLowerCase().includes(needle))
      }
      if (genreRaw) {
        const genreId = Number(genreRaw)
        movies = movies.filter((movie) => movie.genreIds.includes(genreId))
      }
      movies.sort((a, b) => a.title.localeCompare(b.title) || a.id - b.id)
      const totalCount = movies.length
      const slice = movies.slice((page - 1) * pageSize, page * pageSize).map(movieDto)
      return ok({
        movies: slice,
        page,
        pageSize,
        totalCount,
        totalPages: totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize),
      })
    }
    if (parts[2] === "sales" && method === "GET") {
      const user = readUser(request, pathname)
      if (isResponse(user)) return user
      const denied = requireAdmin(user, pathname)
      if (denied) return denied
      const groups = new Map<number, { title: string; ticketCount: number; revenue: number }>()
      for (const ticket of data.tickets) {
        const booking = data.bookings.find((item) => item.id === ticket.bookingId)
        if (!booking || booking.status !== "Active") continue
        const session = data.sessions.find((item) => item.id === booking.sessionId)
        const movie = data.movies.find((item) => item.id === session?.movieId)
        if (!movie) continue
        const current = groups.get(movie.id) ?? { title: movie.title, ticketCount: 0, revenue: 0 }
        current.ticketCount += 1
        current.revenue += ticket.finalPrice
        groups.set(movie.id, current)
      }
      const sales = [...groups.entries()]
        .map(([movieId, value]) => ({ movieId, ...value }))
        .sort((a, b) => b.revenue - a.revenue || a.title.localeCompare(b.title))
      return ok(sales)
    }
    if (parts.length === 4 && parts[3] === "poster" && (method === "POST" || method === "DELETE")) {
      const user = readUser(request, pathname)
      if (isResponse(user)) return user
      const denied = requireAdmin(user, pathname)
      if (denied) return denied
      const movie = data.movies.find((item) => item.id === Number(parts[2]))
      if (!movie) return problem(404, "Not Found", pathname)
      if (method === "DELETE") {
        movie.posterUrl = null
        return ok(movieDto(movie))
      }
      let file: FormDataEntryValue | null = null
      try {
        file = (await request.formData()).get("file")
      } catch {
        return problem(400, "The request contains invalid values.", pathname)
      }
      if (!(file instanceof File) || file.size === 0) return problem(400, "The uploaded file is empty.", pathname)
      if (file.size > 5 * 1024 * 1024) return problem(400, "The poster must be 5 MB or smaller.", pathname)
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        return problem(400, "The poster must be a JPEG, PNG or WebP image.", pathname)
      }
      const bytes = Buffer.from(await file.arrayBuffer())
      movie.posterUrl = `data:${file.type};base64,${bytes.toString("base64")}`
      return ok(movieDto(movie))
    }    if (parts.length === 3 && method === "GET") {
      const movie = data.movies.find((item) => item.id === Number(parts[2]))
      return movie ? ok(movieDto(movie)) : problem(404, "Not Found", pathname)
    }
    if (parts.length === 2 && method === "POST") {
      const user = readUser(request, pathname)
      if (isResponse(user)) return user
      const denied = requireAdmin(user, pathname)
      if (denied) return denied
      const body = await bodyOf(request)
      if (!body) return problem(400, "The request contains invalid values.", pathname)
      const error = validateMovie(body)
      if (error) return problem(400, error, pathname)
      const genreIds = uniquePositive(body.genreIds)
      const missing = genreIds.find((id) => !data.genres.some((genre) => genre.id === id))
      if (missing) return problem(400, `Genre with ID ${missing} does not exist.`, pathname)
      const movie: Movie = {
        id: data.ids.movie++,
        title: String(body.title).trim(),
        durationMinutes: num(body.durationMinutes),
        ageRating: num(body.ageRating),
        posterUrl: body.posterUrl ? String(body.posterUrl).trim() : null,
        genreIds,
      }
      data.movies.push(movie)
      return ok(movieDto(movie), 201)
    }
    if (parts.length === 3 && method === "PUT") {
      const user = readUser(request, pathname)
      if (isResponse(user)) return user
      const denied = requireAdmin(user, pathname)
      if (denied) return denied
      const movie = data.movies.find((item) => item.id === Number(parts[2]))
      if (!movie) return problem(404, "Not Found", pathname)
      const body = await bodyOf(request)
      if (!body) return problem(400, "The request contains invalid values.", pathname)
      const error = validateMovie(body)
      if (error) return problem(400, error, pathname)
      const genreIds = uniquePositive(body.genreIds)
      const missing = genreIds.find((id) => !data.genres.some((genre) => genre.id === id))
      if (missing) return problem(400, `Genre with ID ${missing} does not exist.`, pathname)
      movie.title = String(body.title).trim()
      movie.durationMinutes = num(body.durationMinutes)
      movie.ageRating = num(body.ageRating)
      movie.posterUrl = body.posterUrl ? String(body.posterUrl).trim() : null
      movie.genreIds = genreIds
      return ok(movieDto(movie))
    }
    if (parts.length === 3 && method === "DELETE") {
      const user = readUser(request, pathname)
      if (isResponse(user)) return user
      const denied = requireAdmin(user, pathname)
      if (denied) return denied
      const index = data.movies.findIndex((item) => item.id === Number(parts[2]))
      if (index < 0) return problem(404, "Not Found", pathname)
      if (data.sessions.some((session) => session.movieId === data.movies[index].id)) {
        return problem(409, "The request conflicts with existing data (e.g. the seat was just booked by someone else).", pathname)
      }
      data.movies.splice(index, 1)
      return noContent()
    }
  }

  if (parts[1] === "genres") {
    if (parts.length === 2 && method === "GET") return ok([...data.genres].sort((a, b) => a.name.localeCompare(b.name)).map(genreDto))
    if (parts.length === 3 && method === "GET") {
      const genre = data.genres.find((item) => item.id === Number(parts[2]))
      return genre ? ok(genreDto(genre)) : problem(404, "Not Found", pathname)
    }
    if (method === "POST" || method === "PUT" || method === "DELETE") {
      const user = readUser(request, pathname)
      if (isResponse(user)) return user
      const denied = requireAdmin(user, pathname)
      if (denied) return denied
    }
    if (parts.length === 2 && method === "POST") {
      const body = await bodyOf(request)
      if (!body) return problem(400, "The request contains invalid values.", pathname)
      const name = String(body.name ?? "").trim()
      const invalid = validateName(name, "Genre")
      if (invalid) return problem(400, invalid, pathname)
      if (data.genres.some((genre) => genre.name.toLowerCase() === name.toLowerCase())) {
        return problem(409, `A genre named '${name}' already exists.`, pathname)
      }
      const genre = { id: data.ids.genre++, name }
      data.genres.push(genre)
      return ok(genreDto(genre), 201)
    }
    if (parts.length === 3 && method === "PUT") {
      const genre = data.genres.find((item) => item.id === Number(parts[2]))
      if (!genre) return problem(404, "Not Found", pathname)
      const body = await bodyOf(request)
      if (!body) return problem(400, "The request contains invalid values.", pathname)
      const name = String(body.name ?? "").trim()
      const invalid = validateName(name, "Genre")
      if (invalid) return problem(400, invalid, pathname)
      if (data.genres.some((item) => item.id !== genre.id && item.name.toLowerCase() === name.toLowerCase())) {
        return problem(409, `A genre named '${name}' already exists.`, pathname)
      }
      genre.name = name
      return ok(genreDto(genre))
    }
    if (parts.length === 3 && method === "DELETE") {
      const index = data.genres.findIndex((item) => item.id === Number(parts[2]))
      if (index < 0) return problem(404, "Not Found", pathname)
      if (data.movies.some((movie) => movie.genreIds.includes(data.genres[index].id))) {
        return problem(409, "A genre assigned to movies cannot be deleted.", pathname)
      }
      data.genres.splice(index, 1)
      return noContent()
    }
  }

  if (parts[1] === "halls") {
    if (parts.length === 2 && method === "GET") {
      return ok([...data.halls].sort((a, b) => a.name.localeCompare(b.name)).map((hall) => ({ ...hall })))
    }
    if (parts.length === 3 && method === "GET") {
      const hall = data.halls.find((item) => item.id === Number(parts[2]))
      return hall ? ok({ ...hall }) : problem(404, "Not Found", pathname)
    }
    if (method !== "GET") {
      const user = readUser(request, pathname)
      if (isResponse(user)) return user
      const denied = requireAdmin(user, pathname)
      if (denied) return denied
    }
    if (parts.length === 2 && method === "POST") {
      const body = await bodyOf(request)
      if (!body) return problem(400, "The request contains invalid values.", pathname)
      const parsed = parseHall(body)
      if (typeof parsed === "string") return problem(400, parsed, pathname)
      if (data.halls.some((hall) => hall.name.toLowerCase() === parsed.name.toLowerCase())) {
        return problem(409, `A hall named '${parsed.name}' already exists.`, pathname)
      }
      const hall = { id: data.ids.hall++, ...parsed }
      data.halls.push(hall)
      return ok({ ...hall }, 201)
    }
    if (parts.length === 3 && method === "PUT") {
      const hall = data.halls.find((item) => item.id === Number(parts[2]))
      if (!hall) return problem(404, "Not Found", pathname)
      const body = await bodyOf(request)
      if (!body) return problem(400, "The request contains invalid values.", pathname)
      const parsed = parseHall(body)
      if (typeof parsed === "string") return problem(400, parsed, pathname)
      if (data.halls.some((item) => item.id !== hall.id && item.name.toLowerCase() === parsed.name.toLowerCase())) {
        return problem(409, `A hall named '${parsed.name}' already exists.`, pathname)
      }
      const seatCount = data.seats.filter((seat) => seat.hallId === hall.id).length
      if (parsed.capacity < seatCount) {
        return problem(409, `Capacity cannot be lower than the number of existing seats (${seatCount}).`, pathname)
      }
      hall.name = parsed.name
      hall.capacity = parsed.capacity
      return ok({ ...hall })
    }
    if (parts.length === 3 && method === "DELETE") {
      const index = data.halls.findIndex((item) => item.id === Number(parts[2]))
      if (index < 0) return problem(404, "Not Found", pathname)
      const hallId = data.halls[index].id
      if (data.sessions.some((session) => session.hallId === hallId)) {
        return problem(409, "A hall with sessions cannot be deleted.", pathname)
      }
      if (data.seats.some((seat) => seat.hallId === hallId)) {
        return problem(409, "A hall with seats cannot be deleted. Delete its seats first.", pathname)
      }
      data.halls.splice(index, 1)
      return noContent()
    }
  }

  if (parts[1] === "seats") {
    if (parts.length === 2 && method === "GET") {
      const hallId = url.searchParams.get("hallId")
      let seats = data.seats
      if (hallId) seats = seats.filter((seat) => seat.hallId === Number(hallId))
      return ok(
        [...seats]
          .sort((a, b) => a.hallId - b.hallId || a.rowNumber - b.rowNumber || a.seatNumber - b.seatNumber)
          .map((seat) => ({ ...seat })),
      )
    }
    if (parts.length === 3 && method === "GET") {
      const seat = data.seats.find((item) => item.id === Number(parts[2]))
      return seat ? ok({ ...seat }) : problem(404, "Not Found", pathname)
    }
    if (method !== "GET") {
      const user = readUser(request, pathname)
      if (isResponse(user)) return user
      const denied = requireAdmin(user, pathname)
      if (denied) return denied
    }
    if (parts.length === 2 && method === "POST") {
      const body = await bodyOf(request)
      if (!body) return problem(400, "The request contains invalid values.", pathname)
      const hallId = num(body.hallId)
      const rowNumber = num(body.rowNumber)
      const seatNumber = num(body.seatNumber)
      if (rowNumber < 1 || seatNumber < 1 || rowNumber > 1000 || seatNumber > 1000) {
        return problem(400, "Row number and seat number must be greater than zero.", pathname)
      }
      const hall = data.halls.find((item) => item.id === hallId)
      if (!hall) return problem(404, "Hall was not found.", pathname)
      const hallSeats = data.seats.filter((seat) => seat.hallId === hall.id)
      if (hallSeats.some((seat) => seat.rowNumber === rowNumber && seat.seatNumber === seatNumber)) {
        return problem(409, `Seat ${seatNumber} in row ${rowNumber} already exists in this hall.`, pathname)
      }
      if (hallSeats.length >= hall.capacity) return problem(409, `The hall is full (capacity ${hall.capacity}).`, pathname)
      const seat: Seat = { id: data.ids.seat++, hallId: hall.id, rowNumber, seatNumber, isVip: Boolean(body.isVip) }
      data.seats.push(seat)
      return ok({ ...seat }, 201)
    }
    if (parts.length === 3 && method === "PUT") {
      const seat = data.seats.find((item) => item.id === Number(parts[2]))
      if (!seat) return problem(404, "Not Found", pathname)
      const body = await bodyOf(request)
      if (!body) return problem(400, "The request contains invalid values.", pathname)
      const rowNumber = num(body.rowNumber)
      const seatNumber = num(body.seatNumber)
      if (rowNumber < 1 || seatNumber < 1) return problem(400, "Row number and seat number must be greater than zero.", pathname)
      const booked = data.bookings.some((booking) => booking.seatId === seat.id)
      if (booked && (seat.rowNumber !== rowNumber || seat.seatNumber !== seatNumber)) {
        return problem(409, "A seat with booking history cannot change its row or seat number.", pathname)
      }
      const clash = data.seats.some(
        (item) =>
          item.hallId === seat.hallId &&
          item.id !== seat.id &&
          item.rowNumber === rowNumber &&
          item.seatNumber === seatNumber,
      )
      if (clash) return problem(409, `Seat ${seatNumber} in row ${rowNumber} already exists in this hall.`, pathname)
      seat.rowNumber = rowNumber
      seat.seatNumber = seatNumber
      seat.isVip = Boolean(body.isVip)
      return ok({ ...seat })
    }
    if (parts.length === 3 && method === "DELETE") {
      const index = data.seats.findIndex((item) => item.id === Number(parts[2]))
      if (index < 0) return problem(404, "Not Found", pathname)
      if (data.bookings.some((booking) => booking.seatId === data.seats[index].id)) {
        return problem(409, "A seat with bookings cannot be deleted.", pathname)
      }
      data.seats.splice(index, 1)
      return noContent()
    }
  }

  if (parts[1] === "sessions") {
    if (parts.length === 2 && method === "GET") {
      const page = Number(url.searchParams.get("page") ?? 1)
      const pageSize = Number(url.searchParams.get("pageSize") ?? 10)
      if (page < 1) return problem(400, "Page must be greater than or equal to 1.", pathname)
      if (pageSize < 1 || pageSize > 100) return problem(400, "Page size must be between 1 and 100.", pathname)
      const movieRaw = url.searchParams.get("movieId")
      if (movieRaw && Number(movieRaw) <= 0) return problem(400, "Movie id must be greater than zero.", pathname)
      const dateFrom = url.searchParams.get("dateFrom")
      const dateTo = url.searchParams.get("dateTo")
      if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
        return problem(400, "dateFrom cannot be later than dateTo.", pathname)
      }
      let sessions = [...data.sessions]
      if (movieRaw) sessions = sessions.filter((session) => session.movieId === Number(movieRaw))
      if (dateFrom) sessions = sessions.filter((session) => session.startsAt >= new Date(dateFrom).toISOString())
      if (dateTo) sessions = sessions.filter((session) => session.startsAt <= new Date(dateTo).toISOString())
      sessions.sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      const totalCount = sessions.length
      return ok({
        sessions: sessions.slice((page - 1) * pageSize, page * pageSize).map(sessionDto),
        page,
        pageSize,
        totalCount,
        totalPages: totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize),
      })
    }
    if (parts.length === 3 && method === "GET") {
      const session = data.sessions.find((item) => item.id === Number(parts[2]))
      return session ? ok(sessionDto(session)) : problem(404, "Not Found", pathname)
    }
    if (parts.length === 4 && parts[3] === "seats" && method === "GET") {
      const session = data.sessions.find((item) => item.id === Number(parts[2]))
      if (!session) return problem(404, "Not Found", pathname)
      const taken = new Set(
        data.bookings.filter((booking) => booking.sessionId === session.id && booking.status === "Active").map((booking) => booking.seatId),
      )
      const seats = data.seats
        .filter((seat) => seat.hallId === session.hallId)
        .sort((a, b) => a.rowNumber - b.rowNumber || a.seatNumber - b.seatNumber)
        .map((seat) => ({
          seatId: seat.id,
          rowNumber: seat.rowNumber,
          seatNumber: seat.seatNumber,
          isVip: seat.isVip,
          isAvailable: !taken.has(seat.id),
        }))
      return ok(seats)
    }
    if (method !== "GET") {
      const user = readUser(request, pathname)
      if (isResponse(user)) return user
      const denied = requireAdmin(user, pathname)
      if (denied) return denied
    }
    if (parts.length === 2 && method === "POST") {
      const body = await bodyOf(request)
      if (!body) return problem(400, "The request contains invalid values.", pathname)
      const created = applySession(body, undefined, pathname)
      return created
    }
    if (parts.length === 3 && method === "PUT") {
      const session = data.sessions.find((item) => item.id === Number(parts[2]))
      if (!session) return problem(404, "Not Found", pathname)
      if (data.bookings.some((booking) => booking.sessionId === session.id && booking.status === "Active")) {
        return problem(409, "A session with active bookings cannot be updated.", pathname)
      }
      const body = await bodyOf(request)
      if (!body) return problem(400, "The request contains invalid values.", pathname)
      return applySession(body, session, pathname)
    }
    if (parts.length === 4 && parts[3] === "cancel" && method === "POST") {
      const session = data.sessions.find((item) => item.id === Number(parts[2]))
      if (!session) return problem(404, "Not Found", pathname)
      if (session.status === 2) return problem(409, "The session is already cancelled.", pathname)
      if (session.status === 3) return problem(400, "A completed session cannot be cancelled.", pathname)
      session.status = 2
      for (const booking of data.bookings) {
        if (booking.sessionId === session.id && booking.status === "Active") booking.status = "Cancelled"
      }
      return ok(sessionDto(session))
    }
    if (parts.length === 3 && method === "DELETE") {
      const index = data.sessions.findIndex((item) => item.id === Number(parts[2]))
      if (index < 0) return problem(404, "Not Found", pathname)
      if (data.bookings.some((booking) => booking.sessionId === data.sessions[index].id)) {
        return problem(409, "A session with bookings cannot be deleted.", pathname)
      }
      data.sessions.splice(index, 1)
      return noContent()
    }
  }

  if (parts[1] === "bookings") {
    const user = readUser(request, pathname)
    if (isResponse(user)) return user
    if (parts.length === 2 && method === "POST") {
      const body = await bodyOf(request)
      if (!body) return problem(400, "The request contains invalid values.", pathname)
      const session = data.sessions.find((item) => item.id === num(body.sessionId))
      if (!session) return problem(404, `Session with ID ${body.sessionId} not found.`, pathname)
      const seat = data.seats.find((item) => item.id === num(body.seatId))
      if (!seat) return problem(404, `Seat with ID ${body.seatId} not found.`, pathname)
      if (seat.hallId !== session.hallId) return problem(400, "The selected seat does not belong to the session's hall.", pathname)
      if (session.status !== 1) return problem(400, "You cannot book a ticket for a session that is not scheduled.", pathname)
      if (new Date(session.startsAt).getTime() <= Date.now()) {
        return problem(400, "You cannot book a ticket for a session that has already started.", pathname)
      }
      if (data.bookings.some((booking) => booking.sessionId === session.id && booking.seatId === seat.id && booking.status === "Active")) {
        return problem(409, "This seat has already been booked for this session.", pathname)
      }
      return ok(bookOne(user.userId, session, seat), 201)
    }
    if (parts[2] === "batch" && method === "POST") {
      const body = await bodyOf(request)
      if (!body) return problem(400, "The request contains invalid values.", pathname)
      const seatIds = Array.isArray(body.seatIds) ? body.seatIds.map((id) => Number(id)) : []
      if (seatIds.length < 1 || seatIds.length > 20) return problem(400, "A booking must contain between 1 and 20 seats.", pathname)
      if (new Set(seatIds).size !== seatIds.length || seatIds.some((id) => id <= 0)) {
        return problem(400, "Seat IDs must be positive and unique.", pathname)
      }
      const session = data.sessions.find((item) => item.id === num(body.sessionId))
      if (!session) return problem(404, `Session with ID ${body.sessionId} not found.`, pathname)
      if (session.status !== 1 || new Date(session.startsAt).getTime() <= Date.now()) {
        return problem(400, "You cannot book tickets for a session that is not scheduled or has already started.", pathname)
      }
      const seats: Seat[] = []
      for (const seatId of seatIds) {
        const seat = data.seats.find((item) => item.id === seatId)
        if (!seat) return problem(404, `Seat with ID ${seatId} not found.`, pathname)
        if (seat.hallId !== session.hallId) return problem(400, `Seat ${seatId} does not belong to the session's hall.`, pathname)
        if (data.bookings.some((booking) => booking.sessionId === session.id && booking.seatId === seatId && booking.status === "Active")) {
          return problem(409, `Seat ${seatId} has already been booked for this session.`, pathname)
        }
        seats.push(seat)
      }
      return ok(seats.map((seat) => bookOne(user.userId, session, seat)), 201)
    }
    if (parts[2] === "my" && method === "GET") {
      return ok(data.bookings.filter((booking) => booking.userId === user.userId).map(bookingDto))
    }
    if (parts.length === 2 && method === "GET") {
      const denied = requireAdmin(user, pathname)
      if (denied) return denied
      return ok(data.bookings.map(bookingDto))
    }
    if (parts.length === 3 && method === "GET") {
      const booking = data.bookings.find((item) => item.id === Number(parts[2]))
      if (!booking) return problem(404, "Not Found", pathname)
      if (!isAdminRole(user.role) && booking.userId !== user.userId) return problem(404, "Not Found", pathname)
      return ok(bookingDto(booking))
    }
    if (parts.length === 3 && method === "DELETE") {
      const booking = data.bookings.find((item) => item.id === Number(parts[2]))
      if (!booking) return problem(404, `Booking with ID ${parts[2]} not found.`, pathname)
      if (!isAdminRole(user.role) && booking.userId !== user.userId) {
        return problem(403, "You cannot cancel another user's booking.", pathname)
      }
      if (booking.status !== "Active") return problem(400, "This booking is already cancelled.", pathname)
      booking.status = "Cancelled"
      return noContent()
    }
  }

  if (parts[1] === "tickets" && parts.length === 3 && method === "GET") {
    const user = readUser(request, pathname)
    if (isResponse(user)) return user
    const ticket = data.tickets.find((item) => item.id === Number(parts[2]))
    if (!ticket) return problem(404, `Ticket with ID ${parts[2]} not found.`, pathname)
    const booking = data.bookings.find((item) => item.id === ticket.bookingId)
    if (!isAdminRole(user.role) && booking?.userId !== user.userId) {
      return problem(403, "You cannot access another user's ticket.", pathname)
    }
    return ok(ticketDto(ticket))
  }

  return problem(404, "Not Found", pathname)
}

function validateName(name: string, label: string) {
  if (!name) return `${label} name cannot be empty.`
  if (name.length > 100) return `${label} name cannot be longer than 100 characters.`
  return null
}

function validateMovie(body: Record<string, unknown>) {
  const title = String(body.title ?? "").trim()
  if (!title) return "Movie title cannot be empty."
  if (title.length > 200) return "Movie title cannot be longer than 200 characters."
  const duration = num(body.durationMinutes)
  if (duration < 1 || duration > 1000) return "Movie duration must be greater than zero."
  const age = num(body.ageRating)
  if (age < 0 || age > 21) return "Movie age rating must be between 0 and 21."
  if (body.genreIds != null && !Array.isArray(body.genreIds)) return "The request contains invalid values."
  const ids = Array.isArray(body.genreIds) ? body.genreIds : []
  if (ids.length > 20) return "A movie can have at most 20 genres."
  return null
}

function uniquePositive(value: unknown) {
  const ids = Array.isArray(value) ? value.map((id) => Number(id)).filter((id) => id > 0) : []
  return [...new Set(ids)]
}

function parseHall(body: Record<string, unknown>) {
  const name = String(body.name ?? "").trim()
  const invalid = validateName(name, "Hall")
  if (invalid) return invalid
  const capacity = num(body.capacity)
  if (capacity < 1 || capacity > 10000) return "Hall capacity must be between 1 and 10000."
  return { name, capacity }
}

function applySession(body: Record<string, unknown>, existing: Session | undefined, pathname: string) {
  const data = store()
  const standardPrice = num(body.standardPrice)
  const vipPrice = num(body.vipPrice)
  if (!moneyOk(standardPrice)) return problem(400, "StandardPrice can have at most 2 decimal places.", pathname)
  if (!moneyOk(vipPrice)) return problem(400, "VipPrice can have at most 2 decimal places.", pathname)
  if (vipPrice < standardPrice) return problem(400, "VipPrice cannot be lower than StandardPrice.", pathname)
  const movie = data.movies.find((item) => item.id === num(body.movieId))
  if (!movie) return problem(404, "Movie was not found.", pathname)
  const hall = data.halls.find((item) => item.id === num(body.hallId))
  if (!hall) return problem(404, "Hall was not found.", pathname)
  const starts = parseStart(body.startsAt)
  if (typeof starts === "string") return problem(400, starts, pathname)
  const clash = ensureNoOverlap(hall.id, starts, movie.durationMinutes, existing?.id)
  if (clash) return problem(409, clash, pathname)
  if (existing) {
    existing.movieId = movie.id
    existing.hallId = hall.id
    existing.startsAt = starts.toISOString()
    existing.standardPrice = standardPrice
    existing.vipPrice = vipPrice
    return ok(sessionDto(existing))
  }
  const session: Session = {
    id: data.ids.session++,
    movieId: movie.id,
    hallId: hall.id,
    startsAt: starts.toISOString(),
    standardPrice,
    vipPrice,
    status: 1,
  }
  data.sessions.push(session)
  return ok(sessionDto(session), 201)
}
