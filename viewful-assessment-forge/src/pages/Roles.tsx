import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Shield, Plus, MoreHorizontal, Edit, Trash2, Search, Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { roleAPI, permissionAPI, handleApiError } from "@/services/api";

interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: Permission[];
  userCount: number;
  createdAt: string;
  isActive: boolean;
  isSystemRole?: boolean;
}

interface Permission {
  _id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editRole, setEditRole] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });
  const { toast } = useToast();

  // Fetch roles on component mount
  useEffect(() => {
    fetchRoles();
  }, []);

  // Fetch permissions when dialog opens
  useEffect(() => {
    if ((isCreateDialogOpen || isEditDialogOpen) && permissions.length === 0) {
      fetchPermissions();
    }
  }, [isCreateDialogOpen, isEditDialogOpen, permissions.length]);

  // Reset form state when dialogs close
  useEffect(() => {
    if (!isCreateDialogOpen) {
      setNewRole({ name: "", description: "", permissions: [] });
    }
  }, [isCreateDialogOpen]);

  useEffect(() => {
    if (!isEditDialogOpen) {
      setEditingRole(null);
      setEditRole({ name: "", description: "", permissions: [] });
    }
  }, [isEditDialogOpen]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await roleAPI.getRoles({ limit: 100 });
      setRoles(response.data.data || []);
    } catch (error) {
      const apiError = handleApiError(error);
      toast({
        title: "Error",
        description: apiError.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const response = await permissionAPI.getPermissions({ limit: 100 });
      setPermissions(response.data.data || []);
    } catch (error) {
      const apiError = handleApiError(error);
      toast({
        title: "Error",
        description: apiError.message,
        variant: "destructive",
      });
    } finally {
      setPermissionsLoading(false);
    }
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRole = async () => {
    if (!newRole.name) {
      toast({
        title: "Validation Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await roleAPI.createRole({
        name: newRole.name,
        description: newRole.description,
        permissions: newRole.permissions,
      });

      // Refresh roles list
      await fetchRoles();
      
      const roleName = newRole.name;
      setNewRole({ name: "", description: "", permissions: [] });
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Role Created",
        description: `Role "${roleName}" has been created successfully`,
      });
    } catch (error) {
      const apiError = handleApiError(error);
      toast({
        title: "Error",
        description: apiError.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setEditRole({
      name: role.name,
      description: role.description,
      permissions: role.permissions.map(p => p._id),
    });
    // Ensure permissions are loaded before opening dialog
    if (permissions.length === 0) {
      fetchPermissions();
    }
    setIsEditDialogOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!editRole.name || !editingRole) {
      toast({
        title: "Validation Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await roleAPI.updateRole(editingRole._id, {
        name: editRole.name,
        description: editRole.description,
        permissions: editRole.permissions,
      });

      // Refresh roles list
      await fetchRoles();
      
      const roleName = editRole.name;
      setEditingRole(null);
      setEditRole({ name: "", description: "", permissions: [] });
      setIsEditDialogOpen(false);
      
      toast({
        title: "Role Updated",
        description: `Role "${roleName}" has been updated successfully`,
      });
    } catch (error) {
      const apiError = handleApiError(error);
      toast({
        title: "Error",
        description: apiError.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (id: string) => {
    const role = roles.find(r => r._id === id);
    if (role && role.userCount > 0) {
      toast({
        title: "Cannot Delete Role",
        description: "This role is assigned to users. Reassign users first.",
        variant: "destructive",
      });
      return;
    }

    if (role?.isSystemRole) {
      toast({
        title: "Cannot Delete Role",
        description: "System roles cannot be deleted.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      await roleAPI.deleteRole(id);
      
      // Refresh roles list
      await fetchRoles();
      
      toast({
        title: "Role Deleted",
        description: "Role has been removed from the system",
      });
    } catch (error) {
      const apiError = handleApiError(error);
      toast({
        title: "Error",
        description: apiError.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setNewRole({
        ...newRole,
        permissions: [...newRole.permissions, permissionId],
      });
    } else {
      setNewRole({
        ...newRole,
        permissions: newRole.permissions.filter(p => p !== permissionId),
      });
    }
  };

  const handleEditPermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setEditRole({
        ...editRole,
        permissions: [...editRole.permissions, permissionId],
      });
    } else {
      setEditRole({
        ...editRole,
        permissions: editRole.permissions.filter(p => p !== permissionId),
      });
    }
  };

  const getPermissionsByModule = () => {
    const modules: Record<string, Permission[]> = {};
    permissions.forEach(permission => {
      const module = permission.resource.charAt(0).toUpperCase() + permission.resource.slice(1);
      if (!modules[module]) {
        modules[module] = [];
      }
      modules[module].push(permission);
    });
    return modules;
  };

  return (
    <DashboardLayout title="Roles" subtitle="Manage user roles and permissions">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogDescription>
                  Define a new role and assign permissions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role-name">Role Name</Label>
                    <Input
                      id="role-name"
                      placeholder="e.g., Content Manager"
                      value={newRole.name}
                      onChange={(e) =>
                        setNewRole({ ...newRole, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role-description">Description</Label>
                    <Textarea
                      id="role-description"
                      placeholder="Describe the role's purpose and responsibilities..."
                      value={newRole.description}
                      onChange={(e) =>
                        setNewRole({ ...newRole, description: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Permissions</Label>
                  {permissionsLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="ml-2">Loading permissions...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(getPermissionsByModule()).map(([module, modulePermissions]) => (
                        <Card key={module} className="p-4">
                          <h4 className="font-medium mb-3">{module}</h4>
                          <div className="space-y-2">
                            {modulePermissions.map((permission) => (
                              <div key={permission._id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={permission._id}
                                  checked={newRole.permissions.includes(permission._id)}
                                  onCheckedChange={(checked) =>
                                    handlePermissionChange(permission._id, checked as boolean)
                                  }
                                />
                                <Label
                                  htmlFor={permission._id}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {permission.description}
                                  <span className="text-muted-foreground ml-2">
                                    ({permission.name})
                                  </span>
                                </Label>
                              </div>
                            ))}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleCreateRole} 
                  className="w-full btn-primary"
                  disabled={loading || permissionsLoading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Role"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Role Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Role</DialogTitle>
                <DialogDescription>
                  Modify role details and permissions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-role-name">Role Name</Label>
                    <Input
                      id="edit-role-name"
                      placeholder="e.g., Content Manager"
                      value={editRole.name}
                      onChange={(e) =>
                        setEditRole({ ...editRole, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-role-description">Description</Label>
                    <Textarea
                      id="edit-role-description"
                      placeholder="Describe the role's purpose and responsibilities..."
                      value={editRole.description}
                      onChange={(e) =>
                        setEditRole({ ...editRole, description: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Permissions</Label>
                  {permissionsLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="ml-2">Loading permissions...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(getPermissionsByModule()).map(([module, modulePermissions]) => (
                        <Card key={module} className="p-4">
                          <h4 className="font-medium mb-3">{module}</h4>
                          <div className="space-y-2">
                            {modulePermissions.map((permission) => (
                              <div key={permission._id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`edit-${permission._id}`}
                                  checked={editRole.permissions.includes(permission._id)}
                                  onCheckedChange={(checked) =>
                                    handleEditPermissionChange(permission._id, checked as boolean)
                                  }
                                />
                                <Label
                                  htmlFor={`edit-${permission._id}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {permission.description}
                                  <span className="text-muted-foreground ml-2">
                                    ({permission.name})
                                  </span>
                                </Label>
                              </div>
                            ))}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleUpdateRole} 
                  className="w-full btn-primary"
                  disabled={loading || permissionsLoading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Role"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Roles Table */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Roles
            </CardTitle>
            <CardDescription>
              {filteredRoles.length} of {roles.length} roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading roles...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((role) => (
                    <TableRow key={role._id}>
                      <TableCell className="font-medium">
                        {role.name}
                        {role.isSystemRole && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            System
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {role.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{role.userCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 3).map((permission) => (
                            <Badge key={permission._id} variant="secondary" className="text-xs">
                              {permission.name}
                            </Badge>
                          ))}
                          {role.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            role.isActive ? "status-active" : "status-inactive"
                          }
                        >
                          {role.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(role.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={loading}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleEditRole(role)}
                              // disabled={role.isSystemRole}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="w-4 h-4 mr-2" />
                              View Users
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteRole(role._id)}
                              className="text-destructive"
                              disabled={role.userCount > 0 || role.isSystemRole || loading}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}