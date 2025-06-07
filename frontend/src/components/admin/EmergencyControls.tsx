"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Shield,
  ShieldOff,
  UserX,
  UserCheck,
  Zap,
  RefreshCw,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

interface EmergencyAction {
  action: "disable" | "enable" | "suspend_user" | "unsuspend_user";
  target_id: number;
  reason: string;
  duration_hours?: number;
}

export function EmergencyControls() {
  const [showDialog, setShowDialog] = useState(false);
  const [action, setAction] = useState<EmergencyAction["action"]>("disable");
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleEmergencyAction = async () => {
    if (!targetId || !reason.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setProcessing(true);

      const payload: EmergencyAction = {
        action,
        target_id: parseInt(targetId),
        reason: reason.trim(),
      };

      if (durationHours) {
        payload.duration_hours = parseInt(durationHours);
      }

      const response = await apiClient.post("/admin/emergency", payload);

      toast.success(response.data.message);
      setShowDialog(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Emergency action failed");
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setTargetId("");
    setReason("");
    setDurationHours("");
    setAction("disable");
  };

  const getActionConfig = (actionType: EmergencyAction["action"]) => {
    switch (actionType) {
      case "disable":
        return {
          title: "Emergency Disable Model",
          description: "Immediately disable a model from deployment",
          icon: ShieldOff,
          color: "text-red-600",
          targetLabel: "Model ID",
          targetPlaceholder: "Enter model ID to disable",
        };
      case "enable":
        return {
          title: "Re-enable Model",
          description: "Re-enable a previously disabled model",
          icon: Shield,
          color: "text-green-600",
          targetLabel: "Model ID",
          targetPlaceholder: "Enter model ID to enable",
        };
      case "suspend_user":
        return {
          title: "Suspend User Account",
          description: "Suspend user account and disable all their models",
          icon: UserX,
          color: "text-red-600",
          targetLabel: "User ID",
          targetPlaceholder: "Enter user ID to suspend",
        };
      case "unsuspend_user":
        return {
          title: "Unsuspend User Account",
          description: "Reactivate a suspended user account",
          icon: UserCheck,
          color: "text-green-600",
          targetLabel: "User ID",
          targetPlaceholder: "Enter user ID to unsuspend",
        };
    }
  };

  const currentConfig = getActionConfig(action);
  const IconComponent = currentConfig.icon;

  return (
    <div className="space-y-6">
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Emergency Controls
          </CardTitle>
          <CardDescription className="text-red-600">
            Use these controls only in emergency situations. All actions are
            logged and audited.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2 border-red-200 hover:bg-red-50"
              onClick={() => {
                setAction("disable");
                setShowDialog(true);
              }}
            >
              <ShieldOff className="h-6 w-6 text-red-600" />
              <span className="text-sm">Disable Model</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2 border-green-200 hover:bg-green-50"
              onClick={() => {
                setAction("enable");
                setShowDialog(true);
              }}
            >
              <Shield className="h-6 w-6 text-green-600" />
              <span className="text-sm">Enable Model</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2 border-red-200 hover:bg-red-50"
              onClick={() => {
                setAction("suspend_user");
                setShowDialog(true);
              }}
            >
              <UserX className="h-6 w-6 text-red-600" />
              <span className="text-sm">Suspend User</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2 border-green-200 hover:bg-green-50"
              onClick={() => {
                setAction("unsuspend_user");
                setShowDialog(true);
              }}
            >
              <UserCheck className="h-6 w-6 text-green-600" />
              <span className="text-sm">Unsuspend User</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Action Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Emergency Action Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-red-700">
                When to Use Emergency Controls:
              </h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Security vulnerabilities discovered in models</li>
                <li>• Malicious or harmful content detected</li>
                <li>• Copyright infringement reports</li>
                <li>• User account compromise</li>
                <li>• System abuse or spam</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-blue-700">
                Best Practices:
              </h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Always provide detailed reasons</li>
                <li>• Document the incident thoroughly</li>
                <li>• Notify affected users when appropriate</li>
                <li>• Review actions with team leads</li>
                <li>• Follow up with permanent solutions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Action Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle
              className={`flex items-center gap-2 ${currentConfig.color}`}
            >
              <IconComponent className="h-5 w-5" />
              {currentConfig.title}
            </DialogTitle>
            <DialogDescription>{currentConfig.description}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="target-id">{currentConfig.targetLabel}</Label>
              <Input
                id="target-id"
                type="number"
                placeholder={currentConfig.targetPlaceholder}
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
              />
            </div>

            {(action === "suspend_user" || action === "disable") && (
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (hours) - Optional</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="Leave empty for indefinite"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="reason">
                Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Provide a detailed reason for this emergency action..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>Warning:</strong> This action will be executed
                  immediately and logged for audit purposes. Make sure you have
                  the correct ID and a valid reason.
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                resetForm();
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEmergencyAction}
              disabled={processing || !targetId || !reason.trim()}
              variant={
                action.includes("suspend") || action === "disable"
                  ? "destructive"
                  : "default"
              }
            >
              {processing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <IconComponent className="h-4 w-4 mr-2" />
                  Execute Action
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
