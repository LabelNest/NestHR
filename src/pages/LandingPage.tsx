import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import Footer from '@/components/layout/Footer';
import { 
  Clock, 
  Calendar, 
  Users, 
  BarChart3, 
  FileText, 
  Layers,
  Shield,
  Zap,
  Database,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const features = [
  { 
    icon: Clock, 
    title: 'Smart Attendance Management', 
    description: 'Real-time tracking and regularization with automated workflows' 
  },
  { 
    icon: Calendar, 
    title: 'Leave Management', 
    description: 'Seamless approval workflows and balance tracking' 
  },
  { 
    icon: Users, 
    title: 'Employee Self-Service', 
    description: 'Empower your workforce with self-service portals' 
  },
  { 
    icon: BarChart3, 
    title: 'Advanced Analytics', 
    description: 'Data-driven insights for informed decisions' 
  },
  { 
    icon: FileText, 
    title: 'Document Management', 
    description: 'Secure, organized, and easily accessible' 
  },
  { 
    icon: Layers, 
    title: 'Modular & Scalable', 
    description: 'Built for growth - adapt as you scale' 
  },
];

const stats = [
  { icon: Database, label: 'Built for Big Data Companies' },
  { icon: Shield, label: 'Enterprise-Grade Security' },
  { icon: Zap, label: 'Trusted by Data Teams' },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error.message || 'Login failed');
    } else {
      toast.success('Welcome back!');
      navigate('/app');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Main Content - Split Screen */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* LEFT SIDE - Login Form */}
        <div className="lg:w-2/5 flex flex-col justify-center px-8 py-12 lg:px-16 bg-card">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-12">
            <img 
              src="/labelnest-logo.jpg" 
              alt="LabelNest" 
              className="h-12 w-auto rounded-lg shadow-md"
            />
            <div>
              <span className="font-display font-bold text-2xl text-foreground">LabelNest</span>
              <span className="text-xs text-muted-foreground block">HRMS</span>
            </div>
          </Link>

          {/* Login Form */}
          <div className="max-w-sm">
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">Welcome Back</h1>
            <p className="text-muted-foreground mb-8">Sign in to your account</p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pr-10"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <a href="#" className="text-sm text-primary hover:underline">
                  Forgot Password?
                </a>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <a href="#" className="text-primary font-medium hover:underline">
                Contact Admin
              </a>
            </p>
          </div>
        </div>

        {/* RIGHT SIDE - Branding & Features */}
        <div className="lg:w-3/5 bg-gradient-to-br from-primary to-primary-dark text-white px-8 py-12 lg:px-16 lg:py-20 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-12">
            {/* Hero Section */}
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-4xl lg:text-5xl font-display font-bold leading-tight">
                Enterprise HRMS for Data-Driven Companies
              </h2>
              <p className="text-lg text-primary-light leading-relaxed">
                At LabelNest, we believe one size doesn't fit all when it comes to data. We're building a world where every organization, big or small, can access data that truly fits their needs: locally grounded, globally scalable, and built with purpose.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 animate-slide-up">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Our Vision
              </h3>
              <p className="text-primary-light">
                To become India's most trusted modular data backbone - powering innovation through clean, connected, and contextual data.
              </p>
            </div>

            {/* Features Grid */}
            <div className="space-y-6">
              <h3 className="font-semibold text-xl">What We Offer</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div 
                      key={feature.title}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-all duration-300 animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">{feature.title}</h4>
                          <p className="text-sm text-primary-light">{feature.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div 
                    key={stat.label}
                    className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{stat.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
