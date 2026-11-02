import { getSupabaseConfigurationHelp } from "@/lib/supabase/config";

import { FormMessage } from "@/features/auth/components/form-message";

/**
 * Rendered instead of auth forms when public Supabase configuration is absent.
 * Shows variable names and setup steps only — never values.
 */
function SupabaseConfigurationNotice() {
  return (
    <div className="space-y-4">
      <FormMessage tone="info">
        <p className="font-semibold text-foreground">Authentication is not configured yet.</p>
        <p className="mt-1">{getSupabaseConfigurationHelp()}</p>
        <p className="mt-3 font-mono text-xs leading-relaxed text-ink-muted">
          NEXT_PUBLIC_SUPABASE_URL
          <br />
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        </p>
      </FormMessage>
      <p className="text-xs leading-relaxed text-ink-muted/80">
        Both values are browser-safe. Never place a secret or service-role key in a{" "}
        <code className="rounded bg-surface-elevated px-1 py-0.5 text-[0.7rem]">NEXT_PUBLIC_*</code>{" "}
        variable. See the README for Supabase dashboard setup.
      </p>
    </div>
  );
}

export { SupabaseConfigurationNotice };
