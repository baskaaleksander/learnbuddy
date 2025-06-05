'use client';

import SecondStepUpload from '@/components/second-step-upload';
import { fetchGraphQL } from '@/utils/gql-axios';
import { useRouter } from 'next/navigation';
import React, { use, useEffect, useState } from 'react'

function SecondStepUploadPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;
    const router = useRouter();
    const [materialStatus, setMaterialStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const fetchMaterial = async () => {
                setLoading(true);
                const materialResposne = await fetchGraphQL(`
                    query GetMaterialById {
                        getMaterialById(id: "${id}") {
                            status
                        }
                    }`)
                    setMaterialStatus(materialResposne.getMaterialById.status);
                
                }
            fetchMaterial()

        } catch (error) {
            router.push('/dashboard/materials');
        } finally {
            setLoading(false);
        }

        if (materialStatus !== 'PENDING' && !loading) {
            router.push('/dashboard/materials/');
        }
        
    }, [id])
    return (
    <div className='w-full h-full flex items-center justify-center'>
        <SecondStepUpload id={id} />
    </div>
  )
}

export default SecondStepUploadPage