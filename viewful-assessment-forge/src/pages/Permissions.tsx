import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Key, Plus, MoreHorizontal, Edit, Trash2, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { permissionAPI, handleApiError } from "@/services/api";

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  isSystemPermission: boolean;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PermissionResponse {
  success: boolean;
  data: Permission[];
  message: string;
  meta?: {
    pagination: {
      page: number;
      totalPages: number;
      totalItems: number;
      limit: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}



export default function Permissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [newPermission, setNewPermission] = useState({
    name: "",
    description: "",
  });
  const { toast } = useToast();

  // Fetch permissions from API
  const fetchPermissions = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const response = await permissionAPI.getPermissions({
        page,
        limit: 20,
        search,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      if (response.data.success) {
        setPermissions(response.data.data);
        if (response.data.meta?.pagination) {
          const pagination = response.data.meta.pagination;
          setCurrentPage(pagination.page);
          setTotalPages(pagination.totalPages);
          setTotalItems(pagination.totalItems);
        }
      }
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

  // Load permissions on component mount and when search changes
  useEffect(() => {
    fetchPermissions(currentPage, searchTerm);
  }, [currentPage]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setCurrentPage(1);
      fetchPermissions(1, searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const filteredPermissions = permissions;

  const handleCreatePermission = async () => {
    if (!newPermission.name || !newPermission.description) {
      toast({
        title: "Validation Error",
        description: "Permission name and description are required",
        variant: "destructive",
      });
      return;
    }

    // Validate name format (resource.action)
    if (!newPermission.name.includes('.') || newPermission.name.split('.').length !== 2) {
      toast({
        title: "Validation Error",
        description: "Permission name must follow format: resource.action (e.g., post.create)",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      const response = await permissionAPI.createPermission(newPermission);
      
      if (response.data.success) {
        setNewPermission({ name: "", description: "" });
        setIsCreateDialogOpen(false);
        await fetchPermissions(currentPage, searchTerm);
        
        toast({
          title: "Permission Created",
          description: `Permission "${newPermission.name}" has been created successfully`,
        });
      }
    } catch (error) {
      const apiError = handleApiError(error);
      toast({
        title: "Error",
        description: apiError.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePermission = async (id: string, name: string) => {
    if (deleting) return;

    try {
      setDeleting(id);
      const response = await permissionAPI.deletePermission(id);
      
      if (response.data.success) {
        await fetchPermissions(currentPage, searchTerm);
        toast({
          title: "Permission Deleted",
          description: `Permission "${name}" has been removed from the system`,
        });
      }
    } catch (error) {
      const apiError = handleApiError(error);
      toast({
        title: "Error",
        description: apiError.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const getModuleColor = (resource: string) => {
    const colors: Record<string, string> = {
      post: "bg-blue-100 text-blue-800",
      user: "bg-green-100 text-green-800",
      role: "bg-purple-100 text-purple-800",
      permission: "bg-orange-100 text-orange-800",
      system: "bg-gray-100 text-gray-800",
    };
    return colors[resource.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  return (
    <DashboardLayout title="Permissions" subtitle="Manage system permissions">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Permission
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Permission</DialogTitle>
                <DialogDescription>
                  Define a new permission that can be assigned to roles
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Permission Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., post.create"
                    value={newPermission.name}
                    onChange={(e) =>
                      setNewPermission({ ...newPermission, name: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Use dot notation for hierarchical permissions (resource.action)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this permission allows..."
                    value={newPermission.description}
                    onChange={(e) =>
                      setNewPermission({
                        ...newPermission,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <Button 
                  onClick={handleCreatePermission} 
                  disabled={creating}
                  className="w-full btn-primary"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Permission"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Permissions Table */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              System Permissions
            </CardTitle>
            <CardDescription>
              {loading ? "Loading..." : `${totalItems} permissions found`}
              {searchTerm && !loading && ` (filtered by "${searchTerm}")`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading permissions...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permission Name</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPermissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "No permissions found matching your search" : "No permissions found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPermissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell className="font-mono text-sm font-medium">
                          {permission.name}
                        </TableCell>
                        <TableCell>
                          <Badge className={getModuleColor(permission.resource)}>
                            {permission.resource.charAt(0).toUpperCase() + permission.resource.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {permission.action.charAt(0).toUpperCase() + permission.action.slice(1)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {permission.description}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              permission.isSystemPermission 
                                ? "bg-red-100 text-red-800" 
                                : "bg-green-100 text-green-800"
                            }
                          >
                            {permission.isSystemPermission ? "System" : "Custom"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {permission.createdBy.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(permission.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" disabled={deleting === permission.id}>
                                {deleting === permission.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem disabled>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeletePermission(permission.id, permission.name)}
                                disabled={permission.isSystemPermission || deleting === permission.id}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {permission.isSystemPermission ? "Cannot Delete" : "Delete"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}