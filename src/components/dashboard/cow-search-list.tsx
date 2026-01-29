"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Database } from "@/types/database.types";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { format } from "date-fns";
import CowDetailsDialog from "./cow-details-dialog";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../ui/dropdown-menu";

type Cow = Database["public"]["Tables"]["cows"]["Row"];

interface CowSearchListProps {
  cows: Cow[];
}

export default function CowSearchList({
  cows: initialCows,
}: CowSearchListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCows, setFilteredCows] = useState<Cow[]>(initialCows);
  const [selectedCow, setSelectedCow] = useState<Cow | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    healthStatus: {
      healthy: false,
      sick: false,
      under_treatment: false,
      quarantine: false,
    },
    source: {
      rescue: false,
      birth: false,
      donation: false,
      stray: false,
      transferred: false,
      rescued: false,
    },
    hasAdopter: null as boolean | null,
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredCows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCows = filteredCows.slice(startIndex, endIndex);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [searchTerm, filters, initialCows]);

  const applyFiltersAndSearch = () => {
    let result = [...initialCows];

    // Apply search term
    if (searchTerm.trim() !== "") {
      const searchTermLower = searchTerm.toLowerCase();
      result = result.filter((cow) => {
        return (
          cow.tracking_id.toLowerCase().includes(searchTermLower) ||
          cow.gender.toLowerCase().includes(searchTermLower) ||
          cow.health_status.toLowerCase().includes(searchTermLower) ||
          cow.source.toLowerCase().includes(searchTermLower) ||
          (cow.adopter_name &&
            cow.adopter_name.toLowerCase().includes(searchTermLower)) ||
          (cow.notes && cow.notes.toLowerCase().includes(searchTermLower))
        );
      });
    }

    // Apply health status filters
    const activeHealthFilters = Object.entries(filters.healthStatus)
      .filter(([_, isActive]) => isActive)
      .map(([status]) => status);

    if (activeHealthFilters.length > 0) {
      result = result.filter((cow) =>
        activeHealthFilters.includes(cow.health_status)
      );
    }

    // Apply source filters
    const activeSourceFilters = Object.entries(filters.source)
      .filter(([_, isActive]) => isActive)
      .map(([source]) => source);

    if (activeSourceFilters.length > 0) {
      result = result.filter((cow) => activeSourceFilters.includes(cow.source));
    }

    // Apply adopter filter
    if (filters.hasAdopter !== null) {
      if (filters.hasAdopter) {
        result = result.filter(
          (cow) => cow.adopter_name && cow.adopter_name.trim() !== ""
        );
      } else {
        result = result.filter(
          (cow) => !cow.adopter_name || cow.adopter_name.trim() === ""
        );
      }
    }

    setFilteredCows(result);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleCowClick = (cow: Cow) => {
    setSelectedCow(cow);
    setIsDialogOpen(true);
  };

  const handleHealthStatusFilterChange = (status: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      healthStatus: {
        ...prev.healthStatus,
        [status]: checked,
      },
    }));
  };

  const handleSourceFilterChange = (source: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      source: {
        ...prev.source,
        [source]: checked,
      },
    }));
  };

  const handleAdopterFilterChange = (value: boolean | null) => {
    setFilters((prev) => ({
      ...prev,
      hasAdopter: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      healthStatus: {
        healthy: false,
        sick: false,
        under_treatment: false,
        quarantine: false,
      },
      source: {
        rescue: false,
        birth: false,
        donation: false,
        stray: false,
        transferred: false,
        rescued: false,
      },
      hasAdopter: null,
    });
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

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <>
      <div className="mb-6 flex gap-2">
        <Input
          placeholder="Search cows by tracking ID, gender, health status, source, adopter name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-200 focus:ring-2 focus:ring-gray-200 placeholder:text-[#8b9dc3]"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="border border-gray-200 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Health Status</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={filters.healthStatus.healthy}
              onCheckedChange={(checked: boolean) =>
                handleHealthStatusFilterChange("healthy", checked)
              }
            >
              Healthy
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.healthStatus.sick}
              onCheckedChange={(checked: boolean) =>
                handleHealthStatusFilterChange("sick", checked)
              }
            >
              Sick
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.healthStatus.under_treatment}
              onCheckedChange={(checked: boolean) =>
                handleHealthStatusFilterChange("under_treatment", checked)
              }
            >
              Under Treatment
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.healthStatus.quarantine}
              onCheckedChange={(checked: boolean) =>
                handleHealthStatusFilterChange("quarantine", checked)
              }
            >
              Quarantine
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Source</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={filters.source.rescue}
              onCheckedChange={(checked: boolean) =>
                handleSourceFilterChange("rescue", checked)
              }
            >
              Rescue
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.source.birth}
              onCheckedChange={(checked: boolean) =>
                handleSourceFilterChange("birth", checked)
              }
            >
              Birth
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.source.donation}
              onCheckedChange={(checked: boolean) =>
                handleSourceFilterChange("donation", checked)
              }
            >
              Donation
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.source.stray}
              onCheckedChange={(checked: boolean) =>
                handleSourceFilterChange("stray", checked)
              }
            >
              Stray
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.source.rescued}
              onCheckedChange={(checked: boolean) =>
                handleSourceFilterChange("rescued", checked)
              }
            >
              Rescued
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.source.transferred}
              onCheckedChange={(checked: boolean) =>
                handleSourceFilterChange("transferred", checked)
              }
            >
              Transferred
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Adopter</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={filters.hasAdopter === true}
              onCheckedChange={(checked: boolean) =>
                handleAdopterFilterChange(checked ? true : null)
              }
            >
              Has Adopter
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.hasAdopter === false}
              onCheckedChange={(checked: boolean) =>
                handleAdopterFilterChange(checked ? false : null)
              }
            >
              No Adopter
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />
            <Button
              variant="ghost"
              className="w-full text-sm justify-center"
              onClick={resetFilters}
            >
              Reset Filters
            </Button>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredCows.length > 0 ? (
        <>
          <Card
            className="overflow-hidden"
            style={{ border: "1px solid #dfe3ee" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="text-left"
                    style={{ backgroundColor: "#f7f7f7" }}
                  >
                    <th
                      className="p-4 font-medium"
                      style={{ color: "#3b5998" }}
                    >
                      Sr. No.
                    </th>
                    <th
                      className="p-4 font-medium"
                      style={{ color: "#3b5998" }}
                    >
                      Health Status
                    </th>
                    <th
                      className="p-4 font-medium"
                      style={{ color: "#3b5998" }}
                    >
                      Source
                    </th>
                    <th
                      className="p-4 font-medium"
                      style={{ color: "#3b5998" }}
                    >
                      Adopter Name
                    </th>
                    <th
                      className="p-4 font-medium"
                      style={{ color: "#3b5998" }}
                    >
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody style={{ borderColor: "#dfe3ee" }}>
                  {currentCows.map((cow, index) => (
                    <tr
                      key={cow.id}
                      className="transition-colors cursor-pointer"
                      style={{
                        borderTop: "1px solid #dfe3ee",
                      }}
                      onMouseEnter={(e) =>
                        ((
                          e.currentTarget as HTMLElement
                        ).style.backgroundColor = "#f7f7f7")
                      }
                      onMouseLeave={(e) =>
                        ((
                          e.currentTarget as HTMLElement
                        ).style.backgroundColor = "transparent")
                      }
                      onClick={() => handleCowClick(cow)}
                    >
                      <td className="p-4 whitespace-nowrap font-medium">
                        {startIndex + index + 1}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <Badge style={getHealthBadgeColor(cow.health_status)}>
                          {cow.health_status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="p-4 whitespace-nowrap capitalize">
                        {cow.source}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {cow.adopter_name || "-"}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {formatDate(cow.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm" style={{ color: "#3b5998" }}>
              Showing {startIndex + 1}-{Math.min(endIndex, filteredCows.length)}{" "}
              of {filteredCows.length} cows
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="border-gray-200 hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm" style={{ color: "#3b5998" }}>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="border-gray-200 hover:bg-gray-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div
          className="p-8 text-center rounded-md border border-gray-200"
          style={{ backgroundColor: "#f7f7f7" }}
        >
          <p style={{ color: "#3b5998" }}>
            No cows match your search criteria.
          </p>
        </div>
      )}

      <CowDetailsDialog
        cow={selectedCow}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}
