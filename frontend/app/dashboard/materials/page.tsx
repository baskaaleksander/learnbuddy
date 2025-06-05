'use client';
import ErrorComponent from '@/components/error-component';
import LoadingScreen from '@/components/loading-screen';
import MaterialCard from '@/components/material-card';
import UploadCard from '@/components/upload-card';
import { fetchGraphQL } from '@/utils/gql-axios';
import React, { useEffect, useState, useMemo } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Filter, ArrowUpDown, Search } from 'lucide-react';

function MaterialsPage() {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('newest');
    const [searchQuery, setSearchQuery] = useState<string>('');

    useEffect(() => {
        try {
            setLoading(true);
            const fetchMaterials = async () => {
                const materialsResponse = await fetchGraphQL(`
                query GetUserMaterials {
                    getUserMaterials {
                        id
                        title
                        status
                        description
                        createdAt
                    }
                }
            `);
                setMaterials(materialsResponse.getUserMaterials);
            };
            fetchMaterials();
        } catch (error) {
            setError("Failed to fetch materials. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Filter, search, and sort materials
    const filteredAndSortedMaterials = useMemo(() => {
        let filtered = materials;
        
        // Apply search filter
        if (searchQuery.trim() !== '') {
            filtered = filtered.filter((material: any) => 
                material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (material.description && material.description.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }
        
        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter((material: any) => 
                material.status.toLowerCase() === statusFilter.toLowerCase()
            );
        }

        // Apply sorting
        const sorted = [...filtered].sort((a: any, b: any) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'title-asc':
                    return a.title.localeCompare(b.title);
                case 'title-desc':
                    return b.title.localeCompare(a.title);
                case 'status-asc':
                    return a.status.localeCompare(b.status);
                case 'status-desc':
                    return b.status.localeCompare(a.status);
                default:
                    return 0;
            }
        });

        return sorted;
    }, [materials, statusFilter, sortBy, searchQuery]);

    // Get unique statuses for the filter dropdown
    const availableStatuses = useMemo(() => {
        const statuses = materials.map((material: any) => material.status);
        return Array.from(new Set(statuses));
    }, [materials]);

    if (error) {
        return <ErrorComponent message={error} />;
    }

    if (loading) {
        return <LoadingScreen />
    }

    return (
        <div className="p-4 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Learning Materials</h1>
                <p className="text-muted-foreground">
                    {filteredAndSortedMaterials.length} material{filteredAndSortedMaterials.length !== 1 ? 's' : ''} found
                </p>
            </div>

            {/* Search and Controls */}
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search materials..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                
                {/* Filter and Sort Controls */}
                <div className="flex items-center gap-3">
                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                {availableStatuses.map((status: string) => (
                                    <SelectItem key={status} value={status.toLowerCase()}>
                                        {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sort Options */}
                    <div className="flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Newest First</SelectItem>
                                <SelectItem value="oldest">Oldest First</SelectItem>
                                <SelectItem value="title-asc">Title A-Z</SelectItem>
                                <SelectItem value="title-desc">Title Z-A</SelectItem>
                                <SelectItem value="status-asc">Status A-Z</SelectItem>
                                <SelectItem value="status-desc">Status Z-A</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Materials grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Always show upload card first */}
                <UploadCard />
                
                {/* Show filtered and sorted materials */}
                {filteredAndSortedMaterials.length > 0 ? (
                    filteredAndSortedMaterials.map((material: any) => (
                        <MaterialCard
                            key={material.id}
                            title={material.title}
                            status={material.status}
                            description={material.description}
                            id={material.id}
                        />
                    ))
                ) : (
                    // Show message when no materials match the criteria
                    (statusFilter !== 'all' || searchQuery.trim() !== '') && (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                            <div className="text-muted-foreground">
                                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-medium mb-2">No materials found</h3>
                                <p>No materials match your search or filter criteria.</p>
                                <p className="text-sm mt-2">
                                    {searchQuery.trim() !== '' && 'Try a different search term or '}
                                    {statusFilter !== 'all' && 'change the status filter.'}
                                </p>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

export default MaterialsPage;