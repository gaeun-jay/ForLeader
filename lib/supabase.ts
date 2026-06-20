import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Meeting = {
  id: string;
  title: string;
  dates: string[];
  start_time: string;
  end_time: string;
  step_minutes: number;
  participants: string[];
  created_at: string;
};

export type Response = {
  id: string;
  meeting_id: string;
  name: string;
  available_slots: string[];
  note: string | null;
  created_at: string;
  updated_at: string;
};
