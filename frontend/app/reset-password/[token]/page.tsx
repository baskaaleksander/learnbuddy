'use client';
import DescriptionSection from '@/components/landing-page/description-section';
import ResetPasswordForm from '@/components/features/auth/reset-password-form';
import api from '@/utils/axios';
import React, { use, useEffect, useState } from 'react';

function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
	const resolvedParams = use(params);
	const token = resolvedParams.token;
	const [message, setMessage] = useState<string | null>(null);

	useEffect(() => {
		const verifyToken = async () => {
			try {
				await api.post(`/auth/verify-password-reset-token/${token}`);
			} catch (error: any) {
				if (error.response.status === 404) {
					setMessage('Invalid or expired token');
				} else {
					setMessage('An error occurred while verifying your token');
				}
			}
		};
		verifyToken();
	}, [token]);
	return (
		<div className='flex flex-col items-center justify-center px-[10%] min-h-[80vh] py-16'>
			<DescriptionSection
				title='Password reset'
				secondaryTitle='Forgot your password?'
				description='Please enter your new password'
			/>
			{message ? (
				<div className='text-red-500 text-lg font-semibold mt-4'>{message}</div>
			) : (
				<ResetPasswordForm token={token} />
			)}
		</div>
	);
}

export default ResetPasswordPage;
