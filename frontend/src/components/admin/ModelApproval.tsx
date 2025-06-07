'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ShieldCheck, 
  ShieldX, 
  Clock, 
  Eye, 
  CheckCircle, 
  XCircle, 
  RefreshCw 
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

interface PendingModel {
  id: number;
  name: string;
  description?: string;
  framework: string;
  owner_username: string;
  created_at: string;
  task_type?: string;
}

interface ModelApprovalResponse {
  id: number;
  name: string;
  status: string;
  deployment_status: string;
  owner_username: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
}

export function ModelApproval() {
  const [pendingModels, setPendingModels] = useState<PendingModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<PendingModel | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPendingModels();
  }, []);

  const loadPendingModels = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/models/pending');
      setPendingModels(response.data);
    } catch (error) {
      toast.error('Failed to load pending models');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async () => {
    if (!selectedModel) return;

    try {
      setProcessing(true);
      const response = await apiClient.post('/admin/models/approve', {
        model_id: selectedModel.id,
        action,
        notes
      });

      // Remove the model from pending list
      setPendingModels(pendingModels.filter(model => model.id !== selectedModel.id));
      
      toast.success(`Model ${action}d successfully`);
      setShowApprovalDialog(false);
      setSelectedModel(null);
      setNotes('');
    } catch (error) {
      toast.error(`Failed to ${action} model`);
    } finally {
      setProcessing(false);
    }
  };

  const openApprovalDialog = (model: PendingModel, approvalAction: 'approve' | 'reject') => {
    setSelectedModel(model);
    setAction(approvalAction);
    setNotes('');
    setShowApprovalDialog(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Model Approval Queue
          </CardTitle>
          <CardDescription>
            Review and approve or reject submitted models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-gray-600">
                {pendingModels.length} models pending approval
              </span>
            </div>
            <Button onClick={loadPendingModels} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Framework</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                      Loading pending models...
                    </TableCell>
                  </TableRow>
                ) : pendingModels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                        <span>No models pending approval</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingModels.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{model.name}</div>
                          {model.description && (
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {model.description}
                            </div>
                          )}
                          {model.task_type && (
                            <Badge variant="outline" className="text-xs">
                              {model.task_type}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800">
                          {model.framework}
                        </Badge>
                      </TableCell>
                      <TableCell>{model.owner_username}</TableCell>
                      <TableCell>
                        {new Date(model.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openApprovalDialog(model, 'approve')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openApprovalDialog(model, 'reject')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {action === 'approve' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              {action === 'approve' ? 'Approve' : 'Reject'} Model
            </DialogTitle>
            <DialogDescription>
              {action === 'approve' 
                ? `Approve "${selectedModel?.name}" for deployment`
                : `Reject "${selectedModel?.name}" and prevent deployment`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {selectedModel && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Model Details</Label>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <div><strong>Name:</strong> {selectedModel.name}</div>
                    <div><strong>Framework:</strong> {selectedModel.framework}</div>
                    <div><strong>Owner:</strong> {selectedModel.owner_username}</div>
                    {selectedModel.task_type && (
                      <div><strong>Task Type:</strong> {selectedModel.task_type}</div>
                    )}
                    {selectedModel.description && (
                      <div><strong>Description:</strong> {selectedModel.description}</div>
                    )}
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="notes">
                    {action === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason'}
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder={
                      action === 'approve' 
                        ? "Add any notes about the approval..."
                        : "Please explain why this model is being rejected..."
                    }
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowApprovalDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApproval}
              disabled={processing || (action === 'reject' && !notes.trim())}
              variant={action === 'approve' ? "default" : "destructive"}
            >
              {processing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {action === 'approve' ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  {action === 'approve' ? 'Approve' : 'Reject'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}