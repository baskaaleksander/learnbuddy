'use client';
import { fetchGraphQL } from '@/utils/gql-axios';
import React, { useEffect, useState } from 'react'

function MaterialsPage() {

    const [materials, setMaterials] = useState([]);
    useEffect(() => {
        try {
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
                console.log('Materials fetched:', materialsResponse.getUserMaterials);
            };
            fetchMaterials();
        } catch (error) {
            console.error('Failed to fetch materials:', error);
        }
    }, []);
  return (
    <div>
        {materials.length > 0 ? (
            <ul>
                {materials.map((material: any) => (
                    <li key={material.id}>
                        <h3>{material.title}</h3>
                        <p>Status: {material.status}</p>
                    </li>
                ))}
            </ul>
        ) : (
            <p>No materials found.</p>
        )}
    </div>
  )
}

export default MaterialsPage