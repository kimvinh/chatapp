import React from 'react';
import { Link } from 'react-router-dom';
import './Logo.css'

const Logo = () => {
    return (
        <div className='logo-container'>
            <Link className='logo-link' to='/'>
                <span className="material-symbols-outlined logo">chat_bubble</span>
                <h1 className='logo'>Let's Chat</h1>
            </Link>
        </div>
    )
}

export default Logo;