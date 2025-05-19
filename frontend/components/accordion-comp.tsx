import React from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { FAQProps } from '@/lib/definitions';


function AccordionComp({ questions } : FAQProps) {
    
  return (
        <Accordion type="multiple" className='text-start w-full lg:w-[50%] pt-16 md:pt-20 lg:pt-24'>
          {questions.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger>
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
          ))}
        </Accordion>
  )
}

export default AccordionComp