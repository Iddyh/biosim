
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface VideoStatusProps {
    message: string;
}

export const VideoStatus: React.FC<VideoStatusProps> = ({ message }) => {
    return (
        <div className="flex flex-col items-center justify-center text-center p-4 text-white bg-slate-800/80 w-full h-full">
            <LoadingSpinner className="h-10 w-10 text-sky-400 mb-4" />
            <p className="text-lg font-semibold">Generating Video...</p>
            <p className="text-sm text-slate-300 max-w-xs">{message}</p>
        </div>
    );
};
