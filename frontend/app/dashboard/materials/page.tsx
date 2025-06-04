'use client';
import ErrorComponent from '@/components/error-component';
import LoadingScreen from '@/components/loading-screen';
import MaterialCard from '@/components/material-card';
import { fetchGraphQL } from '@/utils/gql-axios';
import React, { useEffect, useState } from 'react'

function MaterialsPage() {

    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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

    if (error) {
        return <ErrorComponent message={error} />;
    }

    if (loading) {
        return <LoadingScreen />
    }
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4'>
        {materials.length > 0 ? (
            materials.map((material: any) => (
                <MaterialCard
                    key={material.id}
                    title={material.title}
                    status={material.status}
                    id={material.id}
                />
            ))
        ) : (
            <p>No materials found.</p>
        )}
    </div>
  )
}

export default MaterialsPage