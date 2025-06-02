import React from 'react'

interface SidebarProps {
    paths: Array<{
        category: string;
        links: Array<{
            name: string;
            path: string;
            icon: React.ReactNode;
        }>
    }>,
    isOpen: boolean;
    toggle: () => void;
}
function Sidebar( 
    { 
        paths, 
        isOpen, 
        toggle 
    } 
    : SidebarProps) {
  return (
    <nav>

    </nav>
  )
}


export default Sidebar