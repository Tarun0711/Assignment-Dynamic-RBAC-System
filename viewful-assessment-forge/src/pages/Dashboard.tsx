import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Shield,
  Key,
  FileText,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { useUser } from "@/contexts/UserContext";
import { Progress } from "@/components/ui/progress";

const stats = [
  {
    title: "Total Users",
    value: "156",
    change: "+12%",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Active Roles",
    value: "8",
    change: "+2",
    icon: Shield,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    title: "Permissions",
    value: "24",
    change: "+4",
    icon: Key,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    title: "Total Posts",
    value: "89",
    change: "+18%",
    icon: FileText,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
];

const recentActivities = [
  {
    id: 1,
    action: "New role 'Content Manager' created",
    user: "Admin",
    timestamp: "2 minutes ago",
    type: "create",
  },
  {
    id: 2,
    action: "Permission 'post.edit' assigned to Editor role",
    user: "SuperAdmin",
    timestamp: "15 minutes ago",
    type: "update",
  },
  {
    id: 3,
    action: "User 'john.doe@company.com' registered",
    user: "System",
    timestamp: "1 hour ago",
    type: "create",
  },
  {
    id: 4,
    action: "Role 'Moderator' permissions updated",
    user: "Admin",
    timestamp: "2 hours ago",
    type: "update",
  },
];

const roleDistribution = [
  { role: "SuperAdmin", count: 2, percentage: 1.3 },
  { role: "Admin", count: 8, percentage: 5.1 },
  { role: "Editor", count: 45, percentage: 28.8 },
  { role: "Moderator", count: 32, percentage: 20.5 },
  { role: "Viewer", count: 69, percentage: 44.2 },
];

export default function Dashboard() {
  const { user } = useUser();
  return (
    <DashboardLayout 
      title="Dashboard" 
      subtitle="Overview of your RBAC system"
    >
      <div className="space-y-6">
        {/* Role Switcher */}
        <RoleSwitcher />
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="dashboard-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600 font-medium">{stat.change}</span>{" "}
                    from last month
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Role Distribution */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Role Distribution
              </CardTitle>
              <CardDescription>
                Current user distribution across roles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {roleDistribution.map((item) => (
                <div key={item.role} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.role}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {item.count} users
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {item.percentage}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activities
              </CardTitle>
              <CardDescription>
                Latest changes in your RBAC system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {activity.type === "create" ? (
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      ) : (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{activity.action}</p>
                      <div className="flex items-center mt-1 text-xs text-muted-foreground">
                        <span>by {activity.user}</span>
                        <span className="mx-1">•</span>
                        <span>{activity.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View all activities
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to manage your RBAC system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button className="btn-primary h-auto p-4 flex flex-col items-center gap-2">
                <Key className="h-6 w-6" />
                <span>Create Permission</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Shield className="h-6 w-6" />
                <span>Create Role</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Users className="h-6 w-6" />
                <span>Manage Users</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <FileText className="h-6 w-6" />
                <span>View Posts</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">System Status</p>
                  <p className="text-xs text-muted-foreground">All systems operational</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">Security Alerts</p>
                  <p className="text-xs text-muted-foreground">2 pending reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">API Status</p>
                  <p className="text-xs text-muted-foreground">99.9% uptime</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}