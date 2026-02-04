import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, MessageSquare, Tag, User, X, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import logo from "/techiemaya-logo.png";

interface Issue {
  id: number;
  title: string;
  description: string | null;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  project_name: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
}

interface Comment {
  id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user_email: string;
}

interface Activity {
  id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
  user_email: string;
}

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Assignee {
  user_id: string;
  email: string;
}

export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [issueLabels, setIssueLabels] = useState<Label[]>([]);
  const [showLabelDialog, setShowLabelDialog] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#6366f1");
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  const [availableUsers, setAvailableUsers] = useState<Assignee[]>([]);

  const [newComment, setNewComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editProjectName, setEditProjectName] = useState("");
  const [showAssigneesDropdown, setShowAssigneesDropdown] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  useEffect(() => {
    const initPage = async () => {
      if (!id) {
        navigate("/issues");
        return;
      }

      try {
        setLoading(true);
        const userData = JSON.parse(localStorage.getItem('user') || '{}');

        // Fetch everything in parallel for better performance and to avoid sequential loading
        const [issueResponse, labelsResponse, usersResponse] = await Promise.all([
          api.issues.getById(id),
          api.labels.getAll(),
          api.users.getWithRoles()
        ]) as any;

        // Process Issue Data
        const issueData = issueResponse.issue || issueResponse;
        if (!issueData || !issueData.id) {
          throw new Error("Issue not found");
        }

        setIssue(issueData);
        setEditTitle(issueData.title);
        setEditDescription(issueData.description || "");
        setEditProjectName(issueData.project_name || "");
        setAssignees((issueData.assignees || []).map((a: any) => ({
          user_id: a.user_id,
          email: a.email || 'Unknown'
        })));
        setIssueLabels(issueData.labels || []);
        setComments((issueData.comments || []).map((c: any) => ({
          ...c,
          user_email: c.email || c.user_email || 'Unknown'
        })));
        setActivities((issueData.activity || issueData.activities || []).map((a: any) => ({
          ...a,
          user_email: a.email || a.user_email || 'Unknown'
        })));

        setAvailableLabels(labelsResponse.labels || labelsResponse || []);
        setAvailableUsers((usersResponse.users || usersResponse || []).map((u: any) => ({
          user_id: u.user_id || u.id,
          email: u.email
        })));

        setIsAdmin(userData.role === 'admin');
      } catch (error: any) {
        console.error("Error loading issue details:", error);
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          toast({
            title: "Error",
            description: "Issue not found",
            variant: "destructive",
          });
          navigate("/issues");
        } else {
          toast({
            title: "Error",
            description: error.message || "Failed to load details",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [id, navigate, toast]);


  const loadIssueData = async (showLoading = false) => {
    try {
      if (!id) return;
      if (showLoading) setLoading(true);

      const issueResponse = await api.issues.getById(id) as any;
      const issueData = issueResponse.issue || issueResponse;

      if (!issueData || !issueData.id) {
        throw new Error("Issue not found");
      }

      setIssue(issueData);
      setEditTitle(issueData.title);
      setEditDescription(issueData.description || "");
      setEditProjectName(issueData.project_name || "");
      setAssignees((issueData.assignees || []).map((a: any) => ({
        user_id: a.user_id,
        email: a.email || 'Unknown'
      })));
      setIssueLabels(issueData.labels || []);
      setComments((issueData.comments || []).map((c: any) => ({
        ...c,
        user_email: c.email || c.user_email || 'Unknown'
      })));
      setActivities((issueData.activity || issueData.activities || []).map((a: any) => ({
        ...a,
        user_email: a.email || a.user_email || 'Unknown'
      })));
    } catch (error: any) {
      console.error("Error reloading issue data:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to sync data",
        variant: "destructive",
      });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const createCustomLabel = async () => {
    if (!newLabelName) {
      toast({
        title: "Error",
        description: "Label name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const newLabel = await api.labels.create({
        name: newLabelName,
        color: newLabelColor,
        description: ""
      }) as any;

      toast({
        title: "Success",
        description: `Label "${newLabelName}" created successfully`,
      });

      setNewLabelName("");
      setShowLabelDialog(false);

      // Refresh labels
      const allLabels = await api.labels.getAll() as any;
      setAvailableLabels(allLabels.labels || allLabels || []);

      // Auto-assign the new label to the current issue
      if (id) {
        await api.issues.addLabel(id, newLabel.id || newLabel.label?.id);
        await loadIssueData(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create label",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const updateIssueStatus = async (newStatus: 'open' | 'in_progress' | 'closed') => {
    try {
      await api.issues.update(id!, {
        status: newStatus,
        ...(newStatus === 'closed' ? { closed_at: new Date().toISOString() } : {})
      });

      toast({
        title: "Success",
        description: `Issue status updated to ${newStatus.replace('_', ' ')}`,
      });
      await loadIssueData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const saveIssue = async () => {
    if (!id) return;

    try {
      await api.issues.update(id, {
        title: editTitle,
        description: editDescription,
        project_name: editProjectName,
      });

      toast({
        title: "Success",
        description: "Issue updated successfully",
      });
      setIsEditing(false);
      await loadIssueData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update issue",
        variant: "destructive",
      });
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      await api.issues.addComment(id!, newComment);

      toast({
        title: "Success",
        description: "Comment added successfully",
      });

      setNewComment("");
      await loadIssueData();
      // Notifications are handled by the backend API
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  const addLabel = async (labelId: string) => {
    if (!id) return;

    try {
      await api.issues.addLabel(id, labelId);

      toast({
        title: "Success",
        description: "Label added successfully",
      });

      await loadIssueData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add label",
        variant: "destructive",
      });
    }
  };

  const removeLabel = async (labelId: string) => {
    if (!id) return;

    try {
      await api.issues.removeLabel(id, labelId);

      toast({
        title: "Success",
        description: "Label removed successfully",
      });

      await loadIssueData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove label",
        variant: "destructive",
      });
    }
  };

  const assignUser = async (userId: string) => {
    if (!id) return;

    try {
      await api.issues.assignUser(id, userId);

      toast({
        title: "Success",
        description: "User assigned successfully",
      });

      await loadIssueData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign user",
        variant: "destructive",
      });
    }
  };

  const assignMultipleUsers = async () => {
    if (!id || selectedUserIds.length === 0) return;

    try {
      await api.issues.assignUsers(id, selectedUserIds);

      toast({
        title: "Success",
        description: `${selectedUserIds.length} user(s) assigned successfully`,
      });

      setSelectedUserIds([]);
      setShowAssigneesDropdown(false);
      await loadIssueData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign users",
        variant: "destructive",
      });
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const unassignUser = async (userId: string) => {
    if (!id) return;

    try {
      await api.issues.unassignUser(id, userId);

      toast({
        title: "Success",
        description: "User unassigned successfully",
      });

      await loadIssueData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unassign user",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'closed':
        return <CheckCircle2 className="h-5 w-5 text-purple-500" />;
      default:
        return null;
    }
  };

  if (loading || !issue) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 animate-in fade-in duration-500">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-8 w-3/4" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <Skeleton className="h-10 w-24 mt-6" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 pt-4 border-t">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Skeleton */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-10 w-full mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-20" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-14" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/issues")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Issues
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Issue Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  {getStatusIcon(issue.status)}
                  <div className="flex-1">
                    {isEditing ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="text-2xl font-bold"
                      />
                    ) : (
                      <div>
                        <h1 className="text-2xl font-bold">{issue.title}</h1>
                        <p className="text-gray-500 mt-1">#{issue.id}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={6}
                      />
                    </div>
                    <div>
                      <Label>Project Name</Label>
                      <Input
                        value={editProjectName}
                        onChange={(e) => setEditProjectName(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveIssue}>Save</Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-700 whitespace-pre-wrap">{issue.description || "No description provided."}</p>
                    {isAdmin && (
                      <Button className="mt-4" variant="outline" onClick={() => setIsEditing(true)}>
                        Edit
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comments */}
            <Card id="comments-section">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comments ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-l-2 border-gray-300 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{comment.user_email}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{comment.comment}</p>
                  </div>
                ))}

                <div className="mt-4 space-y-2">
                  <Label>Add Comment</Label>
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    rows={3}
                  />
                  <Button onClick={addComment} disabled={!newComment.trim()}>
                    Comment
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-2 text-sm">
                      <span className="text-gray-500">
                        {new Date(activity.created_at).toLocaleString()}
                      </span>
                      <span className="font-semibold">{activity.user_email}</span>
                      <span>{activity.action}</span>
                      {activity.details && (
                        <span className="text-gray-600">
                          {JSON.stringify(activity.details)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    className="w-full"
                    variant={issue.status === 'open' ? 'default' : 'outline'}
                    onClick={() => updateIssueStatus('open')}
                  >
                    Open
                  </Button>
                  <Button
                    className="w-full"
                    variant={issue.status === 'in_progress' ? 'default' : 'outline'}
                    onClick={() => updateIssueStatus('in_progress')}
                  >
                    In Progress
                  </Button>
                  <Button
                    className="w-full"
                    variant={issue.status === 'closed' ? 'default' : 'outline'}
                    onClick={() => updateIssueStatus('closed')}
                  >
                    Closed
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Assignees */}
            <Card>
              <CardHeader>
                <CardTitle
                  className={`flex items-center gap-2 ${isAdmin ? 'cursor-pointer hover:text-blue-600' : ''}`}
                  onClick={() => isAdmin && setShowAssigneesDropdown(!showAssigneesDropdown)}
                >
                  <User className="h-4 w-4" />
                  Assignees
                  {isAdmin && (
                    <span className="text-xs text-gray-500 ml-auto">
                      {showAssigneesDropdown ? '▼' : '▶'}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {assignees.map((assignee) => (
                  <div key={assignee.user_id} className="flex items-center justify-between">
                    <span className="text-sm">{assignee.email}</span>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => unassignUser(assignee.user_id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                {assignees.length === 0 && !showAssigneesDropdown && (
                  <p className="text-sm text-gray-500 text-center py-2">No assignees</p>
                )}
                {/* Show Add Assignees button only for admins - always show when dropdown is closed */}
                {isAdmin && !showAssigneesDropdown && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setShowAssigneesDropdown(true)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Add Assignees
                  </Button>
                )}
                {isAdmin && showAssigneesDropdown && (
                  <div className="border rounded p-3 space-y-2 max-h-60 overflow-y-auto">
                    {availableUsers
                      .filter(u => !assignees.some(a => a.user_id === u.user_id))
                      .map(user => (
                        <label
                          key={user.user_id}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(user.user_id)}
                            onChange={() => toggleUserSelection(user.user_id)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{user.email}</span>
                        </label>
                      ))}
                    {availableUsers.filter(u => !assignees.some(a => a.user_id === u.user_id)).length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-2">No available users to assign</p>
                    )}
                    {selectedUserIds.length > 0 && (
                      <div className="pt-2 border-t">
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={assignMultipleUsers}
                        >
                          Assign {selectedUserIds.length} User{selectedUserIds.length > 1 ? 's' : ''}
                        </Button>
                      </div>
                    )}
                    <div className="pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setShowAssigneesDropdown(false);
                          setSelectedUserIds([]);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Labels */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Labels
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setShowLabelDialog(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {issueLabels.map((label) => (
                    <div
                      key={label.id}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs text-white"
                      style={{ backgroundColor: label.color }}
                    >
                      <span>{label.name}</span>
                      {isAdmin && (
                        <button onClick={() => removeLabel(label.id)}>
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {isAdmin && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addLabel(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    className="w-full p-2 border rounded text-sm"
                  >
                    <option value="">Add label...</option>
                    {availableLabels
                      .filter(l => !issueLabels.some(il => il.id === l.id))
                      .map(label => (
                        <option key={label.id} value={label.id}>
                          {label.name}
                        </option>
                      ))}
                  </select>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Priority:</span>{' '}
                  <span className="capitalize">{issue.priority}</span>
                </div>
                {issue.project_name && (
                  <div>
                    <span className="font-semibold">Project:</span> {issue.project_name}
                  </div>
                )}
                <div>
                  <span className="font-semibold">Created:</span>{' '}
                  {new Date(issue.created_at).toLocaleString()}
                </div>
                <div>
                  <span className="font-semibold">Updated:</span>{' '}
                  {new Date(issue.updated_at).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Dialog open={showLabelDialog} onOpenChange={setShowLabelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Label</DialogTitle>
            <DialogDescription>
              Create a new label and pick a color for it
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="label-name">Label Name</Label>
              <Input
                id="label-name"
                placeholder="e.g. Frontend, Critical, UI/UX"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="label-color">Label Color</Label>
              <div className="flex gap-3 items-center">
                <Input
                  id="label-color"
                  type="color"
                  className="w-12 h-10 p-1 rounded cursor-pointer"
                  value={newLabelColor}
                  onChange={(e) => setNewLabelColor(e.target.value)}
                />
                <Input
                  type="text"
                  value={newLabelColor}
                  onChange={(e) => setNewLabelColor(e.target.value)}
                  className="flex-1"
                  placeholder="#000000"
                />
              </div>
              <div className="flex gap-2 flex-wrap mt-3">
                {['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#64748b'].map(color => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110"
                    style={{ backgroundColor: color, borderColor: newLabelColor === color ? 'black' : 'white' }}
                    onClick={() => setNewLabelColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLabelDialog(false)}>Cancel</Button>
            <Button onClick={createCustomLabel}>Create & Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
