import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || (!secretKey && !publishableKey)) {
  throw new Error("Supabase URL and either a publishable or server secret key are required.");
}

const email = "fongkham-demo@nan-tourism-hackathon.vercel.app";
const password = "NanCoffee2026!";
const appMetadata = {
  role: "merchant",
  demo_merchant: true,
  merchant_profile_id: "merchant-demo-01",
};

const client = createClient(supabaseUrl, secretKey || publishableKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

if (!secretKey) {
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw error;
  console.log(JSON.stringify({
    status: "signed-up",
    userId: data.user?.id,
    email: data.user?.email,
    needsAdminMetadata: true,
  }));
  process.exit(0);
}

let page = 1;
let existingUser;
while (!existingUser) {
  const { data, error } = await client.auth.admin.listUsers({ page, perPage: 100 });
  if (error) throw error;
  existingUser = data.users.find((user) => user.email?.toLowerCase() === email);
  if (existingUser || data.users.length < 100) break;
  page += 1;
}

let result;
if (existingUser) {
  result = await client.auth.admin.updateUserById(existingUser.id, {
    password,
    email_confirm: true,
    app_metadata: {
      ...existingUser.app_metadata,
      ...appMetadata,
    },
    user_metadata: {
      ...existingUser.user_metadata,
      display_name: "MVP Demo Merchant",
      shop_name: "ฟองคำ คอฟฟี่พอยต์",
    },
  });
} else {
  result = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: appMetadata,
    user_metadata: {
      display_name: "MVP Demo Merchant",
      shop_name: "ฟองคำ คอฟฟี่พอยต์",
    },
  });
}

if (result.error) throw result.error;

console.log(JSON.stringify({
  status: existingUser ? "updated" : "created",
  userId: result.data.user.id,
  email: result.data.user.email,
  demoMerchant: result.data.user.app_metadata.demo_merchant === true,
  merchantProfileId: result.data.user.app_metadata.merchant_profile_id,
}));
