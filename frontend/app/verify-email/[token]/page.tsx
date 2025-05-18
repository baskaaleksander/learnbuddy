'use client';
import api from '@/utils/axios';
import React, { useEffect, useState } from 'react'

function VerifyEmail( { params }: { params: { token: string} }) {
  const { token } = params;
  const [ message, setMessage ] = useState<string | null>("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await api.post(`/auth/verify-email/${token}`);
        setMessage("Email verified successfully");
      }
      catch (error : any) {
        if(error.status === 409) {
          setMessage("Email already verified");
        } else if (error.status === 404) {
          setMessage("Invalid or expired token");

        } else {
          setMessage("An error occurred while verifying your email");
        }
      }
    };
    verifyEmail();
  },[])

  return (
    <div className='min-h-screen w-full flex items-center justify-center'>{message}</div>
  )
}

export default VerifyEmail