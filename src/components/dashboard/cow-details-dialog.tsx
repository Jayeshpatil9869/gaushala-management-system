"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Database } from "@/types/database.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { Edit2, Save, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { updateCowAction } from "@/app/actions";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

type Cow = Database["public"]["Tables"]["cows"]["Row"];

interface CowDetailsDialogProps {
  cow: Cow | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CowDetailsDialog({
  cow,
  isOpen,
  onClose,
}: CowDetailsDialogProps) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const router = useRouter();

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    tracking_id: "",
    gender: "",
    health_status: "",
    source: "",
    adopter_name: "",
    notes: "",
  });

  // Initialize form data when cow changes
  useEffect(() => {
    if (cow) {
      setFormData({
        tracking_id: cow.tracking_id || "",
        gender: cow.gender || "",
        health_status: cow.health_status || "",
        source: cow.source || "",
        adopter_name: cow.adopter_name || "",
        notes: cow.notes || "",
      });
    }
  }, [cow]);

  // Reset edit mode when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditMode(false);
    }
  }, [isOpen]);

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleDiscardClick = () => {
    if (cow) {
      setFormData({
        tracking_id: cow.tracking_id || "",
        gender: cow.gender || "",
        health_status: cow.health_status || "",
        source: cow.source || "",
        adopter_name: cow.adopter_name || "",
        notes: cow.notes || "",
      });
    }
    setIsEditMode(false);
  };

  const handleSaveClick = async () => {
    if (!cow) return;

    setIsLoading(true);
    try {
      // Create FormData object for the update action
      const formDataToSend = new FormData();
      formDataToSend.append("gender", formData.gender);
      formDataToSend.append("health_status", formData.health_status);
      formDataToSend.append("source", formData.source);
      formDataToSend.append("adopter_name", formData.adopter_name);
      formDataToSend.append("notes", formData.notes);

      const result = await updateCowAction(cow.id, formDataToSend);

      if (result.success) {
        toast({
          title: "Success",
          description: "Cow details updated successfully",
        });
        setIsEditMode(false);
        // Refresh the page to reflect the updated data
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update cow details",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Helper function to get health status badge color
  const getHealthBadgeColor = (status: string) => {
    switch (status) {
      case "healthy":
        return {
          backgroundColor: "#dcfce7",
          color: "#16a34a",
          border: "1px solid #bbf7d0",
        };
      case "sick":
        return {
          backgroundColor: "#fee2e2",
          color: "#dc2626",
          border: "1px solid #fecaca",
        };
      case "under_treatment":
        return {
          backgroundColor: "#fef3c7",
          color: "#d97706",
          border: "1px solid #fed7aa",
        };
      case "quarantine":
        return {
          backgroundColor: "#f3e8ff",
          color: "#a855f7",
          border: "1px solid #e9d5ff",
        };
      default:
        return {
          backgroundColor: "#f3f4f6",
          color: "#374151",
          border: "1px solid #d1d5db",
        };
    }
  };

  if (!cow) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`w-[calc(100%-1rem)] ${
          isEditMode ? "sm:max-w-lg md:max-w-xl" : "sm:max-w-md"
        } shadow-xl p-4 sm:p-6 max-h-[95vh] overflow-y-auto`}
        style={{ border: "1px solid #dfe3ee" }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-xl font-bold"
            style={{ color: "#3b5998" }}
          >
            Cow Details
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 mt-2 pb-4">
          <div className="flex justify-center">
            {cow.photo_url ? (
              <div
                className={`${
                  isMobile ? "w-32 h-32" : "w-40 h-40"
                } relative rounded-lg overflow-hidden border border-gray-200 shadow-md`}
              >
                <Image
                  src={cow.photo_url}
                  alt={`Photo of ${formData.tracking_id}`}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                className={`${
                  isMobile ? "w-32 h-32" : "w-36 h-36"
                } rounded-lg flex items-center justify-center text-5xl border border-gray-200 shadow-md`}
                style={{ backgroundColor: "#f7f7f7" }}
              >
                🐄
              </div>
            )}
          </div>

          <div className="flex items-center justify-center">
            <Badge
              className="px-4 py-1 text-sm font-medium shadow-sm"
              style={getHealthBadgeColor(formData.health_status)}
            >
              {formData.health_status.replace(/_/g, " ")}
            </Badge>
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg"
            style={{ backgroundColor: "#f7f7f7", border: "1px solid #dfe3ee" }}
          >
            {/* Tracking ID */}
            <div
              className="bg-white p-2 sm:p-3 rounded-md shadow-sm"
              style={{ border: "1px solid #dfe3ee" }}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium" style={{ color: "#8b9dc3" }}>
                  Tracking ID
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                  onClick={handleEditClick}
                  disabled={isEditMode}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
              <p
                className="font-semibold text-sm sm:text-base"
                style={{ color: "#3b5998" }}
              >
                {formData.tracking_id}
              </p>
            </div>

            {/* Gender */}
            <div
              className="bg-white p-2 sm:p-3 rounded-md shadow-sm"
              style={{ border: "1px solid #dfe3ee" }}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium" style={{ color: "#8b9dc3" }}>
                  Gender
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                  onClick={handleEditClick}
                  disabled={isEditMode}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
              {isEditMode ? (
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange("gender", value)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="calf">Calf</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p
                  className="font-semibold capitalize text-sm sm:text-base"
                  style={{ color: "#3b5998" }}
                >
                  {formData.gender}
                </p>
              )}
            </div>

            {/* Source */}
            <div
              className="bg-white p-2 sm:p-3 rounded-md shadow-sm"
              style={{ border: "1px solid #dfe3ee" }}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium" style={{ color: "#8b9dc3" }}>
                  Source
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                  onClick={handleEditClick}
                  disabled={isEditMode}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
              {isEditMode ? (
                <Select
                  value={formData.source}
                  onValueChange={(value) => handleInputChange("source", value)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rescue">Rescue</SelectItem>
                    <SelectItem value="donation">Donation</SelectItem>
                    <SelectItem value="birth">Birth</SelectItem>
                    <SelectItem value="stray">Stray</SelectItem>
                    <SelectItem value="transferred">Transferred</SelectItem>
                    <SelectItem value="rescued">Rescued</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p
                  className="font-semibold capitalize text-sm sm:text-base break-words"
                  style={{ color: "#3b5998" }}
                >
                  {formData.source}
                </p>
              )}
            </div>

            {/* Adopter Name */}
            <div
              className="bg-white p-2 sm:p-3 rounded-md shadow-sm"
              style={{ border: "1px solid #dfe3ee" }}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium" style={{ color: "#8b9dc3" }}>
                  Adopter Name
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                  onClick={handleEditClick}
                  disabled={isEditMode}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
              {isEditMode ? (
                <Input
                  value={formData.adopter_name}
                  onChange={(e) =>
                    handleInputChange("adopter_name", e.target.value)
                  }
                  placeholder="Enter adopter name"
                  className="h-8 text-sm"
                />
              ) : (
                <p
                  className="font-semibold text-sm sm:text-base"
                  style={{ color: "#3b5998" }}
                >
                  {formData.adopter_name || "No adopter yet"}
                </p>
              )}
            </div>

            {/* Health Status (appears above notes when editing) */}
            {isEditMode && (
              <div
                className="col-span-1 sm:col-span-2 bg-white p-2 sm:p-3 rounded-md shadow-sm"
                style={{ border: "1px solid #dfe3ee" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <p
                    className="text-xs font-medium"
                    style={{ color: "#8b9dc3" }}
                  >
                    Health Status
                  </p>
                </div>
                <Select
                  value={formData.health_status}
                  onValueChange={(value) =>
                    handleInputChange("health_status", value)
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select health status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="healthy">Healthy</SelectItem>
                    <SelectItem value="sick">Sick</SelectItem>
                    <SelectItem value="under_treatment">
                      Under Treatment
                    </SelectItem>
                    <SelectItem value="quarantine">Quarantine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes */}
            <div
              className="col-span-1 sm:col-span-2 bg-white p-2 sm:p-3 rounded-md shadow-sm"
              style={{ border: "1px solid #dfe3ee" }}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium" style={{ color: "#8b9dc3" }}>
                  Notes
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                  onClick={handleEditClick}
                  disabled={isEditMode}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
              {isEditMode ? (
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Enter notes about the cow"
                  className="text-sm min-h-[60px]"
                />
              ) : (
                <p className="text-sm" style={{ color: "#3b5998" }}>
                  {formData.notes || "No notes available"}
                </p>
              )}
            </div>

            {/* Registered On */}
            <div
              className="col-span-1 sm:col-span-2 bg-white p-2 sm:p-3 rounded-md shadow-sm"
              style={{ border: "1px solid #dfe3ee" }}
            >
              <p className="text-xs font-medium" style={{ color: "#8b9dc3" }}>
                Registered On
              </p>
              <p
                className="font-semibold text-sm sm:text-base"
                style={{ color: "#3b5998" }}
              >
                {format(new Date(cow.created_at), "MMM d, yyyy • h:mm a")}
              </p>
            </div>
          </div>

          {/* Save and Discard buttons - only show in edit mode */}
          {isEditMode && (
            <div className="flex gap-2 justify-end pt-4 pb-2 border-t mt-4">
              <Button
                variant="outline"
                onClick={handleDiscardClick}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Discard
              </Button>
              <Button
                onClick={handleSaveClick}
                disabled={isLoading}
                className="flex items-center gap-2"
                style={{ backgroundColor: "#3b5998", borderColor: "#3b5998" }}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
