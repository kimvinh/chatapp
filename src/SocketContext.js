import React, { createContext } from 'react';
import io from 'socket.io-client';
import { localNetwork } from './localNetwork';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const socket = io.connect(`${localNetwork}`);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    )
}