import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://dqegpuyvmflinvauyiwv.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZWdwdXl2bWZsaW52YXV5aXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjU5OTEsImV4cCI6MjA5ODQwMTk5MX0.lXq7X_zhwIri-LREcppGv5DJ6jzEhTSTTM0JCW_lXIg";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
