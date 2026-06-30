import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://dqegpuyvmflinvauyiwv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZWdwdXl2bWZsaW52YXV5aXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjU5OTEsImV4cCI6MjA5ODQwMTk5MX0.lXq7X_zhwIri-LREcppGv5DJ6jzEhTSTTM0JCW_lXIg";
const supabase = createClient(supabaseUrl, supabaseAnonKey);
async function check() {
  const item = {
    assetType: "Elektronik",
    name: "Laptop Asus Vivobook",
    brand: "Asus",
    code: "INV-1001",
    category: "IT",
    quantity: 10,
    unitPrice: 15000000,
    status: "Tersedia",
    location: "Gudang Utama",
    purchaseDate: "2024-01-01"
  };
  const { name, category, status, assignedToId, assignedToName, purchaseDate, location, code, ...extra } = item;
  const payload = {
      id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      name: name || 'Tanpa Nama',
      category: category || 'Lainnya',
      status: status || 'Tersedia',
      assignedtoid: assignedToId || null,
      assignedtoname: assignedToName || null,
      purchasedate: purchaseDate || new Date().toISOString(),
      location: location || 'Gudang',
      serialnumber: code || '',
      condition: 'Baik',
      notes: JSON.stringify({ ...extra, code: code || '' })
    };
  const { data, error } = await supabase.from("inventory").insert(payload);
  console.log("Error:", error);
}
check();
