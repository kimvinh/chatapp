import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from '../Components/Logo';
import SubmitButton from '../Components/SubmitButton';
import Warning from '../Components/Warning';
import ModalBox from '../Components/ModalBox';
import { localNetwork } from '../localNetwork';
import './Login.css';
import './ChatRoom.css';

axios.defaults.withCredentials = true;

const Login = () => {
    const navigate = useNavigate();
    const [inputs, setInputs] = useState({
        username: '',
        password: ''
    });

    const [inputsValid, setInputsValid] = useState({
        username: true,
        password: true
    })

    const [isFormValid, setIsFormValid] = useState(false);
    const [focusedInput, setFocusedInput] = useState(null);

    const [showUsernameWarning, setShowUsernameWarning] = useState(false);
    const [showPasswordWarning, setShowPasswordWarning] = useState(false);
    const [showModalBox, setShowModalBox] = useState(false);

    useEffect(() => {
        const formValues = Object.values(inputs);
        const isFormValid = formValues.every((value) => value !== '');
        setIsFormValid(isFormValid);
    }, [inputs])

    const handleInputFocus = (inputField) => {
        setFocusedInput(inputField);
    };

    const handleInputBlur = () => {
        setFocusedInput(null);
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setInputs((prevInputs) => ({
            ...prevInputs,
            [name]: value
        }))

        switch (event.target.name) {
            case 'username':
                if (showUsernameWarning) {
                    setInputsValid((prevStatus) => ({
                        ...prevStatus,
                        username: true
                    }));
                    setShowUsernameWarning(false);
                }
                break;
            case 'password':
                if (showPasswordWarning) {
                    setInputsValid((prevStatus) => ({
                        ...prevStatus,
                        password: true
                    }));
                    setShowPasswordWarning(false);
                }
                break;
            default:
                break;
        }
    }

    const handleLogin = async (event) => {
        event.preventDefault();
        try {
            const response = await axios.post(`${localNetwork}/users/login`, {
                username: inputs.username,
                password: inputs.password
            });
            if (response) {
                setShowModalBox(true);
            }
        } catch (error) {
            if (error.response.data.message === 'Incorrect Username') {
                setShowUsernameWarning(true);
                setInputsValid((prevStatus) => ({
                    ...prevStatus,
                    username: false
                }));
            } else {
                setShowPasswordWarning(true);
                setInputsValid((prevStatus) => ({
                    ...prevStatus,
                    password: false
                }));
            }
        }
    }

    const handleModalBox = () => {
        setShowModalBox(false);
        navigate('/');
    }

    return (
        <div className='login'>
            <div className='login-container'>
                <Logo />
                <div className='login-form'>
                    <h1 className='header'>SIGN IN</h1>
                    <form className='login-field' onSubmit={handleLogin}>
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
                            {showUsernameWarning && <Warning errorType='Incorrect Username' />}
                        </div>
                        <div id='password-field' className='form-floating'>
                            <input 
                                id="password" 
                                type="password" 
                                className={`form-control ${
                                    focusedInput !== 'password' && inputs.password !== '' && !showPasswordWarning
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
                            {showPasswordWarning && <Warning errorType='Incorrect Password' />}
                        </div>
                        <SubmitButton text='Login' disabled={!isFormValid} />
                    </form>
                </div>
                <div className='login-footer'>
                    <p className='footer-text'>Don't have an account yet?</p>
                    <Link to='/signup'>Register Here</Link>
                </div>
            </div>
            {showModalBox && 
            <ModalBox 
                show={handleModalBox}
                type='announcement' 
                message='Great news! You have successfully accessed your account.' 
            />
            }
        </div>
    )
}

export default Login;