import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import React from 'react'
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Button } from './ui/button';
import api from '@/utils/axios';

const formSchema = z.object({
    password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const handleResetPassword = async (data: z.infer<typeof formSchema>) => {
    try {
      await api.post(`/auth/reset-password/${token}`, {
        password: data.password,
      })
    }
    catch (error) {
      console.error("Reset password failed", error);
    } finally {
      form.reset();
      router.push("/login");
    }
  }

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(handleResetPassword)} className='w-full max-w-md mx-auto text-start pt-24'>
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
                    <FormItem className="">
                        <FormLabel>Confirm password</FormLabel>
                        <FormControl>
                            <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
            )} />
            <Button type="submit" className='w-full mt-6'>Change password</Button>
        </form>
    </Form>
  )
}

export default ResetPasswordForm