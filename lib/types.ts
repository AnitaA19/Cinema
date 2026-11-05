export type Role = "SuperAdmin" | "Admin" | "Customer"

export type AuthSession = {
  userId: number
  username: string
  email: string
  role: Role
  token: string
  expiresAtUtc: string
  refreshToken?: string
  refreshTokenExpiresAtUtc?: string
}

export type AdminInvitation = {
  invitationId: number
  email: string
  expiresAtUtc: string
  /** Only returned by the offline preview, which cannot send email. */
  code?: string
}

export type AcceptInvitationInput = {
  email: string
  username: string
  password: string
  code: string
}

export type Genre = {
  id: number
  name: string
}

export type Movie = {
  id: number
  title: string
  durationMinutes: number
  ageRating: number
  posterUrl?: string | null
  genres: Genre[]
}

export type PagedMovies = {
  movies: Movie[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export type MovieSales = {
  movieId: number
  title: string
  ticketCount: number
  revenue: number
}

export type Hall = {
  id: number
  name: string
  capacity: number
}

export type Seat = {
  id: number
  hallId: number
  rowNumber: number
  seatNumber: number
  isVip: boolean
}

export type SessionStatus = number | string

export type Session = {
  id: number
  movieId: number
  movieTitle: string
  durationMinutes: number
  hallId: number
  hallName: string
  startsAt: string
  endsAt: string
  standardPrice: number
  vipPrice: number
  status: SessionStatus
}

export type PagedSessions = {
  sessions: Session[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export type SeatAvailability = {
  seatId: number
  rowNumber: number
  seatNumber: number
  isVip: boolean
  isAvailable: boolean
}

export type Booking = {
  id: number
  userId: number
  sessionId: number
  seatId: number
  movieTitle: string
  sessionStartsAt: string
  rowNumber: number
  seatNumber: number
  isVip: boolean
  status: string
  createdAt: string
  ticketCode: string | null
  finalPrice: number | null
}

export type Ticket = {
  id: number
  bookingId: number
  ticketCode: string
  finalPrice: number
  movieTitle: string
  sessionStartsAt: string
  hallName: string
  rowNumber: number
  seatNumber: number
  isVip: boolean
}

export type ConnectionInfo = {
  mode: "live" | "demo"
  apiUrl: string
}

export type MovieInput = {
  title: string
  durationMinutes: number
  ageRating: number
  posterUrl?: string | null
  genreIds: number[]
}

export type SessionInput = {
  movieId: number
  hallId: number
  startsAt: string
  standardPrice: number
  vipPrice: number
}
