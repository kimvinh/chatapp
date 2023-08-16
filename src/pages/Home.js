import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from '../Components/Logo';
import SubmitButton from '../Components/SubmitButton';
import Warning from '../Components/Warning';
import ModalBox from '../Components/ModalBox';
import Avatar from '../Components/Avatar';
import { localNetwork } from '../localNetwork';
import { SocketContext } from '../SocketContext';
import { getCurrentTime } from './ChatRoom';
import './Home.css';
import '../pages/ChatRoom.css';

const RegisteredUser = ({ user, handleLogout }) => (
    <div className='home-user-login'>
        <div className='user-info'>
            <Link className='user-link' to='/profile'>
                <img 
                    src={`data:image/svg+xml;utf8,${encodeURIComponent(user.avatar)}`}
                    alt="User's Avatar"
                />
                <p>{user.username}</p>
            </Link>
        </div>
        <div className='logout-button' onClick={handleLogout}>
            <SubmitButton text='Logout' />
        </div>
    </div>
)

const AccessRoom = ({ isLogin, activeTab, handleTabChange, selectedAvatar, handleSelectedAvatar, showWarning, inputField, setInputField, handleAction }) => {
    const isInputted = inputField.fullName && inputField.roomID && inputField.roomPassword;
    const handleErrorType = () => {
        if (isInputted) {
            if (activeTab === 'join' && selectedAvatar) {
                return 'room_error_1';
            } else if (activeTab === 'create' && selectedAvatar) {
                return 'room_error_2';
            } else {
                return 'room_error_3';
            }
        } else {
            return '';
        }
    }
    return (
        <div className='home-body-join-room'>
            <div className='tabs-container'>
                <div 
                    className={activeTab === 'join' ? 'tab active-tab' : 'tab'}
                    onClick={() => handleTabChange('join')}
                >
                    JOIN ROOM
                </div>
                <div 
                    className={activeTab === 'create' ? 'tab active-tab' : 'tab'}
                    onClick={() => handleTabChange('create')}
                >
                    CREATE ROOM
                </div>
            </div>
            {activeTab === 'join' ? (
                <h1 className='header'>Joining Chat Room</h1>
            ) : (
                <h1 className='header'>Creating Chat Room</h1>
            )}
            <Avatar selected={handleSelectedAvatar}/>
            {showWarning && 
            <Warning errorType={handleErrorType()} />
            }
            {!isLogin &&
            <div className="form-floating">
                <input 
                    type="text" 
                    className="form-control" 
                    id="full_name"
                    value={inputField.fullName}
                    onChange={(e) => { setInputField.fullName(e.target.value) }} 
                />
                <label htmlFor="full_name">FULL NAME</label>
            </div>
            }
            <div className="form-floating">
                <input 
                    type="text" 
                    className="form-control" 
                    id="room_id"
                    value={inputField.roomID}
                    onChange={(e) => { setInputField.roomID(e.target.value) }} 
                />
                <label htmlFor="room_id">ROOM ID</label>
            </div>
            <div className="form-floating">
                <input 
                    type="text" 
                    className="form-control" 
                    id="password"
                    value={inputField.roomPassword}
                    onChange={(e) => { setInputField.roomPassword(e.target.value) }} 
                />
                <label htmlFor="password">ROOM PASSWORD</label>
            </div>
            <SubmitButton text={activeTab === 'join' ? 'Join' : 'Create'} action={handleAction} />
        </div>
    )
}

const Home = () => {
    const socket = useContext(SocketContext);
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [userID, setUserID] = useState('');
    const [roomID, setRoomID] = useState('');
    const [fullName, setFullName] = useState('');
    const [roomPassword, setRoomPassword] = useState('');

    const [showModalBox, setShowModalBox] = useState(false);
    const [showWarning, setShowWarning] = useState(false);

    const [activeTab, setActiveTab] = useState('join');

    const [avatarURL, setAvatarURL] = useState(null);

    useEffect(() => {
        axios.get(`${localNetwork}:3001/`)
            .then((response) => {
                if (response.data.loggedIn === true) {
                    setIsLogin(true);
                    setUserInfo(response.data.user);
                    setUserID(response.data.user._id);
                    setFullName(response.data.user.first_name + ' ' + response.data.user.last_name);
                    setAvatarURL(response.data.user.avatar);
                } else {
                    setUserID(socket.id);
                    setIsLogin(false);
                }
            })
            .catch((error) => {
                console.log(error);
            });
    }, [socket]);

    useEffect(() => {
        const time = getCurrentTime();
        const user = {
            userID,
            fullName,
            roomID,
            isLogin
        }

        const handleJoinSuccess = () => {
            navigate('/chat', { state: user });
            socket.emit("setup_room", { roomID, userID, fullName, isLogin, type: 'regular', avatarURL , time});
        }

        const handleJoinFailed = (errorMessage) => {
            setShowWarning(true);
        }

        const handleRoomCreationSuccess = () => {
            navigate('/chat', { state: user });
            socket.emit("setup_room", { roomID, userID, fullName, isLogin, type: 'host', avatarURL , time });
        }

        const handleRoomCreationFailed = (errorMessage) => {
            setShowWarning(true);
        }

        socket.on("join_success", handleJoinSuccess);
        socket.on("join_failed", handleJoinFailed);
        socket.on("room_creation_success", handleRoomCreationSuccess);
        socket.on("room_creation_failed", handleRoomCreationFailed);

        return () => {
            socket.off("join_success");
            socket.off("join_failed");
            socket.off("room_creation_success");
            socket.off("room_creation_failed");
        }
    }, [fullName, roomID, isLogin, navigate, setShowWarning, socket, avatarURL, userID])

    useEffect(() => {
        setShowWarning(false);
    }, [fullName, roomID, roomPassword, avatarURL]);

    const handleAction = () => {
        if ((isLogin || fullName) && roomID && roomPassword && avatarURL) {
            if (activeTab === 'join') {
                socket.emit("join_room", { roomID, roomPassword });
            } else if (activeTab === 'create') {
                socket.emit("create_room", { roomID, roomPassword });
            }
        } else {
            setShowWarning(true);
        }
    };

    const handleLogout = () => {
        axios.post(`${localNetwork}:3001/logout`)
            .then(() => {
                setUserID('');
                setIsLogin(false);
                setTimeout(() => {
                    setShowModalBox(true);
                }, 100);
            })
            .catch((error) => {
                console.error(error);
            })
    }

    const handleModalBox = () => {
        setShowModalBox(false);
    }

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setShowWarning(false);
    }

    const handleSelectedAvatar = (avatar) => {
        setAvatarURL(avatar);
    }

    return (
        <div className='home'>
            <div className={isLogin ? 'home-header' : 'home-header-default'}>
                <div className='home-logo'>
                    <Logo />
                </div>
                {isLogin && <RegisteredUser user={userInfo} handleLogout={handleLogout} />}  
            </div>
            <div className='home-body'>
                <AccessRoom
                    isLogin={isLogin}
                    activeTab={activeTab}
                    handleTabChange={handleTabChange}
                    selectedAvatar={avatarURL}
                    handleSelectedAvatar={handleSelectedAvatar}
                    showWarning={showWarning}
                    inputField = {{
                        fullName: fullName,
                        roomID: roomID,
                        roomPassword: roomPassword
                    }}
                    setInputField={{
                        fullName: setFullName,
                        roomID: setRoomID,
                        roomPassword: setRoomPassword
                    }}
                    handleAction={handleAction}
                />
                {!isLogin && (
                <> 
                    <div className="circle">
                        <span className="text">OR</span>
                    </div>
                    <div className='home-body-link-buttons'>
                        <h1 className='header'>Access Your Account</h1>
                        <Link to='/signin'><SubmitButton text='Log in' /></Link>
                        <Link to='/signup'><SubmitButton text='Register' /></Link>
                    </div>
                </>
                )}
            </div>
            {showModalBox &&
            <ModalBox 
                show={handleModalBox}
                type='announcement' 
                message='You have been logged out successfully.' 
            />
            }
        </div>
    )
}

export default Home;