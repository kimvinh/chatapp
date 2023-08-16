import React from 'react';
import { Link } from 'react-router-dom';
import './ModalBox.css';

const ModalBox = ({ show, type, message, onAccept, onReject }) => {
    const renderModal = () => {
        const mainType = type.split('-')[0];
        const subType = type.split('-')[1] || '';
        if (mainType === 'announcement') {
            if (subType === 'kicked') {
                return (
                    <div className='announcement'>
                        <div className='modal-box-head'>
                            <h1><i className="fa-solid fa-circle-info"></i> Announcement</h1>
                        </div>
                        <div className='modal-box-body'>
                            <i className="fa-solid fa-user-slash"></i>
                            <p>{message}</p>
                        </div>
                        <div className='modal-box-footer'>
                            <button className='back' onClick={show}>Back to Home</button>
                        </div>
                    </div>
                )
            } else {
                return (
                    <div className='announcement'>
                        <div className='modal-box-head'>
                            <h1><i className="fa-solid fa-circle-info"></i> Announcement</h1>
                            <button onClick={show}><i className="fa-solid fa-x"></i></button>
                        </div>
                        <div className='modal-box-body'>
                            <i className="fa-regular fa-circle-check"></i>
                            <p>{message}</p>
                        </div>
                        <div className='modal-box-footer'>
                            <button onClick={show}>Continue</button>
                        </div>
                    </div>
                );
            }
        } else if (mainType === 'checking') {
            if (subType === 'friend_request') {
                return (
                    <div className='checking'>
                        <div className='modal-box-head'>
                            <h1><i className="fa-solid fa-circle-question"></i> Just Checking...</h1>
                            <button className='close' onClick={onReject}><i className="fa-solid fa-x"></i></button>
                        </div>
                        <div className='modal-box-body'>
                            <i className="fa-solid fa-user-plus"></i>
                            <p>{message}</p>
                        </div>
                        <div className='modal-box-footer'>
                            <button className='reject' onClick={onReject}>No</button>
                            <button className='accept' onClick={onAccept}>Yes</button>
                        </div>
                    </div>
                )
            } else if (subType === 'unfriend') {
                return (
                    <div className='checking'>
                        <div className='modal-box-head'>
                            <h1><i className="fa-solid fa-circle-question"></i> Just Checking...</h1>
                            <button onClick={show}><i className="fa-solid fa-x"></i></button>
                        </div>
                        <div className='modal-box-body'>
                            <i className="fa-solid fa-user-xmark"></i>
                            <p>{message}</p>
                        </div>
                        <div className='modal-box-footer'>
                            <button className='no' onClick={show}>No</button>
                            <button className='yes' onClick={show}>Yes</button>
                        </div>
                    </div>
                )
            } else {
                return (
                    <div className='checking'>
                        <div className='modal-box-head'>
                            <h1><i className="fa-solid fa-circle-question"></i> Just Checking...</h1>
                            <button onClick={show}><i className="fa-solid fa-x"></i></button>
                        </div>
                        <div className='modal-box-body'>
                            <i className="fa-solid fa-user-pen"></i>
                            <p>{message}</p>
                        </div>
                        <div className='modal-box-footer'>
                            <button className='no' onClick={show}>No</button>
                            <button className='yes' onClick={show}>Yes</button>
                        </div>
                    </div>
                )
            }
        } else if (mainType === 'unauthorized') {
            return (
                <div className='unauthorized'>
                    <div className='modal-box-head'>
                        <h1><i className="fa-solid fa-triangle-exclamation"></i> Login Required</h1>
                    </div>
                    <div className='modal-box-body'>
                        <i className="fa-solid fa-hand wave"></i>
                        <p>{message}</p>
                    </div>
                    <div className='modal-box-footer'>
                        <Link to='../signin'><button>Login</button></Link>
                    </div>
                </div>
            )
        }
    };
    
    return (
    <div className='modal-box'>
        <div className='modal-box-container'>
            {renderModal()}
        </div>
    </div>
    );
};

export default ModalBox;
