import type {
  AcceptInvitationInput,
  AdminInvitation,
  AuthSession,
  Booking,
  ConnectionInfo,
  Genre,
  Hall,
  Movie,
  MovieInput,
  MovieSales,
  PagedMovies,
  PagedSessions,
  Seat,
  SeatAvailability,
  Session,
  SessionInput,
  Ticket,
} from "@/lib/types"

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.errors = errors
  }
}

let authToken: string | null = null
let onUnauthorized: () => void = () => {}
let refreshToken: () => Promise<string | null> = async () => null

export function setAuthToken(token: string | null) {
  authToken = token
}

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

export function setRefreshHandler(handler: () => Promise<string | null>) {
  refreshToken = handler
}

function query(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue
    search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ""
}

type RequestOptions = {
  method?: string
  body?: unknown
  /** Set to false for calls that must not carry the access token or trigger a refresh. */
  auth?: boolean
}

async function send(path: string, options: RequestOptions | undefined, token: string | null) {
  const headers = new Headers()
  const isForm = typeof FormData !== "undefined" && options?.body instanceof FormData
  if (options?.body !== undefined && !isForm) headers.set("content-type", "application/json")
  if (token) headers.set("authorization", `Bearer ${token}`)
  try {
    return await fetch(`/cinema-api${path}`, {
      method: options?.method ?? "GET",
      headers,
      body: options?.body === undefined ? undefined : isForm ? (options.body as FormData) : JSON.stringify(options.body),
      cache: "no-store",
    })
  } catch {
    throw new ApiError("CinemaGo could not be reached.", 0)
  }
}

async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  const token = options?.auth === false ? null : authToken
  let response = await send(path, options, token)

  if (response.status === 401 && token) {
    const fresh = await refreshToken()
    if (fresh) response = await send(path, options, fresh)
    if (!fresh || response.status === 401) onUnauthorized()
  }

  if (response.status === 204) return undefined as T

  const text = await response.text()
  let json: {
    success?: boolean
    data?: T
    detail?: string
    title?: string
    errors?: Record<string, string[]>
  } | null = null
  if (text) {
    try {
      json = JSON.parse(text)
    } catch {
      throw new ApiError("CinemaGo returned a response that was not JSON.", response.status)
    }
  }

  if (!response.ok) {
    const detail = json?.detail || json?.title || "The request failed."
    throw new ApiError(detail, response.status, json?.errors)
  }

  if (json && typeof json === "object" && "success" in json && "data" in json) {
    return json.data as T
  }
  return json as T
}

export const cinema = {
  auth: {
    login: (body: { usernameOrEmail: string; password: string }) =>
      request<AuthSession>("/api/auth/login", { method: "POST", body }),
    register: (body: { username: string; email: string; password: string }) =>
      request<AuthSession>("/api/auth/register", { method: "POST", body }),
    refresh: (refreshToken: string) =>
      request<AuthSession>("/api/auth/refresh", { method: "POST", body: { refreshToken }, auth: false }),
    logout: (refreshToken: string) =>
      request<void>("/api/auth/logout", { method: "POST", body: { refreshToken }, auth: false }),
    inviteAdmin: (email: string) =>
      request<AdminInvitation>("/api/auth/admin-invitations", { method: "POST", body: { email } }),
    acceptAdminInvitation: (body: AcceptInvitationInput) =>
      request<AuthSession>("/api/auth/admin-invitations/accept", { method: "POST", body, auth: false }),
  },
  movies: {
    list: (params: { title?: string; genreId?: number; page?: number; pageSize?: number } = {}) =>
      request<PagedMovies>(`/api/movies${query(params)}`),
    get: (id: number) => request<Movie>(`/api/movies/${id}`),
    sales: () => request<MovieSales[]>("/api/movies/sales"),
    create: (body: MovieInput) => request<Movie>("/api/movies", { method: "POST", body }),
    update: (id: number, body: MovieInput) =>
      request<Movie>(`/api/movies/${id}`, { method: "PUT", body }),
    remove: (id: number) => request<void>(`/api/movies/${id}`, { method: "DELETE" }),
    uploadPoster: (id: number, file: File) => {
      const body = new FormData()
      body.append("file", file)
      return request<Movie>(`/api/movies/${id}/poster`, { method: "POST", body })
    },
    removePoster: (id: number) => request<Movie>(`/api/movies/${id}/poster`, { method: "DELETE" }),
  },
  genres: {
    list: () => request<Genre[]>("/api/genres"),
    create: (body: { name: string }) => request<Genre>("/api/genres", { method: "POST", body }),
    update: (id: number, body: { name: string }) =>
      request<Genre>(`/api/genres/${id}`, { method: "PUT", body }),
    remove: (id: number) => request<void>(`/api/genres/${id}`, { method: "DELETE" }),
  },
  halls: {
    list: () => request<Hall[]>("/api/halls"),
    get: (id: number) => request<Hall>(`/api/halls/${id}`),
    create: (body: { name: string; capacity: number }) =>
      request<Hall>("/api/halls", { method: "POST", body }),
    update: (id: number, body: { name: string; capacity: number }) =>
      request<Hall>(`/api/halls/${id}`, { method: "PUT", body }),
    remove: (id: number) => request<void>(`/api/halls/${id}`, { method: "DELETE" }),
  },
  seats: {
    list: (hallId?: number) => request<Seat[]>(`/api/seats${query({ hallId })}`),
    create: (body: { hallId: number; rowNumber: number; seatNumber: number; isVip: boolean }) =>
      request<Seat>("/api/seats", { method: "POST", body }),
    update: (id: number, body: { rowNumber: number; seatNumber: number; isVip: boolean }) =>
      request<Seat>(`/api/seats/${id}`, { method: "PUT", body }),
    remove: (id: number) => request<void>(`/api/seats/${id}`, { method: "DELETE" }),
  },
  sessions: {
    list: (
      params: {
        movieId?: number
        dateFrom?: string
        dateTo?: string
        page?: number
        pageSize?: number
      } = {},
    ) => request<PagedSessions>(`/api/sessions${query(params)}`),
    get: (id: number) => request<Session>(`/api/sessions/${id}`),
    seats: (id: number) => request<SeatAvailability[]>(`/api/sessions/${id}/seats`),
    create: (body: SessionInput) => request<Session>("/api/sessions", { method: "POST", body }),
    update: (id: number, body: SessionInput) =>
      request<Session>(`/api/sessions/${id}`, { method: "PUT", body }),
    cancel: (id: number) => request<Session>(`/api/sessions/${id}/cancel`, { method: "POST" }),
    remove: (id: number) => request<void>(`/api/sessions/${id}`, { method: "DELETE" }),
  },
  bookings: {
    create: (body: { sessionId: number; seatId: number }) =>
      request<Booking>("/api/bookings", { method: "POST", body }),
    batch: (body: { sessionId: number; seatIds: number[] }) =>
      request<Booking[]>("/api/bookings/batch", { method: "POST", body }),
    mine: () => request<Booking[]>("/api/bookings/my"),
    list: () => request<Booking[]>("/api/bookings"),
    get: (id: number) => request<Booking>(`/api/bookings/${id}`),
    cancel: (id: number) => request<void>(`/api/bookings/${id}`, { method: "DELETE" }),
  },
  tickets: {
    get: (id: number) => request<Ticket>(`/api/tickets/${id}`),
  },
  connection: {
    get: async () => {
      const response = await fetch("/api/connection", { cache: "no-store" })
      if (!response.ok) throw new ApiError("Could not check the CinemaGo connection.", response.status)
      return (await response.json()) as ConnectionInfo
    },
    retry: async () => {
      const response = await fetch("/api/connection", { method: "POST", cache: "no-store" })
      if (!response.ok) throw new ApiError("Could not retry the CinemaGo connection.", response.status)
      return (await response.json()) as ConnectionInfo
    },
  },
}

export function errorText(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return "Something went wrong."
}
