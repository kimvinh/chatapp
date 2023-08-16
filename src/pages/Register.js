import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../Components/Logo';
import SubmitButton from '../Components/SubmitButton';
import Warning from '../Components/Warning';
import ModalBox from '../Components/ModalBox';
import { localNetwork } from '../localNetwork';
import { fetchRandomAvatar } from '../utils/avatarAPI';
import './Register.css';

const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;

const Register = () => {
    const navigate = useNavigate();
    const [inputs, setInputs] = useState({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        password: '',
        confirm_password: ''
    });

    const [inputsValid, setInputsValid] = useState({
        first_name: true,
        last_name: true,
        username: true,
        email: true,
        password: true,
        confirm_password: true
    });

    const [isFormValid, setIsFormValid] = useState(false);

    const [focusedInput, setFocusedInput] = useState(null);

    const [showUsernameWarning, setShowUsernameWarning] = useState(false);
    const [showEmailWarning, setShowEmailWarning] = useState(false);
    const [showConfirmPasswordWarning, setShowConfirmPasswordWarning] = useState(false);
    const [showModalBox, setShowModalBox] = useState(false);

    useEffect(() => {
        // Check the overall form validity
        const formValues = Object.values(inputs);
        const formValidity = Object.values(inputsValid);
    
        const isFormValid = formValues.every((value, index) => value !== '' && formValidity[index]);
        setIsFormValid(isFormValid);
    }, [inputs, inputsValid]);

    const handleInputFocus = (inputField) => {
        setFocusedInput(inputField);
    };

    const handleInputBlur = () => {
        setFocusedInput(null);
    };

    const handleInputChange = async (event) => {
        const { name, value } = event.target;
        setInputs((prevInputs) => ({
            ...prevInputs,
            [name]: value
        }))

        switch (event.target.name) {
            // Email Case
            case 'email':
                if (event.target.value !== '' && !emailRegex.test(event.target.value)) {
                    setInputsValid((prevStatus) => ({
                        ...prevStatus,
                        email: false
                    }));
                    setShowEmailWarning(true);
                } else if (event.target.value === '') {
                    setInputsValid((prevStatus) => ({
                        ...prevStatus,
                        email: true
                    }));
                    setShowEmailWarning(false);
                } else {
                    try {
                        const response = await axios.post(`${localNetwork}/users/check-availability`, { email: event.target.value });
                        if (response.data === 1) {
                            setInputsValid((prevStatus) => ({
                                ...prevStatus,
                                email: false
                            }));
                            setShowEmailWarning(true);
                        } else {
                            setInputsValid((prevStatus) => ({
                                ...prevStatus,
                                email: true
                            }));
                            setShowEmailWarning(false);
                        }
                    } catch (error) {
                        console.error('Error:', error);
                    }
                }
                break;
            // Username Case
            case 'username':
                try {
                    const response = await axios.post(`${localNetwork}/users/check-availability`, { username: event.target.value });
                    if (response.data === 1) {
                        setInputsValid((prevStatus) => ({
                            ...prevStatus,
                            username: false
                        }));
                        setShowUsernameWarning(true);
                    } else {
                        setInputsValid((prevStatus) => ({
                            ...prevStatus,
                            username: true
                        }));
                        setShowUsernameWarning(false);
                    }
                } catch (error) {
                    console.error('Error:', error);
                }
                break;
            // Password Case
            case 'password':
                if (inputs.confirm_password !== '' && event.target.value !== inputs.confirm_password) {
                    setInputsValid((prevStatus) => ({
                        ...prevStatus,
                        confirm_password: false
                    }));
                    setShowConfirmPasswordWarning(true);
                } else {
                    setInputsValid((prevStatus) => ({
                        ...prevStatus,
                        confirm_password: true
                    }));
                    setShowConfirmPasswordWarning(false);
                }
                break;
            // Confirm Password Case
            case 'confirm_password':
                if (inputs.password !== '' && event.target.value !== inputs.password) {
                    setInputsValid((prevStatus) => ({
                        ...prevStatus,
                        confirm_password: false
                    }));
                    setShowConfirmPasswordWarning(true);
                } else {
                    setInputsValid((prevStatus) => ({
                        ...prevStatus,
                        confirm_password: true
                    }));
                    setShowConfirmPasswordWarning(false);
                }
                break;
            default:
                break;
        }
    }

    const handleRegister = async (event) => {
        event.preventDefault();

        let isValidForm = true;

        // Check the user's inputs when they submit the form
        for (const key in inputs) {
            if (inputs.hasOwnProperty(key) && inputs[key] === '') {
                setInputsValid((prevStatus) => ({
                    ...prevStatus,
                    [key]: false
                }));
                isValidForm = false;
            }
        }
        if (!isValidForm) {
            return;
        }

        try {
            const avatar = await fetchRandomAvatar(inputs.first_name + ' ' + inputs.last_name);
            const response = await axios.post(`${localNetwork}/users/register`, {
                first_name: inputs.first_name,
                last_name: inputs.last_name, 
                username: inputs.username,
                email: inputs.email,
                password: inputs.password,
                birthday: '',
                phone: '',
                gender: '',
                country: '',
                avatar: avatar, 
                friends: []
            });

            if (response) {
                setShowModalBox(true);
            }
        } catch (error) {
            console.error(error);
        } 
    }

    const handleModalBox = () => {
        setShowModalBox(false);
        navigate('/signin');
    }

    return (
        <div className='register'>
            <div className='register-container'>
                <Logo />
                <div className='register-form'>
                    <h1 className='header'>CREATE YOUR ACCOUNT</h1>
                    <form className='register-field' onSubmit={handleRegister}>
                        <div id='first_name-field' className='form-floating'>
                            <input 
                                id="first_name" 
                                type="text" 
                                className={`form-control ${
                                    focusedInput !== 'first_name' && inputs.first_name !== '' 
                                    ? 'valid' 
                                    : inputsValid.first_name
                                    ? '' 
                                    : 'is-invalid'
                                }`}
                                name='first_name'
                                value={inputs.first_name}
                                onFocus={() => handleInputFocus('first_name')}
                                onBlur={handleInputBlur}
                                onChange={handleInputChange}
                            />
                            <label htmlFor='first_name'>FIRST NAME</label>
                        </div>
                        <div id='last_name-field' className='form-floating'>
                            <input 
                                id="last_name" 
                                type="text" 
                                className={`form-control ${
                                    focusedInput !== 'last_name' && inputs.last_name !== '' 
                                    ? 'valid' 
                                    : inputsValid.last_name 
                                    ? '' 
                                    : 'is-invalid'
                                }`}
                                name='last_name'
                                value={inputs.last_name}
                                onFocus={() => handleInputFocus('last_name')}
                                onBlur={handleInputBlur}
                                onChange={handleInputChange}
                            />
                            <label htmlFor='last_name'>LAST NAME</label>
                        </div>
                        <div id='username-field' className='form-floating'>
                            <input 
                                id="username" 
                                type="text" 
                                className={`form-control ${
                                    focusedInput !== 'username' && inputs.username !== '' && !showUsernameWarning 
                                        ? 'valid' 
                                        : inputsValid.username 
                                        ? '' 
                                        : 'is-invalid'
                                }`}
                                name='username'
                                value={inputs.username}
                                onFocus={() => handleInputFocus('username')}
                                onBlur={handleInputBlur}
                                onChange={handleInputChange}
                            />
                            <label htmlFor='username'>USERNAME</label>
                            {showUsernameWarning && <Warning errorType='usernameTaken' />}
                        </div>
                        <div id='email-field' className='form-floating'>
                            <input 
                                id="email" 
                                type="text" 
                                className={`form-control ${
                                    (focusedInput !== 'email' && emailRegex.test(inputs.email) && !showEmailWarning) 
                                    || (inputsValid.email && inputs.email !== '') 
                                    ? 'valid'
                                    : inputsValid.email
                                    ? ''
                                    : 'is-invalid'
                                }`}
                                name='email'
                                value={inputs.email}
                                onFocus={() => handleInputFocus('email')}
                                onBlur={handleInputBlur}
                                onChange={handleInputChange}
                            />
                            <label htmlFor='email'>EMAIL</label>
                            {showEmailWarning && <Warning errorType={emailRegex.test(inputs.email) ? 'emailTaken' : 'emailInvalid'} />}
                        </div>
                        <div id='password-field' className='form-floating'>
                            <input 
                                id="password" 
                                type="password" 
                                className={`form-control ${
                                    focusedInput !== 'password' && inputs.password !== '' 
                                    ? 'valid' 
                                    : inputsValid.password 
                                    ? '' 
                                    : 'is-invalid'
                                }`}
                                name='password'
                                value={inputs.password}
                                onFocus={() => handleInputFocus('password')}
                                onBlur={handleInputBlur}
                                onChange={handleInputChange}
                            />
                            <label htmlFor='password'>PASSWORD</label>
                        </div>
                        <div id='confirm_password-field' className='form-floating'>
                            <input 
                                id="confirm_password" 
                                type="password" 
                                className={`form-control ${
                                    focusedInput !== 'confirm_password' && inputs.confirm_password !== '' && inputs.password === inputs.confirm_password
                                    ? 'valid' 
                                    : inputsValid.confirm_password 
                                    ? '' 
                                    : 'is-invalid'
                                }`}
                                name='confirm_password'
                                value={inputs.confirm_password}
                                onFocus={() => handleInputFocus('confirm_password')}
                                onBlur={handleInputBlur}
                                onChange={handleInputChange}
                            />
                            <label htmlFor='confirm_password'>CONFIRM PASSWORD</label>
                            {showConfirmPasswordWarning && <Warning errorType='passwordUnmatched' />}
                        </div>
                        <SubmitButton text='Register' disabled={!isFormValid} />
                    </form>
                    <div className='register-footer'>
                        <p className='footer-text'>Already have an account?</p>
                        <Link to='/signin'>Log In</Link>
                    </div>
                </div>
            </div>
            {showModalBox &&
            <ModalBox 
                show={handleModalBox}
                type='announcement' 
                message='Account created successfully! You can now log in and start exploring.' 
            />
            }
        </div>
    )
}

export default Register;