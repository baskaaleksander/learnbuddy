import React from 'react'
import { Badge } from './badge';
import Link from 'next/link';
import { LucideArrowRight } from 'lucide-react';

function BadgeWithLink({ text, link, linkText }: { text: string; link: string, linkText: string }) {
  return (
    <Badge className='mb-4 bg-[#F9F5FF] text-primary'>
        {text}
            
            <Badge  className='ml-2 border-[#E9D7FE] bg-[#F9F5FF] text-primary hover:brightness-90 transition'>
                <Link href={link}>{linkText}</Link>
                <LucideArrowRight />
            </Badge>
        </Badge>
  )
}

export default BadgeWithLink