import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      // The locally stored session is the source of sign-in state; a slow/failed revalidation
      // must never make a signed-in person look signed out.
      const { data: local } = await supabase.auth.getSession();
      if (!local.session) return null;
      const { data, error } = await supabase.auth.getUser();
      if (error && error.name === 'AuthSessionMissingError') return null;
      if (error && (error as { status?: number }).status === 401) return null;
      const user = data.user ?? local.session.user;
      if (!user) return null;
      const blocked = await supabase.from('account_blocks').select('reason').eq('user_id',user.id).maybeSingle();
      if(blocked.data) return {id:user.id,profile:null,isAdmin:false,block:blocked.data};
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      return {
        id: user.id,
        block: null,
        profile,
        isAdmin: (roles ?? []).some((r) => r.role === "admin"),
      };
    },
  });
}
