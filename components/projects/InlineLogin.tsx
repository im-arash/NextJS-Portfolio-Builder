"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/utils/supabase/client";

export default function InlineLogin({ onSuccess }: { onSuccess: () => void }) {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e: FormEvent) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    onSuccess();
  }

  return (
    <form onSubmit={handleLogin} className="max-w-md space-y-4">
      <h1 className="text-3xl">Admin Login</h1>

      <input
        type="email"
        placeholder="Email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <input
        type="password"
        placeholder="Password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <button className="px-4 py-2 bg-black text-white rounded">Login</button>
    </form>
  );
}
