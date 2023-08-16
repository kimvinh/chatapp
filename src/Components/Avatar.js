import React, { useState, useEffect } from 'react';
import { fetchRandomAvatar } from '../utils/avatarAPI';
import './Avatar.css';

const Avatar = ({ selected }) => {
    const [avatars, setAvatars] = useState([]);
    const [selectedAvatar, setSelectedAvatar] = useState(null);
    const handleAvatarSelection = (index) => {
        setSelectedAvatar(index);
        selected(avatars[index]);
    }

    useEffect(() => {
        const fetchAvatars = async () => {
            const avatarPromises = [];
            for (let i = 0; i < 5; i++) {
                const randomNumber = Math.floor(Math.random() * 10001);
                avatarPromises.push(fetchRandomAvatar(randomNumber));
            }

            const fetchedAvatars = await Promise.all(avatarPromises);
            setAvatars(fetchedAvatars.filter((avatar) => avatar !== null));
        }
        fetchAvatars();
    }, []);
    
    return (
        <div className='flex justify-center gap-3'>
            {avatars.map((avatar, index) => {
                return (
                    <div key={index} className={`avatar-profile ${selectedAvatar === index ? 'selected' : ''}`}>
                        <img
                            src={`data:image/svg+xml;utf8,${encodeURIComponent(avatar)}`}
                            alt='Avatar'
                            onClick={() => handleAvatarSelection(index)}
                        />
                    </div>
                )
            })}
        </div>
    );
};

export default Avatar;