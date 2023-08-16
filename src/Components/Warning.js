import React, { useState, useEffect } from 'react';
import './Warning.css';

const Warning = ({ errorType }) => {
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Set the message based on the error type
        switch (errorType) {
            case 'usernameTaken':
                setMessage('Username is already taken. Please select a different username.');
                break;
            case 'emailTaken':
                setMessage('Email is already taken. Please select a different email.');
                break;
            case 'emailInvalid':
                setMessage('Email is invalid. Please try again.');
                break;
            case 'passwordUnmatched':
                setMessage('Password and confirm password fields do not match.');
                break;
            case 'Incorrect Username':
                setMessage('Invalid username. Please try again.');
                break;
            case 'Incorrect Password':
                setMessage('Invalid password. Please try again.');
                break;
            case 'empty':
                setMessage('This field cannot be empty.');
                break;
            case 'room_error_1':
                setMessage('Invalid room ID or password.');
                break;
            case 'room_error_2':
                setMessage('Room ID already exists.');
                break;
            case 'room_error_3':
                setMessage('Please select one of the avatars above.');
                break;
            default:
                setMessage('Please fill out all the fields.');
                break;
            }
    }, [errorType]);

    return (
        <p className='warning'>
            <i className="fa-solid fa-triangle-exclamation"></i> {message}
        </p>
    )
}

export default Warning;