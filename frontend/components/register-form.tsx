'use client';
import { useAuth } from '@/providers/auth-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';


const formSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
    confirmPassword: z.string(),
    tosAccepted: z.boolean().refine(val => val, {
        message: "You must accept the Terms of Service",
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

function RegisterForm() {
    const { register, user, loading: authLoading } = useAuth();
    const router = useRouter();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
        email: "",
        password: "",
        confirmPassword: "",
        tosAccepted: false,
        },
    })

    useEffect(() => {
        if (user && !authLoading) {
            router.push("/");
        }
    }, [user, authLoading]);


    const handleLogin = async (data: z.infer<typeof formSchema>) => {
        try {
            await register(data.email, data.password);
        } catch (error) {
            console.error("Registration failed", error);
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
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
            )} />
            <FormField
                control={form.control}
                name="password"
                render= {( { field } ) => (
                    <FormItem className="mb-4">
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                            <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
            )} />
            <FormField
                control={form.control}
                name="confirmPassword"
                render= {( { field } ) => (
                    <FormItem className="mb-4">
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                            <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
            )} />
            <FormField
                    control={form.control}
                    name="tosAccepted"
                    render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 mb-2">
                            <FormControl>
                                <Checkbox
                                    id="tosAccepted"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="mr-2 "
                                />
                            </FormControl>
                            <FormLabel htmlFor="tosAccepted" className="mb-0 cursor-pointer">
                                I accept the Terms of Service
                            </FormLabel>
                            <FormMessage />
                        </FormItem>
                    )}
                />

            <Button type="submit" className='w-full mt-6'>Register</Button>
        </form>
    </Form>
  )
}

export default RegisterForm