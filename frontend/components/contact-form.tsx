'use client';
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import api from '@/utils/axios';
import { Checkbox } from './ui/checkbox';

const formSchema = z.object({
    name: z.string().min(3, { message: "Name must be at least 3 characters long" }),
    email: z.string().email({ message: "Invalid email address" }),
    message: z.string().min(10, { message: "Message must be at least 10 characters long" }),
    tosAccepted: z.boolean().refine(val => val, {
        message: "You must accept the Terms of Service",
    }),
})

function ContactForm() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            message: "",
            tosAccepted: false,
        },
    })

    async function onSubmit(data: z.infer<typeof formSchema>) {
        try {
            await api.post('/email/send', {
                to: process.env.NEXT_PUBLIC_EMAIL,
                subject: `Contact Form Submission from ${data.name}`,
                text: `Name: ${data.name}\nEmail: ${data.email}\nMessage: ${data.message}`,
            })
        } catch (error) {
            console.error("error sending email")
        } finally {
            form.reset();
        }

    }
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='w-full text-start'>
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input className="mb-4" placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage className="mb-4" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                                <Input className="mb-4" placeholder="john.doe@example.com" {...field} />
                            </FormControl>
                            <FormMessage className="mb-4" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                                <Textarea className="mb-4" placeholder="Type your message here..." {...field} />
                            </FormControl>
                            <FormMessage className="mb-4" />
                        </FormItem>
                    )}
                />
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
                                    className="mr-2"
                                />
                            </FormControl>
                            <FormLabel htmlFor="tosAccepted" className="mb-0 cursor-pointer">
                                I accept the Terms of Service
                            </FormLabel>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className='w-full mt-4'>
                    Submit
                </Button>
            </form>
        </Form>
    )
}

export default ContactForm