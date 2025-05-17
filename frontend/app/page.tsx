"use client";

import Hero from "@/components/hero";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { useState } from "react";

export default function Home() {
  const { user, login, logout } = useAuth();
  const [email, setEmail] = useState("test@gmail.com");
  const [password, setPassword] = useState("test123");

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    // <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20">
    //   <h1 className="text-2xl font-bold">Authentication Test</h1>
    //   <div className="w-full max-w-md space-y-6">
    //     {user ? (
    //       <div className="p-6 border rounded-lg shadow-sm space-y-4">
    //         <h2 className="text-xl font-semibold">User Details</h2>
    //         <div className="space-y-2">
    //           <p><strong>ID:</strong> {user.id || 'N/A'}</p>
    //           <p><strong>Email:</strong> {user.email || 'N/A'}</p>
    //           <p><strong>Name:</strong> {user.role || 'N/A'}</p>
    //           <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
    //             {JSON.stringify(user, null, 2)}
    //           </pre>
    //         </div>
    //         <Button onClick={() => window.location.href = "/user"} className="w-full">Go to User Page</Button>
    //         <Button variant="destructive" onClick={logout} className="w-full">Logout</Button>
    //       </div>
    //     ) : (
    //       <div className="space-y-4">
    //         <div className="space-y-2">
    //           <label className="block text-sm font-medium">Email</label>
    //           <input
    //             type="email"
    //             value={email}
    //             onChange={(e) => setEmail(e.target.value)}
    //             className="w-full p-2 border rounded"
    //           />
    //         </div>
    //         <div className="space-y-2">
    //           <label className="block text-sm font-medium">Password</label>
    //           <input
    //             type="password"
    //             value={password}
    //             onChange={(e) => setPassword(e.target.value)}
    //             className="w-full p-2 border rounded"
    //           />
    //         </div>
    //         <Button onClick={handleLogin} className="w-full">Login</Button>
    //       </div>
    //     )}
    //   </div>
    // </div>
    <div>
      <Hero />
    </div>
  );
}
