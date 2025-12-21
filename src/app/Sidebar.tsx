import React from 'react'

const Sidebar = () => {
    return (
        <div className='hidden md:flex fixed  left-0 top-0 w-[250px] h-screen bg-[#1a1d29] border-r border-gray-700 p-4'>
            <div className='text-white'>
                <h2 className='text-xl font-bold mb-6'>Gods Unchained</h2>
                <nav className='space-y-2'>
                    <a href='/' className='block p-3 rounded hover:bg-gray-700 transition-colors'>
                        Cards
                    </a>
                    <a href='#' className='block p-3 rounded hover:bg-gray-700 transition-colors'>
                        My Collection
                    </a>
                    <a href='#' className='block p-3 rounded hover:bg-gray-700 transition-colors'>
                        Marketplace
                    </a>
                    <a href='#' className='block p-3 rounded hover:bg-gray-700 transition-colors'>
                        Settings
                    </a>
                </nav>
            </div>
        </div>
    )
}

export default Sidebar