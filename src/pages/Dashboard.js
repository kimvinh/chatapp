import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import { SocketContext } from '../SocketContext';
import ScrollToBottom from 'react-scroll-to-bottom';
import './Dashboard.css';
import { localNetwork } from '../localNetwork';
import ModalBox from '../Components/ModalBox';
import { getCurrentTime } from './ChatRoom';
import EmojiPicker from 'emoji-picker-react';

const Avatar = ({ user, target }) => {
    if (user && !target) {
        return (
            <div className='user-info-container'>
                <div className='user-info-image-avatar'>
                    <img 
                        src={`data:image/svg+xml;utf8,${encodeURIComponent(user.avatar)}`}
                        alt="User's Avatar"
                    />
                </div>
                <div className='name'>
                    <h2>{user.first_name + ' ' + user.last_name}</h2>
                </div>
            </div>
        )
    } else if (target) {
        return (
            <div className='user-info-container'>
                <div className='user-info-image-avatar'>
                    <img 
                        src={`data:image/svg+xml;utf8,${encodeURIComponent(user._id === target.participants[0] ? target.participantsInfo[1].avatar : target.participantsInfo[0].avatar)}`} 
                        alt="Friend's Avatar"
                    />
                </div>
                <div className='name'>
                    <h2>{user._id === target.participants[0] ? target.participantsInfo[1].username : target.participantsInfo[0].username}</h2>
                </div>
            </div>
        )
    }
}

const Dashboard = () => {
    const socket = useContext(SocketContext);
    const location = useLocation();
    const [conversationID, setConversationID] = useState(location.state);
    const [isLogin, setIsLogin] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [currentMessage, setCurrentMessage] = useState('');
    const [messageList, setMessageList] = useState([]);
    const [chatList, setChatList] = useState([]);
    const [target, setTarget] = useState(null);
    const [showPicker, setShowPicker] = useState(false);
    const [file, setFile] = useState(null);
    const focus = useRef(null);
    let fileInputRef = useRef(null);
    useEffect(() => {
        axios.get(`${localNetwork}/`)
            .then((response) => {
                if (response.data.loggedIn) {
                    const user = response.data.user;
                    setUserInfo(user);
                    setIsLogin(true);
                }
            })
            .catch((error) => {
                console.log(error);
            });
    }, [])

    useEffect(() => {
        axios.get(`${localNetwork}/conversations`)
            .then((response) => {
                setChatList(response.data);
            })
    }, [])

    useEffect(() => {
        if (conversationID) {
            const result = chatList.find((chat) => chat._id === conversationID);
            setTarget(result);
        }
    }, [conversationID, chatList]);

    useEffect(() => {
        if (conversationID) {
            socket.emit("join_private_room", conversationID);
            fetchMessages(conversationID);
        }
    }, [socket, conversationID])

    // Initialize socket connection on component mount
    useEffect(() => {
        socket.on("receive_message", (data) => {
            setMessageList((prev) => [...prev, data])
        })

        return () => {
            socket.off("receive_message");
        }
    }, [socket]);

    const sendMessage = async () => {
        if (currentMessage !== '') {
            let messageData = {};
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                
                try {
                    const response = await axios.post(`${localNetwork}/file/upload`, formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });

                    const filePath = response.data.filePath;

                    messageData = {
                        roomID: conversationID,
                        authorName: userInfo.first_name + ' ' + userInfo.last_name,
                        authorID: userInfo._id,
                        message: currentMessage,
                        avatar: userInfo.avatar,
                        type: 'file',
                        path: filePath, // Use the file path from the response
                        time: getCurrentTime()
                    };
                } catch (error) {
                    console.error(error);
                }
            } else {
                messageData = {
                    roomID: conversationID,
                    authorID: userInfo._id,
                    authorName: userInfo.first_name + ' ' + userInfo.last_name,
                    message: currentMessage,
                    avatar: userInfo.avatar,
                    time: getCurrentTime()
                }
            }
            await socket.emit("send_message", messageData);
            delete messageData.roomID;
            await axios.patch(`${localNetwork}/update_conversation`, {
                messageData: messageData,
                conversationID: conversationID
            });
            setCurrentMessage('');
            setShowPicker(false);
            setFile(null);
            fileInputRef.current.value = null;
        }
    }

    const fetchMessages = async (conversationID) => {
        try {
            const response = await axios.get(`${localNetwork}/get_messages`, {
                params: {
                    conversationID: conversationID
                }
            });
        
            setMessageList(response.data); // Update local state with fetched messages
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    }

    const handleChatClick = async (chat) => {
        await socket.emit("join_private_room", chat._id);
        setConversationID(chat._id);
        setTarget(chat);
        fetchMessages(chat._id);
    }

    const handleEmojiSelect = (event) => {
        focus.current.focus();
        setCurrentMessage(currentMessage + event.emoji);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCurrentMessage(file.name);
            setFile(file);
        }
    }

    if (isLogin) {
        return (
            <div className='dashboard'>
                <div className='dashboard-header'>
                    <div className='dropdown'>
                        <div className='dashboard-header-user'>
                            <Avatar user={userInfo} />
                            <i className="fa-solid fa-chevron-right"></i>
                        </div>
                        <div className="dropdown-menu">
                            <Link to='/'>Home</Link>
                            <Link to='/profile'>Profile</Link>
                        </div>
                    </div>
                </div>
                <div className='dashboard-body'>
                    <div className='dashboard-body-chats'>
                        <div className='dashboard-body-search-chats'>
                            <div className='search-chats'>
                                <input type="text" placeholder='Search' />
                                <span className='search-chats-icon'>
                                    <i className="fa-solid fa-magnifying-glass"></i>
                                </span>
                                <span className='add-chat-icon'>
                                    <i className="fa-solid fa-comment-medical"></i>
                                </span>
                            </div>
                        </div>
                        <div className='dashboard-body-chats-list'>
                            <h1>Chats</h1>
                            <div className='chats-list'>
                                {chatList && chatList.map((chat, index) => (
                                    <div 
                                        key={index}
                                        className='friend'
                                        onClick={() => handleChatClick(chat)}
                                    >
                                        <div>
                                            <img 
                                                src={`data:image/svg+xml;utf8,${encodeURIComponent(userInfo._id === chat.participants[0] ? chat.participantsInfo[1].avatar : chat.participantsInfo[0].avatar) }`}
                                                alt="Friend's Avatar"
                                                className='friend-avatar'
                                            />
                                        </div>
                                        <div className='friend-name'>
                                            <p>{userInfo._id === chat.participants[0] ? chat.participantsInfo[1].username : chat.participantsInfo[0].username}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className='dashboard-body-conversation'>
                        {target ? (
                            <>
                                <div className='conversation-header'>
                                    <Avatar user={userInfo} target={target}  />
                                    <div className='calling-icons'>
                                        <i className="fa-solid fa-phone"></i>
                                        <i className="fa-solid fa-video"></i>
                                    </div>
                                </div>
                                <div className='conversation-body'>
                                    <ScrollToBottom className='message-container'>
                                        {messageList.map((messageContent, index) => {
                                            return (
                                                <div key={index} className={userInfo._id === messageContent.authorID ? 'message your' : 'message others'}>
                                                    <div className='message-content'>
                                                        <div className={`flex items-end ${userInfo._id === messageContent.authorID ? 'flex-row-reverse' : ''}`}>
                                                            <div className={`w-10 h-10 flex items-end ${userInfo._id === messageContent.authorID ? 'justify-end' : ''}`}>
                                                                <img
                                                                    src={`data:image/svg+xml;utf8,${encodeURIComponent(messageContent.avatar)}`}
                                                                    alt="User's Avatar"
                                                                    className='w-8 h-8'
                                                                />
                                                            </div>
                                                            {messageContent.path ? (
                                                                <>
                                                                    {messageContent.path.match(/\.(jpeg|jpg|png|gif|bmp)$/i) ? (
                                                                        <img className='w-64 h-auto' src={localNetwork + '/files' + messageContent.path} alt={messageContent.message} />
                                                                    )
                                                                    : (
                                                                        <a href={localNetwork + '/file/download' + messageContent.path}>{messageContent.message}</a>
                                                                    )}
                                                                </>
                                                            )
                                                            :
                                                            (
                                                                    
                                                                <p className='m-0 inline-block'>{messageContent.message}</p>
                                                            )
                                                            }
                                                        </div>
                                                    </div>
                                                    <div className='message-meta'>
                                                        <p>{messageContent.time}</p>
                                                        <p>{userInfo._id === messageContent.authorID ? 'You' : messageContent.authorName}</p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </ScrollToBottom>
                                </div>
                                <div className='conversation-footer'>
                                    <div 
                                        className='flex justify-center items-center w-12 h-12 mr-2 bg-gray-200 rounded-full cursor-pointer'
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                            <i className="fa-solid fa-paperclip text-gray-500 text-lg"></i>
                                    </div>
                                    <input
                                        className='hidden'
                                        type='file'
                                        accept='image/*, .pdf, .doc, .docx'
                                        onChange={handleFileSelect}
                                        ref={fileInputRef}
                                    />
                                    <input 
                                        type='text'
                                        value={currentMessage}
                                        placeholder='Type a message...'
                                        onClick={() => setShowPicker(false)} 
                                        onChange={(e) => setCurrentMessage(e.target.value)}
                                        onKeyDown={(event) => event.key === 'Enter' && sendMessage()}  
                                        ref={focus} 
                                    />
                                    <span className='send-icon'>
                                        <i 
                                            className="fa-solid fa-icons mr-4 bg-gradient-to-r from-sky-500 to-indigo-500 text-transparent bg-clip-text cursor-pointer"
                                            onClick={() => setShowPicker(!showPicker)}
                                            onFocus={handleEmojiSelect}
                                        ></i>
                                        <i className={`fa-solid fa-paper-plane ${currentMessage === '' ? 'disabled' : ''}`} onClick={sendMessage}></i>
                                    </span>
                                </div>
                                <div className='absolute bottom-20 right-5'>
                                    {showPicker && <EmojiPicker onEmojiClick={handleEmojiSelect} />}
                                </div>
                            </>
                        ) : (
                            <div className='chat-announcement'>
                                <h2>Please select a chat</h2>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    } else {
        return (
            <ModalBox 
                type='unauthorized'
                message='Please log in to access this page.'
            />
        )
    }
}

export default Dashboard;