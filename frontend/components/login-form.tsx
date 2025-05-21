'use client';
import React, { use, useEffect } from 'react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { z } from 'zod'
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const formSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
});

function LoginForm() {
    const { login, user, loading: authLoading } = useAuth();
    const router = useRouter();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
        email: "",
        password: "",
        },
    })

    useEffect(() => {
        if (user && !authLoading) {
            router.push("/");
        }
    }, [user, authLoading]);


    const handleLogin = async (data: z.infer<typeof formSchema>) => {
        try {
            await login(data.email, data.password);
        } catch (error) {
            console.error("Login failed", error);
        }
    }
  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(handleLogin)} className='w-full max-w-md mx-auto text-start pt-24'>
            <FormField
                control={form.control}
                name="email"
                render= {( { field } ) => (
                    <FormItem className="mb-4">
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input placeholder='your@email.com' {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
            )} />
            <FormField
                control={form.control}
                name="password"
                render= {( { field } ) => (
                    <FormItem className="">
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder='••••••' {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
            )} />
            <Link href='/reset-password' className='block mt-2 text-sm text-gray-500 hover:underline'>Forgot your password?</Link>
            <Button type="submit" className='w-full mt-6'>Login</Button>
        </form>
    </Form>
  )
}

export default LoginForm