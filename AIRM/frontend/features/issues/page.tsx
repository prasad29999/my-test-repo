import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2, Clock, Plus, Tag, User, Kanban, BarChart3, List, MessageSquare, Settings2, Check, MoreVertical, Edit, EyeOff, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuLabel } from "@/components/ui/dropdown-menu";


interface Issue {
  id: number;
  title: string;
  description: string | null;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  project_name: string | null;
  created_at: string;
  created_by: string | null;
  assignees: Array<{ user_id: string; email: string }>;
  labels: Array<{ id: string; name: string; color: string }>;
  comments_count: number;
  recent_comment?: string;
}

interface Label {
  id: string;
  name: string;
  color: string;
  description: string | null;
}

interface UserProfile {
  user_id: string;
  email: string;
}

export default function Issues() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [newIssueDescription, setNewIssueDescription] = useState("");
  const [newIssueProjectName, setNewIssueProjectName] = useState("");
  const [newIssuePriority, setNewIssuePriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newIssueStatus, setNewIssueStatus] = useState<'open' | 'in_progress' | 'closed'>('open');

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [view, setView] = useState<'list' | 'kanban' | 'burnout'>('kanban');

  // Custom columns support
  const [availableColumns, setAvailableColumns] = useState<Array<{ id: string, name: string, color: string, description?: string }>>([
    { id: 'open', name: 'Open', color: '#10b981' },
    { id: 'in_progress', name: 'In Progress', color: '#3b82f6' },
    { id: 'closed', name: 'Closed', color: '#a855f7' },
  ]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['open', 'in_progress', 'closed']);
  const [showNewColumnDialog, setShowNewColumnDialog] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnColor, setNewColumnColor] = useState("#6366f1"); // Default indigo color
  const [newColumnDescription, setNewColumnDescription] = useState("");

  // Edit column support
  const [editingColumn, setEditingColumn] = useState<{ id: string, name: string, color: string, description?: string } | null>(null);
  const [showEditColumnDialog, setShowEditColumnDialog] = useState(false);

  // Expandable/Collapsible columns
  const [collapsedColumns, setCollapsedColumns] = useState<string[]>([]);


  useEffect(() => {
    const initPage = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (!userData.id) {
          navigate("/auth");
          return;
        }

        setCurrentUser(userData);

        // Fetch metrics, labels, users, issues, and auth check in parallel
        const results = await Promise.all([
          loadLabels(),
          loadUsers(),
          loadIssues(),
          api.auth.getMe()
        ]) as any;

        const currentUserData = results[3];
        setIsAdmin(currentUserData?.user?.role === 'admin' || currentUserData?.role === 'admin');
      } catch (error) {
        console.error('Error initializing page:', error);
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [navigate]);

  const loadLabels = async () => {
    try {
      const response = await api.labels.getAll() as any;
      setLabels(response.labels || response || []);
    } catch (error) {
      console.error("Error loading labels:", error);
      setLabels([]);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.users.getWithRoles() as any;
      const usersData = response.users || response || [];
      setUsers(usersData);
    } catch (error) {
      console.error("Error loading users:", error);
      setUsers([]);
    }
  };

  const loadIssues = async () => {
    try {
      const params: any = {};
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      if (filterAssignee !== 'all') {
        params.assignee = filterAssignee;
      }

      const response = await api.issues.getAll(params) as any;
      const issuesData = response.issues || response || [];

      // Transform issues to match interface
      const transformedIssues = issuesData.map((issue: any) => ({
        ...issue,
        assignees: issue.assignees || [],
        labels: issue.labels || []
      }));

      setIssues(transformedIssues);
    } catch (error) {
      console.error("Error loading issues:", error);
      toast({
        title: "Error",
        description: "Failed to load issues",
        variant: "destructive",
      });
      setIssues([]);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    // Dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Status changed
    if (destination.droppableId !== source.droppableId) {
      const issueId = parseInt(draggableId);
      const newStatus = destination.droppableId as 'open' | 'in_progress' | 'closed';

      // Optimistic update
      const updatedIssues = issues.map(issue => {
        if (issue.id === issueId) {
          return { ...issue, status: newStatus };
        }
        return issue;
      });
      setIssues(updatedIssues);

      // API call
      try {
        await api.issues.update(draggableId, { status: newStatus });
        toast({
          title: "Status Updated",
          description: `Issue moved to ${newStatus.replace('_', ' ')}`,
        });
      } catch (error) {
        console.error("Error updating issue status:", error);
        toast({
          title: "Error",
          description: "Failed to update status",
          variant: "destructive",
        });
        // Revert on error (could reload from server)
        await loadIssues();
      }
    }
  };

  const createIssue = async () => {
    if (!newIssueTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter an issue title",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await api.issues.create({
        title: newIssueTitle,
        description: newIssueDescription,
        project_name: newIssueProjectName,
        priority: newIssuePriority,
        status: newIssueStatus
      }) as any;

      toast({
        title: "Success",
        description: "Issue created successfully",
      });

      setShowCreateDialog(false);
      setNewIssueTitle("");
      setNewIssueDescription("");
      setNewIssueProjectName("");
      setNewIssuePriority('medium');
      setNewIssueStatus('open');
      await loadIssues();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create issue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'closed':
        return <CheckCircle2 className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 font-bold';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-gray-500';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 animate-in fade-in duration-500">
        <div className="max-w-full mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <Skeleton className="h-10 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-32" />
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-9 w-64" />
              <div className="flex gap-4">
                <Skeleton className="h-14 flex-1" />
                <Skeleton className="h-14 flex-1" />
                <Skeleton className="h-14 w-40" />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Issues</h1>
          {view === 'kanban' && (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white">
                    <Plus className="h-4 w-4 mr-2" />
                    New Column
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    setNewIssueStatus('open');
                    setShowCreateDialog(true);
                  }}>
                    Create New Issue
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white">
                    <Settings2 className="h-4 w-4 mr-2" />
                    View Options
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {['open', 'in_progress', 'closed'].map(status => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={visibleColumns.includes(status)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setVisibleColumns([...visibleColumns, status]);
                        } else {
                          setVisibleColumns(visibleColumns.filter(c => c !== status));
                        }
                      }}
                    >
                      <span className="capitalize">{status.replace('_', ' ')}</span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Filters and Create Button */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setView('list')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    <List className="h-4 w-4" />
                    List
                  </button>
                  <button
                    onClick={() => setView('kanban')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    <Kanban className="h-4 w-4" />
                    Kanban board
                  </button>
                  <button
                    onClick={() => setView('burnout')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'burnout' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Burnout
                  </button>
                </div>
              </div>

              <div className="flex gap-4 items-center flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <Label>Status</Label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <Label>Assignee</Label>
                  <select
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="all">All Assignees</option>
                    {users.map(user => (
                      <option key={user.user_id} value={user.user_id}>{user.email}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 items-end">
                  <Button onClick={loadIssues}>
                    Apply Filters
                  </Button>
                  {isAdmin && (
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Issue
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Issues List */}
        {/* Content View */}
        {view === 'list' && (
          <Card>
            <CardHeader>
              <CardTitle>
                {filterStatus === 'all' ? 'All Issues' : `${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Issues`} ({issues.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {issues.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No issues found</p>
                  {isAdmin && (
                    <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                      Create First Issue
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/issues/${issue.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getStatusIcon(issue.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg">
                              {issue.title}
                            </h3>
                            <span className="text-gray-500">#{issue.id}</span>
                            {issue.labels.map((label) => (
                              <span
                                key={label.id}
                                className="px-2 py-1 rounded text-xs text-white"
                                style={{ backgroundColor: label.color }}
                              >
                                {label.name}
                              </span>
                            ))}
                            <span className={`text-xs uppercase ${getPriorityColor(issue.priority)}`}>
                              {issue.priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="capitalize">{issue.status.replace('_', ' ')}</span>
                            {issue.project_name && (
                              <span className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {issue.project_name}
                              </span>
                            )}
                            {issue.assignees.length > 0 && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {issue.assignees.map(a => a.email).join(', ')}
                              </span>
                            )}
                            <span>
                              Created {new Date(issue.created_at).toLocaleDateString()}
                            </span>
                            {parseInt(issue.comments_count as any) > 0 && (
                              <span className="flex items-center gap-1 text-gray-500">
                                <MessageSquare className="h-3 w-3" />
                                {issue.comments_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {view === 'kanban' && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="relative -mx-6 px-6">
              <div className="overflow-x-auto overflow-y-hidden pb-4 kanban-container">
                <div className="flex gap-4 w-full">
                  {availableColumns.filter(col => visibleColumns.includes(col.id)).map(column => {
                    const statusIssues = issues.filter(i => i.status === column.id);
                    const isCollapsed = collapsedColumns.includes(column.id);

                    if (isCollapsed) {
                      return (
                        <div key={column.id} className="bg-gray-50 rounded-lg p-2 w-[52px] flex flex-col shrink-0 border border-gray-200 h-[calc(100vh-240px)] transition-all duration-300 items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 mb-4 hover:bg-gray-200"
                            onClick={() => setCollapsedColumns(collapsedColumns.filter(id => id !== column.id))}
                            title="Expand column"
                          >
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          </Button>
                          <div className="flex-1 flex items-center justify-center [writing-mode:vertical-lr] rotate-180">
                            <h3 className="font-semibold text-sm flex items-center gap-2 text-gray-400 whitespace-nowrap">
                              <span>{column.name}</span>
                              <span className="bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full text-xs font-medium [writing-mode:horizontal-tb] rotate-180">
                                {statusIssues.length}
                              </span>
                            </h3>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={column.id} className="bg-gray-50 rounded-lg p-3 w-[calc((100%-32px)/3)] min-w-[320px] flex flex-col shrink-0 border border-gray-200 h-[calc(100vh-240px)] transition-all duration-300">
                        <div className="flex items-center justify-between mb-3 pb-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-gray-200 mr-1"
                              onClick={() => setCollapsedColumns([...collapsedColumns, column.id])}
                              title="Collapse column"
                            >
                              <ChevronLeft className="h-4 w-4 text-gray-500" />
                            </Button>
                            <h3 className="font-semibold text-sm flex items-center gap-2 text-gray-700">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }}></div>
                              <span>{column.name}</span>
                              <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                                {statusIssues.length}
                              </span>
                            </h3>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-200">
                                <MoreVertical className="h-4 w-4 text-gray-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Column</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setEditingColumn(column);
                                setShowEditColumnDialog(true);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setVisibleColumns(visibleColumns.filter(c => c !== column.id));
                                toast({
                                  title: "Column Hidden",
                                  description: `"${column.name}" has been hidden`,
                                });
                              }}>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Hide from view
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  if (availableColumns.length <= 1) {
                                    toast({
                                      title: "Cannot Delete",
                                      description: "You must have at least one column",
                                      variant: "destructive",
                                    });
                                    return;
                                  }

                                  setAvailableColumns(availableColumns.filter(c => c.id !== column.id));
                                  setVisibleColumns(visibleColumns.filter(c => c !== column.id));
                                  toast({
                                    title: "Column Deleted",
                                    description: `"${column.name}" has been deleted`,
                                  });
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <Droppable droppableId={column.id}>
                          {(provided, snapshot) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className={`space-y-2 flex-1 overflow-y-auto column-scrollbar transition-colors rounded-md ${snapshot.isDraggingOver ? 'bg-gray-100/50' : ''
                                }`}
                            >
                              {statusIssues.length === 0 && !snapshot.isDraggingOver && (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                  No issues
                                </div>
                              )}

                              {statusIssues.map((issue, index) => (
                                <Draggable key={issue.id} draggableId={issue.id.toString()} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      style={{ ...provided.draggableProps.style }}
                                      className={snapshot.isDragging ? 'opacity-90 rotate-1 z-50' : ''}
                                    >
                                      <Card className="cursor-pointer hover:shadow-md transition-all hover:border-gray-400 group bg-white" onClick={() => navigate(`/issues/${issue.id}`)}>
                                        <CardContent className="p-3">
                                          <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border tracking-wider ${issue.priority === 'urgent' ? 'border-red-200 bg-red-50 text-red-700' :
                                              issue.priority === 'high' ? 'border-orange-200 bg-orange-50 text-orange-700' :
                                                issue.priority === 'medium' ? 'border-yellow-200 bg-yellow-50 text-yellow-700' :
                                                  'border-gray-200 bg-gray-50 text-gray-600'
                                              }`}>{issue.priority}</span>
                                          </div>
                                          <h4 className="font-medium text-sm mb-2 text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">{issue.title}</h4>
                                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                                            {issue.labels.map(l => (
                                              <div key={l.id} className="w-2 h-2 rounded-full ring-1 ring-white" style={{ backgroundColor: l.color }} title={l.name}></div>
                                            ))}
                                            <span className="text-xs text-gray-400 ml-auto">#{issue.id}</span>
                                          </div>
                                          {parseInt(issue.comments_count as any) > 0 && (
                                            <div className="flex flex-col gap-1 w-full mt-2 border-t pt-2 max-w-full">
                                              {issue.recent_comment && (
                                                <p className="text-xs text-gray-500 truncate italic">"{issue.recent_comment}"</p>
                                              )}
                                              <div className="flex items-center gap-1 text-gray-400 text-xs ml-auto">
                                                <MessageSquare className="h-3 w-3" />
                                                {issue.comments_count}
                                              </div>
                                            </div>
                                          )}
                                        </CardContent>
                                      </Card>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>

                        <button
                          onClick={() => {
                            setNewIssueStatus(column.id as any);
                            setShowCreateDialog(true);
                          }}
                          className="mt-2 flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors py-1.5 px-2 hover:bg-gray-100 rounded-md text-sm font-medium w-full text-left border border-transparent hover:border-gray-300"
                        >
                          <Plus className="h-4 w-4" />
                          Add item
                        </button>
                      </div>
                    );
                  })}
                  <div className="shrink-0 w-[280px]">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-gray-500 hover:bg-gray-100 h-auto py-2 text-sm font-medium border border-dashed border-gray-300 hover:border-gray-400"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          New column
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuItem onClick={() => setShowNewColumnDialog(true)} className="font-medium">
                          <Plus className="h-4 w-4 mr-2" />
                          Create new column
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {availableColumns.map(column => (
                          <DropdownMenuCheckboxItem
                            key={column.id}
                            checked={visibleColumns.includes(column.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setVisibleColumns([...visibleColumns, column.id]);
                              } else {
                                if (visibleColumns.length > 1) {
                                  setVisibleColumns(visibleColumns.filter(c => c !== column.id));
                                } else {
                                  toast({
                                    title: "Cannot hide column",
                                    description: "At least one column must be visible",
                                    variant: "destructive",
                                  });
                                }
                              }
                            }}
                          >
                            <span>{column.name}</span>
                          </DropdownMenuCheckboxItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-gray-500">Hidden columns</DropdownMenuLabel>
                        {availableColumns.filter(col => !visibleColumns.includes(col.id)).length === 0 && (
                          <DropdownMenuItem disabled className="text-xs">
                            No hidden columns
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
            <style>{`
              .kanban-container {
                scrollbar-width: thin;
                scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
              }
              
              .kanban-container::-webkit-scrollbar {
                height: 8px;
              }
              
              .kanban-container::-webkit-scrollbar-track {
                background: transparent;
                border-radius: 10px;
              }
              
              .kanban-container::-webkit-scrollbar-thumb {
                background-color: rgba(156, 163, 175, 0.5);
                border-radius: 10px;
                border: 2px solid transparent;
                background-clip: content-box;
              }
              
              .kanban-container::-webkit-scrollbar-thumb:hover {
                background-color: rgba(107, 114, 128, 0.8);
              }
              
              .column-scrollbar::-webkit-scrollbar {
                width: 10px;
              }
              
              .column-scrollbar::-webkit-scrollbar-track {
                background: #e5e7eb;
                border-radius: 10px;
                margin: 4px 0;
              }
              
              .column-scrollbar::-webkit-scrollbar-thumb {
                background-color: #9ca3af;
                border-radius: 10px;
                border: 2px solid #e5e7eb;
              }
              
              .column-scrollbar::-webkit-scrollbar-thumb:hover {
                background-color: #6b7280;
              }
              
              /* Firefox scrollbar */
              .column-scrollbar {
                scrollbar-width: thin;
                scrollbar-color: #9ca3af #e5e7eb;
              }
            `}</style>
          </DragDropContext>
        )}

        {view === 'burnout' && (
          <Card>
            <CardHeader>
              <CardTitle>Burnout / Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Status Distribution */}
                <div className="border rounded-lg p-6">
                  <h3 className="font-semibold mb-6 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                    Issue Status Distribution
                  </h3>
                  <div className="flex items-end justify-around h-64 gap-4">
                    {['open', 'in_progress', 'closed'].map(status => {
                      const count = issues.filter(i => i.status === status).length;
                      const max = Math.max(issues.length, 1); // Avoid div by zero
                      const height = Math.round((count / max) * 100);
                      return (
                        <div key={status} className="flex flex-col items-center justify-end h-full w-full">
                          <div className="w-full max-w-[60px] bg-blue-500 rounded-t-md relative group transition-all duration-500" style={{ height: `${height === 0 ? 1 : height}%` }}>
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              {count} Issues
                            </div>
                          </div>
                          <p className="mt-2 text-sm font-medium capitalize text-gray-600">{status.replace('_', ' ')}</p>
                          <p className="text-xs text-gray-400">{count} ({Math.round(count / max * 100)}%)</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Priority Breakout */}
                <div className="border rounded-lg p-6">
                  <h3 className="font-semibold mb-6 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-orange-500" />
                    Workload by Priority
                  </h3>
                  <div className="space-y-4">
                    {['urgent', 'high', 'medium', 'low'].map(priority => {
                      const count = issues.filter(i => i.priority === priority).length;
                      const percentage = Math.round((count / (issues.length || 1)) * 100);
                      return (
                        <div key={priority}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize font-medium">{priority}</span>
                            <span className="text-gray-500">{count} issues ({percentage}%)</span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${priority === 'urgent' ? 'bg-red-500' :
                                priority === 'high' ? 'bg-orange-500' :
                                  priority === 'medium' ? 'bg-yellow-500' :
                                    'bg-gray-400'
                                }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Issue Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Issue</DialogTitle>
            <DialogDescription>
              Create a new issue to track work, bugs, or feature requests
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={newIssueTitle}
                onChange={(e) => setNewIssueTitle(e.target.value)}
                placeholder="Brief description of the issue"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newIssueDescription}
                onChange={(e) => setNewIssueDescription(e.target.value)}
                placeholder="Detailed description of the issue..."
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="project">Project Name</Label>
              <Input
                id="project"
                value={newIssueProjectName}
                onChange={(e) => setNewIssueProjectName(e.target.value)}
                placeholder="e.g., VCP Automation"
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={newIssuePriority}
                onChange={(e) => setNewIssuePriority(e.target.value as any)}
                className="w-full p-2 border rounded"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createIssue} disabled={loading}>
              Create Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Column Dialog */}
      <Dialog open={showNewColumnDialog} onOpenChange={setShowNewColumnDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New option</DialogTitle>
            <DialogDescription>
              Add a custom column to organize your issues
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="columnName">Label text *</Label>
              <Input
                id="columnName"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="e.g., In Review, Testing, Done"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-2">
                {[
                  { color: '#64748b', name: 'Gray' },
                  { color: '#3b82f6', name: 'Blue' },
                  { color: '#10b981', name: 'Green' },
                  { color: '#eab308', name: 'Yellow' },
                  { color: '#f97316', name: 'Orange' },
                  { color: '#ec4899', name: 'Pink' },
                  { color: '#a855f7', name: 'Purple' },
                  { color: '#6366f1', name: 'Indigo' },
                ].map((colorOption) => (
                  <button
                    key={colorOption.color}
                    type="button"
                    onClick={() => setNewColumnColor(colorOption.color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${newColumnColor === colorOption.color
                      ? 'border-gray-900 scale-110'
                      : 'border-gray-300 hover:border-gray-400'
                      }`}
                    style={{ backgroundColor: colorOption.color }}
                    title={colorOption.name}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2 capitalize">
                {[
                  { color: '#64748b', name: 'Gray' },
                  { color: '#3b82f6', name: 'Blue' },
                  { color: '#10b981', name: 'Green' },
                  { color: '#eab308', name: 'Yellow' },
                  { color: '#f97316', name: 'Orange' },
                  { color: '#ec4899', name: 'Pink' },
                  { color: '#a855f7', name: 'Purple' },
                  { color: '#6366f1', name: 'Indigo' },
                ].find(c => c.color === newColumnColor)?.name || 'Custom'}
              </p>
            </div>

            <div>
              <Label htmlFor="columnDescription">Description</Label>
              <Textarea
                id="columnDescription"
                value={newColumnDescription}
                onChange={(e) => setNewColumnDescription(e.target.value)}
                placeholder="Visible in group headers and value pickers"
                rows={3}
                className="mt-1 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowNewColumnDialog(false);
              setNewColumnName("");
              setNewColumnColor("#6366f1");
              setNewColumnDescription("");
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!newColumnName.trim()) {
                  toast({
                    title: "Error",
                    description: "Please enter a label text",
                    variant: "destructive",
                  });
                  return;
                }

                // Create a unique ID from the column name
                const columnId = newColumnName.toLowerCase().replace(/\s+/g, '_');

                // Check if column already exists
                if (availableColumns.some(col => col.id === columnId)) {
                  toast({
                    title: "Error",
                    description: "A column with this name already exists",
                    variant: "destructive",
                  });
                  return;
                }

                // Add the new column
                const newColumn = {
                  id: columnId,
                  name: newColumnName,
                  color: newColumnColor,
                  description: newColumnDescription || undefined,
                };

                setAvailableColumns([...availableColumns, newColumn]);
                setVisibleColumns([...visibleColumns, columnId]);

                toast({
                  title: "Column Created",
                  description: `"${newColumnName}" has been added to your board`,
                });

                setShowNewColumnDialog(false);
                setNewColumnName("");
                setNewColumnColor("#6366f1");
                setNewColumnDescription("");
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Column Dialog */}
      <Dialog open={showEditColumnDialog} onOpenChange={setShowEditColumnDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit option</DialogTitle>
            <DialogDescription>
              Update the column details
            </DialogDescription>
          </DialogHeader>
          {editingColumn && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="editColumnName">Label text *</Label>
                <Input
                  id="editColumnName"
                  value={editingColumn.name}
                  onChange={(e) => setEditingColumn({ ...editingColumn, name: e.target.value })}
                  placeholder="e.g., In Review, Testing, Done"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {[
                    { color: '#64748b', name: 'Gray' },
                    { color: '#3b82f6', name: 'Blue' },
                    { color: '#10b981', name: 'Green' },
                    { color: '#eab308', name: 'Yellow' },
                    { color: '#f97316', name: 'Orange' },
                    { color: '#ec4899', name: 'Pink' },
                    { color: '#a855f7', name: 'Purple' },
                    { color: '#6366f1', name: 'Indigo' },
                  ].map((colorOption) => (
                    <button
                      key={colorOption.color}
                      type="button"
                      onClick={() => setEditingColumn({ ...editingColumn, color: colorOption.color })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${editingColumn.color === colorOption.color
                        ? 'border-gray-900 scale-110'
                        : 'border-gray-300 hover:border-gray-400'
                        }`}
                      style={{ backgroundColor: colorOption.color }}
                      title={colorOption.name}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2 capitalize">
                  {[
                    { color: '#64748b', name: 'Gray' },
                    { color: '#3b82f6', name: 'Blue' },
                    { color: '#10b981', name: 'Green' },
                    { color: '#eab308', name: 'Yellow' },
                    { color: '#f97316', name: 'Orange' },
                    { color: '#ec4899', name: 'Pink' },
                    { color: '#a855f7', name: 'Purple' },
                    { color: '#6366f1', name: 'Indigo' },
                  ].find(c => c.color === editingColumn.color)?.name || 'Custom'}
                </p>
              </div>

              <div>
                <Label htmlFor="editColumnDescription">Description</Label>
                <Textarea
                  id="editColumnDescription"
                  value={editingColumn.description || ""}
                  onChange={(e) => setEditingColumn({ ...editingColumn, description: e.target.value })}
                  placeholder="Visible in group headers and value pickers"
                  rows={3}
                  className="mt-1 resize-none"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditColumnDialog(false);
              setEditingColumn(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!editingColumn || !editingColumn.name.trim()) {
                  toast({
                    title: "Error",
                    description: "Please enter a label text",
                    variant: "destructive",
                  });
                  return;
                }

                // Update the column
                setAvailableColumns(availableColumns.map(col =>
                  col.id === editingColumn.id ? editingColumn : col
                ));

                toast({
                  title: "Column Updated",
                  description: `"${editingColumn.name}" has been updated`,
                });

                setShowEditColumnDialog(false);
                setEditingColumn(null);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
