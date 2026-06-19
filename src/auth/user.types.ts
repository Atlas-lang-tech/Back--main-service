/**
 * User context derived from the headers Traefik's ForwardAuth injects after a
 * successful `/verify`. This service never authenticates — it only reads what
 * the gateway already validated.
 */
export interface UserContext {
  id: string;
  role: string;
  plan: string;
}

/** Value of `X-User-Role` that grants unrestricted access to course content. */
export const ADMIN_ROLE = 'ADMIN';

export const HEADER_USER_ID = 'x-user-id';
export const HEADER_USER_ROLE = 'x-user-role';
export const HEADER_USER_PLAN = 'x-user-plan';
