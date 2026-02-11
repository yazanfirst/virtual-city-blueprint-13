import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Lock, ArrowRight, UserPlus, Building2, Gamepad2, AlertTriangle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { checkPasswordLeaked, checkPasswordStrength, passwordRequirements } from "@/lib/passwordSecurity";

const signInSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const signUpSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string()
    .min(passwordRequirements.minLength, { message: `Password must be at least ${passwordRequirements.minLength} characters` })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/, { message: "Password must contain at least one special character" }),
  displayName: z.string().trim().min(2, { message: "Name must be at least 2 characters" }).max(50, { message: "Name must be less than 50 characters" }),
});

type UserRole = 'merchant' | 'player';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, loading, userRole } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("player");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{ isStrong: boolean; unmetRequirements: string[] }>({ isStrong: false, unmetRequirements: [] });

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      if (userRole === 'merchant' || userRole === 'admin') {
        navigate('/merchant/dashboard');
      } else {
        navigate('/');
      }
    }
  }, [user, loading, userRole, navigate]);

  // Check password strength as user types (only for signup)
  useEffect(() => {
    if (isSignUp && password) {
      setPasswordStrength(checkPasswordStrength(password));
    } else {
      setPasswordStrength({ isStrong: false, unmetRequirements: [] });
    }
  }, [password, isSignUp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        // Validate sign up
        const validation = signUpSchema.safeParse({ email, password, displayName });
        if (!validation.success) {
          toast({
            title: "Validation Error",
            description: validation.error.errors[0].message,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        // Check if password has been leaked
        setIsCheckingPassword(true);
        const leakResult = await checkPasswordLeaked(password);
        setIsCheckingPassword(false);

        if (leakResult.isLeaked) {
          toast({
            title: "Compromised Password Detected",
            description: `This password has appeared in ${leakResult.count.toLocaleString()} data breaches. Please choose a different password to protect your account.`,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        const { error } = await signUp(email, password, displayName, selectedRole);
        
        if (error) {
          let message = error.message;
          if (message.includes('already registered')) {
            message = 'This email is already registered. Please sign in instead.';
          }
          toast({
            title: "Sign Up Failed",
            description: message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Account Created!",
            description: "Please check your email and click the confirmation link to activate your account.",
          });
        }
      } else {
        // Validate sign in
        const validation = signInSchema.safeParse({ email, password });
        if (!validation.success) {
          toast({
            title: "Validation Error",
            description: validation.error.errors[0].message,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        const { error } = await signIn(email, password);
        
        if (error) {
          toast({
            title: "Sign In Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in.",
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="cyber-card">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 glow-primary mb-4">
              {isSignUp ? <UserPlus className="h-7 w-7 text-primary" /> : <User className="h-7 w-7 text-primary" />}
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isSignUp ? "Join the virtual city" : "Sign in to continue"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-foreground">
                  Display Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10 bg-muted border-border focus:border-primary"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-muted border-border focus:border-primary"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-muted border-border focus:border-primary"
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Password strength indicator for signup */}
              {isSignUp && password && (
                <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    {passwordStrength.isStrong ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className={`text-sm font-medium ${passwordStrength.isStrong ? 'text-green-500' : 'text-yellow-500'}`}>
                      {passwordStrength.isStrong ? 'Strong password' : 'Password requirements'}
                    </span>
                  </div>
                  
                  {!passwordStrength.isStrong && (
                    <ul className="space-y-1">
                      {passwordStrength.unmetRequirements.map((req, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <X className="h-3 w-3 text-destructive" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {isSignUp && (
              <div className="space-y-3">
                <Label className="text-foreground">I want to...</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("player")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                      selectedRole === "player"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/50 text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <Gamepad2 className="h-6 w-6" />
                    <span className="text-sm font-medium">Explore</span>
                    <span className="text-xs opacity-70">As a player</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("merchant")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                      selectedRole === "merchant"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/50 text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <Building2 className="h-6 w-6" />
                    <span className="text-sm font-medium">Open Shop</span>
                    <span className="text-xs opacity-70">As a merchant</span>
                  </button>
                </div>
              </div>
            )}

            <Button 
              variant="cyber" 
              className="w-full" 
              type="submit"
              disabled={isSubmitting || isCheckingPassword}
            >
              {isSubmitting || isCheckingPassword ? (
                <span className="animate-pulse">
                  {isCheckingPassword ? "Checking password security..." : "Processing..."}
                </span>
              ) : (
                <>
                  {isSignUp ? "Create Account" : "Sign In"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary hover:underline font-medium"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
