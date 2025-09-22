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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { useUser } from "@/contexts/UserContext";
import { FileText, Plus, MoreHorizontal, Edit, Trash2, Search, Eye, User, Loader2, RefreshCw, Globe, Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { postAPI, handleApiError } from "@/services/api";

interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  tags: string[];
  excerpt?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  meta?: {
    pagination?: {
      page: number;
      totalPages: number;
      totalItems: number;
      limit: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export default function Posts() {
  const { hasPermission, user } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    tags: [] as string[],
    status: "draft" as "draft" | "published" | "archived",
  });
  const [editPost, setEditPost] = useState({
    title: "",
    content: "",
    tags: [] as string[],
    status: "draft" as "draft" | "published" | "archived",
  });
  const { toast } = useToast();

  // Fetch posts from backend
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await postAPI.getPosts({
        page: 1,
        limit: 100,
        search: searchTerm || undefined,
      });
      
      if (response.data.success) {
        setPosts(Array.isArray(response.data.data) ? response.data.data : []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch posts');
      }
    } catch (error: any) {
      const errorInfo = handleApiError(error);
      console.error('Error fetching posts:', error);
      
      // Don't show error toast if it's just a 401 (user not logged in)
      if (errorInfo.status !== 401) {
        toast({
          title: "Error Loading Posts",
          description: errorInfo.message,
          variant: "destructive",
        });
      }
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Load posts on component mount and when search term changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPosts();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreate = hasPermission("post.create");
  const canUpdate = hasPermission("post.update");
  const canDelete = hasPermission("post.delete");

  const handleCreatePost = async () => {
    if (!canCreate) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create posts",
        variant: "destructive",
      });
      return;
    }

    if (!newPost.title || !newPost.content) {
      toast({
        title: "Validation Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      const response = await postAPI.createPost({
        title: newPost.title,
        content: newPost.content,
        tags: newPost.tags,
        status: newPost.status,
      });

      if (response.data.success) {
        const statusMessage = newPost.status === "published" 
          ? " and published successfully" 
          : newPost.status === "archived" 
          ? " and archived" 
          : " as draft";
        
        toast({
          title: "Post Created",
          description: `Post "${newPost.title}" has been created${statusMessage}`,
        });
        setNewPost({ title: "", content: "", tags: [], status: "draft" });
        setIsCreateDialogOpen(false);
        // Refresh the posts list
        fetchPosts();
      } else {
        throw new Error(response.data.message || 'Failed to create post');
      }
    } catch (error: any) {
      const errorInfo = handleApiError(error);
      toast({
        title: "Error Creating Post",
        description: errorInfo.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdatePost = async () => {
    if (!canUpdate) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to update posts",
        variant: "destructive",
      });
      return;
    }

    if (!editPost.title || !editPost.content || !selectedPost) {
      toast({
        title: "Validation Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setEditing(true);
      const response = await postAPI.updatePost(selectedPost.id, {
        title: editPost.title,
        content: editPost.content,
        tags: editPost.tags,
        status: editPost.status,
      });

      if (response.data.success) {
        const statusChanged = selectedPost?.status !== editPost.status;
        const statusMessage = statusChanged 
          ? ` Status changed from "${selectedPost?.status}" to "${editPost.status}".`
          : "";
        
        toast({
          title: "Post Updated",
          description: `Post "${editPost.title}" has been updated successfully.${statusMessage}`,
        });
        setEditPost({ title: "", content: "", tags: [], status: "draft" });
        setSelectedPost(null);
        setIsEditDialogOpen(false);
        // Refresh the posts list
        fetchPosts();
      } else {
        throw new Error(response.data.message || 'Failed to update post');
      }
    } catch (error: any) {
      const errorInfo = handleApiError(error);
      toast({
        title: "Error Updating Post",
        description: errorInfo.message,
        variant: "destructive",
      });
    } finally {
      setEditing(false);
    }
  };

  const openEditDialog = (post: Post) => {
    setSelectedPost(post);
    setEditPost({
      title: post.title,
      content: post.content,
      tags: post.tags || [],
      status: post.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleToggleStatus = async (post: Post) => {
    if (!canUpdate) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to update posts",
        variant: "destructive",
      });
      return;
    }

    const newStatus = post.status === "published" ? "draft" : "published";
    
    try {
      const response = await postAPI.updatePost(post.id, {
        title: post.title,
        content: post.content,
        tags: post.tags,
        status: newStatus,
      });

      if (response.data.success) {
        toast({
          title: "Status Updated",
          description: `Post "${post.title}" ${newStatus === "published" ? "published" : "moved to draft"}`,
        });
        // Refresh the posts list
        fetchPosts();
      } else {
        throw new Error(response.data.message || 'Failed to update post status');
      }
    } catch (error: any) {
      const errorInfo = handleApiError(error);
      toast({
        title: "Error Updating Status",
        description: errorInfo.message,
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!canDelete) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete posts",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setDeleting(id);
      const response = await postAPI.deletePost(id);
      
      if (response.data.success) {
        toast({
          title: "Post Deleted",
          description: "Post has been removed successfully",
        });
        // Refresh the posts list
        fetchPosts();
      } else {
        throw new Error(response.data.message || 'Failed to delete post');
      }
    } catch (error: any) {
      const errorInfo = handleApiError(error);
      toast({
        title: "Error Deleting Post",
        description: errorInfo.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      published: "status-active",
      draft: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      archived: "bg-gray-100 text-gray-800 border border-gray-200",
    };
    return colors[status] || "status-inactive";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <DashboardLayout title="Posts" subtitle="Content management and testing RBAC permissions">
      <div className="space-y-6">
        {/* Role Switcher */}
        <RoleSwitcher />

        {/* Permission Notice */}
        <Card className="dashboard-card border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <FileText className="h-5 w-5" />
              <div>
                <p className="font-medium">RBAC Test Module</p>
                <p className="text-sm text-blue-700">
                  This module demonstrates role-based access control. Your permissions: {" "}
                  {user?.role?.permissions?.slice(0, 3).map((permission, index) => (
                    <Badge key={permission._id} variant="secondary" className="text-xs mr-1">
                      {permission.name}
                    </Badge>
                  )) || (
                    <Badge variant="secondary" className="text-xs mr-1 text-gray-500">
                      No permissions
                    </Badge>
                  )}
                  {user?.role?.permissions && user.role.permissions.length > 3 && (
                    <Badge variant="secondary" className="text-xs mr-1">
                      +{user.role.permissions.length - 3} more
                    </Badge>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchPosts}
              disabled={loading}
              title="Refresh posts"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="btn-primary" 
                disabled={!canCreate || creating}
                title={!canCreate ? "You don't have permission to create posts" : ""}
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {creating ? "Creating..." : "Create Post"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
                <DialogDescription>
                  Write a new post to test the RBAC system. You can save it as a draft or publish it immediately.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="post-title">Title</Label>
                  <Input
                    id="post-title"
                    placeholder="Enter post title..."
                    value={newPost.title}
                    onChange={(e) =>
                      setNewPost({ ...newPost, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="post-content">Content</Label>
                  <Textarea
                    id="post-content"
                    placeholder="Write your post content here..."
                    value={newPost.content}
                    onChange={(e) =>
                      setNewPost({ ...newPost, content: e.target.value })
                    }
                    rows={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="post-status">Status</Label>
                  <Select value={newPost.status} onValueChange={(value: "draft" | "published" | "archived") => setNewPost({ ...newPost, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-post-status">Status</Label>
                  <Select value={editPost.status} onValueChange={(value: "draft" | "published" | "archived") => setEditPost({ ...editPost, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreatePost} 
                    className="btn-primary flex-1"
                    disabled={creating}
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Post"
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Post Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
              <DialogDescription>
                Update the post content and settings. You can change the status to publish, archive, or save as draft.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-post-title">Title</Label>
                <Input
                  id="edit-post-title"
                  placeholder="Enter post title..."
                  value={editPost.title}
                  onChange={(e) =>
                    setEditPost({ ...editPost, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-post-content">Content</Label>
                <Textarea
                  id="edit-post-content"
                  placeholder="Write your post content here..."
                  value={editPost.content}
                  onChange={(e) =>
                    setEditPost({ ...editPost, content: e.target.value })
                  }
                  rows={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-post-status">Status</Label>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getStatusColor(selectedPost?.status || "draft")}>
                    Current: {selectedPost?.status ? selectedPost.status.charAt(0).toUpperCase() + selectedPost.status.slice(1) : "Draft"}
                  </Badge>
                </div>
                <Select value={editPost.status} onValueChange={(value: "draft" | "published" | "archived") => setEditPost({ ...editPost, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleUpdatePost} 
                  className="btn-primary flex-1"
                  disabled={editing}
                >
                  {editing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Post"
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedPost(null);
                    setEditPost({ title: "", content: "", tags: [], status: "draft" });
                  }}
                  disabled={editing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Posts Table */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Content Posts
            </CardTitle>
            <CardDescription>
              {filteredPosts.length} of {posts.length} posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading posts...</span>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "No posts found matching your search." : "No posts available."}
              </div>
            ) : (
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Post</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium mb-1">{post.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {truncateContent(post.content)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {getInitials(post.author.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{post.author.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {post.author.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(post.status)}>
                        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span>{post.viewCount}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(post.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(post.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openEditDialog(post)}
                            disabled={!canUpdate}
                            title={!canUpdate ? "You don't have permission to edit posts" : ""}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(post)}
                            disabled={!canUpdate}
                            title={!canUpdate ? "You don't have permission to update posts" : ""}
                          >
                            {post.status === "published" ? (
                              <>
                                <Archive className="w-4 h-4 mr-2" />
                                Move to Draft
                              </>
                            ) : (
                              <>
                                <Globe className="w-4 h-4 mr-2" />
                                Publish
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeletePost(post.id)}
                            className="text-destructive"
                            disabled={!canDelete || deleting === post.id}
                            title={!canDelete ? "You don't have permission to delete posts" : ""}
                          >
                            {deleting === post.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            {deleting === post.id ? "Deleting..." : "Delete"}
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