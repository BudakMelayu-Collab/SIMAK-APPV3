import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://dqegpuyvmflinvauyiwv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZWdwdXl2bWZsaW52YXV5aXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjU5OTEsImV4cCI6MjA5ODQwMTk5MX0.lXq7X_zhwIri-LREcppGv5DJ6jzEhTSTTM0JCW_lXIg";
const supabase = createClient(supabaseUrl, supabaseAnonKey);
async function check() {
  const { data, error } = await supabase.from("inventory").select("notes");
  let sum = 0;
  data.forEach(item => {
    try {
      const parsed = JSON.parse(item.notes);
      sum += parsed.quantity || 1;
    } catch(e) {}
  });
  console.log("Total rows:", data.length, "Total quantity:", sum, "Error:", error);
}
check();
