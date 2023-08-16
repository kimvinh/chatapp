import React from 'react';
import './SubmitButton.css';
import '../pages/ChatRoom.css'

const SubmitButton = ({ text, disabled, action }) => {
    return <button className='w-full h-11 text-lg rounded-full border-1 border-black submit-button' type='submit' disabled={disabled} onClick={action}>{text}</button>
}

export default SubmitButton;