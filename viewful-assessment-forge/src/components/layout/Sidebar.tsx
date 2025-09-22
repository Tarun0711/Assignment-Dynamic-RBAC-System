import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Shield,
  Users,
  FileText,
  Settings,
  User,
  Key,
  UserCog,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    requiredResource: null,
  },
  {
    title: "Permissions",
    url: "/permissions",
    icon: Key,
    requiredResource: "permission",
  },
  {
    title: "Roles",
    url: "/roles",
    icon: Shield,
    requiredResource: "role",
  },
  {
    title: "Users",
    url: "/users",
    icon: UserCog,
    requiredResource: "user",
  },
  {
    title: "Posts",
    url: "/posts",
    icon: FileText,
    requiredResource: null,
  },
];

const bottomItems = [
  {
    title: "Profile",
    url: "/profile",
    icon: User,
    requiredResource: null,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    requiredResource: null,
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { hasResourceAccess, hasPermission } = useUser();
  const currentPath = location.pathname;

  // Helper function to check if user has dashboard access
  const hasDashboardAccess = () => {
    return hasPermission("system.audit") || hasPermission("system.admin");
  };

  const isActive = (path: string) => currentPath === path;
  const isExpanded = navigationItems.some((i) => isActive(i.url));

  const getNavClass = (item: typeof navigationItems[0], { isActive }: { isActive: boolean }) => {
    return isActive
      ? "bg-sidebar-accent text-sidebar-primary font-medium"
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground";
  };

  const collapsed = state === "collapsed";

  return (
    <Sidebar
      className={`${
        collapsed ? "w-16" : "w-64"
      } bg-sidebar border-r border-sidebar-border transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarContent className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="text-lg font-semibold text-sidebar-foreground">
                  RBAC Admin
                </h2>
                <p className="text-xs text-sidebar-foreground/70">
                  Role Management System
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className="text-sidebar-foreground/70 uppercase tracking-wide text-xs font-semibold px-3 py-2">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems
                .filter((item) => {
                  // Special handling for Dashboard
                  if (item.title === "Dashboard") {
                    return hasDashboardAccess();
                  }
                  // Regular permission check for other items
                  return !item.requiredResource || hasResourceAccess(item.requiredResource);
                })
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={(props) => getNavClass(item, props)}>
                        <item.icon className="w-5 h-5" />
                        {!collapsed && <span className="ml-3">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={(props) => getNavClass(item, props)}>
                      <item.icon className="w-5 h-5" />
                      {!collapsed && <span className="ml-3">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <SidebarTrigger className="w-full" />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}