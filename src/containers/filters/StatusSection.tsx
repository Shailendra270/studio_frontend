import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface StatusOption {
  id: string;
  label: string;
}

interface StatusSectionProps {
  selectedStatus: string[];
  onStatusChange: (statusId: string, checked: boolean) => void;
  statusOptions?: StatusOption[];
}

const defaultStatusOptions: StatusOption[] = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "unpublished", label: "Unpublished" },
];

export const StatusSection: React.FC<StatusSectionProps> = ({
  selectedStatus,
  onStatusChange,
  statusOptions = defaultStatusOptions,
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-bold text-white mb-3">Status</h3>
      <div className="space-y-3">
        {statusOptions.map((status) => (
          <div key={status.id} className="flex items-center space-x-3">
            <Checkbox
              id={status.id}
              checked={
                selectedStatus.includes(status.id) ||
                (status.id === "all" && selectedStatus.includes("all"))
              }
              onCheckedChange={(checked: boolean) =>
                onStatusChange(status.id, checked)
              }
              className="border-2 border-white data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-[#00BBFF] data-[state=checked]:to-[#0051FF] data-[state=checked]:border-[#00BBFF] rounded-md"
            />
            <Label
              htmlFor={status.id}
              className="text-sm font-medium text-white cursor-pointer"
            >
              {status.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};
export default StatusSection;