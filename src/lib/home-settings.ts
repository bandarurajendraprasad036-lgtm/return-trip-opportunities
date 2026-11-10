import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

export const HOME_SETTINGS_KEY = 'home_controls';
export const homeSettingsSchema = z.object({
  fromLocation: z.string().trim().max(80).default(''),
  toLocation: z.string().trim().max(80).default(''),
  showAdminChat: z.boolean().default(true),
  showLocation: z.boolean().default(true),
  showVehicles: z.boolean().default(true),
  showJobs: z.boolean().default(true),
  showServices: z.boolean().default(true),
  showSharing: z.boolean().default(true),
});
export type HomeSettings = z.infer<typeof homeSettingsSchema>;
export const DEFAULT_HOME_SETTINGS: HomeSettings = homeSettingsSchema.parse({});

export function parseHomeSettings(value: string | null | undefined): HomeSettings {
  if (!value) return DEFAULT_HOME_SETTINGS;
  try {
    const parsed = homeSettingsSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : DEFAULT_HOME_SETTINGS;
  } catch {
    return DEFAULT_HOME_SETTINGS;
  }
}

export function useHomeSettings() {
  return useQuery({
    queryKey: ['home-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('app_settings').select('value').eq('key', HOME_SETTINGS_KEY).maybeSingle();
      if (error) throw error;
      return parseHomeSettings(data?.value);
    },
  });
}
