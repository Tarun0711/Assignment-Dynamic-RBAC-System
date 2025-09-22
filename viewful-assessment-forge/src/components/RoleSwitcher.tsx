import { useUser } from "@/contexts/UserContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCog, Shield, LogOut } from "lucide-react";

export function RoleSwitcher() {
  const { user, logout, permissions } = useUser();

  if (!user) return null;

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      SuperAdmin: "bg-purple-100 text-purple-800",
      Admin: "bg-blue-100 text-blue-800", 
      Editor: "bg-green-100 text-green-800",
      Moderator: "bg-orange-100 text-orange-800",
      User: "bg-gray-100 text-gray-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Card className="dashboard-card border-amber-200 bg-amber-50/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-amber-700" />
              <span className="font-medium text-amber-800">Current User:</span>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-amber-800">{user.name}</span>
              <Badge className={getRoleColor(user.role.name)}>
                <Shield className="w-3 h-3 mr-1" />
                {user.role.name}
              </Badge>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="border-amber-200 text-amber-800 hover:bg-amber-100"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
        
        <div className="mt-3 pt-3 border-t border-amber-200">
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-amber-700 mr-2">Permissions:</span>
            {permissions.slice(0, 8).map((permission) => (
              <Badge key={permission._id} variant="outline" className="text-xs border-amber-300 text-amber-800">
                {permission.name}
              </Badge>
            ))}
            {permissions.length > 8 && (
              <Badge key="more-permissions" variant="outline" className="text-xs border-amber-300 text-amber-800">
                +{permissions.length - 8} more
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}