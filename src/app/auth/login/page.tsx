"use client";

import { useState } from "react";
import { createClientBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClientBrowser();

  // Database setup is handled once during deployment
  // No need to call setup APIs on every login page load

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Hardcoded credentials
    const HARDCODED_EMAIL = "admin@gaushala.com";
    const HARDCODED_PASSWORD = "admin@123";

    try {
      // Trim email to handle whitespace
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();

      // Check if credentials match hardcoded values
      if (trimmedEmail === HARDCODED_EMAIL.toLowerCase() && trimmedPassword === HARDCODED_PASSWORD) {
        console.log("Credentials match, attempting Supabase login...");
        
        // Sign in with Supabase using hardcoded credentials
        const { data, error } = await supabase.auth.signInWithPassword({
          email: HARDCODED_EMAIL,
          password: HARDCODED_PASSWORD,
        });

        if (error) {
          console.error("Supabase login error:", error);
          console.error("Error details:", JSON.stringify(error, null, 2));
          
          // If it's an invalid credentials error, try to reset the password
          if (error.message.includes("Invalid login credentials") || error.message.includes("Invalid login")) {
            console.log("Attempting to reset admin password...");
            try {
              const resetResponse = await fetch("/api/reset-admin-password", { method: "POST" });
              const resetData = await resetResponse.json();
              
              if (resetData.success) {
                console.log("Password reset successful, retrying login...");
                // Retry login after password reset
                const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                  email: HARDCODED_EMAIL,
                  password: HARDCODED_PASSWORD,
                });
                
                if (retryError) {
                  setError("Invalid email or password. Please check your credentials.");
                } else if (retryData?.user) {
                  console.log("Login successful after password reset");
                  await new Promise((resolve) => setTimeout(resolve, 200));
                  const { data: sessionData } = await supabase.auth.getSession();
                  if (sessionData?.session) {
                    window.location.href = "/dashboard";
                    return;
                  }
                }
              } else {
                setError("Invalid email or password. Please check your credentials.");
              }
            } catch (resetError) {
              console.error("Error resetting password:", resetError);
              setError("Invalid email or password. Please check your credentials.");
            }
          } else if (error.message.includes("Email not confirmed") || error.message.includes("email")) {
            setError("Please verify your email address before signing in.");
          } else {
            setError(error.message || "Failed to sign in. Please try again.");
          }
        } else if (data?.user) {
          console.log("Login successful, user:", data.user.email);
          
          // Wait a moment for session to be set in cookies
          await new Promise((resolve) => setTimeout(resolve, 200));
          
          // Verify session was set
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            console.log("Session confirmed, redirecting...");
            // Redirect to dashboard
            window.location.href = "/dashboard";
          } else {
            console.error("Session not set after login");
            setError("Session not established. Please try again.");
            setLoading(false);
          }
        } else {
          console.error("Login succeeded but no user data returned");
          setError("Login failed. Please try again.");
        }
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(`An unexpected error occurred: ${errorMessage}. Please try again.`);
    } finally {
      // Only set loading to false if we're not redirecting
      if (!error || error.includes("Session not established")) {
        setLoading(false);
      }
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-50 px-4 py-8"
      style={{ backgroundColor: "#f7f7f7" }}
    >
      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-2 pt-8">
              {/* Logo Section */}
              <div className="flex justify-center">
                <div className="relative">
                  <Image
                    src="/gaushala-logo.png"
                    alt="Shree Govansh Raksha Samiti Gaushala Logo"
                    width={230}
                    height={230}
                    className="object-contain"
                    priority
                  />
                </div>
              </div>

              <CardTitle
                className="text-3xl font-bold pb-1"
                style={{
                  background:
                    "linear-gradient(90deg, #3b5998 0%, #8b9dc3 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {/* Gaushala Management */}
              </CardTitle>
              <CardDescription className="text-gray-400 text-[2vh] p-2">
                Sign in to access the cow management system
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="email"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="h-12 border-2 rounded-xl transition-all duration-200 focus:bg-white"
                    style={{
                      borderColor: "#dfe3ee",
                      backgroundColor: "#f7f7f7",
                    }}
                    onFocus={(e) =>
                      ((e.target as HTMLInputElement).style.borderColor =
                        "#3b5998")
                    }
                    onBlur={(e) =>
                      ((e.target as HTMLInputElement).style.borderColor =
                        "#dfe3ee")
                    }
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="password"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-12 border-2 rounded-xl transition-all duration-200 focus:bg-white"
                    style={{
                      borderColor: "#dfe3ee",
                      backgroundColor: "#f7f7f7",
                    }}
                    onFocus={(e) =>
                      ((e.target as HTMLInputElement).style.borderColor =
                        "#3b5998")
                    }
                    onBlur={(e) =>
                      ((e.target as HTMLInputElement).style.borderColor =
                        "#dfe3ee")
                    }
                    required
                  />
                </div>
                <hr />
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {error}
                      {error.includes("Invalid email or password") && (
                        <div className="mt-2 text-sm">
                          <p className="font-semibold">Troubleshooting:</p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Make sure you&apos;re using: admin@gaushala.com / admin@123</li>
                            <li>The password may need to be reset in Supabase Dashboard</li>
                            <li>Check the browser console (F12) for detailed error messages</li>
                          </ul>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const response = await fetch("/api/reset-admin-password", { method: "POST" });
                                const data = await response.json();
                                if (data.success) {
                                  setError("Password reset successful! Please try logging in again.");
                                } else {
                                  setError(`Password reset failed: ${data.error}. You may need to set SUPABASE_SERVICE_ROLE_KEY in your environment variables.`);
                                }
                              } catch {
                                setError("Failed to reset password. Please check your Supabase configuration.");
                              }
                            }}
                            className="mt-2 text-xs underline text-blue-600 hover:text-blue-800"
                          >
                            Click here to reset admin password
                          </button>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                <Button
                  type="submit"
                  className="w-full h-12 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                  style={{
                    background:
                      "linear-gradient(90deg, #3b5998 0%, #8b9dc3 100%)",
                  }}
                  onMouseEnter={(e) =>
                    ((e.target as HTMLButtonElement).style.background =
                      "linear-gradient(90deg, #2d4373 0%, #7a8bb8 100%)")
                  }
                  onMouseLeave={(e) =>
                    ((e.target as HTMLButtonElement).style.background =
                      "linear-gradient(90deg, #3b5998 0%, #8b9dc3 100%)")
                  }
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-2">
        <p className="text-[2vh] text-gray-500">
          Made in India With ♥ by{" "}
          <a
            href="https://digimirai.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gray-600 underline transition-colors"
          >
            DigiMirai
          </a>
          <br />
          CopyRight &#169; 2025
        </p>
      </div>
    </div>
  );
}
