/** User shape returned by GET /user/auth */
export interface BackendAuthUser {
  user_id?: string;
  id?: string;
  google_id?: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  avatarUrl?: string | null;
  created_at?: string;
  createdAt?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export function mapBackendUser(row: BackendAuthUser): AuthUser {
  return {
    id: String(row.user_id ?? row.id ?? ""),
    email: row.email,
    name: row.name,
    picture: row.avatar_url ?? row.avatarUrl ?? undefined,
  };
}

export class AuthError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "AuthError";
  }
}
