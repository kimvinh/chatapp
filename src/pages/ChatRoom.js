import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SocketContext } from '../SocketContext';
import ScrollToBottom from 'react-scroll-to-bottom';
import EmojiPicker from 'emoji-picker-react';
import ModalBox from '../Components/ModalBox';
import axios from 'axios';
import { localNetwork } from '../localNetwork';
import './ChatRoom.css';

export const getCurrentTime = () => {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let period = hours >= 12 ? "PM" : "AM";

    // Convert to 12-hour format
    hours = hours % 12 || 12;

    // Add leading zeros if needed
    hours = String(hours).padStart(2, "0");
    minutes = String(minutes).padStart(2, "0");

    return `${hours}:${minutes} ${period}`;
};

const ChatRoom = () => {
    const socket = useContext(SocketContext);
    const navigate = useNavigate();
    const focus = useRef(null);
    const fileInputRef = useRef(null);
    const location = useLocation();
    const { userID, fullName, roomID, isLogin } = location.state || {};
    const [hostID, setHostID] = useState('');

    const [currentMessage, setCurrentMessage] = useState('');
    const [file, setFile] = useState(null);
    const [messageList, setMessageList] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [filteredUsersList, setFilteredUsersList] = useState([]);

    const [showPicker, setShowPicker] = useState(false);
    const [showModalBox, setShowModalBox] = useState(false);

    const [currentSearchInput, setCurrentSearchInput] = useState('');

    const [selectedUser, setSelectedUser] = useState(null);
    const [removedUser, setRemovedUser] = useState(null);
    const [isLeaving, setIsLeaving] = useState(null);
    const [isJoined, setIsJoined] = useState(false);
    const [addFriends, setAddFriends] = useState([]);
    const [incomingFriendRequests, setIncomingFriendRequests] = useState([]);

    useEffect(() => {
        if (isLogin) {
            axios.get(`${localNetwork}/`)
                .then((response) => {
                    const friends = [...response.data.user.friends];
                    for (let i = 0; i < friends.length; i++) {
                        const friendRequest = {
                            requestedFrom: userID,
                            beingRequested: friends[i].authorID,
                            status: 'accept'
                        }
                        setAddFriends((prev) => [...prev, friendRequest]);
                    }
                })
        }
    }, [isLogin, userID]);

    // Initialize socket connection on component mount
    useEffect(() => {
        // Listen for incoming messages
        socket.on('receive_message', (messageData) => {
            setMessageList((prevMessages) => [...prevMessages, messageData]);
        });

        // Listen for updated users list
        socket.on('users_list', (users) => {
            const joined = users.findIndex((user) => user.authorID === userID);
            if (joined !== -1) {
                setIsJoined(true);
                const host = users.find((user) => user.type === 'host');
                if (host) {
                    setHostID(host.authorID);
                }

                setUsersList(users);
            } else {
                setIsJoined(false);
                setShowModalBox(true);
            }
        });

        // Clean up listeners on component unmount
        return () => {
            socket.off('receive_message');
            socket.off('users_list');
        };
    }, [socket, isJoined, userID, navigate]);

    useEffect(() => {
        if (!fullName) {
            navigate('/');
        }
    }, [fullName, navigate])

    useEffect(() => {
        const filteredList = currentSearchInput
            ? usersList.filter((user) =>
                user.authorName.toLowerCase().includes(currentSearchInput.toLowerCase())
            )
            : usersList;
        setFilteredUsersList(filteredList);
    }, [currentSearchInput, usersList])

    useEffect(() => {
        socket.on("receive_friend_request", (request) => {
            setIncomingFriendRequests((prevRequests) => [...prevRequests, request]);
        })

        socket.on("receive_friend_request_response", (response) => {
            const { isAccepted, friendRequest, youAre } = response;
            if (youAre === 'requesting') {
                const updatedIndex = addFriends.findIndex((request) => request.beingRequested === friendRequest.beingRequested.authorID);
                const updatedFriendRequest = { ...addFriends[updatedIndex] }
                // Create a new copy of the addFriends array with the updated element
                let updatedAddFriends = [...addFriends];
                if (isAccepted) {
                    updatedFriendRequest.status = 'accept';

                    // Replace the old element with the updated one in the array
                    updatedAddFriends[updatedIndex] = updatedFriendRequest;

                    // Update the addFriends state with the updated array
                    setAddFriends(updatedAddFriends);
                    delete friendRequest.beingRequested.userSocketID;
                    axios.post(`${localNetwork}/addfriend`, {
                        userID,
                        friendInfo: friendRequest.beingRequested
                    })
                        .then((response) => {
                            console.log(response);
                        })  
                } else {
                    updatedAddFriends = updatedAddFriends.filter((request, index) => index !== updatedIndex)
                    setAddFriends(updatedAddFriends);
                }
            } else if (youAre === 'requested') {
                if (isAccepted) {
                    const request = {
                        requestedFrom: friendRequest.requestedFrom.authorID,
                        beingRequested: friendRequest.beingRequested.authorID,
                        status: 'accept'
                    }
                    setAddFriends((prev) => [...prev, request])
                    delete friendRequest.requestedFrom.userSocketID;
                    axios.post(`${localNetwork}/addfriend`, {
                        userID,
                        friendInfo: friendRequest.requestedFrom
                    })
                        .then((response) => {
                            console.log(response);
                        }) 
                }
            }
        })

        return () => {
            socket.off("receive_friend_request");
            socket.off('receive_friend_request_response');
        }
    }, [socket, addFriends, userID]);

    const sendMessage = async () => {
        if (currentMessage !== '') {
            const userIndex = usersList.findIndex((user) => user.authorID === userID);
            let messageData = {};
            if (file) {
                messageData = {
                    roomID: roomID,
                    author: fullName,
                    authorID: userID,
                    message: currentMessage,
                    avatar: usersList[userIndex].avatar,
                    type: 'file',
                    path: null,
                    time: getCurrentTime()
                }

                const formData = new FormData();
                formData.append('file', file);

                try {
                    const response = await axios.post(`${localNetwork}/file/upload`, formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        } 
                    });
                    const filePath = response.data.filePath;
                    messageData.path = filePath;
                } catch (error) {
                    console.error(error);
                }
                
            } else {
                messageData = {
                    roomID: roomID,
                    authorName: fullName,
                    authorID: userID,
                    avatar: usersList[userIndex].avatar,
                    message: currentMessage,
                    type: 'user_message',
                    time: getCurrentTime()
                }
            }
            await socket.emit("send_message", messageData);
            setShowPicker(false);
            setCurrentMessage('');
            setFile(null);
        }
    }

    const handleEmojiSelect = (event) => {
        focus.current.focus();
        setCurrentMessage(currentMessage + event.emoji);
    };

    const handleLeaveRoom = () => {
        setIsLeaving(true);
        setShowModalBox(true);
    }

    const handleModalBox = (event) => {
        if (event.target.className === 'yes') {
            if (selectedUser) {
                // Emit a socket event to transfer the host status
                socket.emit('transfer_host', {
                    roomID: roomID,
                    currentHostID: hostID,
                    newHostID: selectedUser.authorID
                });
            } else if (removedUser) {
                // Emit a socket event to kick a user out of the room
                socket.emit('kick_user', { 
                    roomID: roomID,
                    kickedUserID: removedUser.authorID
                })
            } else if (isLeaving) {
                const time = getCurrentTime();
                // Disconnect from the current room
                socket.emit('leave_room', { roomID, userID, fullName, time });

                navigate('/');
            }
        } else if (event.target.className === 'back') {
            navigate('/');
        }
        setIsLeaving(false);
        setSelectedUser(null);
        setRemovedUser(null);
        setShowModalBox(false);
    }

    const handleMessageModalBox = () => {
        if (selectedUser) {
            return `Are you sure that you want to transfer the host to ${selectedUser.authorName}?`;
        } else if (removedUser) {
            return `Are you sure that you want to kick ${removedUser.authorName} out of the room?`;
        } else if (isLeaving) {
            return 'Do you want to leave the room?';
        } else {
            return 'You were kicked out of the room by the host.';
        } 
    }

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        setCurrentMessage(file.name);
        setFile(file);
    }

    const handleTransferKey = (user) => {
        setSelectedUser(user);
        setShowModalBox(true);
    }

    const handleRemoveUser = (user) => {
        setRemovedUser(user);
        setShowModalBox(true);
    }

    const handleAddFriend = (user) => {
        const friendRequest = {
            requestedFrom: userID,
            beingRequested: user,
            status: 'pending'
        }
        setAddFriends((prev) => [...prev, friendRequest]);
        socket.emit("send_friend_request", { roomID, friendRequest })
    }

    const handleUpdatedAddFriend = (user) => {
        const addFriend = addFriends.find((request) => request.beingRequested === user || request.requestedFrom === user);
        if (addFriend) {
            if (addFriend.status === 'accept') {
                return (
                    <div 
                        className='px-2 rounded-full bg-gray-50 flex justify-center items-center gap-1 text-blue-500'
                    >
                        <i className="fa-solid fa-user-group"></i>
                        <span className='font-bold'>Friend</span>
                    </div>
                )
            } else if (addFriend.status === 'pending') {
                return (
                    <div 
                        className='px-2 rounded-full bg-gray-50 flex justify-center items-center text-gray-500'
                    >
                        Pending...
                    </div>
                )
            }
        }
        return (
            <div 
                className='w-10 h-10 rounded-full bg-gray-50 flex justify-center items-center hover:bg-gray-100 hover:text-blue-500'
                title='Add Friend'
                onClick={() => {handleAddFriend(user)}}
            >
                <i className="fa-solid fa-user-plus"></i>
            </div>
        )
    }

    const handleFriendRequest = () => {
        let copyRequests = [...incomingFriendRequests];
        const request = copyRequests[0];
        copyRequests = copyRequests.slice(1);
        return (
            <ModalBox
                show={handleModalBox}
                type='checking-friend_request'
                message={`You have received a friend request from ${request.requestedFrom.authorName}. Do you want to accept it?`}
                onAccept={() => handleFriendRequestResponse(true, request, copyRequests)}
                onReject={() => handleFriendRequestResponse(false, request, copyRequests)}
            />
        )
    }

    const handleFriendRequestResponse = (isAccepted, friendRequest, requests) => {
        socket.emit("send_friend_request_response", { roomID, isAccepted, friendRequest })
        setIncomingFriendRequests(requests);
    }

    return (
        <div className='chat-room h-screen'>
            <div className='grid grid-cols-4 h-screen p-3'>
                <div className='col-span-1 bg-indigo-300 rounded-lg flex flex-col'>
                    <div className='chat-room-search'>
                        <div className='flex justify-center items-center m-3 relative'>
                            <input 
                                className='h-10 w-full rounded-lg pl-10 pr-5' 
                                type='text' 
                                placeholder='Search people...'
                                value={currentSearchInput}
                                onChange={(e) => setCurrentSearchInput(e.target.value)}
                            />
                            <span className='absolute left-3'>
                                <i className="fa-solid fa-magnifying-glass"></i>
                            </span>
                        </div>
                    </div>
                    <div className='chat-room-people'>
                        <div className='mb-2 flex items-center gap-2'>
                            <h1 className='font-bold pl-3 text-violet-950 underline'>People</h1>
                            <div className='w-9 h-9 bg-violet-950 rounded-full flex justify-center items-center'>
                                <span className='text-white text-lg font-bold'>{filteredUsersList.length}</span>
                            </div>
                        </div>
                        <div className='flex flex-col max-h-[72vh] min-[1920px]:max-h-[75vh] overflow-y-auto'>
                            {filteredUsersList.map((user) => (
                                <div 
                                    key={user.authorID} 
                                    className={`people ${userID !== user.authorID ? 'people-hover group' : ''}`} 
                                >
                                    <div className='w-14 h-14 rounded-full flex justify-center items-center'>
                                        <img
                                            src={`data:image/svg+xml;utf8,${encodeURIComponent(user.avatar)}`}
                                            alt="User's Avatar"
                                            className='w-14 h-14'
                                        />
                                    </div>
                                    <div className='text-white font-bold text-xl'>
                                        {user.authorName + (userID === user.authorID ? ' (You)' : '')}
                                    </div>
                                    {user.type === 'host' && (
                                        <div>
                                            <i className="fa-solid fa-crown pt-1 text-amber-400 text-xl"></i>
                                        </div>
                                    )}
                                    {user.type === 'regular' && hostID === userID && (
                                        <div className='hidden group-hover:flex ml-2 gap-2'>
                                            <div 
                                                className='w-9 h-9 rounded-full bg-gray-50 flex justify-center items-center hover:bg-gray-100 hover:text-amber-400'
                                                title='Transfer Key'
                                                onClick={() => {handleTransferKey(user)}}
                                            >
                                                <i className="fa-solid fa-key text-lg"></i>
                                            </div>
                                            <div 
                                                className='w-9 h-9 rounded-full bg-gray-50 flex justify-center items-center hover:bg-gray-100 hover:text-red-700'
                                                title='Kick Out'
                                                onClick={() => {handleRemoveUser(user)}}
                                            >
                                                <i className="fa-solid fa-xmark text-xl"></i>
                                            </div>
                                        </div>
                                    )}
                                    {isLogin && userID !== user.authorID && user.registered && (
                                        <div className='hidden group-hover:flex'>
                                            {handleUpdatedAddFriend(user.authorID)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className='flex-grow m-3 flex justify-center items-end'>
                        <button 
                            className='bg-rose-600 text-white font-bold text-lg h-11 w-full rounded-lg hover:bg-rose-700'
                            onClick={handleLeaveRoom}
                        >
                            Leave Room
                        </button>
                    </div>
                </div>
                <div className='flex flex-col col-span-3 bg-stone-50 ml-4 rounded-lg'>
                    <div className='h-[750px] min-[1920px]:h-[840px]'>
                        <ScrollToBottom className='w-full h-full overflow-x-hidden'>
                            {messageList.map((messageContent, index) => {
                                if (messageContent.type === 'user_join') {
                                    return (
                                        <div key={index} className='flex justify-center items-center gap-3'>
                                            <div className='text-center'>
                                                <p className='text-emerald-700 italic py-3 text-base m-0'>{messageContent.message}</p>
                                            </div>
                                            <div className='bg-slate-400 rounded-2xl'>
                                                <span className='p-2 text-slate-50'><i className="fa-regular fa-clock"></i> {messageContent.time}</span>
                                            </div>
                                        </div>
                                    )
                                } else if (messageContent.type === 'user_leave') {
                                    return (
                                        <div key={index} className='flex justify-center items-center gap-3'>
                                            <div className='text-center'>
                                                <p className='text-red-700 italic py-3 text-base m-0'>{messageContent.message}</p>
                                            </div>
                                            <div className='bg-slate-400 rounded-2xl'>
                                                <span className='p-2 text-slate-50'><i className="fa-regular fa-clock"></i> {messageContent.time}</span>
                                            </div>
                                        </div>
                                    )
                                } else if (messageContent.type === 'notification') {
                                    return (
                                        <div key={index} className='flex justify-center items-center gap-3'>
                                            <div className='text-center'>
                                                <p className='text-sky-600 italic py-3 text-base m-0'>{messageContent.message}</p>
                                            </div>
                                            <div className='bg-blue-400 rounded-2xl'>
                                                <span className='p-2 text-slate-50'><i className="fa-regular fa-bell"></i> Notification</span>
                                            </div>
                                        </div>
                                    )
                                } else {
                                    return (
                                        <div key={index} className={fullName === messageContent.authorName ? 'message your' : 'message others'}>
                                            <div className='message-content'>
                                                <div className={`flex items-end ${fullName === messageContent.authorName ? 'flex-row-reverse' : ''}`}>
                                                    <div className={`w-10 h-10 flex items-end ${fullName === messageContent.authorName ? 'justify-end' : ''}`}>
                                                        <img
                                                            src={`data:image/svg+xml;utf8,${encodeURIComponent(messageContent.avatar)}`}
                                                            alt="User's Avatar"
                                                            className='w-8 h-8'
                                                        />
                                                    </div>
                                                    {messageContent.path ? (
                                                        <>
                                                            {messageContent.path.match(/\.(jpeg|jpg|png|gif|bmp)$/i) ? (
                                                                <img className='w-64 h-auto' src={localNetwork + ':3001/files' + messageContent.path} alt={messageContent.message} />
                                                            )
                                                            : (
                                                                <a href={localNetwork + ':3001/file/download' + messageContent.path}>{messageContent.message}</a>
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
                                                <p>{fullName === messageContent.authorName ? 'You' : messageContent.authorName}</p>
                                            </div>
                                        </div>
                                    )
                                }
                            })}
                        </ScrollToBottom>
                    </div>
                    <div className='flex-grow flex justify-center items-center p-3 relative border-t-4 border-white'>
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
                            className='w-full h-14 text-lg pl-4 pr-24 rounded-2xl bg-zinc-100' 
                            type='text' 
                            placeholder='Type message here...' 
                            value={currentMessage}
                            onChange={(e) => { setCurrentMessage(e.target.value) }}
                            onKeyDown={(event) => event.key === 'Enter' && sendMessage()}
                            ref={focus}
                        />
                        <div className='absolute right-8 bottom-8 text-2xl'>
                            <i 
                                className="fa-solid fa-icons mr-4 bg-gradient-to-r from-sky-500 to-indigo-500 text-transparent bg-clip-text cursor-pointer"
                                onClick={() => setShowPicker(!showPicker)}
                                onFocus={handleEmojiSelect}
                            ></i>
                            <i 
                                className={`fa-solid fa-paper-plane ${currentMessage !== '' ? 'text-blue-600' : 'text-gray-300 cursor-not-allowed'}`}
                                onClick={sendMessage}
                            ></i>
                        </div>
                        <div className='absolute bottom-20 right-5'>
                            {showPicker && <EmojiPicker onEmojiClick={handleEmojiSelect} />}
                        </div>
                    </div>
                </div>
            </div>
            {showModalBox 
            && 
            <ModalBox 
                show={handleModalBox}
                type={isLeaving || ((selectedUser || removedUser) && isJoined) 
                    ? 'checking' 
                    : 'announcement-kicked'}
                message={handleMessageModalBox()}
            />
            }
            {incomingFriendRequests.length !== 0 && handleFriendRequest()}
        </div>
    )
}

export default ChatRoom;

