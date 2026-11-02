export const AUTH_FIELD_NAMES = [
  "fullName",
  "email",
  "currentPassword",
  "password",
  "confirmPassword",
] as const;

export type AuthFieldName = (typeof AUTH_FIELD_NAMES)[number];

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<AuthFieldName, string>>;
  /** Echoed back only for the confirmation screen ("we sent a link to …"). */
  submittedEmail?: string;
};

export function createInitialAuthState(): AuthActionState {
  return { status: "idle" };
}
