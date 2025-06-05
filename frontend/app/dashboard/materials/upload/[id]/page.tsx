'use client';

import { fetchGraphQL } from '@/utils/gql-axios';
import { useRouter } from 'next/navigation';
import React, { use, useEffect } from 'react'

function SecondStepUploadPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;
    const router = useRouter();

    useEffect(() => {
        const fetchMaterial = async () => {
            fetchGraphQL(`
                query GetMaterialById {
                    getMaterialById(id: ${id}) {
                        id
                        userId
                        title
                        description
                        content
                        status
                        createdAt
                    }
                }`)
            }
    })
    return (
    <div>SecondStepUploadPage {id}</div>
  )
}

export default SecondStepUploadPage