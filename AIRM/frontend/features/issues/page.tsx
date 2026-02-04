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
import { AlertCircle, CheckCircle2, Clock, Plus, Tag, User, Kanban, BarChart3, List, MessageSquare, Settings2, Check, MoreVertical, Edit, EyeOff, Trash2, ChevronLeft, ChevronRight, MoreHorizontal, Search, Circle, ChevronDown } from "lucide-react";
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
  const [availableColumns, setAvailableColumns] = useState<Array<{ id: string, name: string, color: string, description?: string }>>(() => {
    const saved = localStorage.getItem('kanban_columns');
    return saved ? JSON.parse(saved) : [
      { id: 'open', name: 'Open', color: '#10b981' },
      { id: 'in_progress', name: 'In Progress', color: '#3b82f6' },
      { id: 'closed', name: 'Closed', color: '#a855f7' },
    ];
  });

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('kanban_visible_columns');
    return saved ? JSON.parse(saved) : ['open', 'in_progress', 'closed'];
  });

  // Persist columns to localStorage
  useEffect(() => {
    localStorage.setItem('kanban_columns', JSON.stringify(availableColumns));
  }, [availableColumns]);

  useEffect(() => {
    localStorage.setItem('kanban_visible_columns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);
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
    <div className="flex flex-col h-screen overflow-hidden bg-[#f6f8fa]">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#d0d7de] shadow-sm">
        {/* Views Tabs (GitHub Style) */}
        <div className="flex items-center border-b border-gray-200 w-full px-6">
          <button
            onClick={() => setView('kanban')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${view === 'kanban' ? 'border-[#fd8c73] text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <Kanban className="h-4 w-4" />
            Board
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${view === 'list' ? 'border-[#fd8c73] text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <List className="h-4 w-4" />
            Table
          </button>
          <button
            onClick={() => setView('burnout')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${view === 'burnout' ? 'border-[#fd8c73] text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <BarChart3 className="h-4 w-4" />
            Insights
          </button>
        </div>

        {/* Filter & Action Bar */}
        <div className="flex items-center justify-between gap-3 px-6 py-3 bg-[#f6f8fa]/50 border-b border-[#d0d7de]">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Search Input - Robust Flex Layout */}
            <div className="flex items-center gap-2 px-3 py-1.5 border border-[#d0d7de] rounded-md bg-white focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 max-w-md flex-1 shadow-sm transition-all">
              <Search className="h-4 w-4 text-[#656d76] shrink-0" />
              <input
                type="text"
                placeholder="Search or create issue..."
                className="block w-full border-none outline-none text-sm bg-transparent placeholder-gray-500"
                onChange={() => loadIssues()}
              />
            </div>

            {/* Selects - Clean Custom Background Arrows */}
            <div className="flex items-center gap-2 hidden sm:flex">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-8 pl-3 pr-8 text-sm font-medium border border-[#d0d7de] bg-white hover:bg-gray-50 text-[#24292f] rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23656d76%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E')] bg-[length:10px] bg-[right_10px_center] bg-no-repeat min-w-[90px]"
              >
                <option value="all">Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="h-8 pl-3 pr-8 text-sm font-medium border border-[#d0d7de] bg-white hover:bg-gray-50 text-[#24292f] rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23656d76%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E')] bg-[length:10px] bg-[right_10px_center] bg-no-repeat min-w-[100px]"
              >
                <option value="all">Assignee</option>
                {users.map(user => (
                  <option key={user.user_id} value={user.user_id}>{user.email}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {view === 'kanban' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewColumnDialog(true)}
                  className="h-8 px-3 text-xs font-semibold bg-white border-[#d0d7de] text-[#24292f] hover:bg-[#f6f8fa] shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  New Column
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#656d76] hover:bg-[#f6f8fa]">
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 shadow-lg border-[#d0d7de]">
                    <DropdownMenuLabel className="text-xs font-bold text-[#656d76] uppercase tracking-wider">Show Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[#d0d7de]" />
                    {availableColumns.map(column => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        checked={visibleColumns.includes(column.id)}
                        className="text-sm focus:bg-[#f6f8fa] focus:text-[#24292f]"
                        onCheckedChange={(checked) => {
                          if (checked) setVisibleColumns([...visibleColumns, column.id]);
                          else setVisibleColumns(visibleColumns.filter(c => c !== column.id));
                        }}
                      >
                        {column.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {isAdmin && (
              <button
                onClick={() => setShowCreateDialog(true)}
                className="h-8 px-4 text-[13px] font-bold rounded-md shadow-sm flex items-center gap-1.5 transition-colors hover:opacity-90 active:scale-95"
                style={{
                  backgroundColor: '#2da44e',
                  color: 'white',
                  border: '1px solid rgba(27, 31, 36, 0.15)'
                }}
              >
                <Plus className="h-4 w-4" />
                <span>Create Issue</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-hidden">
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
                                {issue.assignees.map(a => a.email || 'Unknown').join(', ')}
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
            {/* Horizontal Scroll Container (Board Level) */}
            <div className="h-full overflow-x-auto overflow-y-hidden">
              <div className="flex gap-3 h-full p-6 min-w-min">
                {availableColumns.filter(col => visibleColumns.includes(col.id)).map(column => {
                  const statusIssues = issues.filter(i => i.status === column.id);
                  // GitHub-specific color mapping from screenshot with custom column support
                  const getStatusStyle = (colId: string, customColor?: string) => {
                    if (colId === 'open') return { color: 'text-[#1a7f37]', icon: AlertCircle, border: 'border-[#1a7f37]', bg: 'bg-[#1a7f37]', customHex: '#1a7f37' };
                    if (colId === 'in_progress') return { color: 'text-[#9a6700]', icon: Circle, border: 'border-[#9a6700]', bg: 'bg-[#9a6700]', customHex: '#9a6700' };
                    if (colId === 'closed') return { color: 'text-[#8250df]', icon: CheckCircle2, border: 'border-[#8250df]', bg: 'bg-[#8250df]', customHex: '#8250df' };
                    // For custom columns, use the provided color
                    if (customColor) {
                      return { color: `text-[${customColor}]`, icon: Circle, border: `border-[${customColor}]`, bg: `bg-[${customColor}]`, customHex: customColor };
                    }
                    return { color: 'text-[#656d76]', icon: Circle, border: 'border-[#d0d7de]', bg: 'bg-[#656d76]', customHex: '#656d76' };
                  };

                  const style = getStatusStyle(column.id, column.color);
                  const StatusIcon = style.icon;

                  // Mock descriptions
                  const getDescription = (colId: string) => {
                    if (colId === 'open') return "This item hasn't been started";
                    if (colId === 'in_progress') return "This is actively being worked on";
                    if (colId === 'closed') return "This has been completed";
                    return "";
                  };

                  return (
                    <div key={column.id} className="flex flex-col w-[340px] flex-shrink-0 h-full bg-[#f6f8fa] rounded-lg border border-[#d0d7de]">
                      {/* Column Header - Fixed at top */}
                      <div className="flex items-start justify-between p-3 border-b border-[#d0d7de] bg-white rounded-t-lg group">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="rounded-full border-[1.5px] w-4 h-4 flex items-center justify-center"
                              style={{ borderColor: style.customHex }}
                            >
                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: style.customHex }}
                              />
                            </div>
                            <h3 className="font-semibold text-sm text-[#24292f]">{column.name}</h3>
                            <span className="bg-[rgba(175,184,193,0.2)] text-[#24292f] px-2 py-0.5 rounded-full text-xs font-medium border border-transparent">
                              {statusIssues.length}
                            </span>
                            <div className="flex items-center gap-2 ml-2">
                              <span className="text-xs text-[#656d76] font-normal">Estimate: 0</span>
                              <span className="text-xs text-[#656d76] font-normal">•</span>
                              <span className="text-xs text-[#656d76] font-normal">Assigned: {statusIssues.filter(i => i.assignees.length > 0).length}</span>
                            </div>
                          </div>
                          <p className="text-xs text-[#656d76] font-normal pl-6 line-clamp-1">{column.description || getDescription(column.id)}</p>
                        </div>

                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-[#d0d7de]/50 rounded-md text-[#656d76]">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => {
                                setEditingColumn(column);
                                setShowEditColumnDialog(true);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this column?')) {
                                    setAvailableColumns(availableColumns.filter(c => c.id !== column.id));
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete column
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Scrollable Cards Area - Independent vertical scroll */}
                      <Droppable droppableId={column.id}>
                        {(provided, snapshot) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={`flex-1 overflow-y-auto p-3 space-y-2 column-scrollbar ${snapshot.isDraggingOver ? 'bg-[#ddf4ff]' : ''
                              }`}
                          >
                            {statusIssues.map((issue, index) => (
                              <Draggable key={issue.id} draggableId={issue.id.toString()} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{ ...provided.draggableProps.style }}
                                    className="mb-2"
                                  >
                                    <div
                                      className={`bg-white p-3 rounded-md border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group select-none relative ${snapshot.isDragging ? 'rotate-2 shadow-xl ring-1 ring-gray-900/5 z-50' : ''}`}
                                      onClick={() => navigate(`/issues/${issue.id}`)}
                                    >
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="shrink-0">
                                          <StatusIcon className="w-4 h-4" style={{ color: style.customHex }} />
                                        </div>
                                        <span className="text-xs text-gray-500 font-mono">
                                          TPF #{issue.id}
                                        </span>

                                        {/* Menu on card hover */}
                                        <div className="ml-auto opacity-0 group-hover:opacity-100">
                                          <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                        </div>
                                      </div>

                                      <h4 className="text-sm font-semibold text-[#24292f] leading-snug mb-1">
                                        {issue.title}
                                      </h4>

                                      {issue.project_name && (
                                        <div className="flex items-center gap-1 text-[10px] text-[#656d76] mb-1">
                                          <Tag className="h-2.5 w-2.5" />
                                          <span>{issue.project_name}</span>
                                        </div>
                                      )}

                                      {(issue.description || issue.recent_comment) ? (
                                        <p className="text-xs text-[#656d76] mb-3 line-clamp-2">
                                          {issue.recent_comment || issue.description}
                                        </p>
                                      ) : (
                                        <div className="mb-3" />
                                      )}

                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          {/* Labels (dot style) */}
                                          {issue.labels.length > 0 && (
                                            <div className="flex -space-x-1">
                                              {issue.labels.slice(0, 3).map(l => (
                                                <div
                                                  key={l.id}
                                                  className="w-2.5 h-2.5 rounded-full border border-white shadow-sm"
                                                  style={{ backgroundColor: l.color }}
                                                  title={l.name}
                                                />
                                              ))}
                                            </div>
                                          )}

                                          {/* Comment Count */}
                                          {(parseInt(issue.comments_count as any) > 0) && (
                                            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                                              <MessageSquare className="h-3 w-3" />
                                              <span>{issue.comments_count}</span>
                                            </div>
                                          )}
                                          {issue.assignees.length > 0 && (
                                            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium ml-1">
                                              <User className="h-3 w-3" />
                                              <span>{issue.assignees.length}</span>
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {/* Priority Indicator */}
                                          {issue.priority === 'urgent' && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}

                                          {/* Assignees */}
                                          {issue.assignees.length > 0 && (
                                            <div className="flex -space-x-1.5">
                                              {issue.assignees.map((a, i) => (
                                                <div
                                                  key={i}
                                                  className="w-5 h-5 rounded-full bg-blue-50 border-[1.5px] border-white flex items-center justify-center text-[9px] font-bold text-blue-600 overflow-hidden shadow-sm"
                                                  title={a.email}
                                                >
                                                  {a.email ? a.email[0].toUpperCase() : 'U'}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>

                      {/* Add Item Footer */}
                      <div className="p-2">
                        <button
                          onClick={() => {
                            setNewIssueStatus(column.id as any);
                            setShowCreateDialog(true);
                          }}
                          className="flex items-center gap-2 w-full px-2 py-1.5 text-gray-500 hover:text-gray-900 hover:bg-white rounded-md transition-all text-sm font-medium text-left"
                        >
                          <Plus className="h-4 w-4" />
                          Add item
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add Column Button Placeholder */}
                <div className="w-[340px] flex-shrink-0">
                  <button
                    onClick={() => setShowNewColumnDialog(true)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 text-[#24292f] hover:bg-[#f3f4f6] rounded-lg text-sm font-bold border-2 border-dashed border-[#d0d7de] hover:border-[#0969da] transition-all bg-white shadow-sm"
                  >
                    <Plus className="h-5 w-5 text-[#0969da]" />
                    <span>Create New Column</span>
                  </button>
                </div>

                {/* Spacer for right padding */}
                <div className="w-4 shrink-0" />
              </div>
              <style>{`
              /* Horizontal scrollbar for board */
              div.overflow-x-auto::-webkit-scrollbar {
                height: 10px;
              }
              div.overflow-x-auto::-webkit-scrollbar-track {
                background: transparent;
              }
              div.overflow-x-auto::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 6px;
              }
              div.overflow-x-auto::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
              
              /* Vertical scrollbar for individual columns */
              .column-scrollbar::-webkit-scrollbar {
                width: 8px;
              }
              .column-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              .column-scrollbar::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 4px;
              }
              .column-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
            `}</style>
            </div>
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

      </div> {/* End of Scrollable Content Area */}

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
    </div >
  );
}
