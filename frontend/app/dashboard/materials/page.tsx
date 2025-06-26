"use client";
import ErrorComponent from "@/components/error-component";
import LoadingScreen from "@/components/loading-screen";
import MaterialCard from "@/components/material-card";
import UploadCard from "@/components/upload-card";
import { fetchGraphQL } from "@/utils/gql-axios";
import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Filter,
  ArrowUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MaterialData, PaginationProps } from "@/lib/definitions";

function MaterialsPage() {
  const [materials, setMaterials] =
    useState<PaginationProps<MaterialData> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt-desc");
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    try {
      setLoading(true);
      const fetchMaterials = async () => {
        const materialsResponse = await fetchGraphQL(`
                query GetUserMaterials {
                    getUserMaterials(page: ${page}, pageSize: ${pageSize}, sortBy: "${sortBy}", status: "${statusFilter}") {
                        data {
                            id
                            title
                            status
                            description
                            createdAt
                        }
						totalItems
						totalPages
						currentPage
						pageSize
						hasNextPage
						hasPreviousPage
					}
                }
            `);
        setMaterials(materialsResponse.getUserMaterials);
        setTotalPages(materialsResponse.getUserMaterials.totalPages || 1);
      };
      fetchMaterials();
    } catch (error) {
      setError("Failed to fetch materials. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortBy, statusFilter]);

  if (error) {
    return <ErrorComponent message={error} />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Learning Materials</h1>
        <p className="text-muted-foreground">
          {materials?.data?.length} material
          {materials?.data?.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="title-asc">Title A-Z</SelectItem>
                  <SelectItem value="title-desc">Title Z-A</SelectItem>
                  <SelectItem value="status-asc">Status A-Z</SelectItem>
                  <SelectItem value="status-desc">Status Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-muted-foreground mr-2">
                Page Size:
              </span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => handlePageSizeChange(parseInt(value))}
              >
                <SelectTrigger className="w-full sm:w-[100px]">
                  <SelectValue placeholder="Page Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Pagination Controls */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={!materials?.hasPreviousPage}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            <span className="text-sm text-muted-foreground px-2">
              Page {page} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!materials?.hasNextPage}
              className="flex items-center gap-1"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Materials grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        <UploadCard />

        {materials?.data && materials.data.length > 0 ? (
          materials.data.map((material: MaterialData) => (
            <MaterialCard
              key={material.id}
              title={material.title}
              status={material.status}
              description={material.description}
              id={material.id}
              createdAt={material.createdAt}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <div className="text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No materials found</h3>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MaterialsPage;
