import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/shared/StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Calendar,
  FolderOpen,
  UserPlus,
  FileEdit,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface LeaveBalance {
  leave_type: string;
  remaining_leaves: number;
}

const DashboardPage = () => {
  const { role, employee, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [dataLoading, setDataLoading] = useState(true);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [teamCount, setTeamCount] = useState(0);
  const [pendingLeaveApprovals, setPendingLeaveApprovals] = useState(0);
  const [pendingRegularizations, setPendingRegularizations] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [activeOnboardings, setActiveOnboardings] = useState(0);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (employee?.id && role) {
      fetchDashboardData();
    }
  }, [employee?.id, role]);

  const fetchDashboardData = async () => {
    if (!employee?.id) return;
    
    setDataLoading(true);
    try {
      // Fetch leave balance for all roles (everyone has their own leave)
      const { data: leaveData } = await supabase
        .from('hr_leave_entitlements')
        .select('leave_type, remaining_leaves')
        .eq('employee_id', employee.id)
        .eq('year', currentYear);
      
      setLeaveBalances(leaveData || []);

      if (role === 'Manager') {
        // Fetch team count
        const { count: teamMemberCount } = await supabase
          .from('hr_employees')
          .select('id', { count: 'exact', head: true })
          .eq('manager_id', employee.id)
          .eq('status', 'Active');
        
        setTeamCount(teamMemberCount || 0);

        // Fetch pending leave approvals for team
        const { data: teamIds } = await supabase
          .from('hr_employees')
          .select('id')
          .eq('manager_id', employee.id);
        
        if (teamIds && teamIds.length > 0) {
          const { count: pendingCount } = await supabase
            .from('hr_leave_requests')
            .select('id', { count: 'exact', head: true })
            .in('employee_id', teamIds.map(t => t.id))
            .eq('status', 'Pending');
          
          setPendingLeaveApprovals(pendingCount || 0);
        }
      }

      if (role === 'Admin') {
        // Fetch total active employees
        const { count: empCount } = await supabase
          .from('hr_employees')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'Active');
        
        setTotalEmployees(empCount || 0);

        // Fetch all pending leave approvals
        const { count: pendingLeaveCount } = await supabase
          .from('hr_leave_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'Pending');
        
        setPendingLeaveApprovals(pendingLeaveCount || 0);

        // Fetch pending regularization requests
        const { count: pendingRegCount } = await supabase
          .from('hr_attendance_regularization_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'Pending');
        
        setPendingRegularizations(pendingRegCount || 0);

        // Fetch active onboardings count
        const { count: onboardingCount } = await supabase
          .from('hr_onboarding_tasks')
          .select('employee_id', { count: 'exact', head: true })
          .eq('status', 'Pending');
        
        setActiveOnboardings(onboardingCount || 0);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setDataLoading(false);
    }
  };

  // Loading skeleton
  if (authLoading || !employee) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const getLeaveBalanceDisplay = () => {
    if (dataLoading) return 'Loading...';
    if (leaveBalances.length === 0) return 'Not configured';
    
    return leaveBalances
      .map(lb => `${lb.leave_type.split(' ')[0]}: ${lb.remaining_leaves}`)
      .join(' | ');
  };

  // Employee Dashboard
  if (role === 'Employee') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Welcome back, {employee.full_name.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">
            Here's your personal overview for today.
          </p>
        </div>

        {/* Leave Balance Card */}
        <Card className="p-6 glass-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Leave Balance ({currentYear})</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {dataLoading ? (
                  <Skeleton className="h-6 w-48" />
                ) : leaveBalances.length > 0 ? (
                  leaveBalances.map((lb) => (
                    <Badge key={lb.leave_type} variant="secondary" className="text-sm">
                      {lb.leave_type}: {lb.remaining_leaves} days
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Leave balance not configured yet</p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="p-6 glass-card cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => navigate('/app/attendance')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Attendance</h3>
                  <p className="text-sm text-muted-foreground">Punch in/out</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Card>

          <Card 
            className="p-6 glass-card cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => navigate('/app/leaves')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">My Leaves</h3>
                  <p className="text-sm text-muted-foreground">Apply for leave</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Card>

          <Card 
            className="p-6 glass-card cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => navigate('/app/profile')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Profile</h3>
                  <p className="text-sm text-muted-foreground">View your profile</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Card>

          <Card 
            className="p-6 glass-card cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => navigate('/app/documents')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Documents</h3>
                  <p className="text-sm text-muted-foreground">My documents</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Manager Dashboard
  if (role === 'Manager') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Welcome back, {employee.full_name.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">
            Here's your team overview for today.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Team Members" 
            value={dataLoading ? '...' : teamCount.toString()}
            icon={Users}
            onClick={() => navigate('/app/team')}
          />
          <StatCard 
            title="Pending Leave Approvals" 
            value={dataLoading ? '...' : pendingLeaveApprovals.toString()}
            icon={AlertCircle}
            onClick={() => navigate('/app/approvals')}
          />
          <Card className="p-4 glass-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">My Leave Balance</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {dataLoading ? (
                    <Skeleton className="h-5 w-32" />
                  ) : leaveBalances.length > 0 ? (
                    leaveBalances.slice(0, 2).map((lb) => (
                      <Badge key={lb.leave_type} variant="outline" className="text-xs">
                        {lb.leave_type.charAt(0)}: {lb.remaining_leaves}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">Not configured</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="p-6 glass-card cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => navigate('/app/approvals')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-status-partial/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-status-partial" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Approve Leaves</h3>
                  <p className="text-sm text-muted-foreground">{pendingLeaveApprovals} pending</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Card>

          <Card 
            className="p-6 glass-card cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => navigate('/app/team')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">View My Team</h3>
                  <p className="text-sm text-muted-foreground">{teamCount} members</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Card>

          <Card 
            className="p-6 glass-card cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => navigate('/app/leaves')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Apply Leave</h3>
                  <p className="text-sm text-muted-foreground">Request time off</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Card>

          <Card 
            className="p-6 glass-card cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => navigate('/app/profile')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Profile</h3>
                  <p className="text-sm text-muted-foreground">View profile</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Welcome, Admin!
        </h1>
        <p className="text-muted-foreground">
          Here's your HR overview for today.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Employees" 
          value={dataLoading ? '...' : totalEmployees.toString()}
          icon={Users}
          onClick={() => navigate('/app/directory')}
        />
        <StatCard 
          title="Pending Leave Approvals" 
          value={dataLoading ? '...' : pendingLeaveApprovals.toString()}
          icon={AlertCircle}
          onClick={() => navigate('/app/approvals')}
        />
        <StatCard 
          title="Pending Regularizations" 
          value={dataLoading ? '...' : pendingRegularizations.toString()}
          icon={FileEdit}
          onClick={() => navigate('/app/admin/attendance-regularization')}
        />
        <StatCard 
          title="Active Onboardings" 
          value={dataLoading ? '...' : activeOnboardings.toString()}
          icon={UserPlus}
          onClick={() => navigate('/app/onboarding')}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className="p-6 glass-card cursor-pointer hover:shadow-md transition-shadow group"
          onClick={() => navigate('/app/directory')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">View Directory</h3>
                <p className="text-sm text-muted-foreground">All employees</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </Card>

        <Card 
          className="p-6 glass-card cursor-pointer hover:shadow-md transition-shadow group"
          onClick={() => navigate('/app/add-employee')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Add Employee</h3>
                <p className="text-sm text-muted-foreground">New hire</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </Card>

        <Card 
          className="p-6 glass-card cursor-pointer hover:shadow-md transition-shadow group"
          onClick={() => navigate('/app/approvals')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-status-partial/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-status-partial" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Approve Leaves</h3>
                <p className="text-sm text-muted-foreground">{pendingLeaveApprovals} pending</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </Card>

        <Card 
          className="p-6 glass-card cursor-pointer hover:shadow-md transition-shadow group"
          onClick={() => navigate('/app/admin/attendance-regularization')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <FileEdit className="w-6 h-6 text-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Regularizations</h3>
                <p className="text-sm text-muted-foreground">{pendingRegularizations} pending</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;